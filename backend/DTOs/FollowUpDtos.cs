namespace SewTec.CRM.Api.DTOs;

public record FollowUpDto(
    string Id,
    string BranchId,
    string CustomerId,
    string CustomerName,
    string CustomerPhone,
    string Channel,
    string ScheduledAt,
    string Topic,
    string Status,
    string AssignedRepId,
    string AssignedRepName,
    string? CompletedAt,
    string? Outcome,
    string? OutcomeNote,
    string? NextFollowUpId,
    string Revision = ""
);

public record CreateFollowUpRequest(
    string CustomerId,
    string CustomerName,
    string CustomerPhone,
    string Channel,
    string ScheduledAt,
    string Topic,
    string AssignedRepId,
    string AssignedRepName
);

public record CompleteFollowUpRequest(
    string Outcome,
    string? OutcomeNote,
    string? UninterestedReason,
    NextFollowUpInput? NextFollowUp
);

public record NextFollowUpInput(
    string ScheduledAt,
    string Channel,
    string Topic
);

public record RescheduleRequest(
    string NewScheduledAt
);