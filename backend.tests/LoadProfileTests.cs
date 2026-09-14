using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class LoadProfileTests
{
    [Fact]
    [Trait("Category", "Performance")]
    public async Task TenThousandCustomers_TwentyActiveUsers()
    {
        if (Environment.GetEnvironmentVariable("SEWTEC_RUN_LOAD_TEST") != "1") return;
        using var factory = new CrmFactory(); await factory.Seed();
        await using var db = factory.OpenDb();
        var hash = (await db.Users.FirstAsync()).PasswordHash;
        var users = Enumerable.Range(0, 20).Select(i => new AppUser { Id = "load-user-" + i, Username = "load-user-" + i, FullName = "Load " + i, BranchId = "load", Role = "rep", PasswordHash = hash }).ToArray();
        db.Users.AddRange(users); await db.SaveChangesAsync();
        for (var i = 0; i < 10000; i++)
        {
            var id = "load-" + i; var owner = users[i % 20];
            db.Customers.Add(new Customer { Id = id, Name = "Load customer " + i.ToString("D5"), Phone = "011" + i.ToString("D8"), BranchId = "load", AssignedRepId = owner.Id, AssignedRepName = owner.FullName, CreatedAt = DateTime.UtcNow, LastContactAt = DateTime.UtcNow });
            db.Opportunities.Add(new Opportunity { Id = id, CustomerId = id, Title = "Machine", MachineModel = "JACK", Quantity = 1, EstimatedValue = 1000, AssignedRepId = owner.Id, BranchId = "load" });
            db.FollowUps.Add(new FollowUp { Id = id, CustomerId = id, Topic = "Follow up", ScheduledAt = DateTime.UtcNow.AddDays(1), AssignedRepId = owner.Id, BranchId = "load" });
            db.Interactions.Add(new Interaction { Id = id, CustomerId = id, Summary = "History", OccurredAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync(); db.ChangeTracker.Clear();
        var reads = new ConcurrentBag<double>(); var writes = new ConcurrentBag<double>();
        using var scope = factory.Services.CreateScope(); var auth = scope.ServiceProvider.GetRequiredService<AuthService>();
        var clients = users.Select(u => { var client = factory.CreateClient(); client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GenerateJwtToken(u)); return client; }).ToArray();
        try
        {
            foreach (var client in clients) (await client.GetAsync("/api/customers?pageSize=25")).EnsureSuccessStatusCode();
            await Task.WhenAll(clients.Select(async (client, index) =>
            {
                for (var iteration = 0; iteration < 10; iteration++)
                {
                    var timer = Stopwatch.StartNew();
                    var response = await client.GetAsync("/api/" + new[] { "customers", "opportunities", "follow-ups" }[iteration % 3] + "?pageSize=25");
                    response.EnsureSuccessStatusCode(); await response.Content.ReadAsByteArrayAsync(); reads.Add(timer.Elapsed.TotalMilliseconds);
                    if (iteration % 5 == 0)
                    {
                        timer.Restart();
                        var saved = await client.PostAsJsonAsync("/api/customers", new { name = "Load write", phone = "012" + (index * 10 + iteration).ToString("D8"), type = "factory", assignedRepId = users[index].Id, assignedRepName = users[index].FullName });
                        saved.EnsureSuccessStatusCode(); await saved.Content.ReadAsByteArrayAsync(); writes.Add(timer.Elapsed.TotalMilliseconds);
                    }
                }
            }));
            static object Stats(ConcurrentBag<double> samples) { var values = samples.Order().ToArray(); return new { count = values.Length, p50Ms = values[values.Length / 2], p95Ms = values[(int)Math.Ceiling(values.Length * .95) - 1], maxMs = values[^1] }; }
            var report = new { timestampUtc = DateTime.UtcNow, profile = "Windows local ASP.NET TestServer HTTP pipeline, SQLite file, 10,000 customers + 30,000 related rows, 20 distinct users, 200 paged reads and 40 creates; login/setup excluded; not socket/TLS/hosting load", reads = Stats(reads), writes = Stats(writes), processors = Environment.ProcessorCount, runtime = Environment.Version.ToString() };
            var output = Environment.GetEnvironmentVariable("SEWTEC_LOAD_REPORT") ?? Path.Combine(Path.GetTempPath(), "sewtec-load.json");
            await File.WriteAllTextAsync(output, JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
            Assert.Equal(10043, await db.Customers.CountAsync());
        }
        finally { foreach (var client in clients) client.Dispose(); }
    }
}
