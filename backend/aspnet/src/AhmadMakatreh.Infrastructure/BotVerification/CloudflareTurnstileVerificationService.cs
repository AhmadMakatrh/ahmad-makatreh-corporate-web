// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CloudflareTurnstileVerificationService
using System.Net.Http.Json;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Infrastructure.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ILoggerOfCloudflareTurnstileVerificationServiceRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Infrastructure.BotVerification.CloudflareTurnstileVerificationService>;
using JsonPropertyNameAttributeRef = global::System.Text.Json.Serialization.JsonPropertyNameAttribute;
using TaskOfValueTupleRef = global::System.Threading.Tasks.Task<(bool IsValid, string? ErrorMessage)>;
using IOptionsOfTurnstileOptionsRef = global::Microsoft.Extensions.Options.IOptions<global::AhmadMakatreh.Infrastructure.Options.TurnstileOptions>;
using DictionaryOfStringAndStringRef = global::System.Collections.Generic.Dictionary<string, string>;
using IBotVerificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IBotVerificationService;
using FormUrlEncodedContentRef = global::System.Net.Http.FormUrlEncodedContent;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TurnstileOptionsRef = global::AhmadMakatreh.Infrastructure.Options.TurnstileOptions;
using IHostEnvironmentRef = global::Microsoft.Extensions.Hosting.IHostEnvironment;
using HttpClientRef = global::System.Net.Http.HttpClient;
using ExceptionRef = global::System.Exception;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.BotVerification;

/// <summary>
/// Cloudflare Turnstile anti-bot verification adapter implementing IBotVerificationService.
/// Enforces a strict fail-closed security boundary outside Development environments.
/// </summary>
public class CloudflareTurnstileVerificationService : IBotVerificationServiceRef
{
    private readonly HttpClientRef _httpClient;
    private readonly TurnstileOptionsRef _options;
    private readonly IHostEnvironmentRef _env;
    private readonly ILoggerOfCloudflareTurnstileVerificationServiceRef _logger;

    public CloudflareTurnstileVerificationService(
        HttpClientRef httpClient,
        IOptionsOfTurnstileOptionsRef options,
        IHostEnvironmentRef env,
        ILoggerOfCloudflareTurnstileVerificationServiceRef logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _env = env;
        _logger = logger;
    }

    public async TaskOfValueTupleRef VerifyTokenAsync(string? token, string? remoteIp, CancellationTokenRef cancellationToken = default)
    {
        // 1. Strict Fail-Closed Check:
        // Bot challenge verification is mandatory in all non-Development environments (Production, Staging, etc.).
        if (!_env.IsDevelopment())
        {
            if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.SecretKey))
            {
                _logger.LogCritical("Security Configuration Error: Turnstile bot protection is required in '{Environment}' environment but is disabled or missing SecretKey.", _env.EnvironmentName);
                return (false, "Security verification service is required in this environment.");
            }
        }
        else
        {
            // In local Development environment, bypass is permitted ONLY if explicitly enabled via AllowDevelopmentBypass
            if (!_options.Enabled)
            {
                if (_options.AllowDevelopmentBypass)
                {
                    _logger.LogDebug("[Turnstile] Local development bypass active (IsDevelopment=true && AllowDevelopmentBypass=true).");
                    return (true, null);
                }

                _logger.LogWarning("[Turnstile] Turnstile is disabled in Development but AllowDevelopmentBypass is false. Rejecting.");
                return (false, "Security verification service is disabled. Enable Turnstile or set Turnstile:AllowDevelopmentBypass=true for local testing.");
            }
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return (false, "Verification token is required.");
        }

        if (string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            _logger.LogWarning("Turnstile is enabled but SecretKey is not configured.");
            return (false, "Turnstile service is misconfigured.");
        }

        try
        {
            var content = new FormUrlEncodedContentRef(new DictionaryOfStringAndStringRef
            {
                { "secret", _options.SecretKey },
                { "response", token },
                { "remoteip", remoteIp ?? string.Empty }
            });

            var response = await _httpClient.PostAsync(_options.VerifyEndpoint, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Turnstile API returned non-success status: {StatusCode}", response.StatusCode);
                return (false, "Captcha verification service error.");
            }

            var result = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse>(cancellationToken: cancellationToken);
            if (result is not null && result.Success)
            {
                return (true, null);
            }

            var errors = result?.ErrorCodes != null ? string.Join(", ", result.ErrorCodes) : "Verification failed";
            _logger.LogWarning("Turnstile verification rejected: {Errors}", errors);
            return (false, "Bot verification challenge failed. Please try again.");
        }
        catch (ExceptionRef ex)
        {
            _logger.LogError(ex, "Exception during Cloudflare Turnstile token validation");
            return (false, "Unable to verify security challenge at this time.");
        }
    }

    private sealed record TurnstileVerifyResponse
    {
        [JsonPropertyNameAttributeRef("success")]
        public bool Success { get; init; }

        [JsonPropertyNameAttributeRef("error-codes")]
        public string[]? ErrorCodes { get; init; }
    }
}
