using System;

namespace SewTec.CRM.Api.Models;

public class Interaction
{
    public string? ActorId { get; set; }
    public string Id { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public InteractionChannel Channel { get; set; }
    public InteractionOutcome Outcome { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string? UninterestedReason { get; set; }
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public string? FollowUpId { get; set; }
    public string? OpportunityId { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
}
