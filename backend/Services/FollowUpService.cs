using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public record CompletedFollowUpResult(
    FollowUpDto FollowUp,
    InteractionDto Interaction,
    FollowUpDto? NextFollowUp
);

public interface IFollowUpService
{
    Task<List<FollowUpDto>> GetAllAsync(string? view, string? customerId, string? assignedRepId);
    Task<FollowUpDto?> GetByIdAsync(string id);
    Task<List<FollowUpDto>> GetByCustomerIdAsync(string customerId);
    Task<FollowUpDto> CreateAsync(CreateFollowUpRequest request);
    Task<CompletedFollowUpResult> CompleteAsync(string id, CompleteFollowUpRequest request);
    Task<FollowUpDto> RescheduleAsync(string id, RescheduleRequest request);
}

public class FollowUpService : IFollowUpService
{
    private readonly CrmDbContext _context;

    public FollowUpService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<FollowUpDto>> GetAllAsync(string? view, string? customerId, string? assignedRepId)
    {
        var query = _context.FollowUps.AsQueryable();

        if (!string.IsNullOrEmpty(customerId))
        {
            query = query.Where(f => f.CustomerId == customerId);
        }

        if (!string.IsNullOrEmpty(assignedRepId) && assignedRepId != "all")
        {
            query = query.Where(f => f.AssignedRepId == assignedRepId);
        }

        var list = await query.ToListAsync();

        if (!string.IsNullOrEmpty(view))
        {
            var now = DateTime.UtcNow;
            var todayDate = now.Date;

            switch (view.ToLowerInvariant())
            {
                case "today":
                    list = list.Where(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt.Date == todayDate).ToList();
                    break;
                case "overdue":
                    list = list.Where(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt.Date < todayDate).ToList();
                    break;
                case "upcoming":
                    list = list.Where(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt.Date > todayDate).ToList();
                    break;
                case "completed":
                    list = list.Where(f => f.Status == FollowUpStatus.Completed).ToList();
                    break;
            }
        }

        list = list.OrderBy(f => f.ScheduledAt).ToList();
        return list.Select(f => f.ToDto()).ToList();
    }

    public async Task<FollowUpDto?> GetByIdAsync(string id)
    {
        var fu = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
        return fu?.ToDto();
    }

    public async Task<List<FollowUpDto>> GetByCustomerIdAsync(string customerId)
    {
        var list = await _context.FollowUps
            .Where(f => f.CustomerId == customerId)
            .OrderBy(f => f.ScheduledAt)
            .ToListAsync();

        return list.Select(f => f.ToDto()).ToList();
    }

    public async Task<FollowUpDto> CreateAsync(CreateFollowUpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerId))
            throw new ArgumentException("معرف العميل مطلوب.");

        if (string.IsNullOrWhiteSpace(request.Topic))
            throw new ArgumentException("موضوع المتابعة مطلوب.");

        if (!DateTime.TryParse(request.ScheduledAt, out var scheduledAt))
        {
            throw new ArgumentException("Invalid ScheduledAt date");
        }

        var newFu = new FollowUp
        {
            Id = $"fu_{Guid.NewGuid().ToString("N")}",
            BranchId = "mahalla",
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            Channel = MappingExtensions.ParseFollowUpChannel(request.Channel),
            ScheduledAt = scheduledAt,
            Topic = request.Topic.Trim(),
            Status = FollowUpStatus.Scheduled,
            AssignedRepId = request.AssignedRepId,
            AssignedRepName = request.AssignedRepName
        };

        _context.FollowUps.Add(newFu);

        // Update customer nextFollowUpAt
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer != null)
        {
            customer.NextFollowUpAt = scheduledAt;
        }

        await _context.SaveChangesAsync();

        return newFu.ToDto();
    }

    public async Task<CompletedFollowUpResult> CompleteAsync(string id, CompleteFollowUpRequest request)
    {
        var fu = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
        if (fu == null)
            throw new KeyNotFoundException($"FollowUp with id {id} not found");

        if (fu.Status == FollowUpStatus.Completed)
            throw new SewTec.CRM.Api.Security.ConflictException("already_completed", "تم إنجاز هذه المتابعة مسبقاً.");

        if (request.NextFollowUp != null && (!DateTime.TryParse(request.NextFollowUp.ScheduledAt, out _) || string.IsNullOrWhiteSpace(request.NextFollowUp.Topic))) throw new ArgumentException("بيانات المتابعة التالية غير صالحة.");
        var now = DateTime.UtcNow;
        var outcome = MappingExtensions.ParseInteractionOutcome(request.Outcome);

        // 1. Mark current follow-up completed
        fu.Status = FollowUpStatus.Completed;
        fu.CompletedAt = now;
        fu.Outcome = outcome;
        fu.OutcomeNote = request.OutcomeNote?.Trim();

        // 2. Create Interaction
        var summary = !string.IsNullOrEmpty(request.OutcomeNote)
            ? request.OutcomeNote.Trim()
            : (outcome == InteractionOutcome.NoAnswer ? "محاولة تواصل — لم يرد العميل" : "تم التواصل بنجاح");

        var channel = (InteractionChannel)Enum.Parse(typeof(InteractionChannel), fu.Channel.ToString());

        var interaction = new Interaction
        {
            Id = $"int_{Guid.NewGuid().ToString("N")}",
            CustomerId = fu.CustomerId,
            CustomerName = fu.CustomerName,
            Channel = channel,
            Outcome = outcome,
            Summary = summary,
            UninterestedReason = request.UninterestedReason?.Trim(),
            PerformedBy = fu.AssignedRepName,
            OccurredAt = now,
            FollowUpId = fu.Id
        };
        _context.Interactions.Add(interaction);

        // 3. Create Timeline Activity
        var activity = new Activity
        {
            Id = $"act_{Guid.NewGuid().ToString("N")}",
            CustomerId = fu.CustomerId,
            Type = ActivityType.FollowupCompleted,
            Title = $"إنجاز متابعة: {fu.Topic}",
            Description = interaction.Summary,
            OccurredAt = now,
            PerformedBy = fu.AssignedRepName,
            MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                Channel: fu.Channel.ToSnakeCase(),
                MachineModel: null,
                QuotationRef: null,
                OpportunityId: null,
                Amount: null,
                Outcome: outcome.ToSnakeCase()
            ))
        };
        _context.Activities.Add(activity);

        // 4. Update Customer lastContactAt
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == fu.CustomerId);
        if (customer != null)
        {
            customer.LastContactAt = now;
        }

        // 5. Handle Next Follow-Up
        FollowUp? nextFollowUp = null;
        if (request.NextFollowUp != null && DateTime.TryParse(request.NextFollowUp.ScheduledAt, out var nextDate))
        {
            nextFollowUp = new FollowUp
            {
                Id = $"fu_{Guid.NewGuid().ToString("N")}",
                BranchId = "mahalla",
                CustomerId = fu.CustomerId,
                CustomerName = fu.CustomerName,
                CustomerPhone = fu.CustomerPhone,
                Channel = MappingExtensions.ParseFollowUpChannel(request.NextFollowUp.Channel),
                ScheduledAt = nextDate,
                Topic = request.NextFollowUp.Topic.Trim(),
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = fu.AssignedRepId,
                AssignedRepName = fu.AssignedRepName
            };
            _context.FollowUps.Add(nextFollowUp);
            fu.NextFollowUpId = nextFollowUp.Id;

            if (customer != null)
            {
                customer.NextFollowUpAt = nextDate;
            }
        }
        else if (outcome == InteractionOutcome.NoAnswer)
        {
            // Default retry tomorrow morning at 11:00 AM
            var tomorrow11Am = BranchClock.TomorrowAtElevenUtc();
            nextFollowUp = new FollowUp
            {
                Id = $"fu_{Guid.NewGuid().ToString("N")}",
                BranchId = "mahalla",
                CustomerId = fu.CustomerId,
                CustomerName = fu.CustomerName,
                CustomerPhone = fu.CustomerPhone,
                Channel = fu.Channel,
                ScheduledAt = tomorrow11Am,
                Topic = $"إعادة محاولة اتصال (لم يرد سابقاً): {fu.Topic}",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = fu.AssignedRepId,
                AssignedRepName = fu.AssignedRepName
            };
            _context.FollowUps.Add(nextFollowUp);
            fu.NextFollowUpId = nextFollowUp.Id;

            if (customer != null)
            {
                customer.NextFollowUpAt = tomorrow11Am;
            }
        }

        await _context.SaveChangesAsync();

        return new CompletedFollowUpResult(fu.ToDto(), interaction.ToDto(), nextFollowUp?.ToDto());
    }

    public async Task<FollowUpDto> RescheduleAsync(string id, RescheduleRequest request)
    {
        var fu = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
        if (fu == null)
            throw new KeyNotFoundException($"FollowUp with id {id} not found");

        if (fu.Status == FollowUpStatus.Completed)
            throw new InvalidOperationException("لا يمكن إعادة جدولة متابعة تم إنجازها بالفعل.");

        if (!DateTime.TryParse(request.NewScheduledAt, out var newScheduledAt))
        {
            throw new ArgumentException("Invalid NewScheduledAt date");
        }

        fu.ScheduledAt = newScheduledAt;

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == fu.CustomerId);
        if (customer != null)
        {
            customer.NextFollowUpAt = newScheduledAt;
        }

        await _context.SaveChangesAsync();

        return fu.ToDto();
    }
}
