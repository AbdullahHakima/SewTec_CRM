using System;

namespace SewTec.CRM.Api.Models;

public class Opportunity
{
    public string Revision { get; set; } = Guid.NewGuid().ToString("N");
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string MachineModel { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal? EstimatedValue { get; set; }
    public OpportunityStage Stage { get; set; }
    public DateTime StageUpdatedAt { get; set; }
    public string AssignedRepId { get; set; } = string.Empty;
    public string AssignedRepName { get; set; } = string.Empty;
    public DateTime? ExpectedCloseDate { get; set; }
    public string? QuotationRef { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
}
