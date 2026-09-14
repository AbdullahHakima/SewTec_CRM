namespace SewTec.CRM.Api.DTOs;

public record CustomerDto(
    string Id,
    string BranchId,
    string Name,
    string Type,
    string Status,
    bool IsVip,
    string Phone,
    string? PhoneSecondary,
    string? ContactPerson,
    string Address,
    string City,
    string AssignedRepId,
    string AssignedRepName,
    decimal LifetimeSales,
    decimal OpenPipelineValue,
    string LastContactAt,
    string? NextFollowUpAt,
    List<InstalledMachineDto> InstalledMachines,
    string? Notes,
    string CreatedAt,
    string Revision = ""
);

public record InstalledMachineDto(
    string Model,
    int Quantity,
    string? SerialNumber,
    int PurchaseYear,
    bool PurchasedFromSewTec
);

public record CreateCustomerRequest(
    string Name,
    string Type,
    string Phone,
    string? PhoneSecondary,
    string? ContactPerson,
    string? Address,
    string? City,
    string AssignedRepId,
    string AssignedRepName,
    string? Notes
);

public record UpdateCustomerRequest(
    string? Name,
    string? Type,
    string? Phone,
    string? PhoneSecondary,
    string? ContactPerson,
    string? Address,
    string? City,
    string? AssignedRepId,
    string? AssignedRepName,
    string? Notes,
    bool? IsVip
);
