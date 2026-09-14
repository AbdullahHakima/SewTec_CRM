using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SewTec.CRM.Api.Data;
using SewTec.CRM.Api.Middleware;
using SewTec.CRM.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. DbContext & SQLite Persistence
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=sewtec_crm.db";
builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseSqlite(connectionString));

// 2. Health Checks Pipeline
builder.Services.AddHealthChecks();

// 3. Domain Services Layer
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IOpportunityService, OpportunityService>();
builder.Services.AddScoped<IFollowUpService, FollowUpService>();
builder.Services.AddScoped<IMentoringService, MentoringService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<ICatalogImportService, CatalogImportService>();

// 4. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Configure Jwt:Key with at least 32 random bytes.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SewTecCRM";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SewTecCRMClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<CrmDbContext>();
            var id = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var account = await db.Users.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (account == null || !account.IsActive || account.SessionVersion != context.Principal?.FindFirst("sessionVersion")?.Value
                || account.Role != context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                || account.BranchId != context.Principal?.FindFirst("branchId")?.Value)
                context.Fail("Session revoked");
        }
    };
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<SewTec.CRM.Api.Security.CurrentUser>();
builder.Services.AddScoped<SewTec.CRM.Api.Security.RevisionFilter>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("login", context => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

// 5. Controllers with JSON options
builder.Services.AddControllers(options => options.Filters.AddService<SewTec.CRM.Api.Security.RevisionFilter>())
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

// 6. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? (builder.Environment.IsDevelopment() ? new[] { "http://localhost:3000", "http://127.0.0.1:3000" } : Array.Empty<string>()))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsProduction() && builder.Configuration["AllowedHosts"] is (null or "*"))
    throw new InvalidOperationException("Configure AllowedHosts explicitly in production.");

if (args.Contains("--bootstrap-admin"))
{
    using var scope = app.Services.CreateScope();
    await BootstrapAdmin.RunAsync(scope.ServiceProvider.GetRequiredService<CrmDbContext>(), builder.Configuration);
    return;
}

// Schema changes run through the explicit operator command, never during normal startup.
if (args.Contains("--migrate"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
    await DatabaseUpgrade.RunAsync(db, args);
    if (args.Contains("--seed-demo") && app.Environment.IsDevelopment()) await SeedData.SeedAsync(db);
    return;
}
if (app.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("Demo:Enabled"))
{
    using var scope = app.Services.CreateScope();
    await SeedData.SeedAsync(scope.ServiceProvider.GetRequiredService<CrmDbContext>());
}

// 7. Request Pipeline & Middleware Order
app.UseMiddleware<GlobalExceptionMiddleware>();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    if (context.Request.Path.StartsWithSegments("/api")) context.Response.Headers["Cache-Control"] = "no-store";
    if (app.Environment.IsProduction()) context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
    await next();
});
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<WriteTransactionMiddleware>();

app.MapHealthChecks("/health");
app.MapGet("/ready", async (CrmDbContext db) => {
    try { return await db.Database.CanConnectAsync() && !(await db.Database.GetPendingMigrationsAsync()).Any() ? Results.Ok(new { status = "ready" }) : Results.StatusCode(503); }
    catch { return Results.StatusCode(503); }
});

app.MapControllers();

app.Run();

public partial class Program { }
