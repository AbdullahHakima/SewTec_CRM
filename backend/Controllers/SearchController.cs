using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;
namespace SewTec.CRM.Api.Controllers;
[ApiController, Route("api/search"), Authorize]
public class SearchController(CrmDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest();
        q = q.Trim().ToLower();
        var customers = await new ListQueryService(db).Customers(q, null, null, null, 1, 4);
        var opportunities = await db.Opportunities.AsNoTracking().Where(o => o.Title.ToLower().Contains(q) || o.CustomerName.ToLower().Contains(q) || o.MachineModel.ToLower().Contains(q)).OrderBy(o => o.Id).Take(3).ToListAsync();
        var products = await db.Products.AsNoTracking().Where(p => p.Model.ToLower().Contains(q) || p.Brand.ToLower().Contains(q) || p.DescriptionArabic.Contains(q)).OrderBy(p => p.Id).Take(3).ToListAsync();
        return Ok(new { customers = customers.Items, opportunities = opportunities.Select(o => o.ToDto()), products = products.Select(p => p.ToDto()), hasResults = customers.Items.Count + opportunities.Count + products.Count > 0 });
    }
}
