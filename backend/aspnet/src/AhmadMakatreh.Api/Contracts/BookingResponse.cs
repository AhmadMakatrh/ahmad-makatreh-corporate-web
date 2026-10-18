// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: BookingResponse
using System.Text.Json.Serialization;
using IReadOnlyListOfStringRef = global::System.Collections.Generic.IReadOnlyList<string>;
using JsonIgnoreConditionRef = global::System.Text.Json.Serialization.JsonIgnoreCondition;
using JsonIgnoreAttributeRef = global::System.Text.Json.Serialization.JsonIgnoreAttribute;
// codeguard:components:end

namespace AhmadMakatreh.Api.Contracts;

/// <summary>
/// Public HTTP response contract for booking submissions.
/// </summary>
public record BookingResponse
{
    public bool Success { get; init; }
    public string? ReferenceId { get; init; }
    public string Message { get; init; } = string.Empty;
    public IReadOnlyListOfStringRef? Errors { get; init; }
    [JsonIgnoreAttributeRef(Condition = JsonIgnoreConditionRef.WhenWritingNull)]
    public string? Code { get; init; }
    [JsonIgnoreAttributeRef(Condition = JsonIgnoreConditionRef.WhenWritingNull)]
    public int? RetryAfterSeconds { get; init; }
    [JsonIgnoreAttributeRef(Condition = JsonIgnoreConditionRef.WhenWritingNull)]
    public string? NotificationStatus { get; init; }
}
