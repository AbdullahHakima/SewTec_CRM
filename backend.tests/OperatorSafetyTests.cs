using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using SewTec.CRM.Api.Data;

namespace SewTec.CRM.Tests;

public class OperatorSafetyTests
{
    [Fact]
    public async Task FreshUpgrade_AppliesEveryMigration_AndWritesIntegrityReport()
    {
        using var factory = new CrmFactory();
        await using var db = factory.OpenDb();
        var report = factory.DbFile + ".upgrade.json";
        try
        {
            await DatabaseUpgrade.RunAsync(db, ["--migrate"]);
            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
            Assert.Contains("\"integrity\": \"ok\"", await File.ReadAllTextAsync(report));
        }
        finally { if (File.Exists(report)) File.Delete(report); }
    }

    [Fact]
    public async Task Bootstrap_RequiresStrongCredentials_AndCannotReplaceAccounts()
    {
        using var factory = new CrmFactory();
        await using var db = factory.OpenDb(); await db.Database.MigrateAsync();
        var settings = new Dictionary<string, string?> { ["Bootstrap:Username"] = " Owner ",
            ["Bootstrap:FullName"] = "Owner", ["Bootstrap:BranchId"] = "a", ["Bootstrap:Password"] = "short" };
        IConfiguration Config() => new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        await Assert.ThrowsAsync<ArgumentException>(() => BootstrapAdmin.RunAsync(db, Config()));
        Assert.Empty(await db.Users.ToListAsync());
        settings["Bootstrap:Password"] = "Isolated-test-password-2026";
        await BootstrapAdmin.RunAsync(db, Config());
        var account = await db.Users.SingleAsync();
        Assert.Equal("owner", account.Username); Assert.Equal("admin", account.Role);
        Assert.True(BCrypt.Net.BCrypt.Verify(settings["Bootstrap:Password"], account.PasswordHash));
        await Assert.ThrowsAsync<InvalidOperationException>(() => BootstrapAdmin.RunAsync(db, Config()));
        Assert.Single(await db.Users.ToListAsync());
    }

    [Fact]
    public async Task LegacyDuplicateReport_BlocksMigrationWithoutChangingRecords()
    {
        using var factory = new CrmFactory();
        await using var db = factory.OpenDb();
        await db.GetService<IMigrator>().MigrateAsync("20260913141052_LegacyBaseline");
        await db.Database.ExecuteSqlRawAsync("""
            INSERT INTO Customers (Id,Name,Type,Status,IsVip,Phone,Address,City,AssignedRepId,AssignedRepName,BranchId,CreatedAt,LastContactAt,OpenPipelineValue,LifetimeSales)
            VALUES ('one','one','factory','active',0,'01011111111','','','rep','rep','a','2026-01-01','2026-01-01',0,0),
                   ('two','two','factory','active',0,'+20 1011111111','','','rep','rep','b','2026-01-01','2026-01-01',0,0);
            """);
        try
        {
            await Assert.ThrowsAsync<InvalidOperationException>(() => DatabaseUpgrade.RunAsync(db, ["--migrate"]));
            Assert.Single(await db.Database.GetAppliedMigrationsAsync());
            var report = await File.ReadAllTextAsync(factory.DbFile + ".preflight.json");
            Assert.Contains("one", report); Assert.Contains("two", report);
        }
        finally { File.Delete(factory.DbFile + ".preflight.json"); }
    }
}
