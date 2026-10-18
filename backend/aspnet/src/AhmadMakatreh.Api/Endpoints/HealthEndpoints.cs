// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: HealthEndpoints
using AhmadMakatreh.Infrastructure.Persistence.PostgreSql;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DictionaryOfStringAndStringRef = global::System.Collections.Generic.Dictionary<string, string>;
using IEndpointRouteBuilderRef = global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IServiceProviderRef = global::System.IServiceProvider;
using StringComparisonRef = global::System.StringComparison;
using IConfigurationRef = global::Microsoft.Extensions.Configuration.IConfiguration;
using FromServicesAttributeRef = global::Microsoft.AspNetCore.Mvc.FromServicesAttribute;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using StatusCodesRef = global::Microsoft.AspNetCore.Http.StatusCodes;
using EnvironmentRef = global::System.Environment;
using ExceptionRef = global::System.Exception;
using ResultsRef = global::Microsoft.AspNetCore.Http.Results;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilderRef MapHealthEndpoints(this IEndpointRouteBuilderRef app)
    {
        var group = app.MapGroup("/health")
                       .WithTags("Health");

        // 1. Liveness Probe: Checks if the application process is running and responsive
        // Should NOT fail if downstream databases or third-party integrations are temporarily unavailable.
        group.MapGet("/live", () => ResultsRef.Ok(new
        {
            status = "Live",
            timestamp = DateTimeRef.UtcNow,
            service = "AhmadMakatreh.Api"
        }))
        .WithName("LivenessCheck")
        .Produces(StatusCodesRef.Status200OK);

        // 2. Readiness Probe: Verifies critical dependencies required to process live traffic
        // Checks PostgreSQL database connectivity when PostgreSQL is the active provider.
        group.MapGet("/ready", async (
            [FromServicesAttributeRef] IServiceProviderRef serviceProvider,
            [FromServicesAttributeRef] IConfigurationRef configuration,
            CancellationTokenRef cancellationToken) =>
        {
            var provider = configuration.GetValue<string>("Persistence:Provider") ?? "Postgres";
            var diagnostics = new DictionaryOfStringAndStringRef();

            if (provider.Equals("Postgres", StringComparisonRef.OrdinalIgnoreCase))
            {
                var dbContext = serviceProvider.GetService<AppDbContextRef>();
                if (dbContext == null)
                {
                    diagnostics["database"] = "NotConfigured";
                    return ResultsRef.Json(new
                    {
                        status = "Unhealthy",
                        provider = "Postgres",
                        diagnostics
                    }, statusCode: StatusCodesRef.Status503ServiceUnavailable);
                }

                try
                {
                    var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
                    if (!canConnect)
                    {
                        diagnostics["database"] = "ConnectionFailed";
                        return ResultsRef.Json(new
                        {
                            status = "Unhealthy",
                            provider = "Postgres",
                            diagnostics
                        }, statusCode: StatusCodesRef.Status503ServiceUnavailable);
                    }

                    diagnostics["database"] = "Connected";
                }
                catch (ExceptionRef)
                {
                    diagnostics["database"] = "Error";
                    return ResultsRef.Json(new
                    {
                        status = "Unhealthy",
                        provider = "Postgres",
                        diagnostics
                    }, statusCode: StatusCodesRef.Status503ServiceUnavailable);
                }
            }
            else
            {
                diagnostics["database"] = "DevJson";
            }

            return ResultsRef.Ok(new
            {
                status = "Ready",
                provider,
                diagnostics,
                timestamp = DateTimeRef.UtcNow
            });
        })
        .WithName("ReadinessCheck")
        .Produces(StatusCodesRef.Status200OK)
        .Produces(StatusCodesRef.Status503ServiceUnavailable);

        // 3. Backwards-compatible legacy /health endpoint
        group.MapGet("/", () => ResultsRef.Ok(new
        {
            status = "Healthy",
            timestamp = DateTimeRef.UtcNow,
            runtime = EnvironmentRef.Version.ToString(),
            service = "AhmadMakatreh.Api"
        }))
        .WithName("LegacyHealthCheck")
        .Produces(StatusCodesRef.Status200OK);

        return app;
    }
}
