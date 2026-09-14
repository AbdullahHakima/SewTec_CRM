using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class AuthServiceTests
{
    private (CrmDbContext, IConfiguration) CreateDependencies()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new CrmDbContext(options);

        var myConfig = new Dictionary<string, string?>
        {
            {"Jwt:Key", "TESTING_MOCK_JWT_KEY_32_BYTES_MIN!"},
            {"Jwt:Issuer", "SewTecCRM"},
            {"Jwt:Audience", "SewTecCRMClient"},
            {"Jwt:ExpirationHours", "24"}
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfig)
            .Build();

        return (context, configuration);
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsJwtTokenAndUserData()
    {
        var (context, config) = CreateDependencies();
        var service = new AuthService(context, config);

        var password = "secretPassword123";
        var user = new AppUser
        {
            Id = "user_01",
            Username = "ahmed_sales",
            PasswordHash = service.HashPassword(password),
            FullName = "أحمد شحاتة",
            Role = "sales_rep",
            BranchId = "branch_mahalla",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var response = await service.LoginAsync(new LoginRequest(user.Username, password));

        Assert.NotNull(response);
        Assert.False(string.IsNullOrEmpty(response.Token));
        Assert.Equal(user.Username, response.Username);
        Assert.Equal("sales_rep", response.Role);
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorizedAccessException()
    {
        var (context, config) = CreateDependencies();
        var service = new AuthService(context, config);

        var user = new AppUser
        {
            Id = "user_02",
            Username = "mohamed_sales",
            PasswordHash = service.HashPassword("correctPassword"),
            FullName = "محمد السيد",
            Role = "sales_rep",
            BranchId = "branch_mahalla",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.LoginAsync(new LoginRequest(user.Username, "wrongPassword")));
    }
}

