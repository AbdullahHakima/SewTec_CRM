using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Controllers;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Tests;

public class ProductCatalogTests
{
    [Fact]
    public async Task PagedCatalog_HasStablePagesAndTotalCount()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);
        var first = await controller.GetPage(page: 1, pageSize: 5);
        var second = await controller.GetPage(page: 2, pageSize: 5);
        var firstPage = Assert.IsType<OkObjectResult>(first.Result).Value as PageResult<ProductDto>;
        var secondPage = Assert.IsType<OkObjectResult>(second.Result).Value as PageResult<ProductDto>;
        Assert.NotNull(firstPage); Assert.NotNull(secondPage);
        Assert.Equal(await context.Products.CountAsync(), firstPage.TotalCount);
        Assert.Equal(5, firstPage.Items.Count); Assert.Equal(5, secondPage.Items.Count);
        Assert.Empty(firstPage.Items.Select(p => p.Id).Intersect(secondPage.Items.Select(p => p.Id)));
        Assert.NotNull(firstPage.Summary);
    }

    private async Task<CrmDbContext> CreateSeededContextAsync()
    {
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new CrmDbContext(options);
        await SeedData.EnsureProductsSeededAsync(context);
        return context;
    }

    [Fact]
    public async Task GetAll_WithoutFilters_ReturnsAllCatalogProducts()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetAll();
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var products = Assert.IsType<List<ProductDto>>(okResult.Value);

        Assert.True(products.Count >= 15);
    }

    [Fact]
    public async Task GetAll_FilterByBrand_ReturnsOnlyMatchingBrand()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetAll(brand: "JUKI");
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var products = Assert.IsType<List<ProductDto>>(okResult.Value);

        Assert.NotEmpty(products);
        Assert.All(products, p => Assert.Equal("JUKI", p.Brand));
    }

    [Fact]
    public async Task GetAll_FilterByCategory_ReturnsOnlyMatchingCategory()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetAll(category: "overlock");
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var products = Assert.IsType<List<ProductDto>>(okResult.Value);

        Assert.NotEmpty(products);
        Assert.All(products, p => Assert.Equal("overlock", p.Category));
    }

    [Fact]
    public async Task GetAll_FilterByPriceRange_ReturnsProductsWithinBounds()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetAll(minPrice: 20000, maxPrice: 50000);
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var products = Assert.IsType<List<ProductDto>>(okResult.Value);

        Assert.NotEmpty(products);
        Assert.All(products, p => Assert.InRange(p.SuggestedPriceEgp, 20000, 50000));
    }

    [Fact]
    public async Task GetAll_MinPriceGreaterThanMaxPrice_ReturnsEmptyListWithoutCrash()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetAll(minPrice: 90000, maxPrice: 20000);
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var products = Assert.IsType<List<ProductDto>>(okResult.Value);

        Assert.Empty(products);
    }

    [Fact]
    public async Task GetAll_SqlInjectionSearch_HandledSafelyWithoutCrash()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var injectionQuery = "'; DROP TABLE Products; -- ' OR 1=1";
        var result = await controller.GetAll(search: injectionQuery);
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var products = Assert.IsType<List<ProductDto>>(okResult.Value);

        // Should return 0 items safely, table intact
        Assert.Empty(products);
        Assert.True(await context.Products.AnyAsync());
    }

    [Fact]
    public async Task Create_NegativePrice_ReturnsBadRequest()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var dto = new CreateProductDto(
            Model: "TEST-01",
            Brand: "JACK",
            Category: "single_needle",
            SuggestedPriceEgp: -1000, // Invalid!
            DescriptionArabic: "وصف",
            SpeedRpm: 5000,
            MaxStitchLengthMm: 5,
            NeedleSystem: "DBx1",
            MotorType: "سيرفو",
            HasAutomaticTrimmer: true,
            HasAutoFootLifter: true,
            HasReverseStitch: true,
            LubricationType: "تزييت أوتوماتيك",
            WarrantyMonths: 24,
            InStock: true,
            StockCount: 5,
            Application: "ملابس",
            Features: null
        );

        var result = await controller.Create(dto);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetById_ValidId_ReturnsProductWithFeatures()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetById("prod_01");
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var product = Assert.IsType<ProductDto>(okResult.Value);

        Assert.Equal("JACK A4B-A", product.Model);
        Assert.NotEmpty(product.Features);
        Assert.True(product.SpeedRpm > 0);
    }

    [Fact]
    public async Task GetById_NonExistentId_ReturnsNotFound()
    {
        using var context = await CreateSeededContextAsync();
        var controller = new ProductsController(context);

        var result = await controller.GetById("prod_ghost");
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }
}

