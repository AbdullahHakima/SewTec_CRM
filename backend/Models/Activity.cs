using System;

namespace SewTec.CRM.Api.Models;

public class Activity
{
    public string? ActorId { get; set; }
    public string Id { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public ActivityType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string PerformedBy { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
}
