// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: Inquiry
using AhmadMakatreh.Domain.Enums;
using ArgumentExceptionRef = global::System.ArgumentException;
using InquiryStatusRef = global::AhmadMakatreh.Domain.Enums.InquiryStatus;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Domain.Entities;

/// <summary>
/// Domain entity representing a customer project booking inquiry.
/// Follows data minimization principles: transient connection metadata (such as RemoteIp) is omitted from durable persistence.
/// </summary>
public class Inquiry
{
    public GuidRef Id { get; init; }
    public string ReferenceId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string ProjectDetails { get; init; } = string.Empty;
    public string? ServiceKey { get; init; }
    public string? InquiryCategory { get; init; }
    public InquiryStatusRef Status { get; set; }
    public DateTimeRef CreatedAtUtc { get; init; }
    public DateTimeRef UpdatedAtUtc { get; set; }
    public string? NotificationStatus { get; set; }
    public DateTimeRef? NotificationAttemptedAtUtc { get; set; }
    public string AdminNotes { get; set; } = string.Empty;
    public string? NotesUpdatedBy { get; set; }

    // Parameterless constructor required by EF Core and JSON deserialization
    public Inquiry() { }

    public Inquiry(
        GuidRef id,
        string referenceId,
        string name,
        string email,
        string projectDetails,
        InquiryStatusRef status = InquiryStatusRef.New,
        DateTimeRef? createdAtUtc = null,
        DateTimeRef? updatedAtUtc = null,
        string? serviceKey = null,
        string? inquiryCategory = null)
    {
        if (string.IsNullOrWhiteSpace(referenceId))
            throw new ArgumentExceptionRef("ReferenceId cannot be empty.", nameof(referenceId));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentExceptionRef("Name cannot be empty.", nameof(name));
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentExceptionRef("Email cannot be empty.", nameof(email));
        if (string.IsNullOrWhiteSpace(projectDetails))
            throw new ArgumentExceptionRef("ProjectDetails cannot be empty.", nameof(projectDetails));

        Id = id == GuidRef.Empty ? GuidRef.NewGuid() : id;
        ReferenceId = referenceId.Trim();
        Name = name.Trim();
        Email = email.Trim();
        ProjectDetails = projectDetails.Trim();
        ServiceKey = serviceKey;
        InquiryCategory = inquiryCategory;
        Status = status;
        CreatedAtUtc = createdAtUtc ?? DateTimeRef.UtcNow;
        UpdatedAtUtc = updatedAtUtc ?? CreatedAtUtc;
    }

    public void UpdateStatus(InquiryStatusRef newStatus)
    {
        Status = newStatus;
        UpdatedAtUtc = DateTimeRef.UtcNow;
    }
}
