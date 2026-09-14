using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("operational")]
    public async Task<ActionResult<OperationalDashboardDto>> GetOperationalSummary()
    {
        var summary = await _reportingService.GetOperationalSummaryAsync();
        return Ok(summary);
    }
}
