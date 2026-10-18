// codeguard:components:start
// codeguard:defines: BookingSubmissionDisposition, BookingSubmissionOutcome
using BookingSubmissionDispositionRef = global::AhmadMakatreh.Application.Models.BookingSubmissionDisposition;
using BookingSubmissionOutcomeRef = global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome;
// codeguard:components:end
namespace AhmadMakatreh.Application.Models;

public enum BookingSubmissionDisposition
{
    Stored,
    Duplicate,
    IpBlocked
}

public sealed record BookingSubmissionOutcome(
    BookingSubmissionDispositionRef Disposition,
    int? RetryAfterSeconds = null)
{
    public static BookingSubmissionOutcomeRef Stored { get; } = new(BookingSubmissionDispositionRef.Stored);
    public static BookingSubmissionOutcomeRef Duplicate { get; } = new(BookingSubmissionDispositionRef.Duplicate);
    public static BookingSubmissionOutcomeRef Blocked(int retryAfterSeconds) =>
        new(BookingSubmissionDispositionRef.IpBlocked, retryAfterSeconds);
}
