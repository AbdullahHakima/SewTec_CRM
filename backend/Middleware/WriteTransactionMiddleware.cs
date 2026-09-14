using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.Data;

namespace SewTec.CRM.Api.Middleware;

// SQLite obtains the writer reservation before revision/last-admin checks.
// A response with a validation/authorization error cannot commit partial work.
public sealed class WriteTransactionMiddleware(RequestDelegate next)
{
    // Queue asynchronously within this process instead of occupying worker threads in SQLite's busy wait.
    // SQLite still supplies the cross-process transaction lock and all integrity constraints.
    private static readonly SemaphoreSlim Writer = new(1, 1);
    public async Task InvokeAsync(HttpContext context, CrmDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated != true || context.Request.Method is "GET" or "HEAD" or "OPTIONS") { await next(context); return; }
        await Writer.WaitAsync(context.RequestAborted);
        try
        {
        await using var transaction = await db.Database.BeginTransactionAsync(context.RequestAborted);
        var original = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;
        try
        {
            await next(context);
            if (context.Response.StatusCode < 400) await transaction.CommitAsync(context.RequestAborted);
            buffer.Position = 0;
            await buffer.CopyToAsync(original, context.RequestAborted);
        }
        finally { context.Response.Body = original; }
        }
        finally { Writer.Release(); }
    }
}
