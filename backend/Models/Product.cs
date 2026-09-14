namespace SewTec.CRM.Api.Models;

public class Product
{
    public string Id { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal SuggestedPriceEgp { get; set; }
    public string DescriptionArabic { get; set; } = string.Empty;
    public int SpeedRpm { get; set; } = 5000;
    public decimal MaxStitchLengthMm { get; set; } = 5.0m;
    public string NeedleSystem { get; set; } = "DBx1";
    public string MotorType { get; set; } = "سيرفو دفع مباشر مدمج موفر للطاقة (Direct Drive)";
    public bool HasAutomaticTrimmer { get; set; } = true;
    public bool HasAutoFootLifter { get; set; } = true;
    public bool HasReverseStitch { get; set; } = true;
    public string LubricationType { get; set; } = "تزييت أوتوماتيك مغلق لمنع بقع الزيت";
    public int WarrantyMonths { get; set; } = 24;
    public bool InStock { get; set; } = true;
    public int StockCount { get; set; } = 5;
    public string Application { get; set; } = "أقمشة خفيفة ومتوسطة، جينز، قمصان قطنية";
    public string FeaturesJson { get; set; } = "[]";

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    [System.Text.Json.Serialization.JsonPropertyName("features")]
    public List<string>? Features
    {
        get
        {
            if (string.IsNullOrEmpty(FeaturesJson)) return new List<string>();
            try { return System.Text.Json.JsonSerializer.Deserialize<List<string>>(FeaturesJson) ?? new List<string>(); }
            catch { return new List<string>(); }
        }
        set
        {
            if (value != null)
                FeaturesJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }
}

