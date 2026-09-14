using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public class AuthService
{
    private readonly CrmDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(CrmDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<RegisteredUserResponse> RegisterAsync(RegisterRequest request)
    {
        if (!_context.Admin) throw new UnauthorizedAccessException();
        if (request.Role is not ("admin" or "rep") || string.IsNullOrWhiteSpace(request.FullName) || request.Password.Length < 12) throw new ArgumentException("اختر دوراً صالحاً وكلمة مرور من 12 حرفاً على الأقل.");
        if (_context.Users.IgnoreQueryFilters().Any(u => u.Username == request.Username.Trim().ToLower()))
            throw new InvalidOperationException("Username already exists.");

        var user = new AppUser
        {
            Id = Guid.NewGuid().ToString(),
            Username = request.Username.Trim().ToLower(),
            PasswordHash = HashPassword(request.Password),
            FullName = request.FullName,
            Role = request.Role,
            BranchId = _context.Branch,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new RegisteredUserResponse(user.Id, user.Username, user.FullName, user.Role, user.BranchId);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.Username == request.Username.Trim().ToLower() && u.IsActive)
            ?? throw new UnauthorizedAccessException("Invalid username or password.");

        if (!VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid username or password.");

        var token = GenerateJwtToken(user);
        await Task.CompletedTask;
        return new AuthResponse(token, user.Id, user.Username, user.FullName, user.Role, user.BranchId);
    }

    public string GenerateJwtToken(AppUser user)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "SewTecCRM";
        var audience = _configuration["Jwt:Audience"] ?? "SewTecCRMClient";
        var expirationHours = int.TryParse(_configuration["Jwt:ExpirationHours"], out var h) ? h : 24;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim("username", user.Username),
            new Claim("sessionVersion", user.SessionVersion),
            new Claim("fullName", user.FullName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("branchId", user.BranchId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
