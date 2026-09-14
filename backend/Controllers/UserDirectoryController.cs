using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/users/directory")]
[Authorize]
public class UserDirectoryController(CrmDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await context.Users.Where(u => u.IsActive)
        .OrderBy(u => u.FullName).ThenBy(u => u.Id)
        .Select(u => new { u.Id, u.FullName, u.Role }).ToListAsync());
}
