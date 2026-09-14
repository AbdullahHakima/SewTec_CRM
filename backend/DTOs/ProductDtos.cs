namespace SewTec.CRM.Api.DTOs;

public record ProductDto(
    string Id,
    string Model,
    string Brand,
    string Category,
    decimal SuggestedPriceEgp,
    string DescriptionArabic,
    int SpeedRpm,
    decimal MaxStitchLengthMm,
    string NeedleSystem,
    string MotorType,
    bool HasAutomaticTrimmer,
    bool HasAutoFootLifter,
    bool HasReverseStitch,
    string LubricationType,
    int WarrantyMonths,
    bool InStock,
    int StockCount,
    string Application,
    List<string> Features
);

public record CreateProductDto(
    string Model,
    string Brand,
    string Category,
    decimal SuggestedPriceEgp,
    string DescriptionArabic,
    int? SpeedRpm,
    decimal? MaxStitchLengthMm,
    string? NeedleSystem,
    string? MotorType,
    bool? HasAutomaticTrimmer,
    bool? HasAutoFootLifter,
    bool? HasReverseStitch,
    string? LubricationType,
    int? WarrantyMonths,
    bool? InStock,
    int? StockCount,
    string? Application,
    List<string>? Features
);

public record UpdateProductDto(
    string? Model,
    string? Brand,
    string? Category,
    decimal? SuggestedPriceEgp,
    string? DescriptionArabic,
    int? SpeedRpm,
    decimal? MaxStitchLengthMm,
    string? NeedleSystem,
    string? MotorType,
    bool? HasAutomaticTrimmer,
    bool? HasAutoFootLifter,
    bool? HasReverseStitch,
    string? LubricationType,
    int? WarrantyMonths,
    bool? InStock,
    int? StockCount,
    string? Application,
    List<string>? Features
);

public record BatchPriceUpdateItem(
    string Id,
    decimal NewPrice
);

public record CatalogImportResult(
    bool Success,
    int TotalProcessed,
    int InsertedCount,
    int UpdatedCount,
    List<string> InsertedModels,
    List<string> UpdatedModels,
    List<string> Errors
);

public record PriceImportResult(
    bool Success,
    int TotalProcessed,
    int UpdatedCount,
    List<string> UpdatedModels,
    List<string> NotFoundModels,
    List<string> Errors
);

