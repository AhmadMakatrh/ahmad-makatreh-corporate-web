// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: TurnstileOptions
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Options;

/// <summary>
/// Cloudflare Turnstile anti-bot verification options.
/// </summary>
public class TurnstileOptions
{
    public const string SectionName = "Turnstile";

    public bool Enabled { get; set; } = false;
    public string SecretKey { get; set; } = string.Empty;
    public bool AllowDevelopmentBypass { get; set; } = false;
    public string VerifyEndpoint { get; set; } = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
}
