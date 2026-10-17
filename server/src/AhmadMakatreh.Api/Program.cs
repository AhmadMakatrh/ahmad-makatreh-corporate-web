// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: Program
using AhmadMakatreh.Api.Endpoints;
using AhmadMakatreh.Api.Security;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Application.Services;
using AhmadMakatreh.Infrastructure;
using AhmadMakatreh.Infrastructure.Persistence.PostgreSql;
using Microsoft.EntityFrameworkCore;
using BookingService = AhmadMakatreh.Application.Services.BookingApplicationService;
using IpResolver = AhmadMakatreh.Api.Security.ClientIpResolver;
using IHttpMaxRequestBodySizeFeatureRef = global::Microsoft.AspNetCore.Http.Features.IHttpMaxRequestBodySizeFeature;
using FixedWindowRateLimiterOptionsRef = global::System.Threading.RateLimiting.FixedWindowRateLimiterOptions;
using ForwardedHeadersRef = global::Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders;
using QueueProcessingOrderRef = global::System.Threading.RateLimiting.QueueProcessingOrder;
using RateLimitPartitionRef = global::System.Threading.RateLimiting.RateLimitPartition;
using IBookingApplicationServiceRef = global::AhmadMakatreh.Application.Services.IBookingApplicationService;
using ForwardedHeadersOptionsRef = global::Microsoft.AspNetCore.Builder.ForwardedHeadersOptions;
using IPAddressRef = global::System.Net.IPAddress;
using StringComparisonRef = global::System.StringComparison;
using WebApplicationRef = global::Microsoft.AspNetCore.Builder.WebApplication;
using BookingResultRef = global::AhmadMakatreh.Application.Models.BookingResult;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using StatusCodesRef = global::Microsoft.AspNetCore.Http.StatusCodes;
using HttpMethodsRef = global::Microsoft.AspNetCore.Http.HttpMethods;
using ExceptionRef = global::System.Exception;
using TimeSpanRef = global::System.TimeSpan;
using UriKindRef = global::System.UriKind;
using UriRef = global::System.Uri;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
// codeguard:components:end

var builder = WebApplicationRef.CreateBuilder(args);

// ==========================================
// 1. Application & Infrastructure Layers DI
// ==========================================
builder.Services.AddScoped<IBookingApplicationServiceRef, BookingService>();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddAdminAccess(builder.Configuration, builder.Environment);

// ==========================================
// 2. Client IP Resolution & Rate Limiting
// ==========================================
var configuredProxies = builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>();
if (configuredProxies is { Length: > 0 })
{
    var knownProxies = configuredProxies.Select(proxy =>
        IPAddressRef.TryParse(proxy, out var ip) ? ip
            : throw new InvalidOperationExceptionRef("Configuration Error: Every ReverseProxy:KnownProxies entry must be an IP address.")).ToArray();
    builder.Services.Configure<ForwardedHeadersOptionsRef>(options =>
    {
        options.ForwardedHeaders = ForwardedHeadersRef.XForwardedFor
                                 | ForwardedHeadersRef.XForwardedProto;

        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();

        foreach (var proxy in knownProxies)
        {
            options.KnownProxies.Add(proxy);
        }
    });
}

builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("AdminUploadPolicy", http =>
        RateLimitPartitionRef.GetFixedWindowLimiter(
            partitionKey: http.User.FindFirst("email")?.Value ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptionsRef
            { PermitLimit = 6, Window = TimeSpanRef.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("AdminReplyPolicy", http =>
        RateLimitPartitionRef.GetFixedWindowLimiter(
            partitionKey: http.User.FindFirst("email")?.Value ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptionsRef
            { PermitLimit = 6, Window = TimeSpanRef.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("AdminPolicy", http =>
        RateLimitPartitionRef.GetFixedWindowLimiter(
            partitionKey: http.User.FindFirst("email")?.Value ?? http.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptionsRef
            {
                PermitLimit = 120, Window = TimeSpanRef.FromMinutes(1), QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodesRef.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            success = false,
            code = BookingResultRef.RateLimitedCode,
            message = "Rate limit exceeded. Please wait a moment before submitting again."
        }, cancellationToken: token);
    };

    options.AddPolicy("BookingPolicy", httpContext =>
    {
        // Safe Client IP Resolution:
        // By default, rely strictly on connection RemoteIpAddress (TCP socket).
        // Only trust CF-Connecting-IP if explicitly configured for an environment with origin lockdown.
        var clientIp = IpResolver.Resolve(httpContext, builder.Configuration) ?? "anonymous";

        return RateLimitPartitionRef.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptionsRef
            {
                PermitLimit = 3,
                Window = TimeSpanRef.FromSeconds(20),
                QueueProcessingOrder = QueueProcessingOrderRef.OldestFirst,
                QueueLimit = 0
            });
    });
});

// ==========================================
// 3. CORS Configuration
// ==========================================
const string CorsPolicyName = "ProductionCorsPolicy";
const string CorsPolicyNameRef = CorsPolicyName;

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyNameRef, policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;
            if (!UriRef.TryCreate(origin, UriKindRef.Absolute, out var uri)) return false;

            var host = uri.Host;

            // Allow localhost dev servers on any port
            if (host.Equals("localhost", StringComparisonRef.OrdinalIgnoreCase) ||
                host.Equals("127.0.0.1", StringComparisonRef.OrdinalIgnoreCase))
            {
                return true;
            }

            // Strictly allow official custom domain and subdomains
            if (host.Equals("ahmad-makatreh.vip", StringComparisonRef.OrdinalIgnoreCase) ||
                host.EndsWith(".ahmad-makatreh.vip", StringComparisonRef.OrdinalIgnoreCase))
            {
                return true;
            }

            // Strictly allow project Cloudflare Pages deployments (production & preview branches)
            if (host.Equals("ahmadmakatreh-site.pages.dev", StringComparisonRef.OrdinalIgnoreCase) ||
                host.EndsWith(".ahmadmakatreh-site.pages.dev", StringComparisonRef.OrdinalIgnoreCase) ||
                host.Equals("ahmad-makatreh.pages.dev", StringComparisonRef.OrdinalIgnoreCase) ||
                host.EndsWith(".ahmad-makatreh.pages.dev", StringComparisonRef.OrdinalIgnoreCase))
            {
                return true;
            }

            // Configurable additional origins
            var additionalOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            if (additionalOrigins != null && additionalOrigins.Any(o =>
                UriRef.TryCreate(o, UriKindRef.Absolute, out var extraUri) &&
                extraUri.Host.Equals(host, StringComparisonRef.OrdinalIgnoreCase)))
            {
                return true;
            }

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

var app = builder.Build();

// ==========================================
// 4. Development Auto-Migration (Optional DX helper)
// ==========================================
if (app.Environment.IsDevelopment())
{
    var autoMigrate = app.Configuration.GetValue<bool>("Persistence:AutoMigrateInDevelopment", false);
    var provider = app.Configuration.GetValue<string>("Persistence:Provider") ?? "Postgres";

    if (autoMigrate && provider.Equals("Postgres", StringComparisonRef.OrdinalIgnoreCase))
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetService<AppDbContextRef>();
        if (db != null)
        {
            try
            {
                await db.Database.MigrateAsync();
                app.Logger.LogInformation("Database auto-migrated successfully in Development.");
            }
            catch (ExceptionRef ex)
            {
                app.Logger.LogWarning(ex, "Development database auto-migration skipped or failed.");
            }
        }
    }
}

// ==========================================
// 5. Middleware Pipeline
// ==========================================
if (configuredProxies is { Length: > 0 })
{
    app.UseForwardedHeaders();
}

app.UseCors(CorsPolicyNameRef);
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/admin"))
    {
        context.Response.Headers.CacheControl = "no-store";
        if (!HttpMethodsRef.IsGet(context.Request.Method) && !context.Request.Path.StartsWithSegments("/api/admin/media"))
        {
            var inquiryImport = HttpMethodsRef.IsPost(context.Request.Method)
                && string.Equals(context.Request.Path.Value?.TrimEnd('/'), "/api/admin/inquiries/import", StringComparisonRef.OrdinalIgnoreCase);
            var limit = (inquiryImport ? 10L : 2L) * 1024 * 1024;
            if (context.Request.ContentLength > limit) { context.Response.StatusCode = 413; return; }
            var size = context.Features.Get<IHttpMaxRequestBodySizeFeatureRef>();
            if (size is { IsReadOnly: false }) size.MaxRequestBodySize = limit;
        }
    }
    await next();
});
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Defensive Security Headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;");
    context.Response.Headers.Append("Cross-Origin-Embedder-Policy", "credentialless");
    context.Response.Headers.Append("Cross-Origin-Opener-Policy", "same-origin");
    await next();
});

// ==========================================
// 6. Endpoint Mappings
// ==========================================
app.MapHealthEndpoints();
app.MapBookingEndpoints();
app.MapAdminInquiryEndpoints();
app.MapAdminSiteEndpoints();
app.MapAdminMediaEndpoints();

app.Run();

// Required for WebApplicationFactory in Integration Tests
public partial class Program { }
