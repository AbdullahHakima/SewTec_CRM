using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InteractionsController : ControllerBase
{
    private readonly CrmDbContext _context;

    public InteractionsController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<List<InteractionDto>>> GetByCustomerId(string customerId)
    {
        var list = await _context.Interactions
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.OccurredAt)
            .ToListAsync();

        return Ok(list.Select(i => i.ToDto()).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<InteractionDto>> Create([FromBody] CreateInteractionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Summary)) throw new ArgumentException("ملخص التواصل مطلوب.");
        var existing = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId) ?? throw new KeyNotFoundException("العميل غير موجود.");
        var now = DateTime.UtcNow;
        var channel = MappingExtensions.ParseInteractionChannel(request.Channel);
        var outcome = MappingExtensions.ParseInteractionOutcome(request.Outcome);

        var interaction = new Interaction
        {
            Id = $"int_{Guid.NewGuid().ToString("N")}",
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            Channel = channel,
            Outcome = outcome,
            Summary = request.Summary,
            UninterestedReason = request.UninterestedReason,
            PerformedBy = request.PerformedBy,
            OccurredAt = now,
            FollowUpId = request.FollowUpId,
            OpportunityId = request.OpportunityId
        };
        _context.Interactions.Add(interaction);

        // Also add timeline activity
        var activity = new Activity
        {
            Id = $"act_{Guid.NewGuid().ToString("N")}",
            CustomerId = request.CustomerId,
            Type = ActivityType.Interaction,
            Title = $"تسجيل تواصل: {request.Summary}",
            Description = request.Summary,
            OccurredAt = now,
            PerformedBy = request.PerformedBy,
            MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                Channel: channel.ToSnakeCase(),
                MachineModel: null,
                QuotationRef: null,
                OpportunityId: request.OpportunityId,
                Amount: null,
                Outcome: outcome.ToSnakeCase()
            ))
        };
        _context.Activities.Add(activity);

        // Update customer lastContactAt
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer != null)
        {
            customer.LastContactAt = now;
        }

        if (request.NextFollowUp != null)
        {
            if (!DateTime.TryParse(request.NextFollowUp.ScheduledAt, out var due) || string.IsNullOrWhiteSpace(request.NextFollowUp.Topic)) throw new ArgumentException("بيانات المتابعة التالية غير صالحة.");
            _context.FollowUps.Add(new FollowUp { Id = Guid.NewGuid().ToString("N"), CustomerId = existing.Id, CustomerName = existing.Name, CustomerPhone = existing.Phone,
                BranchId = existing.BranchId, AssignedRepId = existing.AssignedRepId, AssignedRepName = existing.AssignedRepName, ScheduledAt = due,
                Topic = request.NextFollowUp.Topic.Trim(), Channel = MappingExtensions.ParseFollowUpChannel(request.NextFollowUp.Channel), Status = FollowUpStatus.Scheduled });
            existing.NextFollowUpAt = due;
        }
        await _context.SaveChangesAsync();

        return Ok(interaction.ToDto());
    }
}
