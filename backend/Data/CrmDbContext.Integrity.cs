using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Security;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Data;

public partial class CrmDbContext
{
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ChangeTracker.DetectChanges();
        var changed = ChangeTracker.Entries().Where(e => e.State is EntityState.Added or EntityState.Modified).ToList();
        foreach (var entry in changed)
        {
            if (entry.Entity is Customer c)
            {
                if (Scoped)
                {
                    if (entry.State == EntityState.Added) c.BranchId = Branch;
                    if (c.BranchId != Branch || (!Admin && entry.State != EntityState.Added && (string?)entry.OriginalValues[nameof(Customer.AssignedRepId)] != ActorId))
                        throw new KeyNotFoundException("العميل غير موجود.");
                    if (!Admin) c.AssignedRepId = ActorId;
                    if (string.IsNullOrWhiteSpace(c.AssignedRepId)) c.AssignedRepId = ActorId;
                    var rep = await Users.FirstOrDefaultAsync(u => u.Id == c.AssignedRepId && u.IsActive, cancellationToken)
                        ?? throw new ArgumentException("اختر مستخدماً نشطاً من نفس الفرع.");
                    c.AssignedRepName = rep.FullName;
                }
                if (string.IsNullOrWhiteSpace(c.Name)) throw new ArgumentException("اسم العميل مطلوب.");
                // Normalize on phone changes only; unrelated writes never reinterpret legacy data.
                if (entry.State == EntityState.Added || entry.Property(nameof(Customer.Phone)).IsModified || entry.Property(nameof(Customer.PhoneSecondary)).IsModified)
                {
                    c.Phone = ValidatePhone(c.Phone);
                    c.PhoneSecondary = string.IsNullOrWhiteSpace(c.PhoneSecondary) ? null : ValidatePhone(c.PhoneSecondary);
                    var numbers = new[] { c.Phone, c.PhoneSecondary }.Where(n => n != null).Cast<string>().Distinct().ToList();
                    var collision = await CustomerPhones.AsNoTracking().FirstOrDefaultAsync(p => numbers.Contains(p.NormalizedPhone) && p.CustomerId != c.Id, cancellationToken);
                    if (collision != null)
                    {
                        var visible = await Customers.AnyAsync(x => x.Id == collision.CustomerId, cancellationToken);
                        throw new ConflictException("duplicate_customer", "رقم الهاتف مسجل لعميل بالفعل. تواصل مع مسؤول الفرع.", visible ? collision.CustomerId : null);
                    }
                    var previous = await CustomerPhones.Where(p => p.CustomerId == c.Id).ToListAsync(cancellationToken);
                    CustomerPhones.RemoveRange(previous.Where(p => !numbers.Contains(p.NormalizedPhone)));
                    foreach (var number in numbers.Where(n => previous.All(p => p.NormalizedPhone != n)))
                        CustomerPhones.Add(new CustomerPhone { CustomerId = c.Id, NormalizedPhone = number });
                }
                if (entry.State == EntityState.Modified && (entry.Property(nameof(Customer.AssignedRepId)).IsModified || entry.Property(nameof(Customer.AssignedRepName)).IsModified || entry.Property(nameof(Customer.Name)).IsModified || entry.Property(nameof(Customer.Phone)).IsModified))
                {
                    foreach (var opportunity in await Opportunities.Where(o => o.CustomerId == c.Id).ToListAsync(cancellationToken))
                    { opportunity.AssignedRepId = c.AssignedRepId; opportunity.AssignedRepName = c.AssignedRepName; opportunity.CustomerName = c.Name; opportunity.Revision = Guid.NewGuid().ToString("N"); }
                    foreach (var followUp in await FollowUps.Where(f => f.CustomerId == c.Id).ToListAsync(cancellationToken))
                    { followUp.AssignedRepId = c.AssignedRepId; followUp.AssignedRepName = c.AssignedRepName; followUp.CustomerName = c.Name; followUp.CustomerPhone = c.Phone; followUp.Revision = Guid.NewGuid().ToString("N"); }
                }
                c.Revision = Guid.NewGuid().ToString("N");
            }
            var customerId = entry.Entity switch
            {
                Opportunity o => o.CustomerId, FollowUp f => f.CustomerId, Interaction i => i.CustomerId,
                Activity a => a.CustomerId, InstalledMachine m => m.CustomerId, _ => null
            };
            if (customerId != null && Scoped)
            {
                var parent = await Customers.FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken)
                    ?? throw new KeyNotFoundException("العميل غير موجود.");
                switch (entry.Entity)
                {
                    case Opportunity o:
                        o.BranchId = parent.BranchId; o.CustomerName = parent.Name;
                        o.AssignedRepId = parent.AssignedRepId; o.AssignedRepName = parent.AssignedRepName;
                        break;
                    case FollowUp f:
                        f.BranchId = parent.BranchId; f.CustomerName = parent.Name; f.CustomerPhone = parent.Phone;
                        f.AssignedRepId = parent.AssignedRepId; f.AssignedRepName = parent.AssignedRepName;
                        break;
                    case Interaction i:
                        i.CustomerName = parent.Name; i.PerformedBy = ActorName; i.ActorId = ActorId;
                        if (i.FollowUpId != null && !await FollowUps.AnyAsync(f => f.Id == i.FollowUpId && f.CustomerId == customerId, cancellationToken)
                            && !FollowUps.Local.Any(f => f.Id == i.FollowUpId && f.CustomerId == customerId)) throw new ArgumentException("المتابعة لا تخص العميل.");
                        if (i.OpportunityId != null && !await Opportunities.AnyAsync(o => o.Id == i.OpportunityId && o.CustomerId == customerId, cancellationToken)) throw new ArgumentException("الفرصة لا تخص العميل.");
                        break;
                    case Activity a: a.PerformedBy = ActorName; a.ActorId = ActorId; break;
                }
            }
            switch (entry.Entity)
            {
                case Opportunity o:
                    if (o.Quantity <= 0 || o.EstimatedValue < 0 || string.IsNullOrWhiteSpace(o.MachineModel)) throw new ArgumentException("بيانات الفرصة غير صالحة.");
                    o.Revision = Guid.NewGuid().ToString("N"); break;
                case FollowUp f:
                    if (string.IsNullOrWhiteSpace(f.Topic)) throw new ArgumentException("موضوع المتابعة مطلوب.");
                    f.Revision = Guid.NewGuid().ToString("N"); break;
                case InstalledMachine m:
                    if (m.Quantity <= 0 || string.IsNullOrWhiteSpace(m.Model) || m.PurchaseYear < 1900 || m.PurchaseYear > DateTime.UtcNow.Year + 1) throw new ArgumentException("بيانات الماكينة غير صالحة.");
                    break;
                case MentoringNote n when Scoped:
                    n.BranchId = Branch; n.Author = ActorName; n.ActorId = ActorId;
                    var eligible = await Users.FirstOrDefaultAsync(u => u.Id == n.RepId && u.IsActive, cancellationToken);
                    if (!Admin || string.IsNullOrWhiteSpace(n.Message) || eligible == null || n.Type is not ("coaching" or "target" or "alert")) throw new ArgumentException("بيانات التوجيه غير صالحة.");
                    n.RepName = eligible.FullName;
                    break;
            }
        }
        foreach (var customerId in changed.Select(e => e.Entity).OfType<FollowUp>().Select(f => f.CustomerId).Distinct())
        {
            var parent = await Customers.FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);
            if (parent == null) continue;
            var scheduled = await FollowUps.AsNoTracking().Where(f => f.CustomerId == customerId && f.Status == FollowUpStatus.Scheduled).ToListAsync(cancellationToken);
            var pending = ChangeTracker.Entries<FollowUp>().Where(e => e.Entity.CustomerId == customerId).ToList();
            var dates = scheduled.Where(f => pending.All(e => e.Entity.Id != f.Id)).Select(f => f.ScheduledAt)
                .Concat(pending.Where(e => e.State != EntityState.Deleted && e.Entity.Status == FollowUpStatus.Scheduled).Select(e => e.Entity.ScheduledAt));
            parent.NextFollowUpAt = dates.Select(d => (DateTime?)d).Min();
            parent.Revision = Guid.NewGuid().ToString("N");
        }
        try { return await base.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { throw new ConflictException("stale_edit", "تم تعديل البيانات. حدّث الصفحة ثم أعد المحاولة."); }
        catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.Sqlite.SqliteException { SqliteErrorCode: 19, SqliteExtendedErrorCode: 1555 or 2067 })
        { throw new ConflictException("duplicate_record", "البيانات مسجلة بالفعل. حدّث الصفحة أو تواصل مع مسؤول الفرع."); }
    }

    public static string ValidatePhone(string raw)
    {
        var phone = CustomerService.NormalizePhone(raw);
        if (phone.Length != 11 || !(phone.StartsWith("010") || phone.StartsWith("011") || phone.StartsWith("012") || phone.StartsWith("015")))
            throw new ArgumentException("أدخل رقم هاتف محمول مصري صحيحاً.");
        return phone;
    }
}
