// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: IInquiryRepository
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Application.Models;
using TaskOfBookingSubmissionOutcomeRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TaskOfInquiryRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.Inquiry?>;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using TaskRef = global::System.Threading.Tasks.Task;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

/// <summary>
/// Use-case driven repository contract for inquiry persistence.
/// Does not leak EF Core, IQueryable, or database-specific types.
/// </summary>
public interface IInquiryRepository
{
    TaskRef AddAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken = default);
    TaskOfBookingSubmissionOutcomeRef AddUnlessDuplicateAsync(InquiryRef inquiry, string clientIp, CancellationTokenRef cancellationToken = default);
    TaskOfInquiryRef GetByReferenceIdAsync(string referenceId, CancellationTokenRef cancellationToken = default);
    TaskRef RecordNotificationAsync(GuidRef id, string status, DateTimeRef attemptedAt, CancellationTokenRef cancellationToken = default);
}
