using System.IO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class SystemController : ControllerBase
{
    private readonly CrmDbContext _context;
    public SystemController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet("backup")]
    public async Task<IActionResult> DownloadBackup()
    {
        await Task.CompletedTask;
        return NotFound(); // Whole-database backups are operator-only, never an application download.
    }

    [HttpGet("info")]
    public async Task<ActionResult<object>> GetSystemInfo()
    {
        var customerCount = await _context.Customers.CountAsync();
        var oppCount = await _context.Opportunities.CountAsync();
        var followUpCount = await _context.FollowUps.CountAsync();
        var userCount = await _context.Users.CountAsync();
        var activityCount = await _context.Activities.CountAsync();

        return Ok(new
        {
            status = "Operational",
            branchId = _context.Branch,
            timezone = "Africa/Cairo",
            databaseEngine = "SQLite",
            entityCounts = new
            {
                customers = customerCount,
                opportunities = oppCount,
                followUps = followUpCount,
                users = userCount,
                activities = activityCount
            },
            serverTimeUtc = DateTime.UtcNow.ToString("o")
        });
    }
}
