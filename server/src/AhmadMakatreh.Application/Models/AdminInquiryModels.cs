// codeguard:components:start
// codeguard:defines: InquiryFilter, InquirySummary, InquiryPage, InquiryPaging
using System.Globalization;
using AhmadMakatreh.Domain.Enums;
using IReadOnlyListOfInquirySummaryRef = global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Application.Models.InquirySummary>;
using InquiryStatusRef = global::AhmadMakatreh.Domain.Enums.InquiryStatus;
using DateTimeKindRef = global::System.DateTimeKind;
using CultureInfoRef = global::System.Globalization.CultureInfo;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Models;

public record InquiryFilter(string? Search, string? Category, InquiryStatusRef? Status, string? NotificationStatus,
    DateTimeRef? From, DateTimeRef? To, int PageSize = 25, DateTimeRef? BeforeDate = null, GuidRef? BeforeId = null);

public record InquirySummary(GuidRef Id, string ReferenceId, string Name, string Email, string? InquiryCategory,
    string? ServiceKey, string Status, string? NotificationStatus, DateTimeRef CreatedAtUtc, DateTimeRef UpdatedAtUtc);

public record InquiryPage(IReadOnlyListOfInquirySummaryRef Items, string? NextCursor);

public static class InquiryPaging
{
    public static string Cursor(DateTimeRef date, GuidRef id) => $"{date.Ticks.ToString(CultureInfoRef.InvariantCulture)}.{id:N}";
    public static bool TryParse(string? cursor, out DateTimeRef? date, out GuidRef? id)
    {
        date = null; id = null;
        if (string.IsNullOrEmpty(cursor)) return true;
        var parts = cursor.Split('.');
        if (parts.Length != 2 || !long.TryParse(parts[0], out var ticks) || ticks < DateTimeRef.MinValue.Ticks
            || ticks > DateTimeRef.MaxValue.Ticks || !GuidRef.TryParseExact(parts[1], "N", out var parsed)) return false;
        date = new DateTimeRef(ticks, DateTimeKindRef.Utc); id = parsed; return true;
    }
}
