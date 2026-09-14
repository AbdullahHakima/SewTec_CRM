using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;
using SewTec.CRM.Api.Services;

namespace SewTec.CRM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly CrmDbContext _context;
    private readonly ICatalogImportService _importService;

    public ProductsController(CrmDbContext context, ICatalogImportService? importService = null)
    {
        _context = context;
        _importService = importService ?? new CatalogImportService(context, Microsoft.Extensions.Logging.Abstractions.NullLogger<CatalogImportService>.Instance);
    }

    [NonAction] // Retained only for isolated legacy unit coverage; HTTP consumers use the paginated action below.
    public async Task<ActionResult<List<ProductDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? brand = null,
        [FromQuery] string? category = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStock = null,
        [FromQuery] string? sortBy = null)
    {
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.Model.ToLower().Contains(s) ||
                p.Brand.ToLower().Contains(s) ||
                p.DescriptionArabic.ToLower().Contains(s) ||
                p.Application.ToLower().Contains(s) ||
                p.NeedleSystem.ToLower().Contains(s) ||
                p.MotorType.ToLower().Contains(s) ||
                p.Category.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(brand) && !brand.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Brand.ToLower() == brand.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Category.ToLower() == category.Trim().ToLower());
        }

        if (minPrice.HasValue)
        {
            query = query.Where(p => p.SuggestedPriceEgp >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(p => p.SuggestedPriceEgp <= maxPrice.Value);
        }

        if (inStock.HasValue)
        {
            query = query.Where(p => p.InStock == inStock.Value);
        }

        var list = await query.ToListAsync();
        var dtos = list.Select(p => p.ToDto()).ToList();

        dtos = sortBy?.ToLower() switch
        {
            "price_asc" => dtos.OrderBy(p => p.SuggestedPriceEgp).ToList(),
            "price_desc" => dtos.OrderByDescending(p => p.SuggestedPriceEgp).ToList(),
            "model_asc" => dtos.OrderBy(p => p.Model).ToList(),
            "speed_desc" => dtos.OrderByDescending(p => p.SpeedRpm).ToList(),
            _ => dtos
        };

        return Ok(dtos);
    }

    public record CatalogSummary(int All, int InStock, int TotalStockUnits, string[] Brands, decimal MinPrice, decimal MaxPrice);

    [HttpGet]
    public async Task<ActionResult<PageResult<ProductDto>>> GetPage(
        [FromQuery] string? search = null, [FromQuery] string? brand = null, [FromQuery] string? category = null,
        [FromQuery] decimal? minPrice = null, [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStock = null, [FromQuery] string? sortBy = null,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (page < 1 || pageSize is < 1 or > 100) return BadRequest(new { message = "بيانات الصفحة غير صالحة." });
        if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) return BadRequest(new { message = "نطاق السعر غير صالح." });
        var query = _context.Products.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p => p.Model.ToLower().Contains(term) || p.Brand.ToLower().Contains(term)
                || p.DescriptionArabic.ToLower().Contains(term) || p.Application.ToLower().Contains(term)
                || p.NeedleSystem.ToLower().Contains(term) || p.MotorType.ToLower().Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(brand) && !brand.Equals("all", StringComparison.OrdinalIgnoreCase)) query = query.Where(p => p.Brand.ToLower() == brand.Trim().ToLower());
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase)) query = query.Where(p => p.Category.ToLower() == category.Trim().ToLower());
        if (minPrice.HasValue) query = query.Where(p => p.SuggestedPriceEgp >= minPrice);
        if (maxPrice.HasValue) query = query.Where(p => p.SuggestedPriceEgp <= maxPrice);
        if (inStock.HasValue) query = query.Where(p => p.InStock == inStock);
        var total = await query.CountAsync();
        query = sortBy?.ToLowerInvariant() switch
        {
            "price_asc" => query.OrderBy(p => (double)p.SuggestedPriceEgp).ThenBy(p => p.Id),
            "price_desc" => query.OrderByDescending(p => (double)p.SuggestedPriceEgp).ThenBy(p => p.Id),
            "speed_desc" => query.OrderByDescending(p => p.SpeedRpm).ThenBy(p => p.Id),
            _ => query.OrderBy(p => p.Model).ThenBy(p => p.Id)
        };
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        var all = _context.Products.AsNoTracking();
        var minCatalogPrice = await all.Where(p => p.SuggestedPriceEgp > 0).OrderBy(p => (double)p.SuggestedPriceEgp).Select(p => (double)p.SuggestedPriceEgp).FirstOrDefaultAsync();
        var maxCatalogPrice = await all.Where(p => p.SuggestedPriceEgp > 0).OrderByDescending(p => (double)p.SuggestedPriceEgp).Select(p => (double)p.SuggestedPriceEgp).FirstOrDefaultAsync();
        var summary = new CatalogSummary(await all.CountAsync(), await all.CountAsync(p => p.InStock), await all.SumAsync(p => p.StockCount),
            await all.Select(p => p.Brand).Distinct().OrderBy(b => b).ToArrayAsync(),
            (decimal)minCatalogPrice, (decimal)maxCatalogPrice);
        return Ok(new PageResult<ProductDto>(items.Select(p => p.ToDto()).ToList(), total, page, pageSize, summary));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { message = "الماكينة المطلوبة غير موجودة بالكتالوج" });
        }
        return Ok(product.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Model))
        {
            return BadRequest(new { message = "موديل الماكينة مطلوب" });
        }

        if (dto.SuggestedPriceEgp < 0)
        {
            return BadRequest(new { message = "سعر الماكينة لا يمكن أن يكون سالباً." });
        }

        if (dto.SpeedRpm.HasValue && dto.SpeedRpm.Value < 0)
        {
            return BadRequest(new { message = "سرعة الماكينة لا يمكن أن تكون سالبة." });
        }

        if (dto.StockCount.HasValue && dto.StockCount.Value < 0)
        {
            return BadRequest(new { message = "رصيد المخزن لا يمكن أن يكون سالباً." });
        }

        var id = "prod_" + Guid.NewGuid().ToString("N")[..8];
        var product = new Product
        {
            Id = id,
            Model = dto.Model.Trim(),
            Brand = dto.Brand.Trim().ToUpperInvariant(),
            Category = dto.Category.Trim().ToLowerInvariant(),
            SuggestedPriceEgp = dto.SuggestedPriceEgp,
            DescriptionArabic = dto.DescriptionArabic,
            SpeedRpm = dto.SpeedRpm ?? 5000,
            MaxStitchLengthMm = dto.MaxStitchLengthMm ?? 5.0m,
            NeedleSystem = dto.NeedleSystem ?? "DBx1",
            MotorType = dto.MotorType ?? "سيرفو دفع مباشر مدمج",
            HasAutomaticTrimmer = dto.HasAutomaticTrimmer ?? true,
            HasAutoFootLifter = dto.HasAutoFootLifter ?? true,
            HasReverseStitch = dto.HasReverseStitch ?? true,
            LubricationType = dto.LubricationType ?? "تزييت أوتوماتيك",
            WarrantyMonths = dto.WarrantyMonths ?? 24,
            InStock = dto.InStock ?? true,
            StockCount = dto.StockCount ?? 1,
            Application = dto.Application ?? "",
            FeaturesJson = JsonSerializer.Serialize(dto.Features ?? new List<string>())
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product.ToDto());
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ProductDto>> Update(string id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { message = "الماكينة غير موجودة بالكتالوج" });
        }

        if (dto.SuggestedPriceEgp.HasValue && dto.SuggestedPriceEgp.Value < 0)
        {
            return BadRequest(new { message = "سعر الماكينة لا يمكن أن يكون سالباً." });
        }

        if (dto.SpeedRpm.HasValue && dto.SpeedRpm.Value < 0)
        {
            return BadRequest(new { message = "سرعة الماكينة لا يمكن أن تكون سالبة." });
        }

        if (dto.StockCount.HasValue && dto.StockCount.Value < 0)
        {
            return BadRequest(new { message = "رصيد المخزن لا يمكن أن يكون سالباً." });
        }

        if (dto.Model != null) product.Model = dto.Model.Trim();
        if (dto.Brand != null) product.Brand = dto.Brand.Trim().ToUpperInvariant();
        if (dto.Category != null) product.Category = dto.Category.Trim().ToLowerInvariant();
        if (dto.SuggestedPriceEgp.HasValue) product.SuggestedPriceEgp = dto.SuggestedPriceEgp.Value;
        if (dto.DescriptionArabic != null) product.DescriptionArabic = dto.DescriptionArabic;
        if (dto.SpeedRpm.HasValue) product.SpeedRpm = dto.SpeedRpm.Value;
        if (dto.MaxStitchLengthMm.HasValue) product.MaxStitchLengthMm = dto.MaxStitchLengthMm.Value;
        if (dto.NeedleSystem != null) product.NeedleSystem = dto.NeedleSystem;
        if (dto.MotorType != null) product.MotorType = dto.MotorType;
        if (dto.HasAutomaticTrimmer.HasValue) product.HasAutomaticTrimmer = dto.HasAutomaticTrimmer.Value;
        if (dto.HasAutoFootLifter.HasValue) product.HasAutoFootLifter = dto.HasAutoFootLifter.Value;
        if (dto.HasReverseStitch.HasValue) product.HasReverseStitch = dto.HasReverseStitch.Value;
        if (dto.LubricationType != null) product.LubricationType = dto.LubricationType;
        if (dto.WarrantyMonths.HasValue) product.WarrantyMonths = dto.WarrantyMonths.Value;
        if (dto.InStock.HasValue) product.InStock = dto.InStock.Value;
        if (dto.StockCount.HasValue) product.StockCount = dto.StockCount.Value;
        if (dto.Application != null) product.Application = dto.Application;
        if (dto.Features != null) product.FeaturesJson = JsonSerializer.Serialize(dto.Features);

        await _context.SaveChangesAsync();
        return Ok(product.ToDto());
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { message = "الماكينة غير موجودة" });
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    [HttpPost("reseed")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<List<ProductDto>>> ReseedCatalog()
    {
        await Task.CompletedTask;
        return NotFound();
    }

    [HttpPost("batch-prices")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> BatchUpdatePrices([FromBody] List<BatchPriceUpdateItem> updates)
    {
        if (updates == null || !updates.Any())
        {
            return BadRequest(new { message = "قائمة الأسعار فارغة" });
        }

        foreach (var item in updates)
        {
            if (item.NewPrice < 0) return BadRequest(new { message = "لا يمكن حفظ سعر سالب." });
            var prod = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.Id || p.Model == item.Id);
            if (prod != null)
            {
                prod.SuggestedPriceEgp = item.NewPrice;
            }
        }

        await _context.SaveChangesAsync();
        var all = await _context.Products.ToListAsync();
        return Ok(all.Select(p => p.ToDto()).ToList());
    }

    [HttpPost("import-catalog")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<CatalogImportResult>> ImportCatalog([FromForm] IFormFile? file, [FromQuery] bool replaceAll = false)
    {
        if (file == null || file.Length == 0 || file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "يرجى إرفاق ملف الكتالوج (.csv أو .json)" });
        }

        using var stream = file.OpenReadStream();
        var result = await _importService.ImportCatalogFromStreamAsync(stream, file.FileName, replaceAll);
        return Ok(result);
    }

    [HttpPost("import-prices")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<PriceImportResult>> ImportPrices([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0 || file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "يرجى إرفاق ملف الأسعار (.csv أو .json)" });
        }

        using var stream = file.OpenReadStream();
        var result = await _importService.ImportPricesFromStreamAsync(stream, file.FileName);
        return Ok(result);
    }

    [HttpPost("seed-from-file")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<CatalogImportResult>> SeedFromFile([FromQuery] string? filePath = null, [FromQuery] bool replaceAll = false)
    {
        await Task.CompletedTask;
        return NotFound(); // Server-filesystem imports are operator concerns; admins upload bounded files instead.
    }

    [HttpGet("templates/catalog-csv")]
    public IActionResult DownloadCatalogTemplate()
    {
        var bytes = _importService.GenerateCatalogTemplateCsv();
        return File(bytes, "text/csv; charset=utf-8", "sewtec_catalog_template.csv");
    }

    [HttpGet("templates/prices-csv")]
    public IActionResult DownloadPricesTemplate()
    {
        var bytes = _importService.GeneratePricesTemplateCsv();
        return File(bytes, "text/csv; charset=utf-8", "sewtec_prices_template.csv");
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCatalogCsv()
    {
        var products = await _context.Products.ToListAsync();
        var bytes = _importService.ExportCatalogCsv(products);
        return File(bytes, "text/csv; charset=utf-8", "sewtec_machines_catalog.csv");
    }
}
