// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: NotificationDispatchStatus, BookingResult
using NotificationDispatchStatusRef = global::AhmadMakatreh.Application.Models.NotificationDispatchStatus;
using IReadOnlyListOfStringRef = global::System.Collections.Generic.IReadOnlyList<string>;
using IEnumerableOfStringRef = global::System.Collections.Generic.IEnumerable<string>;
using BookingResultRef = global::AhmadMakatreh.Application.Models.BookingResult;
using ListOfStringRef = global::System.Collections.Generic.List<string>;
// codeguard:components:end

namespace AhmadMakatreh.Application.Models;

public enum NotificationDispatchStatus
{
    Accepted,
    Failed,
    Disabled,
    TimedOut,
    Unknown
}

/// <summary>
/// Domain-neutral application outcome for booking submissions.
/// </summary>
public record BookingResult
{
    public const string DuplicateSubmissionCode = "duplicate_submission";
    public const string IpBlockedCode = "ip_blocked";
    public const string RateLimitedCode = "rate_limited";

    public bool Success { get; init; }
    public string? ReferenceId { get; init; }
    public string Message { get; init; } = string.Empty;
    public IReadOnlyListOfStringRef? Errors { get; init; }
    public NotificationDispatchStatusRef? NotificationStatus { get; init; }
    public string? FailureCode { get; init; }
    public int? RetryAfterSeconds { get; init; }

    public static BookingResultRef Succeeded(string referenceId, string message, NotificationDispatchStatusRef notificationStatus) =>
        new() { Success = true, ReferenceId = referenceId, Message = message, NotificationStatus = notificationStatus };

    public static BookingResultRef Failed(
        string message,
        IEnumerableOfStringRef? errors = null,
        string? failureCode = null,
        int? retryAfterSeconds = null) =>
        new()
        {
            Success = false,
            Message = message,
            Errors = errors?.ToList() ?? new ListOfStringRef { message },
            FailureCode = failureCode,
            RetryAfterSeconds = retryAfterSeconds
        };
}
