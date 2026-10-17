// codeguard:components:start
// codeguard:defines: AdminAccess
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using IConfigurationRetrieverOfOpenIdConnectConfigurationRef = global::Microsoft.IdentityModel.Protocols.IConfigurationRetriever<global::Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>;
using ConfigurationManagerOfOpenIdConnectConfigurationRef = global::Microsoft.IdentityModel.Protocols.ConfigurationManager<global::Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>;
using TaskOfOpenIdConnectConfigurationRef = global::System.Threading.Tasks.Task<global::Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>;
using AntiforgeryValidationExceptionRef = global::Microsoft.AspNetCore.Antiforgery.AntiforgeryValidationException;
using OperationCanceledExceptionRef = global::System.OperationCanceledException;
using OpenIdConnectConfigurationRef = global::Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration;
using TokenValidationParametersRef = global::Microsoft.IdentityModel.Tokens.TokenValidationParameters;
using HttpDocumentRetrieverRef = global::Microsoft.IdentityModel.Protocols.HttpDocumentRetriever;
using IEndpointRouteBuilderRef = global::Microsoft.AspNetCore.Routing.IEndpointRouteBuilder;
using IServiceCollectionRef = global::Microsoft.Extensions.DependencyInjection.IServiceCollection;
using SecurityAlgorithmsRef = global::Microsoft.IdentityModel.Tokens.SecurityAlgorithms;
using CookieSecurePolicyRef = global::Microsoft.AspNetCore.Http.CookieSecurePolicy;
using IDocumentRetrieverRef = global::Microsoft.IdentityModel.Protocols.IDocumentRetriever;
using RouteGroupBuilderRef = global::Microsoft.AspNetCore.Routing.RouteGroupBuilder;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IHostEnvironmentRef = global::Microsoft.Extensions.Hosting.IHostEnvironment;
using StringComparisonRef = global::System.StringComparison;
using JwtBearerEventsRef = global::Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents;
using IConfigurationRef = global::Microsoft.Extensions.Configuration.IConfiguration;
using StringComparerRef = global::System.StringComparer;
using ILoggerFactoryRef = global::Microsoft.Extensions.Logging.ILoggerFactory;
using JsonWebKeySetRef = global::Microsoft.IdentityModel.Tokens.JsonWebKeySet;
using SameSiteModeRef = global::Microsoft.AspNetCore.Http.SameSiteMode;
using IAntiforgeryRef = global::Microsoft.AspNetCore.Antiforgery.IAntiforgery;
using HttpMethodsRef = global::Microsoft.AspNetCore.Http.HttpMethods;
using HttpClientRef = global::System.Net.Http.HttpClient;
using ExceptionRef = global::System.Exception;
using TimeSpanRef = global::System.TimeSpan;
using UriKindRef = global::System.UriKind;
using ResultsRef = global::Microsoft.AspNetCore.Http.Results;
using TaskRef = global::System.Threading.Tasks.Task;
using UriRef = global::System.Uri;
// codeguard:components:end

namespace AhmadMakatreh.Api.Security;

public static class AdminAccess
{
    public const string Policy = "SiteAdministrator";
    private const string PolicyRef = Policy;
    public const string Scheme = "CloudflareAccess";
    private const string SchemeRef = Scheme;

    public static IServiceCollectionRef AddAdminAccess(this IServiceCollectionRef services, IConfigurationRef configuration, IHostEnvironmentRef environment)
    {
        var issuer = configuration["AdminAccess:TeamDomain"]?.TrimEnd('/');
        var audience = configuration["AdminAccess:Audience"];
        var emails = configuration.GetSection("AdminAccess:AllowedEmails").Get<string[]>() ?? [];
        var configured = UriRef.TryCreate(issuer, UriKindRef.Absolute, out var teamUri)
            && teamUri.Scheme == "https" && teamUri.Host.EndsWith(".cloudflareaccess.com", StringComparisonRef.OrdinalIgnoreCase)
            && teamUri.AbsolutePath == "/" && !string.IsNullOrWhiteSpace(audience) && emails.Length > 0;

        services.AddAuthentication().AddJwtBearer(SchemeRef, options =>
        {
            options.MapInboundClaims = false;
            options.IncludeErrorDetails = false;
            options.TokenValidationParameters = new TokenValidationParametersRef
            {
                ValidateIssuer = true, ValidIssuer = issuer,
                ValidateAudience = true, ValidAudience = audience,
                ValidateLifetime = true, RequireExpirationTime = true,
                RequireSignedTokens = true, ValidateIssuerSigningKey = true,
                ValidAlgorithms = [SecurityAlgorithmsRef.RsaSha256],
                NameClaimType = "email", ClockSkew = TimeSpanRef.FromSeconds(30)
            };
            if (configured)
            {
                options.ConfigurationManager = new ConfigurationManagerOfOpenIdConnectConfigurationRef(
                    $"{issuer}/cdn-cgi/access/certs", new AccessKeyRetriever(issuer!), new HttpDocumentRetrieverRef(new HttpClientRef { Timeout = TimeSpanRef.FromSeconds(5) })
                    {
                        RequireHttps = true
                    }) { AutomaticRefreshInterval = TimeSpanRef.FromHours(1) };
            }
            options.Events = new JwtBearerEventsRef
            {
                OnMessageReceived = context =>
                {
                    // Only the assertion is accepted; a public Authorization header cannot select this identity.
                    var assertion = context.Request.Headers["Cf-Access-Jwt-Assertion"];
                    if (!configured || assertion.Count != 1 || string.IsNullOrWhiteSpace(assertion[0]) || assertion[0]!.Length > 16384)
                        context.NoResult();
                    else context.Token = assertion[0];
                    return TaskRef.CompletedTask;
                }
            };
        });
        services.AddAuthorization(options => options.AddPolicy(PolicyRef, policy =>
            policy.AddAuthenticationSchemes(SchemeRef).RequireAuthenticatedUser().RequireAssertion(context =>
                configured && emails.Contains(context.User.FindFirst("email")?.Value, StringComparerRef.OrdinalIgnoreCase)
                && context.User.FindFirst("type")?.Value == "app")));
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-Admin-CSRF";
            options.Cookie.Name = "AdminAntiforgery";
            options.Cookie.Path = "/api/admin";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteModeRef.Strict;
            options.Cookie.SecurePolicy = environment.IsDevelopment() ? CookieSecurePolicyRef.SameAsRequest : CookieSecurePolicyRef.Always;
        });
        return services;
    }

    public static RouteGroupBuilderRef MapAdminGroup(this IEndpointRouteBuilderRef app)
    {
        return app.MapGroup("/api/admin").RequireAuthorization(PolicyRef).RequireRateLimiting("AdminPolicy")
            .AddEndpointFilter(async (context, next) =>
            {
                var http = context.HttpContext;
                http.Response.Headers.CacheControl = "no-store";
                if (!HttpMethodsRef.IsGet(http.Request.Method) && !HttpMethodsRef.IsHead(http.Request.Method))
                {
                    var origin = http.Request.Headers.Origin.ToString();
                    var allowed = http.RequestServices.GetRequiredService<IConfigurationRef>()["AdminAccess:Origin"]
                        ?? "https://admin.ahmad-makatreh.vip";
                    if (!string.Equals(origin, allowed, StringComparisonRef.Ordinal))
                        return ResultsRef.Problem(statusCode: 403, title: "Admin origin rejected.");
                    try
                    {
                        await http.RequestServices.GetRequiredService<IAntiforgeryRef>().ValidateRequestAsync(http);
                    }
                    catch (AntiforgeryValidationExceptionRef)
                    {
                        return ResultsRef.Problem(statusCode: 403, title: "Admin verification failed. Reload the dashboard.");
                    }
                }
                try { return await next(context); }
                catch (OperationCanceledExceptionRef) when (http.RequestAborted.IsCancellationRequested) { throw; }
                catch (ExceptionRef exception)
                {
                    http.RequestServices.GetRequiredService<ILoggerFactoryRef>().CreateLogger("AdminApi")
                        .LogError("Admin operation failed with {ErrorType}.", exception.GetType().Name);
                    return ResultsRef.Problem(statusCode: 500, title: "The admin operation could not be completed.");
                }
            });
    }

    private sealed class AccessKeyRetriever(string issuer) : IConfigurationRetrieverOfOpenIdConnectConfigurationRef
    {
        public async TaskOfOpenIdConnectConfigurationRef GetConfigurationAsync(string address, IDocumentRetrieverRef retriever, CancellationTokenRef cancel)
        {
            var document = await retriever.GetDocumentAsync(address, cancel);
            var configuration = new OpenIdConnectConfigurationRef { Issuer = issuer };
            foreach (var key in new JsonWebKeySetRef(document).GetSigningKeys()) configuration.SigningKeys.Add(key);
            return configuration;
        }
    }
}
