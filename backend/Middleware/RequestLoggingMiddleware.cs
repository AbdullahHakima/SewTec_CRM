using System.Diagnostics;

namespace SewTec.CRM.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        context.Response.Headers["X-Correlation-Id"] = correlationId;

        var stopwatch = Stopwatch.StartNew();
        var method = context.Request.Method;
        var path = context.Request.Path;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;
            var user = context.User.Identity?.Name ?? "Anonymous";

            if (statusCode >= 400)
            {
                _logger.LogWarning("[HTTP {StatusCode}] {Method} {Path} took {ElapsedMs}ms (User: {User})",
                    statusCode, method, path, stopwatch.ElapsedMilliseconds, user);
            }
            else
            {
                _logger.LogInformation("[HTTP {StatusCode}] {Method} {Path} took {ElapsedMs}ms (User: {User})",
                    statusCode, method, path, stopwatch.ElapsedMilliseconds, user);
            }
        }
    }
}
