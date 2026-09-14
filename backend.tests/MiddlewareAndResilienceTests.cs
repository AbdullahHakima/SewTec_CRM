using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SewTec.CRM.Api.Middleware;

namespace SewTec.CRM.Tests;

public class MiddlewareAndResilienceTests
{
    [Theory]
    [InlineData(typeof(KeyNotFoundException), (int)HttpStatusCode.NotFound)]
    [InlineData(typeof(ArgumentException), (int)HttpStatusCode.BadRequest)]
    [InlineData(typeof(InvalidOperationException), (int)HttpStatusCode.BadRequest)]
    [InlineData(typeof(UnauthorizedAccessException), (int)HttpStatusCode.Unauthorized)]
    [InlineData(typeof(Exception), (int)HttpStatusCode.InternalServerError)]
    public async Task GlobalExceptionMiddleware_CatchesExceptions_ReturnsStandardProblemDetails(Type exceptionType, int expectedStatusCode)
    {
        RequestDelegate next = (ctx) =>
        {
            var ex = (Exception)Activator.CreateInstance(exceptionType, "Test error message")!;
            throw ex;
        };

        var middleware = new GlobalExceptionMiddleware(next, NullLogger<GlobalExceptionMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        Assert.Equal(expectedStatusCode, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        if (expectedStatusCode == 500) Assert.DoesNotContain("Test error message", responseBody);
        else Assert.Contains("Test error message", responseBody);
        Assert.Contains("status", responseBody);
        Assert.Contains("traceId", responseBody);
    }

    [Fact]
    public async Task RequestLoggingMiddleware_AddsCorrelationIdHeader()
    {
        RequestDelegate next = (ctx) => Task.CompletedTask;
        var middleware = new RequestLoggingMiddleware(next, NullLogger<RequestLoggingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        await middleware.InvokeAsync(context);

        Assert.True(context.Response.Headers.ContainsKey("X-Correlation-Id"));
        Assert.False(string.IsNullOrEmpty(context.Response.Headers["X-Correlation-Id"].ToString()));
    }

    [Fact]
    public async Task RequestLoggingMiddleware_PreservesIncomingCorrelationIdHeader()
    {
        RequestDelegate next = (ctx) => Task.CompletedTask;
        var middleware = new RequestLoggingMiddleware(next, NullLogger<RequestLoggingMiddleware>.Instance);

        var context = new DefaultHttpContext();
        var incomingCorrelationId = "custom-corr-id-12345";
        context.Request.Headers["X-Correlation-Id"] = incomingCorrelationId;

        await middleware.InvokeAsync(context);

        Assert.Equal(incomingCorrelationId, context.Response.Headers["X-Correlation-Id"].ToString());
    }
}

