using System;

namespace SewTec.CRM.Api.Models;

public class AppUser
{
    public bool IsActive { get; set; } = true;
    public string SessionVersion { get; set; } = Guid.NewGuid().ToString("N");
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "admin" | "rep"
    public string BranchId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
