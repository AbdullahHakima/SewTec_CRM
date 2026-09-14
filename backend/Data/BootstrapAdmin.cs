using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Data;

public static class BootstrapAdmin
{
    // Operator command only. Credentials come from the process environment, never command arguments or logs.
    public static async Task RunAsync(CrmDbContext db, IConfiguration configuration)
    {
        if ((await db.Database.GetPendingMigrationsAsync()).Any())
            throw new InvalidOperationException("Run the database migration before creating the first administrator.");
        var username = configuration["Bootstrap:Username"]?.Trim().ToLowerInvariant();
        var password = configuration["Bootstrap:Password"];
        var name = configuration["Bootstrap:FullName"]?.Trim();
        var branch = configuration["Bootstrap:BranchId"]?.Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(branch) || password is null || password.Length < 12)
            throw new ArgumentException("Set Bootstrap__Username, Bootstrap__Password (12+ characters), Bootstrap__FullName and Bootstrap__BranchId in the operator environment.");
        await using var transaction = await db.Database.BeginTransactionAsync();
        if (await db.Users.IgnoreQueryFilters().AnyAsync())
            throw new InvalidOperationException("Bootstrap is available only for an empty account database. Use authorized account administration thereafter.");
        db.Users.Add(new AppUser { Id = "user_" + Guid.NewGuid().ToString("N"), Username = username,
            FullName = name, BranchId = branch, Role = "admin", IsActive = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password), CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}
