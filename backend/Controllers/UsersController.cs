using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class UsersController : ControllerBase
{
    private readonly CrmDbContext _context;

    public UsersController(CrmDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        return Ok(await SewTec.CRM.Api.Services.TeamQueryService.UsersAsync(_context));
    }

    [HttpGet("monitoring")]
    public async Task<ActionResult<TeamMonitoringSummaryDto>> GetMonitoringSummary()
    {
        return Ok(await SewTec.CRM.Api.Services.TeamQueryService.SummaryAsync(_context));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        if (request.Role is not ("admin" or "rep") || request.Password.Length < 12 || string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "اختر دوراً صالحاً وكلمة مرور من 12 حرفاً على الأقل." });
        var exists = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());
        if (exists)
        {
            return BadRequest(new { message = "اسم المستخدم مستخدم بالفعل." });
        }

        var newUser = new AppUser
        {
            Id = $"user_{Guid.NewGuid().ToString("N")}",
            Username = request.Username.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "rep" : request.Role,
            BranchId = _context.Branch,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        var dto = new UserDto(
            newUser.Id,
            newUser.Username,
            newUser.FullName,
            newUser.Role,
            newUser.BranchId,
            newUser.CreatedAt.ToString("o"),
            0, 0, 0, 0, 0, 0, 0
        );

        return CreatedAtAction(nameof(GetAll), new { id = newUser.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
            return NotFound(new { message = "المستخدم غير موجود." });

        if (request.Role != null && request.Role is not ("admin" or "rep")) return BadRequest(new { message = "الدور غير صالح." });
        if (request.Password != null && request.Password.Length < 12) return BadRequest(new { message = "كلمة المرور يجب أن تكون 12 حرفاً على الأقل." });
        if (user.IsActive && user.Role == "admin" && (request.Role == "rep" || request.IsActive == false) && await _context.Users.CountAsync(u => u.Role == "admin" && u.IsActive) <= 1)
            return BadRequest(new { message = "لا يمكن تعطيل آخر مسؤول في الفرع." });
        if (request.IsActive == false && await _context.Customers.AnyAsync(c => c.AssignedRepId == id))
            return BadRequest(new { message = "أعد توزيع العملاء قبل تعطيل المستخدم." });
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        user.SessionVersion = Guid.NewGuid().ToString("N");
        if (!string.IsNullOrWhiteSpace(request.FullName) && request.FullName.Trim() != user.FullName)
        {
            user.FullName = request.FullName.Trim();
            foreach (var customer in await _context.Customers.Where(c => c.AssignedRepId == user.Id).ToListAsync())
                customer.AssignedRepName = user.FullName;
        }
        if (!string.IsNullOrWhiteSpace(request.Role)) user.Role = request.Role.Trim();
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _context.SaveChangesAsync();

        return Ok(new UserDto(
            user.Id,
            user.Username,
            user.FullName,
            user.Role,
            user.BranchId,
            user.CreatedAt.ToString("o"),
            0, 0, 0, 0, 0, 0, 0, user.IsActive
        ));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null)
            return NotFound(new { message = "المستخدم غير موجود." });

        if (user.Role == "admin" && user.IsActive)
        {
            var adminCount = await _context.Users.CountAsync(u => u.Role == "admin" && u.IsActive);
            if (adminCount <= 1)
            {
                return BadRequest(new { message = "لا يمكن حذف آخر مسؤول نظام في الفرع." });
            }
        }

        if (await _context.Customers.AnyAsync(c => c.AssignedRepId == id) || await _context.Opportunities.AnyAsync(o => o.AssignedRepId == id) || await _context.FollowUps.AnyAsync(f => f.AssignedRepId == id))
            return BadRequest(new { message = "أعد توزيع العملاء والعمل المفتوح قبل حذف المستخدم." });
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "تم حذف المستخدم بنجاح." });
    }
}
