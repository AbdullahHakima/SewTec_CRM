using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class MentoringController : ControllerBase
{
    private readonly IMentoringService _mentoringService;

    public MentoringController(IMentoringService mentoringService)
    {
        _mentoringService = mentoringService;
    }

    [HttpGet("notes")]
    public async Task<ActionResult<List<MentoringNoteDto>>> GetNotes()
    {
        var notes = await _mentoringService.GetNotesAsync();
        return Ok(notes);
    }

    [HttpPost("notes")]
    public async Task<ActionResult<MentoringNoteDto>> CreateNote([FromBody] CreateMentoringNoteRequest request)
    {
        var note = await _mentoringService.CreateNoteAsync(request);
        return Ok(note);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<TeamMonitoringSummaryDto>> GetSummary()
    {
        var summary = await _mentoringService.GetMonitoringSummaryAsync();
        return Ok(summary);
    }
}
