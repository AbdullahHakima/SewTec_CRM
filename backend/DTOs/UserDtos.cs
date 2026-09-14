namespace SewTec.CRM.Api.DTOs;

public record UserDto(
    string Id,
    string Username,
    string FullName,
    string Role,
    string BranchId,
    string CreatedAt,
    int AssignedCustomersCount,
    decimal ActivePipelineValue,
    decimal TotalLifetimeSales,
    int ScheduledFollowUpsCount,
    int OverdueFollowUpsCount,
    int CompletedFollowUpsCount,
    int InteractionsCount,
    bool IsActive = true
);

public record CreateUserRequest(
    string Username,
    string Password,
    string FullName,
    string Role,
    string? BranchId
);

public record UpdateUserRequest(
    string? FullName,
    string? Role,
    string? Password,
    bool? IsActive = null
);

public record RepPerformanceDto(
    string RepId,
    string RepName,
    string Username,
    string Role,
    int CustomerCount,
    decimal PipelineValue,
    decimal LifetimeSales,
    int OverdueCount,
    int CompletedCount,
    int ScheduledCount,
    int ActivityCount,
    double CompletionRate
);

public record TeamMonitoringSummaryDto(
    int TotalReps,
    int TotalCustomers,
    decimal TotalActivePipeline,
    decimal TotalWonSales,
    int TotalOverdueTasks,
    int TotalCompletedTasks,
    List<RepPerformanceDto> RepsPerformance
);
