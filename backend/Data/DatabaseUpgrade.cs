using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Data.Sqlite;
using System.Text.Json;

namespace SewTec.CRM.Api.Data;

public static class DatabaseUpgrade
{
    public static async Task RunAsync(CrmDbContext db, string[] args)
    {
        await db.Database.OpenConnectionAsync();
        var connection = (SqliteConnection)db.Database.GetDbConnection();
        using var tables = connection.CreateCommand();
        tables.CommandText = "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='Customers'";
        var existing = Convert.ToInt32(await tables.ExecuteScalarAsync()) > 0;
        if (existing)
        {
            // This report deliberately contains identifiers and numbers, not names or credentials.
            // Store it with operator-only permissions alongside the offline backup.
            var numbers = new Dictionary<string, HashSet<string>>();
            var invalid = new List<string>();
            using var read = connection.CreateCommand();
            read.CommandText = "SELECT Id, Phone, PhoneSecondary FROM Customers";
            using (var rows = await read.ExecuteReaderAsync())
                while (await rows.ReadAsync())
                    for (var column = 1; column <= 2; column++)
                    {
                        if (rows.IsDBNull(column) || string.IsNullOrWhiteSpace(rows.GetString(column))) continue;
                        try
                        {
                            var number = CrmDbContext.ValidatePhone(rows.GetString(column));
                            if (!numbers.TryGetValue(number, out var ids)) numbers[number] = ids = new();
                            ids.Add(rows.GetString(0));
                        }
                        catch (ArgumentException) { invalid.Add(rows.GetString(0)); }
                    }
            var duplicates = numbers.Where(p => p.Value.Count > 1).ToDictionary(p => p.Key, p => p.Value);
            var reportPath = Path.GetFullPath(connection.DataSource + ".preflight.json");
            await File.WriteAllTextAsync(reportPath, JsonSerializer.Serialize(new { duplicates, invalidCustomerIds = invalid.Distinct() }, new JsonSerializerOptions { WriteIndented = true }));
            if (duplicates.Count > 0 || invalid.Count > 0)
                throw new InvalidOperationException($"Migration blocked: review phone conflicts in {reportPath}. No records merged.");
            if (args.Contains("--report-only")) return;
            using var backup = new SqliteConnection($"Data Source={connection.DataSource}.{DateTime.UtcNow:yyyyMMddHHmmss}.bak");
            backup.Open();
            connection.BackupDatabase(backup);

            var applied = (await db.Database.GetAppliedMigrationsAsync()).ToList();
            if (applied.Count == 0)
            {
                if (!args.Contains("--baseline-legacy")) throw new InvalidOperationException("Existing unversioned database: use --baseline-legacy after reviewing the copy and backup.");
                // Compare every baseline column against an independently migrated in-memory database.
                using var baseline = new SqliteConnection("Data Source=:memory:");
                baseline.Open();
                using var expected = new CrmDbContext(new DbContextOptionsBuilder<CrmDbContext>().UseSqlite(baseline).Options);
                await expected.GetService<IMigrator>().MigrateAsync("20260913141052_LegacyBaseline");
                var expectedSchema = await Schema(baseline);
                var actualSchema = await Schema(connection);
                foreach (var (table, columns) in expectedSchema.Where(x => !x.Key.StartsWith("__")))
                    if (!actualSchema.TryGetValue(table, out var actual) || columns.Except(actual).Any())
                        throw new InvalidOperationException($"Legacy schema mismatch in {table}. Restore/upgrade the copy explicitly before baselining.");
                await db.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (MigrationId TEXT NOT NULL PRIMARY KEY, ProductVersion TEXT NOT NULL); INSERT INTO __EFMigrationsHistory VALUES ('20260913141052_LegacyBaseline','10.0.12');");
            }
        }
        if (args.Contains("--report-only")) return;
        await db.Database.MigrateAsync();
        using var check = connection.CreateCommand();
        check.CommandText = "PRAGMA integrity_check";
        if ((string?)await check.ExecuteScalarAsync() != "ok") throw new InvalidOperationException("Integrity check failed.");
        var upgradeReport = new
        {
            appliedMigrations = await db.Database.GetAppliedMigrationsAsync(),
            unmappedInteractionActors = await db.Interactions.IgnoreQueryFilters().CountAsync(i => i.ActorId == null),
            unmappedActivityActors = await db.Activities.IgnoreQueryFilters().CountAsync(i => i.ActorId == null),
            unmappedMentoringAuthors = await db.MentoringNotes.IgnoreQueryFilters().CountAsync(i => i.ActorId == null),
            unmappedMentoringReps = await db.MentoringNotes.IgnoreQueryFilters().CountAsync(i => i.RepId == null),
            integrity = "ok",
            completedAtUtc = DateTime.UtcNow
        };
        await File.WriteAllTextAsync(Path.GetFullPath(connection.DataSource + ".upgrade.json"),
            JsonSerializer.Serialize(upgradeReport, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static async Task<Dictionary<string, HashSet<string>>> Schema(SqliteConnection connection)
    {
        var result = new Dictionary<string, HashSet<string>>();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT m.name, p.name FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type = 'table'";
        using var rows = await command.ExecuteReaderAsync();
        while (await rows.ReadAsync())
        {
            if (!result.TryGetValue(rows.GetString(0), out var columns)) result[rows.GetString(0)] = columns = new();
            columns.Add(rows.GetString(1));
        }
        return result;
    }
}
