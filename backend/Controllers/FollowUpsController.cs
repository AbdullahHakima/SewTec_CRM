using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/follow-ups")]
[Authorize]
public class FollowUpsController : ControllerBase
{
    private readonly IFollowUpService _followUpService;

    public FollowUpsController(IFollowUpService followUpService)
    {
        _followUpService = followUpService;
    }

    [HttpGet]
    public async Task<ActionResult<PageResult<FollowUpDto>>> GetAll(
        [FromQuery] string? view,
        [FromQuery] string? customerId,
        [FromQuery] string? assignedRepId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var list = await new ListQueryService(HttpContext.RequestServices.GetRequiredService<SewTec.CRM.Api.Data.CrmDbContext>()).FollowUps(view, customerId, assignedRepId, page, pageSize);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FollowUpDto>> GetById(string id)
    {
        var fu = await _followUpService.GetByIdAsync(id);
        if (fu == null)
            return NotFound(new { message = $"FollowUp with id {id} not found" });

        return Ok(fu);
    }

    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<List<FollowUpDto>>> GetByCustomerId(string customerId)
    {
        var list = await _followUpService.GetByCustomerIdAsync(customerId);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<FollowUpDto>> Create([FromBody] CreateFollowUpRequest request)
    {
        try
        {
            var created = await _followUpService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<object>> Complete(string id, [FromBody] CompleteFollowUpRequest request)
    {
        try
        {
            var result = await _followUpService.CompleteAsync(id, request);
            return Ok(new
            {
                followUp = result.FollowUp,
                interaction = result.Interaction,
                nextFollowUp = result.NextFollowUp
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/reschedule")]
    public async Task<ActionResult<FollowUpDto>> Reschedule(string id, [FromBody] RescheduleRequest request)
    {
        try
        {
            var updated = await _followUpService.RescheduleAsync(id, request);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
