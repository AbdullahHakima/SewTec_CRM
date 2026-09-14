namespace SewTec.CRM.Api.Models;

public class InstalledMachine
{
    public int Id { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? SerialNumber { get; set; }
    public int PurchaseYear { get; set; }
    public bool PurchasedFromSewTec { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
}
