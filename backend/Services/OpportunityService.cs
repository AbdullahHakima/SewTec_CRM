using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public interface IOpportunityService
{
    Task<List<OpportunityDto>> GetAllAsync(string? stage, string? customerId, string? assignedRepId);
    Task<OpportunityDto?> GetByIdAsync(string id);
    Task<List<OpportunityDto>> GetByCustomerIdAsync(string customerId);
    Task<OpportunityDto> CreateAsync(CreateOpportunityRequest request);
    Task<OpportunityDto> UpdateAsync(string id, UpdateOpportunityRequest request);
    Task<OpportunityDto> UpdateStageAsync(string id, UpdateStageRequest request);
}

public class OpportunityService : IOpportunityService
{
    private readonly CrmDbContext _context;

    public OpportunityService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<List<OpportunityDto>> GetAllAsync(string? stage, string? customerId, string? assignedRepId)
    {
        var query = _context.Opportunities.AsQueryable();

        if (!string.IsNullOrEmpty(customerId))
        {
            query = query.Where(o => o.CustomerId == customerId);
        }

        if (!string.IsNullOrEmpty(assignedRepId) && assignedRepId != "all")
        {
            query = query.Where(o => o.AssignedRepId == assignedRepId);
        }

        if (!string.IsNullOrEmpty(stage))
        {
            if (stage == "active")
            {
                query = query.Where(o => o.Stage != OpportunityStage.Won && o.Stage != OpportunityStage.Lost);
            }
            else if (stage != "all")
            {
                var parsedStage = MappingExtensions.ParseOpportunityStage(stage);
                query = query.Where(o => o.Stage == parsedStage);
            }
        }

        var list = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return list.Select(o => o.ToDto()).ToList();
    }

    public async Task<OpportunityDto?> GetByIdAsync(string id)
    {
        var opp = await _context.Opportunities.FirstOrDefaultAsync(o => o.Id == id);
        return opp?.ToDto();
    }

    public async Task<List<OpportunityDto>> GetByCustomerIdAsync(string customerId)
    {
        var list = await _context.Opportunities
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return list.Select(o => o.ToDto()).ToList();
    }

    public async Task<OpportunityDto> CreateAsync(CreateOpportunityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerId))
            throw new ArgumentException("معرف العميل مطلوب.");

        if (string.IsNullOrWhiteSpace(request.MachineModel))
            throw new ArgumentException("موديل الماكينة مطلوب.");

        if (request.Quantity <= 0)
            throw new ArgumentException("الكمية يجب أن تكون 1 على الأقل.");

        if (request.EstimatedValue.HasValue && request.EstimatedValue.Value < 0)
            throw new ArgumentException("القيمة التقديرية لا يمكن أن تكون سالبة.");

        var existingCustomer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (existingCustomer == null)
            throw new KeyNotFoundException($"Customer with id {request.CustomerId} not found");

        var now = DateTime.UtcNow;
        var initialStage = !string.IsNullOrEmpty(request.Stage)
            ? MappingExtensions.ParseOpportunityStage(request.Stage)
            : OpportunityStage.New;

        DateTime? expectedClose = null;
        if (!string.IsNullOrEmpty(request.ExpectedCloseDate))
        {
            if (!DateTime.TryParse(request.ExpectedCloseDate, out var dt)) throw new ArgumentException("تاريخ الإغلاق غير صالح.");
            expectedClose = dt;
        }

        var quoteRef = request.QuotationRef;
        if (string.IsNullOrEmpty(quoteRef) && initialStage == OpportunityStage.Quotation)
        {
            var count = Guid.NewGuid().ToString("N")[..12];
            quoteRef = $"Q-{DateTime.UtcNow.Year}-{count}";
        }

        var newOpp = new Opportunity
        {
            Id = $"op_{Guid.NewGuid().ToString("N")}",
            BranchId = "mahalla",
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            Title = request.Title.Trim(),
            MachineModel = request.MachineModel.Trim(),
            Quantity = request.Quantity,
            EstimatedValue = request.EstimatedValue,
            Stage = initialStage,
            StageUpdatedAt = now,
            AssignedRepId = request.AssignedRepId,
            AssignedRepName = request.AssignedRepName,
            ExpectedCloseDate = expectedClose,
            QuotationRef = quoteRef,
            Notes = request.Notes?.Trim(),
            CreatedAt = now
        };

        _context.Opportunities.Add(newOpp);

        // Update customer open pipeline value
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer != null && request.EstimatedValue.HasValue)
        {
            if (initialStage == OpportunityStage.Won) customer.LifetimeSales += request.EstimatedValue.Value;
            else if (initialStage != OpportunityStage.Lost) customer.OpenPipelineValue += request.EstimatedValue.Value;
        }

        // Add Activity entry
        var activity = new Activity
        {
            Id = $"act_{Guid.NewGuid().ToString("N")}",
            CustomerId = request.CustomerId,
            Type = ActivityType.StageChange,
            Title = $"إنشاء فرصة جديدة: {request.Title}",
            Description = $"ماكينة {request.MachineModel} (عدد {request.Quantity}) — مرحلة: جديد",
            OccurredAt = now,
            PerformedBy = request.AssignedRepName,
            MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                Channel: null,
                MachineModel: request.MachineModel,
                QuotationRef: quoteRef,
                OpportunityId: newOpp.Id,
                Amount: request.EstimatedValue,
                Outcome: null
            ))
        };
        _context.Activities.Add(activity);

        await _context.SaveChangesAsync();

        return newOpp.ToDto();
    }

    public async Task<OpportunityDto> UpdateAsync(string id, UpdateOpportunityRequest request)
    {
        var opp = await _context.Opportunities.FirstOrDefaultAsync(o => o.Id == id);
        if (opp == null)
            throw new KeyNotFoundException($"Opportunity with id {id} not found");

        if (request.Quantity.HasValue && request.Quantity.Value <= 0)
            throw new ArgumentException("الكمية يجب أن تكون 1 على الأقل.");

        if (request.EstimatedValue.HasValue && request.EstimatedValue.Value < 0)
            throw new ArgumentException("القيمة التقديرية لا يمكن أن تكون سالبة.");

        var previousStage = opp.Stage;
        var previousValue = opp.EstimatedValue ?? 0;
        if (!string.IsNullOrEmpty(request.Title)) opp.Title = request.Title.Trim();
        if (!string.IsNullOrEmpty(request.MachineModel)) opp.MachineModel = request.MachineModel.Trim();
        if (request.Quantity.HasValue) opp.Quantity = request.Quantity.Value;
        if (request.EstimatedValue.HasValue) opp.EstimatedValue = request.EstimatedValue.Value;
        if (!string.IsNullOrEmpty(request.Stage)) opp.Stage = MappingExtensions.ParseOpportunityStage(request.Stage);
        if (request.QuotationRef != null) opp.QuotationRef = request.QuotationRef.Trim();
        if (request.Notes != null) opp.Notes = request.Notes.Trim();
        if (request.ExpectedCloseDate != null)
        {
            if (request.ExpectedCloseDate == "") opp.ExpectedCloseDate = null;
            else if (DateTime.TryParse(request.ExpectedCloseDate, out var dt)) opp.ExpectedCloseDate = dt;
            else throw new ArgumentException("تاريخ الإغلاق غير صالح.");
        }

        if (previousStage != opp.Stage)
        {
            opp.StageUpdatedAt = DateTime.UtcNow;
            if (opp.Stage == OpportunityStage.Quotation && string.IsNullOrEmpty(opp.QuotationRef))
                opp.QuotationRef = $"Q-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..12]}";
            _context.Activities.Add(new Activity { Id = "act_" + Guid.NewGuid().ToString("N"), CustomerId = opp.CustomerId,
                Type = ActivityType.StageChange, Title = $"تحديث مرحلة الفرصة: {opp.Title}",
                Description = $"تم تغيير المرحلة إلى: {opp.Stage.ToSnakeCase()}", OccurredAt = opp.StageUpdatedAt,
                PerformedBy = opp.AssignedRepName,
                MetadataJson = JsonSerializer.Serialize(new { opportunityId = opp.Id, outcome = opp.Stage.ToSnakeCase(), amount = opp.EstimatedValue }) });
        }

        var parent = await _context.Customers.FirstOrDefaultAsync(c => c.Id == opp.CustomerId);
        if (parent != null) ApplyBalanceChange(parent, previousStage, previousValue, opp.Stage, opp.EstimatedValue ?? 0);
        await _context.SaveChangesAsync();

        return opp.ToDto();
    }

    public async Task<OpportunityDto> UpdateStageAsync(string id, UpdateStageRequest request)
    {
        var opp = await _context.Opportunities.FirstOrDefaultAsync(o => o.Id == id);
        if (opp == null)
            throw new KeyNotFoundException($"Opportunity with id {id} not found");

        var prevStage = opp.Stage;
        var nextStage = MappingExtensions.ParseOpportunityStage(request.Stage);
        if (prevStage == nextStage) return opp.ToDto();
        var now = DateTime.UtcNow;

        opp.Stage = nextStage;
        opp.StageUpdatedAt = now;

        if (!string.IsNullOrEmpty(request.Note))
        {
            opp.Notes = string.IsNullOrEmpty(opp.Notes) ? request.Note.Trim() : opp.Notes + " " + request.Note.Trim();
        }

        // Auto-generate quotation ref if moving to Quotation and none exists
        if (nextStage == OpportunityStage.Quotation && string.IsNullOrEmpty(opp.QuotationRef))
        {
            var count = Guid.NewGuid().ToString("N")[..12];
            opp.QuotationRef = $"Q-{DateTime.UtcNow.Year}-{count}";
        }

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == opp.CustomerId);
        if (customer != null) ApplyBalanceChange(customer, prevStage, opp.EstimatedValue ?? 0, nextStage, opp.EstimatedValue ?? 0);

        // Add Activity entry
        var activity = new Activity
        {
            Id = $"act_{Guid.NewGuid().ToString("N")}",
            CustomerId = opp.CustomerId,
            Type = ActivityType.StageChange,
            Title = $"تحديث مرحلة الفرصة: {opp.Title}",
            Description = $"تم تغيير المرحلة إلى: {nextStage.ToSnakeCase()}" + (!string.IsNullOrEmpty(request.Note) ? $" — {request.Note.Trim()}" : ""),
            OccurredAt = now,
            PerformedBy = opp.AssignedRepName,
            MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                Channel: null,
                MachineModel: opp.MachineModel,
                QuotationRef: opp.QuotationRef,
                OpportunityId: opp.Id,
                Amount: opp.EstimatedValue,
                Outcome: nextStage.ToSnakeCase()
            ))
        };
        _context.Activities.Add(activity);

        await _context.SaveChangesAsync();

        return opp.ToDto();
    }
    private static void ApplyBalanceChange(Customer customer, OpportunityStage before, decimal beforeValue, OpportunityStage after, decimal afterValue)
    {
        static bool Open(OpportunityStage stage) => stage != OpportunityStage.Won && stage != OpportunityStage.Lost;
        customer.OpenPipelineValue = Math.Max(0, customer.OpenPipelineValue - (Open(before) ? beforeValue : 0) + (Open(after) ? afterValue : 0));
        customer.LifetimeSales = Math.Max(0, customer.LifetimeSales - (before == OpportunityStage.Won ? beforeValue : 0) + (after == OpportunityStage.Won ? afterValue : 0));
        if (customer.LifetimeSales >= 250000) customer.IsVip = true;
    }

}
