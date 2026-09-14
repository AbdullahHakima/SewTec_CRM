using System.Text.Json.Serialization;

namespace SewTec.CRM.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CustomerType
{
    Factory,
    Workshop,
    Trader,
    Individual
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CustomerStatus
{
    Active,
    Dormant,
    Inactive
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OpportunityStage
{
    New,
    Contacted,
    Interested,
    Quotation,
    Negotiation,
    Won,
    Lost
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FollowUpChannel
{
    Call,
    Visit,
    Whatsapp,
    Email
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FollowUpStatus
{
    Scheduled,
    Completed,
    Missed,
    Cancelled
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InteractionChannel
{
    Call,
    Visit,
    Whatsapp,
    Email,
    Note
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum InteractionOutcome
{
    Interested,
    QuotationRequested,
    NeedsTime,
    NoAnswer,
    NotInterested
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ActivityType
{
    Interaction,
    Quotation,
    StageChange,
    FollowupCompleted
}
