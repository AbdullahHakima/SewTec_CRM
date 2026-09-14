using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class OpportunityServiceTests
{
    private CrmDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new CrmDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_InvalidQuantity_ThrowsArgumentException()
    {
        using var context = CreateInMemoryContext();
        var service = new OpportunityService(context);

        var customer = new Customer { Id = "c1", Name = "عميل", Phone = "01000001122" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        var req = new CreateOpportunityRequest(
            CustomerId: customer.Id,
            CustomerName: customer.Name,
            Title: "توريد",
            MachineModel: "JACK A4B",
            Quantity: 0, // Invalid!
            EstimatedValue: 50000,
            Stage: "new",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            ExpectedCloseDate: null,
            QuotationRef: null,
            Notes: null
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(req));
        Assert.Contains("الكمية", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_NegativeValue_ThrowsArgumentException()
    {
        using var context = CreateInMemoryContext();
        var service = new OpportunityService(context);

        var customer = new Customer { Id = "c1", Name = "عميل", Phone = "01000001122" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        var req = new CreateOpportunityRequest(
            CustomerId: customer.Id,
            CustomerName: customer.Name,
            Title: "توريد",
            MachineModel: "JACK A4B",
            Quantity: 1,
            EstimatedValue: -5000, // Invalid!
            Stage: "new",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            ExpectedCloseDate: null,
            QuotationRef: null,
            Notes: null
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(req));
        Assert.Contains("القيمة", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_NonExistentCustomer_ThrowsKeyNotFoundException()
    {
        using var context = CreateInMemoryContext();
        var service = new OpportunityService(context);

        var req = new CreateOpportunityRequest(
            CustomerId: "ghost_customer",
            CustomerName: "شبح",
            Title: "توريد",
            MachineModel: "JACK A4B",
            Quantity: 1,
            EstimatedValue: 50000,
            Stage: "new",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            ExpectedCloseDate: null,
            QuotationRef: null,
            Notes: null
        );

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CreateAsync(req));
    }

    [Fact]
    public async Task UpdateStageAsync_WonStage_IncreasesLifetimeSalesAndSetsVip()
    {
        using var context = CreateInMemoryContext();
        var service = new OpportunityService(context);

        var customer = new Customer
        {
            Id = "cust_test_01",
            Name = "مصنع الإسكندرية للتريكو",
            Phone = "01000001122",
            LifetimeSales = 100000,
            OpenPipelineValue = 200000,
            IsVip = false
        };
        context.Customers.Add(customer);

        var opp = new Opportunity
        {
            Id = "opp_test_01",
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            Title = "توريد 4 ماكينات JACK A4B",
            MachineModel = "JACK A4B",
            Quantity = 4,
            EstimatedValue = 184000,
            Stage = OpportunityStage.Negotiation,
            AssignedRepId = "rep_01",
            AssignedRepName = "أحمد شحاتة"
        };
        context.Opportunities.Add(opp);
        await context.SaveChangesAsync();

        var updateReq = new UpdateStageRequest(
            Stage: "won",
            Note: "تم الاتفاق واستلام الدفعة المقدمة"
        );

        var updated = await service.UpdateStageAsync(opp.Id, updateReq);

        Assert.Equal("won", updated.Stage);
        var refreshedCustomer = await context.Customers.FindAsync(customer.Id);
        Assert.NotNull(refreshedCustomer);
        Assert.Equal(284000, refreshedCustomer.LifetimeSales); // 100,000 + 184,000
        Assert.True(refreshedCustomer.IsVip); // >= 250,000 sets VIP!
    }

    [Fact]
    public async Task UpdateStageAsync_WonToNegotiation_RevertsLifetimeSales()
    {
        using var context = CreateInMemoryContext();
        var service = new OpportunityService(context);

        var customer = new Customer
        {
            Id = "cust_test_02",
            Name = "مصنع السلام",
            Phone = "01000001133",
            LifetimeSales = 300000,
            OpenPipelineValue = 0,
            IsVip = true
        };
        context.Customers.Add(customer);

        var opp = new Opportunity
        {
            Id = "opp_test_02",
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            Title = "توريد ماكينات",
            MachineModel = "SIRUBA 747K",
            Quantity = 2,
            EstimatedValue = 100000,
            Stage = OpportunityStage.Won,
            AssignedRepId = "rep_01",
            AssignedRepName = "أحمد شحاتة"
        };
        context.Opportunities.Add(opp);
        await context.SaveChangesAsync();

        // Revert to negotiation
        var updateReq = new UpdateStageRequest("negotiation", "طلب تعديل العقد");
        await service.UpdateStageAsync(opp.Id, updateReq);

        var refreshedCustomer = await context.Customers.FindAsync(customer.Id);
        Assert.NotNull(refreshedCustomer);
        Assert.Equal(200000, refreshedCustomer.LifetimeSales); // 300,000 - 100,000
        Assert.Equal(100000, refreshedCustomer.OpenPipelineValue);
    }
}

