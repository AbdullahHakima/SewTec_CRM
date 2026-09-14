using System.Net;
using System.Text.Json;

namespace SewTec.CRM.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError("Request failed: {ExceptionType}; trace {TraceId}", ex.GetType().Name, context.TraceIdentifier);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            SewTec.CRM.Api.Security.ConflictException => HttpStatusCode.Conflict,
            KeyNotFoundException => HttpStatusCode.NotFound,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            ArgumentException => HttpStatusCode.BadRequest,
            InvalidOperationException => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            status = (int)statusCode,
            title = statusCode.ToString(),
            message = statusCode == HttpStatusCode.InternalServerError ? "حدث خطأ غير متوقع. أعد المحاولة أو تواصل مع الدعم." : exception.Message,
            code = (exception as SewTec.CRM.Api.Security.ConflictException)?.Code,
            customerId = (exception as SewTec.CRM.Api.Security.ConflictException)?.CustomerId,
            traceId = context.TraceIdentifier,
            timestamp = DateTime.UtcNow.ToString("o")
        };

        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}
