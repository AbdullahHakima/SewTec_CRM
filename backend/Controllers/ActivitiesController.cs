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
public class ActivitiesController : ControllerBase
{
    private readonly CrmDbContext _context;

    public ActivitiesController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<List<ActivityDto>>> GetByCustomerId(string customerId)
    {
        var list = await _context.Activities
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.OccurredAt)
            .ToListAsync();

        return Ok(list.Select(a => a.ToDto()).ToList());
    }
}
