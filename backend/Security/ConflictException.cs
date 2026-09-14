namespace SewTec.CRM.Api.Security;

public sealed class ConflictException(string code, string message, string? customerId = null) : Exception(message)
{
    public string Code { get; } = code;
    public string? CustomerId { get; } = customerId;
}
