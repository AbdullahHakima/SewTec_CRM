namespace SewTec.CRM.Api.DTOs;

public record ActivityDto(
    string Id,
    string CustomerId,
    string Type,
    string Title,
    string Description,
    string OccurredAt,
    string PerformedBy,
    ActivityMetadataDto? Metadata
);

public record ActivityMetadataDto(
    string? Channel,
    string? MachineModel,
    string? QuotationRef,
    string? OpportunityId,
    decimal? Amount,
    string? Outcome
);