using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly CrmDbContext _context;

    public AuthController(AuthService authService, CrmDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [HttpPost("login")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var res = await _authService.LoginAsync(request);
            return Ok(res);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<RegisteredUserResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var res = await _authService.RegisterAsync(request);
            return Created("/api/users", res);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<object>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Role,
            user.BranchId
        });
    }
}
