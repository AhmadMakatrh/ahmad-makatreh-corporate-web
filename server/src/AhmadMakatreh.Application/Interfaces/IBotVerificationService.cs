// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: IBotVerificationService
using TaskOfValueTupleRef = global::System.Threading.Tasks.Task<(bool IsValid, string? ErrorMessage)>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

/// <summary>
/// Provider-agnostic abstraction for bot challenge verification (e.g. Cloudflare Turnstile, reCAPTCHA, etc.).
/// Prevents the core application layer from coupling to third-party vendor SDKs.
/// </summary>
public interface IBotVerificationService
{
    TaskOfValueTupleRef VerifyTokenAsync(string? token, string? remoteIp, CancellationTokenRef cancellationToken = default);
}
