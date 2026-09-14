using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace SewTec.CRM.Api.Controllers;
[ApiController]
[Route("api/demo")]
[Authorize(Roles = "admin")]
public class DemoController : ControllerBase
{
    [HttpPost("reset")]
    public IActionResult ResetData() => NotFound();
}
