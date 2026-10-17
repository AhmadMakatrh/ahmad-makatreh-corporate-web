// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: SubmitBookingCommand
// codeguard:components:end

namespace AhmadMakatreh.Application.Models;

/// <summary>
/// Application command carrying data required to process a project booking request.
/// Free of HTTP/ASP.NET Core dependencies.
/// </summary>
public record SubmitBookingCommand(
    string Name,
    string Email,
    string ProjectDetails,
    string? TurnstileToken,
    string? RemoteIp,
    string? ServiceKey = null,
    string? InquiryCategory = null
);
