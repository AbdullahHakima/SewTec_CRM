using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public record OperationalDashboardDto(
    int TotalCustomers,
    int VipCustomers,
    int FactoryCount,
    int WorkshopCount,
    int TraderCount,
    int IndividualCount,
    decimal TotalActivePipeline,
    decimal TotalLifetimeSales,
    int OverdueFollowUps,
    int TodayFollowUps,
    int WonDealsCount,
    Dictionary<string, int> BrandDistribution,
    Dictionary<string, decimal> StageValueBreakdown
);

public interface IReportingService
{
    Task<OperationalDashboardDto> GetOperationalSummaryAsync();
}

public class ReportingService : IReportingService
{
    private readonly CrmDbContext _context;

    public ReportingService(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<OperationalDashboardDto> GetOperationalSummaryAsync()
    {
        var customers = _context.Customers.AsNoTracking();
        var opportunities = _context.Opportunities.AsNoTracking();
        var followUps = _context.FollowUps.AsNoTracking();
        var dayStart = BranchClock.DayStartUtc;
        var nextDay = BranchClock.NextDayStartUtc;
        var customerCounts = await customers.GroupBy(c => c.Type).Select(g => new { Type = g.Key, Count = g.Count() }).ToListAsync();
        var stages = await opportunities.GroupBy(o => o.Stage).Select(g => new { Stage = g.Key, Count = g.Count(), Value = g.Sum(o => (double)(o.EstimatedValue ?? 0)) }).ToListAsync();
        var brands = await _context.InstalledMachines.GroupBy(m => m.Model.ToUpper().Contains("JACK") ? "JACK" : m.Model.ToUpper().Contains("HIKARI") ? "HIKARI" : m.Model.ToUpper().Contains("SIRUBA") ? "SIRUBA" : m.Model.ToUpper().Contains("JUKI") ? "JUKI" : "OTHER")
            .Select(g => new { Brand = g.Key, Quantity = g.Sum(m => m.Quantity) }).ToListAsync();
        var brandDist = new[] { "JACK", "HIKARI", "SIRUBA", "JUKI", "OTHER" }.ToDictionary(b => b, b => brands.FirstOrDefault(g => g.Brand == b)?.Quantity ?? 0);
        var stageValues = Enum.GetValues<OpportunityStage>().ToDictionary(stage => stage.ToSnakeCase(), stage => (decimal)(stages.FirstOrDefault(g => g.Stage == stage)?.Value ?? 0));
        int Count(CustomerType type) => customerCounts.FirstOrDefault(g => g.Type == type)?.Count ?? 0;
        return new OperationalDashboardDto(
            customerCounts.Sum(g => g.Count), await customers.CountAsync(c => c.IsVip),
            Count(CustomerType.Factory), Count(CustomerType.Workshop), Count(CustomerType.Trader), Count(CustomerType.Individual),
            (decimal)stages.Where(g => g.Stage != OpportunityStage.Won && g.Stage != OpportunityStage.Lost).Sum(g => g.Value),
            (decimal)await customers.SumAsync(c => (double)c.LifetimeSales),
            await followUps.CountAsync(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt < dayStart),
            await followUps.CountAsync(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt >= dayStart && f.ScheduledAt < nextDay),
            stages.FirstOrDefault(g => g.Stage == OpportunityStage.Won)?.Count ?? 0, brandDist, stageValues);
    }
}
