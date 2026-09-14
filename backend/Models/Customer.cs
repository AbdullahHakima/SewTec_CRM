using System;
using System.Collections.Generic;

namespace SewTec.CRM.Api.Models;

public class Customer
{
    public string Revision { get; set; } = Guid.NewGuid().ToString("N");
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = "mahalla";
    public string Name { get; set; } = string.Empty;
    public CustomerType Type { get; set; }
    public CustomerStatus Status { get; set; }
    public bool IsVip { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? PhoneSecondary { get; set; }
    public string? ContactPerson { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string AssignedRepId { get; set; } = string.Empty;
    public string AssignedRepName { get; set; } = string.Empty;
    public decimal LifetimeSales { get; set; }
    public decimal OpenPipelineValue { get; set; }
    public DateTime LastContactAt { get; set; }
    public DateTime? NextFollowUpAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<InstalledMachine> InstalledMachines { get; set; } = new List<InstalledMachine>();
    public ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();
    public ICollection<FollowUp> FollowUps { get; set; } = new List<FollowUp>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
