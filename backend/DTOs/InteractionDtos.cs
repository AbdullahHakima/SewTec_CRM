namespace SewTec.CRM.Api.DTOs;

public record InteractionDto(
    string Id,
    string CustomerId,
    string CustomerName,
    string Channel,
    string Outcome,
    string Summary,
    string? UninterestedReason,
    string PerformedBy,
    string OccurredAt,
    string? FollowUpId,
    string? OpportunityId
);

public record CreateInteractionRequest(
    string CustomerId,
    string CustomerName,
    string Channel,
    string Outcome,
    string Summary,
    string? UninterestedReason,
    string PerformedBy,
    string? FollowUpId,
    string? OpportunityId,
    NextFollowUpInput? NextFollowUp = null
);
