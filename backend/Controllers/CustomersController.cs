using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<PageResult<CustomerDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? assignedRepId,
        [FromQuery] bool? isStale,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var customers = await new ListQueryService(HttpContext.RequestServices.GetRequiredService<SewTec.CRM.Api.Data.CrmDbContext>()).Customers(search, type, assignedRepId, isStale, page, pageSize);
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetById(string id)
    {
        var customer = await _customerService.GetByIdAsync(id);
        if (customer == null)
            return NotFound(new { message = $"Customer with id {id} not found" });

        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerRequest request)
    {
        var created = await _customerService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerDto>> Update(string id, [FromBody] UpdateCustomerRequest request)
    {
        try
        {
            var updated = await _customerService.UpdateAsync(id, request);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/machines")]
    public async Task<ActionResult<CustomerDto>> AddMachine(string id, [FromBody] InstalledMachineDto request)
    {
        try
        {
            var updated = await _customerService.AddMachineAsync(id, request);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
