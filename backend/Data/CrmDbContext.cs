using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Data;

public partial class CrmDbContext : DbContext
{
    private readonly SewTec.CRM.Api.Security.CurrentUser? _actor;
    public CrmDbContext(DbContextOptions<CrmDbContext> options, SewTec.CRM.Api.Security.CurrentUser? actor = null) : base(options) { _actor = actor; }
    public bool Scoped => _actor?.IsRequest == true;
    public string ActorId => _actor?.Id ?? "";
    public string ActorName => _actor?.Name ?? "";
    public string Branch => _actor?.BranchId ?? "";
    public bool Admin => _actor?.IsAdmin == true;
    public DbSet<CustomerPhone> CustomerPhones => Set<CustomerPhone>();

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<InstalledMachine> InstalledMachines => Set<InstalledMachine>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<FollowUp> FollowUps => Set<FollowUp>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<MentoringNote> MentoringNotes => Set<MentoringNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Customer>().HasQueryFilter(c => !Scoped || (c.BranchId == Branch && (Admin || c.AssignedRepId == ActorId)));
        modelBuilder.Entity<AppUser>().HasQueryFilter(u => !Scoped || (u.BranchId == Branch && (Admin || u.Id == ActorId)));
        modelBuilder.Entity<MentoringNote>().HasQueryFilter(n => !Scoped || (Admin && n.BranchId == Branch));
        modelBuilder.Entity<CustomerPhone>().HasKey(p => p.NormalizedPhone);
        modelBuilder.Entity<CustomerPhone>().HasOne<Customer>().WithMany().HasForeignKey(p => p.CustomerId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Opportunity>().HasQueryFilter(o => !Scoped || (o.Customer.BranchId == Branch && (Admin || o.Customer.AssignedRepId == ActorId)));
        modelBuilder.Entity<FollowUp>().HasQueryFilter(o => !Scoped || (o.Customer.BranchId == Branch && (Admin || o.Customer.AssignedRepId == ActorId)));
        modelBuilder.Entity<Interaction>().HasQueryFilter(o => !Scoped || (o.Customer.BranchId == Branch && (Admin || o.Customer.AssignedRepId == ActorId)));
        modelBuilder.Entity<Activity>().HasQueryFilter(o => !Scoped || (o.Customer.BranchId == Branch && (Admin || o.Customer.AssignedRepId == ActorId)));
        modelBuilder.Entity<InstalledMachine>().HasQueryFilter(o => !Scoped || (o.Customer.BranchId == Branch && (Admin || o.Customer.AssignedRepId == ActorId)));
        modelBuilder.Entity<Customer>().Property(c => c.Revision).IsConcurrencyToken();
        modelBuilder.Entity<Opportunity>().Property(c => c.Revision).IsConcurrencyToken();
        modelBuilder.Entity<FollowUp>().Property(c => c.Revision).IsConcurrencyToken();
        modelBuilder.Entity<AppUser>().Property(c => c.SessionVersion).IsConcurrencyToken();
        modelBuilder.Entity<Customer>().HasIndex(c => new { c.BranchId, c.AssignedRepId });
        modelBuilder.Entity<FollowUp>().HasIndex(f => new { f.CustomerId, f.Status, f.ScheduledAt });

        // ── Customer ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Customer>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).ValueGeneratedNever();

            e.Property(c => c.Type).HasConversion<string>();
            e.Property(c => c.Status).HasConversion<string>();

            e.HasIndex(c => c.Phone);
            e.HasIndex(c => c.BranchId);
        });

        // ── InstalledMachine ──────────────────────────────────────────────────
        modelBuilder.Entity<InstalledMachine>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Id).ValueGeneratedOnAdd();

            e.HasOne(m => m.Customer)
             .WithMany(c => c.InstalledMachines)
             .HasForeignKey(m => m.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Opportunity ───────────────────────────────────────────────────────
        modelBuilder.Entity<Opportunity>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.Id).ValueGeneratedNever();

            e.Property(o => o.Stage).HasConversion<string>();

            e.HasOne(o => o.Customer)
             .WithMany(c => c.Opportunities)
             .HasForeignKey(o => o.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(o => o.CustomerId);
            e.HasIndex(o => o.Stage);
        });

        // ── FollowUp ──────────────────────────────────────────────────────────
        modelBuilder.Entity<FollowUp>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Id).ValueGeneratedNever();

            e.Property(f => f.Channel).HasConversion<string>();
            e.Property(f => f.Status).HasConversion<string>();
            e.Property(f => f.Outcome).HasConversion<string>();

            e.HasOne(f => f.Customer)
             .WithMany(c => c.FollowUps)
             .HasForeignKey(f => f.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(f => f.CustomerId);
            e.HasIndex(f => f.Status);
        });

        // ── Interaction ───────────────────────────────────────────────────────
        modelBuilder.Entity<Interaction>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Id).ValueGeneratedNever();

            e.Property(i => i.Channel).HasConversion<string>();
            e.Property(i => i.Outcome).HasConversion<string>();

            e.HasOne(i => i.Customer)
             .WithMany(c => c.Interactions)
             .HasForeignKey(i => i.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Activity ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Activity>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).ValueGeneratedNever();

            e.Property(a => a.Type).HasConversion<string>();
            e.Property(a => a.MetadataJson).HasColumnName("MetadataJson");

            e.HasOne(a => a.Customer)
             .WithMany(c => c.Activities)
             .HasForeignKey(a => a.CustomerId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Product ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).ValueGeneratedNever();
        });

        // ── AppUser ───────────────────────────────────────────────────────────
        modelBuilder.Entity<AppUser>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).ValueGeneratedNever();

            e.HasIndex(u => u.Username).IsUnique();
        });

        // ── MentoringNote ─────────────────────────────────────────────────────
        modelBuilder.Entity<MentoringNote>(e =>
        {
            e.HasKey(n => n.Id);
            e.Property(n => n.Id).ValueGeneratedNever();
        });
    }
}
