using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class CatalogImportServiceTests
{
    private async Task<CrmDbContext> CreateInMemoryContextAsync()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new CrmDbContext(options);
        await SeedData.EnsureProductsSeededAsync(context);
        return context;
    }

    [Fact]
    public async Task ImportCatalogFromCsv_WithArabicHeaders_SeedsSuccessfully()
    {
        using var context = await CreateInMemoryContextAsync();
        var service = new CatalogImportService(context, NullLogger<CatalogImportService>.Instance);

        var csv = @"الموديل,الماركة,القسم,السعر,السرعة,طول الغرزة,نظام الإبرة,الموتور,قص خيط,رفع دواس,فرماتورة,التزييت,الضمان,متوفر,الكمية,الخامات,الوصف,المميزات
JACK A4B-A,JACK,single_needle,""49,500"",5000,5.0,DBx1 11-18#,سيرفو دفع مباشر,نعم,نعم,نعم,تزييت مغلق,24,نعم,15,قمصان وبدل,ماكينة محدثة,ميزة 1;ميزة 2
NEW-OVERLOCK-99,ZOJE,overlock,""38,000"",6000,4.0,DCx27,سيرفو خارجي,لا,لا,لا,تزييت أوتوماتيك,12,نعم,5,ملابس رياضية,ماكينة جديدة كلياً,محرك قوي;صوت ناعم";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));
        var result = await service.ImportCatalogFromStreamAsync(stream, "test_catalog.csv");

        Assert.True(result.Success);
        Assert.Equal(2, result.TotalProcessed);
        Assert.Equal(1, result.UpdatedCount); // JACK A4B-A already existed in seed
        Assert.Equal(1, result.InsertedCount); // NEW-OVERLOCK-99 is new

        var updated = await context.Products.FirstAsync(p => p.Model == "JACK A4B-A");
        Assert.Equal(49500m, updated.SuggestedPriceEgp);

        var inserted = await context.Products.FirstAsync(p => p.Model == "NEW-OVERLOCK-99");
        Assert.Equal(38000m, inserted.SuggestedPriceEgp);
        Assert.Equal("ZOJE", inserted.Brand);
    }

    [Fact]
    public async Task ImportCatalogFromCsv_NegativePrice_RecordsValidationError()
    {
        using var context = await CreateInMemoryContextAsync();
        var service = new CatalogImportService(context, NullLogger<CatalogImportService>.Instance);

        var csv = @"الموديل,الماركة,القسم,السعر
INVALID-MACHINE,JACK,single_needle,-5000";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));
        var result = await service.ImportCatalogFromStreamAsync(stream, "invalid_price.csv");

        Assert.False(result.Success);
        Assert.NotEmpty(result.Errors);
        Assert.Contains(result.Errors, e => e.Contains("لا يمكن أن يكون سالباً"));
        Assert.Null(await context.Products.FirstOrDefaultAsync(p => p.Model == "INVALID-MACHINE"));
    }

    [Fact]
    public async Task ImportCatalogFromJson_ValidJsonArray_ImportsAndUpdates()
    {
        using var context = await CreateInMemoryContextAsync();
        var service = new CatalogImportService(context, NullLogger<CatalogImportService>.Instance);

        var json = @"[
          {
            ""model"": ""JACK F4"",
            ""suggestedPriceEgp"": 21000,
            ""speedRpm"": 5200
          },
          {
            ""model"": ""SPECIAL-CUSTOM-01"",
            ""brand"": ""SEWTEC-PRO"",
            ""category"": ""special"",
            ""suggestedPriceEgp"": 95000,
            ""features"": [""شاشة ذكية"", ""تحكم رقمي""]
          }
        ]";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        var result = await service.ImportCatalogFromStreamAsync(stream, "catalog.json");

        Assert.True(result.Success);
        Assert.Equal(2, result.TotalProcessed);
        Assert.Equal(1, result.UpdatedCount);
        Assert.Equal(1, result.InsertedCount);

        var f4 = await context.Products.FirstAsync(p => p.Model == "JACK F4");
        Assert.Equal(21000m, f4.SuggestedPriceEgp);

        var custom = await context.Products.FirstAsync(p => p.Model == "SPECIAL-CUSTOM-01");
        Assert.Equal(95000m, custom.SuggestedPriceEgp);
        Assert.Equal("SEWTEC-PRO", custom.Brand);
    }

    [Fact]
    public async Task ImportPricesFromCsv_WithEgyptianNumeralsAndCurrency_UpdatesCorrectly()
    {
        using var context = await CreateInMemoryContextAsync();
        var service = new CatalogImportService(context, NullLogger<CatalogImportService>.Instance);

        // Uses Arabic numerals ٥٢٠٠٠ and currency suffix
        var csv = @"الموديل,السعر الجديد
JACK A4B-A,٥٢٠٠٠ ج.م
JACK C4,53,500 EGP";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));
        var result = await service.ImportPricesFromStreamAsync(stream, "prices.csv");

        Assert.True(result.Success);
        Assert.Equal(2, result.TotalProcessed);
        Assert.Equal(2, result.UpdatedCount);

        var a4b = await context.Products.FirstAsync(p => p.Model == "JACK A4B-A");
        Assert.Equal(52000m, a4b.SuggestedPriceEgp);

        var c4 = await context.Products.FirstAsync(p => p.Model == "JACK C4");
        Assert.Equal(53500m, c4.SuggestedPriceEgp);
    }

    [Fact]
    public async Task ImportPricesFromCsv_UnknownModel_AddedToNotFoundList()
    {
        using var context = await CreateInMemoryContextAsync();
        var service = new CatalogImportService(context, NullLogger<CatalogImportService>.Instance);

        var csv = @"الموديل,السعر الجديد
UNKNOWN-MACHINE-XYZ,45000";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));
        var result = await service.ImportPricesFromStreamAsync(stream, "prices.csv");

        Assert.True(result.Success);
        Assert.Equal(0, result.UpdatedCount);
        Assert.Contains("UNKNOWN-MACHINE-XYZ", result.NotFoundModels);
    }

    [Fact]
    public async Task ExportCatalogCsv_And_Templates_ReturnValidUtf8BomBytes()
    {
        using var context = await CreateInMemoryContextAsync();
        var service = new CatalogImportService(context, NullLogger<CatalogImportService>.Instance);

        var products = await context.Products.ToListAsync();
        var exportBytes = service.ExportCatalogCsv(products);
        var catalogTpl = service.GenerateCatalogTemplateCsv();
        var pricesTpl = service.GeneratePricesTemplateCsv();

        Assert.NotEmpty(exportBytes);
        Assert.NotEmpty(catalogTpl);
        Assert.NotEmpty(pricesTpl);

        // Verify UTF-8 BOM: 0xEF, 0xBB, 0xBF
        Assert.Equal(0xEF, exportBytes[0]);
        Assert.Equal(0xBB, exportBytes[1]);
        Assert.Equal(0xBF, exportBytes[2]);

        var exportStr = Encoding.UTF8.GetString(exportBytes);
        Assert.Contains("JACK A4B-A", exportStr);
        Assert.Contains("JUKI DDL-9000C-FMS", exportStr);
    }
}
