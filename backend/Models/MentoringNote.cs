using System;

namespace SewTec.CRM.Api.Models;

public class MentoringNote
{
    public string? RepId { get; set; }
    public string? ActorId { get; set; }
    public string BranchId { get; set; } = "";
    public string Id { get; set; } = string.Empty;
    public string RepName { get; set; } = string.Empty;
    public string Type { get; set; } = "coaching"; // "coaching" | "target" | "alert"
    public string Message { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
