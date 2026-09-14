using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class FollowUpServiceTests
{
    private CrmDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new CrmDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_MissingCustomerId_ThrowsArgumentException()
    {
        using var context = CreateInMemoryContext();
        var service = new FollowUpService(context);

        var req = new CreateFollowUpRequest(
            CustomerId: "   ",
            CustomerName: "عميل",
            CustomerPhone: "01000001122",
            Channel: "call",
            ScheduledAt: DateTime.UtcNow.AddDays(1).ToString("o"),
            Topic: "متابعة",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة"
        );

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(req));
    }

    [Fact]
    public async Task CompleteFollowUpAsync_NoAnswer_CreatesNextDayRetryTaskAndLogsInteraction()
    {
        using var context = CreateInMemoryContext();
        var service = new FollowUpService(context);

        var customer = new Customer
        {
            Id = "cust_fu_01",
            Name = "مصنع السعادة",
            Phone = "01011112222",
            AssignedRepId = "rep_01",
            AssignedRepName = "أحمد شحاتة"
        };
        context.Customers.Add(customer);

        var followUp = new FollowUp {
            Id = "fu_test_01",
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            Channel = FollowUpChannel.Call,
            Topic = "متابعة كوتيشن ماكينات Jack C4",
            ScheduledAt = DateTime.UtcNow.AddHours(-2), // overdue
            Status = FollowUpStatus.Scheduled,
            AssignedRepId = "rep_01",
            AssignedRepName = "أحمد شحاتة"
        };
        context.FollowUps.Add(followUp);
        await context.SaveChangesAsync();

        var completeReq = new CompleteFollowUpRequest(
            Outcome: "no_answer",
            OutcomeNote: "الهاتف يرن دون إجابة",
            UninterestedReason: null,
            NextFollowUp: null
        );

        var result = await service.CompleteAsync(followUp.Id, completeReq);

        Assert.Equal("completed", result.FollowUp.Status);
        Assert.NotNull(result.NextFollowUp);
        Assert.Contains("لم يرد سابقاً", result.NextFollowUp.Topic);
        
        // Assert automated retry task was created in DB
        var retryTask = await context.FollowUps.FirstOrDefaultAsync(f => f.Topic.Contains("لم يرد سابقاً"));
        Assert.NotNull(retryTask);
        Assert.Equal(FollowUpStatus.Scheduled, retryTask.Status);
        Assert.Equal(customer.Id, retryTask.CustomerId);

        // Assert interaction was logged
        var interaction = await context.Interactions.FirstOrDefaultAsync(i => i.CustomerId == customer.Id);
        Assert.NotNull(interaction);
        Assert.Equal(InteractionOutcome.NoAnswer, interaction.Outcome);
    }

    [Fact]
    public async Task CompleteFollowUpAsync_AlreadyCompleted_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryContext();
        var service = new FollowUpService(context);

        var fu = new FollowUp {Topic = "متابعة اختبار", 
            Id = "fu_done_01",
            CustomerId = "c1",
            Customer = new Customer { Id = "c1", Name = "عميل", Phone = "01011112222" },
            CustomerName = "عميل",
            ScheduledAt = DateTime.UtcNow,
            Status = FollowUpStatus.Completed
        };
        context.FollowUps.Add(fu);
        await context.SaveChangesAsync();

        var completeReq = new CompleteFollowUpRequest("connected", "تم التواصل", null, null);

        var ex = await Assert.ThrowsAsync<SewTec.CRM.Api.Security.ConflictException>(() => service.CompleteAsync(fu.Id, completeReq));
        Assert.Contains("مسبقاً", ex.Message);
    }

    [Fact]
    public async Task RescheduleAsync_AlreadyCompleted_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryContext();
        var service = new FollowUpService(context);

        var fu = new FollowUp {Topic = "متابعة اختبار", 
            Id = "fu_done_02",
            CustomerId = "c1",
            Customer = new Customer { Id = "c1", Name = "عميل", Phone = "01011112222" },
            CustomerName = "عميل",
            ScheduledAt = DateTime.UtcNow,
            Status = FollowUpStatus.Completed
        };
        context.FollowUps.Add(fu);
        await context.SaveChangesAsync();

        var rescheduleReq = new RescheduleRequest(DateTime.UtcNow.AddDays(2).ToString("o"));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.RescheduleAsync(fu.Id, rescheduleReq));
        Assert.Contains("إنجازها", ex.Message);
    }

    [Fact]
    public async Task RescheduleAsync_InvalidDate_ThrowsArgumentException()
    {
        using var context = CreateInMemoryContext();
        var service = new FollowUpService(context);

        var fu = new FollowUp {Topic = "متابعة اختبار", 
            Id = "fu_pending_03",
            CustomerId = "c1",
            Customer = new Customer { Id = "c1", Name = "عميل", Phone = "01011112222" },
            CustomerName = "عميل",
            ScheduledAt = DateTime.UtcNow,
            Status = FollowUpStatus.Scheduled
        };
        context.FollowUps.Add(fu);
        await context.SaveChangesAsync();

        var rescheduleReq = new RescheduleRequest("invalid-not-a-date");

        await Assert.ThrowsAsync<ArgumentException>(() => service.RescheduleAsync(fu.Id, rescheduleReq));
    }
}

