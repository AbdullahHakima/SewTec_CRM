namespace SewTec.CRM.Api.DTOs;

public record OpportunityDto(
    string Id,
    string BranchId,
    string CustomerId,
    string CustomerName,
    string Title,
    string MachineModel,
    int Quantity,
    decimal? EstimatedValue,
    string Stage,
    string StageUpdatedAt,
    string AssignedRepId,
    string AssignedRepName,
    string? ExpectedCloseDate,
    string? QuotationRef,
    string? Notes,
    string CreatedAt,
    string Revision = ""
);

public record CreateOpportunityRequest(
    string CustomerId,
    string CustomerName,
    string Title,
    string MachineModel,
    int Quantity,
    decimal? EstimatedValue,
    string? Stage,
    string AssignedRepId,
    string AssignedRepName,
    string? ExpectedCloseDate,
    string? QuotationRef,
    string? Notes
);

public record UpdateOpportunityRequest(
    string? Title,
    string? MachineModel,
    int? Quantity,
    decimal? EstimatedValue,
    string? Stage,
    string? ExpectedCloseDate,
    string? QuotationRef,
    string? Notes
);

public record UpdateStageRequest(
    string Stage,
    string? Note
);