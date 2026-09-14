using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Tests;

public sealed class CrmFactory : WebApplicationFactory<Program>
{
    public string DbFile { get; } = Path.Combine(Path.GetTempPath(), $"sewtec-test-{Guid.NewGuid():N}.db");
    public CrmDbContext OpenDb() => new(new DbContextOptionsBuilder<CrmDbContext>().UseSqlite($"Data Source={DbFile}").Options);
    protected override void ConfigureWebHost(IWebHostBuilder builder) => builder.UseEnvironment("Testing")
        .UseSetting("Jwt:Key", "ISOLATED-INTEGRATION-TEST-KEY-32-BYTES-MINIMUM")
        .UseSetting("ConnectionStrings:DefaultConnection", $"Data Source={DbFile}")
        .UseSetting("Logging:LogLevel:Default", "Error");
    public async Task Seed()
    {
        await using var db = OpenDb(); await db.Database.MigrateAsync();
        foreach (var (id, branch, role) in new[] { ("admin-a", "a", "admin"), ("rep-a", "a", "rep"), ("rep-b", "a", "rep"), ("admin-b", "b", "admin"), ("rep-c", "b", "rep") })
            db.Users.Add(new AppUser { Id = id, Username = id, FullName = id, BranchId = branch, Role = role, PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test-password-2026"), CreatedAt = DateTime.UtcNow });
        for (var index = 0; index < 3; index++)
        {
            var id = $"c{index}"; var owner = new[] { "rep-a", "rep-b", "rep-c" }[index];
            db.Customers.Add(new Customer { Id = id, Name = "عميل " + index, Phone = $"0100000000{index}", BranchId = index == 2 ? "b" : "a", AssignedRepId = owner, AssignedRepName = owner, LastContactAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow });
            db.Opportunities.Add(new Opportunity { Id = $"o{index}", CustomerId = id, BranchId = index == 2 ? "b" : "a", AssignedRepId = owner, AssignedRepName = owner, Title = "فرصة", MachineModel = "JACK", Quantity = 1, EstimatedValue = 1000, CreatedAt = DateTime.UtcNow });
            db.FollowUps.Add(new FollowUp { Id = $"f{index}", CustomerId = id, BranchId = index == 2 ? "b" : "a", AssignedRepId = owner, AssignedRepName = owner, Topic = "متابعة", ScheduledAt = DateTime.UtcNow.AddDays(1) });
            db.Activities.Add(new Activity { Id = $"a{index}", CustomerId = id, Title = "نشاط", Description = "اختبار", OccurredAt = DateTime.UtcNow });
            db.Interactions.Add(new Interaction { Id = $"i{index}", CustomerId = id, Summary = "تواصل", OccurredAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync();
    }
    public async Task<HttpClient> Login(string username)
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { username, password = "Test-password-2026" });
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", json.GetProperty("token").GetString());
        return client;
    }
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        foreach (var suffix in new[] { "", "-wal", "-shm" }) if (File.Exists(DbFile + suffix)) File.Delete(DbFile + suffix);
    }
}

public class ProductionSecurityTests
{
    [Fact]
    public async Task AccountSafeguards_Reports_AndDurableActors()
    {
        using var app = new CrmFactory(); await app.Seed(); using var admin = await app.Login("admin-a"); using var rep = await app.Login("rep-a");
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.DeleteAsync("/api/users/admin-a")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync("/api/users/admin-a", new { role = "rep" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync("/api/users/rep-a", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", new { username = "bad-role", fullName = "Bad", password = "Strong-password-2026", role = "supervisor" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PutAsJsonAsync("/api/users/rep-c", new { role = "admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await rep.PostAsJsonAsync("/api/products", new { model = "forged" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsync("/api/products/seed-from-file?filePath=../../secret", null)).StatusCode);
        (await rep.PostAsJsonAsync("/api/interactions", new { customerId = "c0", customerName = "forged", channel = "call", outcome = "interested", summary = "Verified actor", performedBy = "admin-b" })).EnsureSuccessStatusCode();
        (await admin.PutAsJsonAsync("/api/users/rep-a", new { fullName = "Renamed Rep" })).EnsureSuccessStatusCode();
        var users = await admin.GetFromJsonAsync<JsonElement>("/api/users");
        Assert.Equal(1, users.EnumerateArray().Single(u => u.GetProperty("id").GetString() == "rep-a").GetProperty("interactionsCount").GetInt32());
        Assert.Equal(2, (await admin.GetFromJsonAsync<JsonElement>("/api/reports/operational")).GetProperty("totalCustomers").GetInt32());
        (await admin.GetAsync("/api/users/monitoring")).EnsureSuccessStatusCode();
        (await admin.GetAsync("/api/mentoring/summary")).EnsureSuccessStatusCode();
        using var anonymous = app.CreateClient();
        foreach (var route in new[] { "customers", "opportunities", "follow-ups", "reports/operational", "products", "products/export", "users/directory", "search?q=test", "activities/customer/c0", "interactions/customer/c0" })
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/" + route)).StatusCode);
    }

    [Fact]
    public async Task EveryCustomerResource_IsScoped_AndPrivilegedRoutesDenyReps()
    {
        using var app = new CrmFactory(); await app.Seed(); using var rep = await app.Login("rep-a");
        foreach (var endpoint in new[] { "customers", "opportunities", "follow-ups" })
        {
            var page = await rep.GetFromJsonAsync<JsonElement>($"/api/{endpoint}?pageSize=1");
            Assert.Equal(1, page.GetProperty("totalCount").GetInt32());
            Assert.Single(page.GetProperty("items").EnumerateArray());
        }
        foreach (var endpoint in new[] { "customers/c1", "customers/c2", "opportunities/o1", "opportunities/o2", "follow-ups/f1", "follow-ups/f2" })
            Assert.Equal(HttpStatusCode.NotFound, (await rep.GetAsync("/api/" + endpoint)).StatusCode);
        foreach (var endpoint in new[] { "activities/customer/c1", "interactions/customer/c2" })
            Assert.Empty((await rep.GetFromJsonAsync<JsonElement>("/api/" + endpoint)).EnumerateArray());
        foreach (var endpoint in new[] { "users", "users/monitoring", "mentoring/notes", "system/info", "system/backup" })
            Assert.Equal(HttpStatusCode.Forbidden, (await rep.GetAsync("/api/" + endpoint)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await rep.PostAsJsonAsync("/api/demo/reset", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await rep.PostAsJsonAsync("/api/auth/register", new { })).StatusCode);
        using var anonymous = app.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync("/api/auth/register", new { role = "admin" })).StatusCode);
        using var admin = await app.Login("admin-a");
        Assert.Equal(2, (await admin.GetFromJsonAsync<JsonElement>("/api/customers")).GetProperty("totalCount").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync("/api/customers/c2")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync("/api/system/backup")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsJsonAsync("/api/demo/reset", new { })).StatusCode);
    }

    [Fact]
    public async Task DuplicateNumbers_AreGlobal_AndAssignmentsCannotBeForged()
    {
        using var app = new CrmFactory(); await app.Seed(); using var rep = await app.Login("rep-a");
        object Input(string phone, string? secondary = null) => new { name = "جديد", type = "factory", phone, phoneSecondary = secondary, assignedRepId = "rep-c", assignedRepName = "forged" };
        var duplicate = await rep.PostAsJsonAsync("/api/customers", Input("+20 100 000 0002"));
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.DoesNotContain("c2", await duplicate.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.Conflict, (await rep.PostAsJsonAsync("/api/customers", Input("01111111111", "٠١٠٠٠٠٠٠٠٠١"))).StatusCode);
        var created = await rep.PostAsJsonAsync("/api/customers", Input("01111111111", "01511111111"));
        created.EnsureSuccessStatusCode(); var record = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("rep-a", record.GetProperty("assignedRepId").GetString()); Assert.Equal("a", record.GetProperty("branchId").GetString());
        var id = record.GetProperty("id").GetString();
        using var fresh = app.OpenDb();
        Assert.Equal(2, await fresh.CustomerPhones.CountAsync(p => p.CustomerId == id));
        var races = await Task.WhenAll(rep.PostAsJsonAsync("/api/customers", Input("01211111111")), rep.PostAsJsonAsync("/api/customers", Input("01211111111")));
        Assert.Single(races, r => r.StatusCode == HttpStatusCode.Created);
        Assert.Single(races, r => r.StatusCode == HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task StaleWrites_AndSessionRevocation_AreEnforced()
    {
        using var app = new CrmFactory(); await app.Seed(); using var rep = await app.Login("rep-a");
        var customer = await rep.GetFromJsonAsync<JsonElement>("/api/customers/c0");
        var revision = customer.GetProperty("revision").GetString();
        Assert.Equal((HttpStatusCode)428, (await rep.PutAsJsonAsync("/api/customers/c0", new { notes = "missing version" })).StatusCode);
        rep.DefaultRequestHeaders.TryAddWithoutValidation("If-Match", revision);
        (await rep.PutAsJsonAsync("/api/customers/c0", new { notes = "saved" })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, (await rep.PutAsJsonAsync("/api/customers/c0", new { notes = "lost update" })).StatusCode);
        using var admin = await app.Login("admin-a");
        (await admin.PutAsJsonAsync("/api/users/rep-a", new { password = "Different-password-2026" })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized, (await rep.GetAsync("/api/customers")).StatusCode);
        using var fresh = app.OpenDb(); Assert.Equal("saved", (await fresh.Customers.SingleAsync(c => c.Id == "c0")).Notes);
    }

    [Fact]
    public async Task FollowUpCompletion_IsAtomic_AndRetryCannotDuplicateHistory()
    {
        using var app = new CrmFactory(); await app.Seed(); using var rep = await app.Login("rep-a");
        var followUp = await rep.GetFromJsonAsync<JsonElement>("/api/follow-ups/f0");
        rep.DefaultRequestHeaders.TryAddWithoutValidation("If-Match", followUp.GetProperty("revision").GetString());
        var failed = await rep.PostAsJsonAsync("/api/follow-ups/f0/complete", new { outcome = "interested", nextFollowUp = new { scheduledAt = "bad", channel = "call", topic = "retry" } });
        Assert.Equal(HttpStatusCode.BadRequest, failed.StatusCode);
        var saved = await rep.PostAsJsonAsync("/api/follow-ups/f0/complete", new { outcome = "no_answer" }); saved.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, (await rep.PostAsJsonAsync("/api/follow-ups/f0/complete", new { outcome = "no_answer" })).StatusCode);
        using var fresh = app.OpenDb();
        Assert.Equal(2, await fresh.FollowUps.CountAsync(f => f.CustomerId == "c0"));
        Assert.Equal(2, await fresh.Interactions.CountAsync(i => i.CustomerId == "c0"));
        Assert.Equal(2, await fresh.Activities.CountAsync(a => a.CustomerId == "c0"));
    }
}
