// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: BookingRequest
// codeguard:components:end

namespace AhmadMakatreh.Api.Contracts;

/// <summary>
/// Public HTTP request contract for submitting a booking inquiry.
/// </summary>
public record BookingRequest(
    string Name,
    string Email,
    string ProjectDetails,
    string? TurnstileToken = null,
    string? ServiceKey = null,
    string? InquiryCategory = null
);
