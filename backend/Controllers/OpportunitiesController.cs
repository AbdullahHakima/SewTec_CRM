using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OpportunitiesController : ControllerBase
{
    private readonly IOpportunityService _opportunityService;

    public OpportunitiesController(IOpportunityService opportunityService)
    {
        _opportunityService = opportunityService;
    }

    [HttpGet]
    public async Task<ActionResult<PageResult<OpportunityDto>>> GetAll(
        [FromQuery] string? stage,
        [FromQuery] string? customerId,
        [FromQuery] string? assignedRepId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var list = await new ListQueryService(HttpContext.RequestServices.GetRequiredService<SewTec.CRM.Api.Data.CrmDbContext>()).Opportunities(stage, customerId, assignedRepId, page, pageSize);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OpportunityDto>> GetById(string id)
    {
        var opp = await _opportunityService.GetByIdAsync(id);
        if (opp == null)
            return NotFound(new { message = $"Opportunity with id {id} not found" });

        return Ok(opp);
    }

    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<List<OpportunityDto>>> GetByCustomerId(string customerId)
    {
        var list = await _opportunityService.GetByCustomerIdAsync(customerId);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<OpportunityDto>> Create([FromBody] CreateOpportunityRequest request)
    {
        var created = await _opportunityService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<OpportunityDto>> Update(string id, [FromBody] UpdateOpportunityRequest request)
    {
        try
        {
            var updated = await _opportunityService.UpdateAsync(id, request);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/stage")]
    public async Task<ActionResult<OpportunityDto>> UpdateStage(string id, [FromBody] UpdateStageRequest request)
    {
        try
        {
            var updated = await _opportunityService.UpdateStageAsync(id, request);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
