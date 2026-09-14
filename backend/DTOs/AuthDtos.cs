namespace SewTec.CRM.Api.DTOs;

public record LoginRequest(
    string Username,
    string Password
);

public record RegisterRequest(
    string Username,
    string Password,
    string FullName,
    string Role,
    string BranchId
);

public record AuthResponse(
    string Token,
    string UserId,
    string Username,
    string FullName,
    string Role,
    string BranchId
);

public record RegisteredUserResponse(
    string UserId,
    string Username,
    string FullName,
    string Role,
    string BranchId
);
