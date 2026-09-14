using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public static class TeamQueryService
{
    public static async Task<List<UserDto>> UsersAsync(CrmDbContext db)
    {
        var today = BranchClock.DayStartUtc;
        var users = await db.Users.AsNoTracking().OrderBy(u => u.FullName).ThenBy(u => u.Id).ToListAsync();
        var customers = await db.Customers.GroupBy(c => c.AssignedRepId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var opportunities = await db.Opportunities.GroupBy(o => new { o.AssignedRepId, o.Stage }).Select(g => new { Id = g.Key.AssignedRepId, g.Key.Stage, Value = g.Sum(o => (double)(o.EstimatedValue ?? 0)) }).ToListAsync();
        var tasks = await db.FollowUps.GroupBy(f => new { f.AssignedRepId, f.Status, Overdue = f.ScheduledAt < today }).Select(g => new { Id = g.Key.AssignedRepId, g.Key.Status, g.Key.Overdue, Count = g.Count() }).ToListAsync();
        var interactions = await db.Interactions.Where(i => i.ActorId != null).GroupBy(i => i.ActorId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        return users.Select(u => new UserDto(u.Id, u.Username, u.FullName, u.Role, u.BranchId, u.CreatedAt.ToString("o"),
            customers.FirstOrDefault(c => c.Id == u.Id)?.Count ?? 0,
            (decimal)opportunities.Where(o => o.Id == u.Id && o.Stage != OpportunityStage.Won && o.Stage != OpportunityStage.Lost).Sum(o => o.Value),
            (decimal)opportunities.Where(o => o.Id == u.Id && o.Stage == OpportunityStage.Won).Sum(o => o.Value),
            tasks.Where(f => f.Id == u.Id && f.Status == FollowUpStatus.Scheduled).Sum(f => f.Count),
            tasks.Where(f => f.Id == u.Id && f.Status == FollowUpStatus.Scheduled && f.Overdue).Sum(f => f.Count),
            tasks.Where(f => f.Id == u.Id && f.Status == FollowUpStatus.Completed).Sum(f => f.Count),
            interactions.FirstOrDefault(i => i.Id == u.Id)?.Count ?? 0, u.IsActive)).ToList();
    }

    public static async Task<TeamMonitoringSummaryDto> SummaryAsync(CrmDbContext db)
    {
        var users = await UsersAsync(db);
        var reps = users.Where(u => u.Role == "rep").ToList();
        if (reps.Count == 0) reps = users;
        var metrics = reps.Select(u => new RepPerformanceDto(u.Id, u.FullName, u.Username, u.Role, u.AssignedCustomersCount,
            u.ActivePipelineValue, u.TotalLifetimeSales, u.OverdueFollowUpsCount, u.CompletedFollowUpsCount,
            u.ScheduledFollowUpsCount, u.InteractionsCount,
            u.CompletedFollowUpsCount + u.ScheduledFollowUpsCount == 0 ? 100 : Math.Round(100d * u.CompletedFollowUpsCount / (u.CompletedFollowUpsCount + u.ScheduledFollowUpsCount), 1))).ToList();
        return new TeamMonitoringSummaryDto(reps.Count, users.Sum(u => u.AssignedCustomersCount), users.Sum(u => u.ActivePipelineValue),
            users.Sum(u => u.TotalLifetimeSales), users.Sum(u => u.OverdueFollowUpsCount), users.Sum(u => u.CompletedFollowUpsCount), metrics);
    }
}
