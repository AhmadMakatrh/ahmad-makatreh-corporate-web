// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: InquiryStatus
// codeguard:components:end

namespace AhmadMakatreh.Domain.Enums;

/// <summary>
/// Lifecycle status of a project booking inquiry.
/// </summary>
public enum InquiryStatus
{
    New = 0,
    Contacted = 1,
    InProgress = 2,
    Closed = 3,
    Archived = 4
}
