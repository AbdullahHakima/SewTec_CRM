using System;

namespace SewTec.CRM.Api.Models;

public class FollowUp
{
    public string Revision { get; set; } = Guid.NewGuid().ToString("N");
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public FollowUpChannel Channel { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Topic { get; set; } = string.Empty;
    public FollowUpStatus Status { get; set; }
    public string AssignedRepId { get; set; } = string.Empty;
    public string AssignedRepName { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public InteractionOutcome? Outcome { get; set; }
    public string? OutcomeNote { get; set; }
    public string? NextFollowUpId { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
}
