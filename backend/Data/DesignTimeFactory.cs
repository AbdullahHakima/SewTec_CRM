using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SewTec.CRM.Api.Data;

public class DesignTimeFactory : IDesignTimeDbContextFactory<CrmDbContext>
{
    public CrmDbContext CreateDbContext(string[] args) => new(
        new DbContextOptionsBuilder<CrmDbContext>().UseSqlite("Data Source=design-only.db").Options);
}
