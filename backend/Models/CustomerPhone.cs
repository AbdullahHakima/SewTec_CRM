namespace SewTec.CRM.Api.Models;

// One company-wide namespace covers both primary and secondary phone numbers.
public class CustomerPhone
{
    public string NormalizedPhone { get; set; } = "";
    public string CustomerId { get; set; } = "";
}
