using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public record PageResult<T>(List<T> Items, int TotalCount, int Page, int PageSize, object? Summary = null);
public class ListQueryService(CrmDbContext db)
{
    private static (int skip, int size, int page) Bounds(int page, int pageSize)
    {
        if (page < 1 || page > 100000 || pageSize < 1 || pageSize > 100) throw new ArgumentException("حدود الصفحة غير صالحة.");
        return ((page - 1) * pageSize, pageSize, page);
    }
    public async Task<PageResult<CustomerDto>> Customers(string? search, string? type, string? rep, bool? stale, int page, int pageSize)
    {
        var bounds = Bounds(page, pageSize);
        var query = db.Customers.AsNoTracking();
        var typeCounts = await query.GroupBy(c => c.Type).Select(g => new { Type = g.Key, Count = g.Count() }).ToListAsync();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower(); var phone = CustomerService.NormalizePhone(q);
            query = query.Where(c => c.Name.ToLower().Contains(q) || c.Phone.Contains(q) || (phone.Length > 0 && c.Phone.Contains(phone)) || (c.PhoneSecondary != null && c.PhoneSecondary.Contains(q)) || (c.ContactPerson != null && c.ContactPerson.ToLower().Contains(q)) || (c.Address != null && c.Address.ToLower().Contains(q)) || c.InstalledMachines.Any(m => m.Model.ToLower().Contains(q)));
        }
        if (!string.IsNullOrEmpty(type) && type != "all") { var value = MappingExtensions.ParseCustomerType(type); query = query.Where(c => c.Type == value); }
        if (!string.IsNullOrEmpty(rep) && rep != "all") query = query.Where(c => c.AssignedRepId == rep);
        if (stale == true) { var vipDate = DateTime.UtcNow.AddDays(-14); var otherDate = DateTime.UtcNow.AddDays(-21); query = query.Where(c => c.IsVip ? c.LastContactAt <= vipDate : c.LastContactAt <= otherDate); }
        var total = await query.CountAsync();
        var items = await query.OrderBy(c => c.Name).ThenBy(c => c.Id).Skip(bounds.skip).Take(bounds.size).Include(c => c.InstalledMachines).ToListAsync();
        return new(items.Select(c => c.ToDto()).ToList(), total, page, pageSize, new { typeCounts = typeCounts.ToDictionary(c => c.Type.ToSnakeCase(), c => c.Count), all = typeCounts.Sum(c => c.Count) });
    }
    public async Task<PageResult<OpportunityDto>> Opportunities(string? stage, string? customerId, string? rep, int page, int pageSize)
    {
        var bounds = Bounds(page, pageSize);
        var query = db.Opportunities.AsNoTracking();
        if (!string.IsNullOrEmpty(customerId)) query = query.Where(o => o.CustomerId == customerId);
        if (!string.IsNullOrEmpty(rep) && rep != "all") query = query.Where(o => o.AssignedRepId == rep);
        var groups = await query.GroupBy(o => o.Stage).Select(g => new { Stage = g.Key, Count = g.Count(), Value = g.Sum(o => (double)(o.EstimatedValue ?? 0)) }).ToListAsync();
        if (stage == "active") query = query.Where(o => o.Stage != OpportunityStage.Won && o.Stage != OpportunityStage.Lost);
        else if (!string.IsNullOrEmpty(stage) && stage != "all") { var value = MappingExtensions.ParseOpportunityStage(stage); query = query.Where(o => o.Stage == value); }
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(o => o.CreatedAt).ThenBy(o => o.Id).Skip(bounds.skip).Take(bounds.size).ToListAsync();
        var summary = new {
            activeCount = groups.Where(g => g.Stage != OpportunityStage.Won && g.Stage != OpportunityStage.Lost).Sum(g => g.Count),
            totalActiveValue = groups.Where(g => g.Stage != OpportunityStage.Won && g.Stage != OpportunityStage.Lost).Sum(g => g.Value),
            wonCount = groups.Where(g => g.Stage == OpportunityStage.Won).Sum(g => g.Count), totalWonValue = groups.Where(g => g.Stage == OpportunityStage.Won).Sum(g => g.Value),
            lostCount = groups.Where(g => g.Stage == OpportunityStage.Lost).Sum(g => g.Count),
            stageCounts = Enum.GetValues<OpportunityStage>().ToDictionary(s => s.ToSnakeCase(), s => new { count = groups.Where(g => g.Stage == s).Sum(g => g.Count), totalValue = groups.Where(g => g.Stage == s).Sum(g => g.Value) })
        };
        return new(items.Select(o => o.ToDto()).ToList(), total, page, pageSize, summary);
    }
    public async Task<PageResult<FollowUpDto>> FollowUps(string? view, string? customerId, string? rep, int page, int pageSize)
    {
        var bounds = Bounds(page, pageSize);
        var query = db.FollowUps.AsNoTracking();
        if (!string.IsNullOrEmpty(customerId)) query = query.Where(f => f.CustomerId == customerId);
        if (!string.IsNullOrEmpty(rep) && rep != "all") query = query.Where(f => f.AssignedRepId == rep);
        var start = BranchClock.DayStartUtc; var end = BranchClock.NextDayStartUtc;
        var summary = new {
            today = await query.CountAsync(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt >= start && f.ScheduledAt < end),
            overdue = await query.CountAsync(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt < start),
            upcoming = await query.CountAsync(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt >= end),
            completed = await query.CountAsync(f => f.Status == FollowUpStatus.Completed),
            completedToday = await query.CountAsync(f => f.Status == FollowUpStatus.Completed && f.CompletedAt >= start && f.CompletedAt < end)
        };
        query = view switch {
            "today" => query.Where(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt >= start && f.ScheduledAt < end),
            "overdue" => query.Where(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt < start),
            "upcoming" => query.Where(f => f.Status == FollowUpStatus.Scheduled && f.ScheduledAt >= end),
            "completed" => query.Where(f => f.Status == FollowUpStatus.Completed), _ => query
        };
        var total = await query.CountAsync();
        var items = await query.OrderBy(f => f.ScheduledAt).ThenBy(f => f.Id).Skip(bounds.skip).Take(bounds.size).ToListAsync();
        return new(items.Select(f => f.ToDto()).ToList(), total, page, pageSize, summary);
    }
}
