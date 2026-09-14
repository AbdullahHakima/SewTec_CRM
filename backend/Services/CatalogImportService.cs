using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public class CatalogImportService : ICatalogImportService
{
    private readonly CrmDbContext _context;
    private readonly ILogger<CatalogImportService> _logger;

    public CatalogImportService(CrmDbContext context, ILogger<CatalogImportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CatalogImportResult> ImportCatalogFromStreamAsync(Stream stream, string fileName, bool replaceAll = false)
    {
        var errors = new List<string>();
        var insertedModels = new List<string>();
        var updatedModels = new List<string>();
        int totalProcessed = 0;

        try
        {
            var isJson = fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase);

            List<CreateProductDto> parsedDtos;
            if (isJson)
            {
                parsedDtos = await ParseProductsFromJsonAsync(stream, errors);
            }
            else
            {
                parsedDtos = await ParseProductsFromCsvAsync(stream, errors);
            }

            if (replaceAll)
            {
                var existing = await _context.Products.ToListAsync();
                _context.Products.RemoveRange(existing);
            }

            var existingDbProducts = replaceAll ? new List<Product>() : await _context.Products.ToListAsync();
            var existingByModel = existingDbProducts.ToDictionary(p => p.Model.Trim().ToLowerInvariant(), p => p);

            foreach (var dto in parsedDtos)
            {
                totalProcessed++;
                if (string.IsNullOrWhiteSpace(dto.Model))
                {
                    errors.Add($"سطر {totalProcessed}: اسم الموديل فارغ وتم تخطيه.");
                    continue;
                }

                if (dto.SuggestedPriceEgp < 0)
                {
                    errors.Add($"الموديل '{dto.Model}': السعر لا يمكن أن يكون سالباً ({dto.SuggestedPriceEgp}).");
                    continue;
                }

                var modelKey = dto.Model.Trim().ToLowerInvariant();
                Product? targetProduct = null;

                if (!replaceAll && existingByModel.TryGetValue(modelKey, out var found))
                {
                    targetProduct = found;
                }

                if (targetProduct != null)
                {
                    targetProduct.Brand = !string.IsNullOrWhiteSpace(dto.Brand) ? dto.Brand.Trim().ToUpperInvariant() : targetProduct.Brand;
                    targetProduct.Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim().ToLowerInvariant() : targetProduct.Category;
                    targetProduct.SuggestedPriceEgp = dto.SuggestedPriceEgp;
                    if (!string.IsNullOrWhiteSpace(dto.DescriptionArabic)) targetProduct.DescriptionArabic = dto.DescriptionArabic.Trim();
                    if (dto.SpeedRpm.HasValue && dto.SpeedRpm.Value > 0) targetProduct.SpeedRpm = dto.SpeedRpm.Value;
                    if (dto.MaxStitchLengthMm.HasValue && dto.MaxStitchLengthMm.Value > 0) targetProduct.MaxStitchLengthMm = dto.MaxStitchLengthMm.Value;
                    if (!string.IsNullOrWhiteSpace(dto.NeedleSystem)) targetProduct.NeedleSystem = dto.NeedleSystem.Trim();
                    if (!string.IsNullOrWhiteSpace(dto.MotorType)) targetProduct.MotorType = dto.MotorType.Trim();
                    if (dto.HasAutomaticTrimmer.HasValue) targetProduct.HasAutomaticTrimmer = dto.HasAutomaticTrimmer.Value;
                    if (dto.HasAutoFootLifter.HasValue) targetProduct.HasAutoFootLifter = dto.HasAutoFootLifter.Value;
                    if (dto.HasReverseStitch.HasValue) targetProduct.HasReverseStitch = dto.HasReverseStitch.Value;
                    if (!string.IsNullOrWhiteSpace(dto.LubricationType)) targetProduct.LubricationType = dto.LubricationType.Trim();
                    if (dto.WarrantyMonths.HasValue && dto.WarrantyMonths.Value >= 0) targetProduct.WarrantyMonths = dto.WarrantyMonths.Value;
                    if (dto.InStock.HasValue) targetProduct.InStock = dto.InStock.Value;
                    if (dto.StockCount.HasValue && dto.StockCount.Value >= 0) targetProduct.StockCount = dto.StockCount.Value;
                    if (!string.IsNullOrWhiteSpace(dto.Application)) targetProduct.Application = dto.Application.Trim();
                    if (dto.Features != null && dto.Features.Any()) targetProduct.FeaturesJson = JsonSerializer.Serialize(dto.Features);

                    updatedModels.Add(targetProduct.Model);
                }
                else
                {
                    var newId = "prod_" + Guid.NewGuid().ToString("N");
                    var newProduct = new Product
                    {
                        Id = newId,
                        Model = dto.Model.Trim(),
                        Brand = !string.IsNullOrWhiteSpace(dto.Brand) ? dto.Brand.Trim().ToUpperInvariant() : "SEWTEC",
                        Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim().ToLowerInvariant() : "single_needle",
                        SuggestedPriceEgp = dto.SuggestedPriceEgp,
                        DescriptionArabic = dto.DescriptionArabic ?? $"ماكينة {dto.Model} عالية الجودة",
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
                        StockCount = dto.StockCount ?? 5,
                        Application = dto.Application ?? "الملابس الجاهزة والمنسوجات",
                        FeaturesJson = JsonSerializer.Serialize(dto.Features ?? new List<string>())
                    };

                    _context.Products.Add(newProduct);
                    existingByModel[modelKey] = newProduct;
                    insertedModels.Add(newProduct.Model);
                }
            }

            if (errors.Count > 0 || parsedDtos.Count == 0) { _context.ChangeTracker.Clear(); return new CatalogImportResult(false, totalProcessed, 0, 0, new(), new(), errors.Count > 0 ? errors : new() { "الملف لا يحتوي بيانات صالحة." }); }
            await _context.SaveChangesAsync();
            return new CatalogImportResult(
                Success: true,
                TotalProcessed: totalProcessed,
                InsertedCount: insertedModels.Count,
                UpdatedCount: updatedModels.Count,
                InsertedModels: insertedModels,
                UpdatedModels: updatedModels,
                Errors: errors
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing catalog from stream");
            _context.ChangeTracker.Clear();
            errors.Add("تعذر معالجة الملف. تحقق من التنسيق والبيانات.");
            return new CatalogImportResult(false, totalProcessed, insertedModels.Count, updatedModels.Count, insertedModels, updatedModels, errors);
        }
    }

    public async Task<PriceImportResult> ImportPricesFromStreamAsync(Stream stream, string fileName)
    {
        var errors = new List<string>();
        var updatedModels = new List<string>();
        var notFoundModels = new List<string>();
        int totalProcessed = 0;

        try
        {
            var isJson = fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase);
            List<BatchPriceUpdateItem> priceItems;

            if (isJson)
            {
                priceItems = await ParsePricesFromJsonAsync(stream, errors);
            }
            else
            {
                priceItems = await ParsePricesFromCsvAsync(stream, errors);
            }

            var existingProducts = await _context.Products.ToListAsync();
            var byId = existingProducts.ToDictionary(p => p.Id.Trim().ToLowerInvariant(), p => p);
            var byModel = existingProducts.ToDictionary(p => p.Model.Trim().ToLowerInvariant(), p => p);

            foreach (var item in priceItems)
            {
                totalProcessed++;
                if (string.IsNullOrWhiteSpace(item.Id))
                {
                    errors.Add($"سطر {totalProcessed}: معرف أو اسم الموديل فارغ.");
                    continue;
                }

                if (item.NewPrice < 0)
                {
                    errors.Add($"الموديل '{item.Id}': السعر لا يمكن أن يكون سالباً ({item.NewPrice}).");
                    continue;
                }

                var key = item.Id.Trim().ToLowerInvariant();
                Product? target = null;

                if (byId.TryGetValue(key, out var p1))
                {
                    target = p1;
                }
                else if (byModel.TryGetValue(key, out var p2))
                {
                    target = p2;
                }

                if (target != null)
                {
                    target.SuggestedPriceEgp = item.NewPrice;
                    updatedModels.Add($"{target.Model} (السعر الجديد: {item.NewPrice:N0} ج.م)");
                }
                else
                {
                    notFoundModels.Add(item.Id);
                }
            }

            if (errors.Count > 0) { _context.ChangeTracker.Clear(); return new PriceImportResult(false, totalProcessed, 0, new(), notFoundModels, errors); }
            await _context.SaveChangesAsync();

            return new PriceImportResult(
                Success: true,
                TotalProcessed: totalProcessed,
                UpdatedCount: updatedModels.Count,
                UpdatedModels: updatedModels,
                NotFoundModels: notFoundModels,
                Errors: errors
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing prices from stream");
            _context.ChangeTracker.Clear();
            errors.Add("تعذر معالجة ملف الأسعار. تحقق من التنسيق والبيانات.");
            return new PriceImportResult(false, totalProcessed, updatedModels.Count, updatedModels, notFoundModels, errors);
        }
    }

    public async Task<CatalogImportResult> SeedFromDiskFileAsync(string filePath, bool replaceAll = false)
    {
        var resolvedPath = ResolveDiskPath(filePath);
        if (!File.Exists(resolvedPath))
        {
            return new CatalogImportResult(
                Success: false,
                TotalProcessed: 0,
                InsertedCount: 0,
                UpdatedCount: 0,
                InsertedModels: new List<string>(),
                UpdatedModels: new List<string>(),
                Errors: new List<string> { $"الملف غير موجود في المسار: {resolvedPath}" }
            );
        }

        using var fileStream = File.OpenRead(resolvedPath);
        return await ImportCatalogFromStreamAsync(fileStream, Path.GetFileName(resolvedPath), replaceAll);
    }

    public byte[] GenerateCatalogTemplateCsv()
    {
        var sb = new StringBuilder();
        sb.Append('﻿');
        sb.AppendLine("الموديل,الماركة,القسم,السعر,السرعة,طول الغرزة,نظام الإبرة,الموتور,قص خيط,رفع دواس,فرماتورة,التزييت,الضمان,متوفر,الكمية,الخامات,الوصف,المميزات");
        sb.AppendLine("JACK A4B-A,JACK,single_needle,47500,5000,5.0,DBx1 11-18#,سيرفو دفع مباشر مدمج,نعم,نعم,نعم,تزييت أوتوماتيك مغلق,24,نعم,12,أقمشة خفيفة ومتوسطة ومصانع القمصان,ماكينة سنجر كمبيوتر الجيل الذكي,شاشة ناطقة باللغة العربية;مستشعر ذكي لقدم الدواس;إضاءة ليد ثلاثية المستويات");
        sb.AppendLine("SIRUBA 747K,SIRUBA,overlock,48500,7500,3.6,DCx27 9-14#,سيرفو مباشر تايواني,لا,لا,لا,تزييت هيدروليكي كامل,36,نعم,14,الملابس الجاهزة والتريكو,ماكينة أوفرلوك 4 فتلة تايوانية أصلية,صناعة تايوانية 100%;عمر افتراضي يتجاوز 15 عاماً;وفرة قطع الغيار الأصلية");
        sb.AppendLine("JUKI DDL-9000C,JUKI,single_needle,85000,5000,5.0,DBx1 9-18#,محرك سيرفو ياباني AC,نعم,نعم,نعم,تقنية الرأس الجاف الخالي من الزيت,36,نعم,5,مصانع البدل الراقية والحرير,الماكينة الرقمية الأولى في العالم ياباني بالكامل,تحكم رقمي كامل بضغط الدواس;تقنية الرأس الجاف;اتصال NFC لنقل الإعدادات");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public byte[] GeneratePricesTemplateCsv()
    {
        var sb = new StringBuilder();
        sb.Append('﻿');
        sb.AppendLine("الموديل,السعر الجديد");
        sb.AppendLine("JACK A4B-A,48000");
        sb.AppendLine("JACK A5E-A,55500");
        sb.AppendLine("SIRUBA 747K-514M2-24,49000");
        sb.AppendLine("JUKI DDL-9000C-FMS,86500");
        sb.AppendLine("HIKARI HK2900ASS,43500");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public byte[] ExportCatalogCsv(List<Product> products)
    {
        var sb = new StringBuilder();
        sb.Append('﻿');
        sb.AppendLine("كود الموديل,الموديل,الماركة,القسم,السعر بالجنيه,السرعة (RPM),طول الغرزة (ملم),نظام الإبرة,نوع الموتور,قص خيط أوتوماتيك,رفع دواس أوتوماتيك,فرماتورة أوتوماتيك,نظام التزييت,شهور الضمان,حالة التوفر,رصيد المخزن,الخامات والتطبيقات,الوصف الفني,المزايا");

        foreach (var p in products)
        {
            var features = "";
            try
            {
                var list = JsonSerializer.Deserialize<List<string>>(p.FeaturesJson ?? "[]");
                if (list != null) features = string.Join(";", list);
            }
            catch {}

            sb.AppendLine(string.Join(",",
                EscapeCsv(p.Id),
                EscapeCsv(p.Model),
                EscapeCsv(p.Brand),
                EscapeCsv(p.Category),
                p.SuggestedPriceEgp.ToString("0.##", CultureInfo.InvariantCulture),
                p.SpeedRpm.ToString(),
                p.MaxStitchLengthMm.ToString("0.#", CultureInfo.InvariantCulture),
                EscapeCsv(p.NeedleSystem),
                EscapeCsv(p.MotorType),
                p.HasAutomaticTrimmer ? "نعم" : "لا",
                p.HasAutoFootLifter ? "نعم" : "لا",
                p.HasReverseStitch ? "نعم" : "لا",
                EscapeCsv(p.LubricationType),
                p.WarrantyMonths.ToString(),
                p.InStock ? "متوفر" : "تحت الطلب",
                p.StockCount.ToString(),
                EscapeCsv(p.Application),
                EscapeCsv(p.DescriptionArabic),
                EscapeCsv(features)
            ));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private async Task<List<CreateProductDto>> ParseProductsFromJsonAsync(Stream stream, List<string> errors)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var content = await reader.ReadToEndAsync();
        content = StripBom(content).Trim();

        using var doc = JsonDocument.Parse(content);
        JsonElement root = doc.RootElement;

        if (root.ValueKind == JsonValueKind.Object)
        {
            if (root.TryGetProperty("products", out var pArr) && pArr.ValueKind == JsonValueKind.Array)
                root = pArr;
            else if (root.TryGetProperty("catalog", out var cArr) && cArr.ValueKind == JsonValueKind.Array)
                root = cArr;
            else if (root.TryGetProperty("items", out var iArr) && iArr.ValueKind == JsonValueKind.Array)
                root = iArr;
            else if (root.TryGetProperty("data", out var dArr) && dArr.ValueKind == JsonValueKind.Array)
                root = dArr;
        }

        if (root.ValueKind != JsonValueKind.Array)
        {
            errors.Add("تنسيق JSON غير صالح: يجب أن يحتوي على مصفوفة عناصر (Array of Products).");
            return new List<CreateProductDto>();
        }

        var list = new List<CreateProductDto>();
        int idx = 0;
        foreach (var el in root.EnumerateArray())
        {
            idx++;
            try
            {
                var model = GetStringProp(el, "model", "Model", "اسم_الموديل", "name");
                if (string.IsNullOrWhiteSpace(model))
                {
                    errors.Add($"العنصر {idx}: حقل 'model' مفقود.");
                    continue;
                }

                var brand = GetStringProp(el, "brand", "Brand", "الماركة") ?? "SEWTEC";
                var category = GetStringProp(el, "category", "Category", "القسم") ?? "single_needle";
                var price = GetDecimalProp(el, "suggestedPriceEgp", "SuggestedPriceEgp", "price", "Price", "السعر") ?? 0m;
                var desc = GetStringProp(el, "descriptionArabic", "DescriptionArabic", "description", "الوصف") ?? "";
                var speed = GetIntProp(el, "speedRpm", "SpeedRpm", "speed", "السرعة");
                var stitch = GetDecimalProp(el, "maxStitchLengthMm", "MaxStitchLengthMm", "stitchLength", "طول_الغرزة");
                var needle = GetStringProp(el, "needleSystem", "NeedleSystem", "الإبرة");
                var motor = GetStringProp(el, "motorType", "MotorType", "الموتور");
                var autoTrimmer = GetBoolProp(el, "hasAutomaticTrimmer", "HasAutomaticTrimmer", "قص_خيط");
                var autoFoot = GetBoolProp(el, "hasAutoFootLifter", "HasAutoFootLifter", "رفع_دواس");
                var reverse = GetBoolProp(el, "hasReverseStitch", "HasReverseStitch", "فرماتورة");
                var lubrication = GetStringProp(el, "lubricationType", "LubricationType", "التزييت");
                var warranty = GetIntProp(el, "warrantyMonths", "WarrantyMonths", "الضمان");
                var inStock = GetBoolProp(el, "inStock", "InStock", "متوفر");
                var stockCount = GetIntProp(el, "stockCount", "StockCount", "الكمية");
                var app = GetStringProp(el, "application", "Application", "الاستخدام");

                var features = new List<string>();
                if (el.TryGetProperty("features", out var fEl) && fEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var feat in fEl.EnumerateArray())
                    {
                        var s = feat.GetString();
                        if (!string.IsNullOrWhiteSpace(s)) features.Add(s);
                    }
                }

                list.Add(new CreateProductDto(
                    Model: model,
                    Brand: brand,
                    Category: category,
                    SuggestedPriceEgp: price,
                    DescriptionArabic: desc,
                    SpeedRpm: speed,
                    MaxStitchLengthMm: stitch,
                    NeedleSystem: needle,
                    MotorType: motor,
                    HasAutomaticTrimmer: autoTrimmer,
                    HasAutoFootLifter: autoFoot,
                    HasReverseStitch: reverse,
                    LubricationType: lubrication,
                    WarrantyMonths: warranty,
                    InStock: inStock,
                    StockCount: stockCount,
                    Application: app,
                    Features: features
                ));
            }
            catch (Exception ex)
            {
                errors.Add($"العنصر {idx}: خطأ أثناء القراءة - {ex.Message}");
            }
        }

        return list;
    }

    private async Task<List<CreateProductDto>> ParseProductsFromCsvAsync(Stream stream, List<string> errors)
    {
        var list = new List<CreateProductDto>();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var lines = new List<string>();
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            lines.Add(line);
        }

        if (lines.Count == 0)
        {
            errors.Add("ملف CSV فارغ.");
            return list;
        }

        lines[0] = StripBom(lines[0]);

        var headerTokens = ParseCsvLine(lines[0]);
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headerTokens.Count; i++)
        {
            var raw = NormalizeHeaderName(headerTokens[i]);
            colMap[raw] = i;
        }

        int modelIdx = FindColIndex(colMap, "model", "الموديل", "اسم الموديل", "اسم_الموديل", "name");
        int brandIdx = FindColIndex(colMap, "brand", "الماركة", "البراند", "الشركة");
        int catIdx = FindColIndex(colMap, "category", "القسم", "النوع", "فئة");
        int priceIdx = FindColIndex(colMap, "suggestedpriceegp", "price", "السعر", "السعر المقترح", "سعر البيع", "سعر");
        int speedIdx = FindColIndex(colMap, "speedrpm", "speed", "السرعة", "السرعة القصوى");
        int stitchIdx = FindColIndex(colMap, "maxstitchlengthmm", "stitchlength", "طول الغرزة", "طول_الغرزة");
        int needleIdx = FindColIndex(colMap, "needlesystem", "نظام الإبرة", "الإبرة");
        int motorIdx = FindColIndex(colMap, "motortype", "نوع الموتور", "الموتور", "المحرك");
        int trimIdx = FindColIndex(colMap, "hasautomatictrimmer", "قص خيط", "قص خيط أوتوماتيك", "مقص");
        int liftIdx = FindColIndex(colMap, "hasautofootlifter", "رفع دواس", "رفع دواس أوتوماتيك", "دواس");
        int revIdx = FindColIndex(colMap, "hasreversestitch", "فرماتورة", "تثبيت");
        int lubIdx = FindColIndex(colMap, "lubricationtype", "نظام التزييت", "التزييت");
        int warIdx = FindColIndex(colMap, "warrantymonths", "الضمان", "شهور الضمان");
        int stockIdx = FindColIndex(colMap, "instock", "حالة التوفر", "متوفر", "المخزن");
        int countIdx = FindColIndex(colMap, "stockcount", "رصيد المخزن", "الكمية", "العدد");
        int appIdx = FindColIndex(colMap, "application", "الاستخدام", "التطبيق", "الخامات");
        int descIdx = FindColIndex(colMap, "descriptionarabic", "description", "الوصف", "الوصف الفني");
        int featIdx = FindColIndex(colMap, "features", "المزايا", "المميزات");

        if (modelIdx < 0)
        {
            errors.Add("ملف CSV لا يحتوي على عمود الموديل (Model / الموديل).");
            return list;
        }

        for (int r = 1; r < lines.Count; r++)
        {
            if (string.IsNullOrWhiteSpace(lines[r])) continue;
            var cells = ParseCsvLine(lines[r]);
            if (cells.Count == 0) continue;

            var model = GetCell(cells, modelIdx);
            if (string.IsNullOrWhiteSpace(model)) continue;

            var brand = GetCell(cells, brandIdx) ?? "SEWTEC";
            var cat = GetCell(cells, catIdx) ?? "single_needle";
            var price = ParseDecimal(GetCell(cells, priceIdx)) ?? 0m;
            var speed = ParseInt(GetCell(cells, speedIdx));
            var stitch = ParseDecimal(GetCell(cells, stitchIdx));
            var needle = GetCell(cells, needleIdx);
            var motor = GetCell(cells, motorIdx);
            var trim = ParseBool(GetCell(cells, trimIdx));
            var lift = ParseBool(GetCell(cells, liftIdx));
            var rev = ParseBool(GetCell(cells, revIdx));
            var lub = GetCell(cells, lubIdx);
            var war = ParseInt(GetCell(cells, warIdx));
            var inStock = ParseBool(GetCell(cells, stockIdx));
            var count = ParseInt(GetCell(cells, countIdx));
            var app = GetCell(cells, appIdx);
            var desc = GetCell(cells, descIdx) ?? $"ماكينة {model}";

            var featStr = GetCell(cells, featIdx);
            var features = new List<string>();
            if (!string.IsNullOrWhiteSpace(featStr))
            {
                features = featStr.Split(new[] { ';', '|' }, StringSplitOptions.RemoveEmptyEntries)
                                  .Select(f => f.Trim())
                                  .Where(f => !string.IsNullOrWhiteSpace(f))
                                  .ToList();
            }

            list.Add(new CreateProductDto(
                Model: model,
                Brand: brand,
                Category: cat,
                SuggestedPriceEgp: price,
                DescriptionArabic: desc,
                SpeedRpm: speed,
                MaxStitchLengthMm: stitch,
                NeedleSystem: needle,
                MotorType: motor,
                HasAutomaticTrimmer: trim,
                HasAutoFootLifter: lift,
                HasReverseStitch: rev,
                LubricationType: lub,
                WarrantyMonths: war,
                InStock: inStock,
                StockCount: count,
                Application: app,
                Features: features
            ));
        }

        return list;
    }

    private async Task<List<BatchPriceUpdateItem>> ParsePricesFromJsonAsync(Stream stream, List<string> errors)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var content = await reader.ReadToEndAsync();
        content = StripBom(content).Trim();

        using var doc = JsonDocument.Parse(content);
        JsonElement root = doc.RootElement;

        if (root.ValueKind == JsonValueKind.Object)
        {
            if (root.TryGetProperty("prices", out var prArr) && prArr.ValueKind == JsonValueKind.Array)
                root = prArr;
            else if (root.TryGetProperty("items", out var iArr) && iArr.ValueKind == JsonValueKind.Array)
                root = iArr;
            else if (root.TryGetProperty("products", out var prodArr) && prodArr.ValueKind == JsonValueKind.Array)
                root = prodArr;
        }

        if (root.ValueKind != JsonValueKind.Array)
        {
            errors.Add("تنسيق JSON للأسعار يجب أن يكون مصفوفة عناصر.");
            return new List<BatchPriceUpdateItem>();
        }

        var list = new List<BatchPriceUpdateItem>();
        int idx = 0;
        foreach (var el in root.EnumerateArray())
        {
            idx++;
            var idOrModel = GetStringProp(el, "id", "Id", "model", "Model", "الموديل", "كود_الموديل");
            var price = GetDecimalProp(el, "newPrice", "NewPrice", "price", "Price", "suggestedPriceEgp", "SuggestedPriceEgp", "السعر", "السعر_الجديد");

            if (string.IsNullOrWhiteSpace(idOrModel))
            {
                errors.Add($"العنصر {idx}: معرّف أو موديل الماكينة مفقود.");
                continue;
            }

            if (!price.HasValue)
            {
                errors.Add($"الموديل '{idOrModel}': لم يتم تحديد السعر الجديد.");
                continue;
            }

            list.Add(new BatchPriceUpdateItem(idOrModel, price.Value));
        }

        return list;
    }

    private async Task<List<BatchPriceUpdateItem>> ParsePricesFromCsvAsync(Stream stream, List<string> errors)
    {
        var list = new List<BatchPriceUpdateItem>();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var lines = new List<string>();
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            lines.Add(line);
        }

        if (lines.Count == 0)
        {
            errors.Add("ملف الأسعار CSV فارغ.");
            return list;
        }

        lines[0] = StripBom(lines[0]);
        var headerTokens = ParseCsvLine(lines[0]);
        var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < headerTokens.Count; i++)
        {
            colMap[NormalizeHeaderName(headerTokens[i])] = i;
        }

        int idOrModelIdx = FindColIndex(colMap, "model", "الموديل", "اسم الموديل", "id", "كود الموديل", "الماكينة");
        int priceIdx = FindColIndex(colMap, "newprice", "price", "السعر الجديد", "السعر", "السعر المقترح", "سعر البيع");

        if (idOrModelIdx < 0 && headerTokens.Count >= 2)
        {
            idOrModelIdx = 0;
            priceIdx = 1;
        }

        int startRow = 1;
        if (ParseDecimal(GetCell(headerTokens, 1)).HasValue)
        {
            startRow = 0;
        }

        for (int r = startRow; r < lines.Count; r++)
        {
            if (string.IsNullOrWhiteSpace(lines[r])) continue;
            var cells = ParseCsvLine(lines[r]);
            if (cells.Count <= Math.Max(idOrModelIdx, priceIdx)) continue;

            var idOrModel = GetCell(cells, idOrModelIdx);
            var rawPrice = GetCell(cells, priceIdx);

            // Resilience for unquoted thousands separator: e.g. Model,53,500 EGP (split into 3 cells)
            if (cells.Count > 2 && priceIdx == 1 && !string.IsNullOrWhiteSpace(rawPrice))
            {
                var nextCell = GetCell(cells, 2);
                if (!string.IsNullOrWhiteSpace(nextCell))
                {
                    var p1 = NormalizeDigits(rawPrice).Trim();
                    var p2 = NormalizeDigits(nextCell).Trim();
                    var digits2 = new string(p2.TakeWhile(c => char.IsDigit(c)).ToArray());
                    if (decimal.TryParse(p1, out _) && digits2.Length > 0)
                    {
                        rawPrice = p1 + digits2;
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(idOrModel)) continue;
            var price = ParseDecimal(rawPrice);
            if (!price.HasValue)
            {
                errors.Add($"سطر {r + 1}: تعذر تحويل القيمة '{rawPrice}' لسعر رقمي صالح.");
                continue;
            }

            list.Add(new BatchPriceUpdateItem(idOrModel, price.Value));
        }

        return list;
    }

    private static string StripBom(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        return input.TrimStart('﻿', '​');
    }

    private static string NormalizeHeaderName(string header)
    {
        return StripBom(header).Trim().ToLowerInvariant().Replace("_", " ").Replace("-", " ");
    }

    private static int FindColIndex(Dictionary<string, int> colMap, params string[] candidates)
    {
        foreach (var c in candidates)
        {
            var norm = c.Trim().ToLowerInvariant().Replace("_", " ").Replace("-", " ");
            if (colMap.TryGetValue(norm, out var idx))
                return idx;
        }
        return -1;
    }

    private static string? GetCell(List<string> cells, int idx)
    {
        if (idx < 0 || idx >= cells.Count) return null;
        var s = cells[idx].Trim();
        return string.IsNullOrEmpty(s) ? null : s;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        if (string.IsNullOrEmpty(line)) return result;

        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(sb.ToString());
                sb.Clear();
            }
            else
            {
                sb.Append(c);
            }
        }

        result.Add(sb.ToString());
        return result;
    }

    private static string EscapeCsv(string? val)
    {
        if (string.IsNullOrEmpty(val)) return "";
        char q = (char)34;
        if (val.IndexOfAny(new char[] { ',', q, (char)10, (char)13 }) >= 0)
        {
            return q + val.Replace(q.ToString(), new string(q, 2)) + q;
        }
        return val;
    }
    public static string NormalizeDigits(string? input)
    {
        if (string.IsNullOrEmpty(input)) return "";
        var sb = new StringBuilder(input.Length);
        foreach (char c in input)
        {
            if (c >= '٠' && c <= '٩')
                sb.Append((char)('0' + (c - '٠')));
            else if (c >= '۰' && c <= '۹')
                sb.Append((char)('0' + (c - '۰')));
            else
                sb.Append(c);
        }
        return sb.ToString();
    }

    private static decimal? ParseDecimal(string? val)
    {
        if (string.IsNullOrWhiteSpace(val)) return null;
        var s = NormalizeDigits(val).Trim();
        s = s.Replace("EGP", "", StringComparison.OrdinalIgnoreCase)
             .Replace("ج.م", "")
             .Replace("جنيه", "")
             .Replace(",", "")
             .Trim();

        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d))
            return d;
        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.CurrentCulture, out var d2))
            return d2;

        return null;
    }

    private static int? ParseInt(string? val)
    {
        var d = ParseDecimal(val);
        return d.HasValue ? (int)Math.Round(d.Value) : null;
    }

    private static bool? ParseBool(string? val)
    {
        if (string.IsNullOrWhiteSpace(val)) return null;
        var s = val.Trim().ToLowerInvariant();
        if (s is "true" or "1" or "نعم" or "متاح" or "متوفر" or "yes") return true;
        if (s is "false" or "0" or "لا" or "غير متاح" or "تحت الطلب" or "no") return false;
        return null;
    }

    private static string? GetStringProp(JsonElement el, params string[] names)
    {
        foreach (var n in names)
        {
            if (el.TryGetProperty(n, out var prop) && prop.ValueKind == JsonValueKind.String)
                return prop.GetString();
        }
        return null;
    }

    private static decimal? GetDecimalProp(JsonElement el, params string[] names)
    {
        foreach (var n in names)
        {
            if (el.TryGetProperty(n, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var d))
                    return d;
                if (prop.ValueKind == JsonValueKind.String)
                    return ParseDecimal(prop.GetString());
            }
        }
        return null;
    }

    private static int? GetIntProp(JsonElement el, params string[] names)
    {
        var d = GetDecimalProp(el, names);
        return d.HasValue ? (int)Math.Round(d.Value) : null;
    }

    private static bool? GetBoolProp(JsonElement el, params string[] names)
    {
        foreach (var n in names)
        {
            if (el.TryGetProperty(n, out var prop))
            {
                if (prop.ValueKind is JsonValueKind.True or JsonValueKind.False)
                    return prop.GetBoolean();
                if (prop.ValueKind == JsonValueKind.String)
                    return ParseBool(prop.GetString());
            }
        }
        return null;
    }

    private string ResolveDiskPath(string path)
    {
        if (Path.IsPathRooted(path)) return path;

        var baseDir = AppContext.BaseDirectory;
        var p1 = Path.Combine(baseDir, path);
        if (File.Exists(p1)) return p1;

        var cwd = Directory.GetCurrentDirectory();
        var p2 = Path.Combine(cwd, path);
        if (File.Exists(p2)) return p2;

        var p3 = Path.Combine(cwd, "backend", path);
        if (File.Exists(p3)) return p3;

        var p4 = Path.Combine(cwd, "backend", "Data", "seed_files", Path.GetFileName(path));
        if (File.Exists(p4)) return p4;

        return p1;
    }
}
