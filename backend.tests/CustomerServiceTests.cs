using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class CustomerServiceTests
{
    private CrmDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new CrmDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_Valid11DigitPhone_CreatesCustomerSuccessfully()
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var request = new CreateCustomerRequest(
            Name: "مصنع الأمل للملابس",
            Type: "factory",
            Phone: "010-1234-5678", // 11 digits
            PhoneSecondary: null,
            ContactPerson: "أ / محمود",
            Address: "شارع الإنتاج",
            City: "المحلة الكبرى",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            Notes: "عميل تجريبي"
        );

        var customer = await service.CreateAsync(request);

        Assert.NotNull(customer);
        Assert.Equal("مصنع الأمل للملابس", customer.Name);
        Assert.Equal("01012345678", customer.Phone);
        Assert.Equal(1, await context.Customers.CountAsync());
    }

    [Fact]
    public async Task CreateAsync_ArabicDigitsPhone_NormalizesAndSucceeds()
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var request = new CreateCustomerRequest(
            Name: "مشغل الهدى",
            Type: "workshop",
            Phone: "٠١٠١٢٣٤٥٦٧٨", // Arabic-indic 11 digits
            PhoneSecondary: null,
            ContactPerson: "أم محمد",
            Address: "المحلة الكبرى",
            City: "المحلة الكبرى",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            Notes: null
        );

        var customer = await service.CreateAsync(request);

        Assert.NotNull(customer);
        Assert.Equal("مشغل الهدى", customer.Name);
    }

    [Fact]
    public async Task CreateAsync_InternationalEgyptPrefix_NormalizesAndSucceeds()
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var request = new CreateCustomerRequest(
            Name: "شركة الغزل الدولية",
            Type: "factory",
            Phone: "+201012345678", // +20 prefix normalized to 11 digits
            PhoneSecondary: null,
            ContactPerson: "م / حسام",
            Address: "المنطقة الصناعية",
            City: "المحلة الكبرى",
            AssignedRepId: "rep_02",
            AssignedRepName: "محمد السيد",
            Notes: null
        );

        var customer = await service.CreateAsync(request);

        Assert.NotNull(customer);
    }

    [Fact]
    public async Task CreateAsync_EmptyName_ThrowsArgumentException()
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var request = new CreateCustomerRequest(
            Name: "   ",
            Type: "factory",
            Phone: "01000001122",
            PhoneSecondary: null,
            ContactPerson: null,
            Address: "المحلة",
            City: "المحلة",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            Notes: null
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(request));
        Assert.Contains("اسم العميل مطلوب", ex.Message);
    }

    [Theory]
    [InlineData("0101234567")]       // 10 digits
    [InlineData("010123456789")]     // 12 digits
    [InlineData("123")]              // 3 digits
    [InlineData("abcdefghijk")]      // 0 digits
    public async Task CreateAsync_InvalidPhoneLength_ThrowsArgumentException(string invalidPhone)
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var request = new CreateCustomerRequest(
            Name: "ورشة النصر",
            Type: "workshop",
            Phone: invalidPhone,
            PhoneSecondary: null,
            ContactPerson: "علي",
            Address: "المحلة",
            City: "المحلة الكبرى",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            Notes: null
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(request));
        Assert.Contains("11", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_InvalidSecondaryPhone_ThrowsArgumentException()
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var createReq = new CreateCustomerRequest(
            Name: "مؤسسة الغزل",
            Type: "factory",
            Phone: "01000000001",
            PhoneSecondary: null,
            ContactPerson: "حسام",
            Address: "المحلة",
            City: "المحلة الكبرى",
            AssignedRepId: "rep_01",
            AssignedRepName: "أحمد شحاتة",
            Notes: null
        );
        var created = await service.CreateAsync(createReq);

        var updateReq = new UpdateCustomerRequest(
            Name: null,
            Type: null,
            Phone: null,
            PhoneSecondary: "01012345", // 8 digits (invalid)
            ContactPerson: null,
            Address: null,
            City: null,
            AssignedRepId: null,
            AssignedRepName: null,
            Notes: null,
            IsVip: null
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(created.Id, updateReq));
        Assert.Contains("11", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_NonExistentCustomer_ThrowsKeyNotFoundException()
    {
        using var context = CreateInMemoryContext();
        var service = new CustomerService(context);

        var updateReq = new UpdateCustomerRequest("اسم جديد", null, null, null, null, null, null, null, null, null, null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.UpdateAsync("cust_does_not_exist", updateReq));
    }
}

