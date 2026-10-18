// codeguard:components:start
// codeguard:defines: DevJsonInquiryRepository
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Domain.Enums;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.Inquiry>>;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using IEnumerableOfInquiryRef = global::System.Collections.Generic.IEnumerable<global::AhmadMakatreh.Domain.Entities.Inquiry>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TaskOfInquiryPageRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.InquiryPage>;
using InquirySummaryRef = global::AhmadMakatreh.Application.Models.InquirySummary;
using TaskOfInquiryRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.Inquiry?>;
using InquiryFilterRef = global::AhmadMakatreh.Application.Models.InquiryFilter;
using InquiryPagingRef = global::AhmadMakatreh.Application.Models.InquiryPaging;
using InquiryStatusRef = global::AhmadMakatreh.Domain.Enums.InquiryStatus;
using InquiryPageRef = global::AhmadMakatreh.Application.Models.InquiryPage;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using TaskOfInt32Ref = global::System.Threading.Tasks.Task<int>;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.DevJson;

public partial class DevJsonInquiryRepository
{
    public async TaskOfBooleanRef ClaimNotificationAsync(GuidRef id, DateTimeRef? expectedAttemptedAt, DateTimeRef attemptedAt, CancellationTokenRef token)
    {
        await FileLock.WaitAsync(token);
        try
        {
            var rows = await ReadInquiriesLockedAsync(token);
            var inquiry = rows.FirstOrDefault(row => row.Id == id && row.NotificationAttemptedAtUtc == expectedAttemptedAt
                && row.NotificationStatus == "disabled");
            if (inquiry is null) return false;
            inquiry.NotificationStatus = "unknown"; inquiry.NotificationAttemptedAtUtc = attemptedAt;
            await WriteInquiriesLockedAsync(rows, token); return true;
        }
        finally { FileLock.Release(); }
    }
    public async TaskOfBooleanRef CompleteNotificationAsync(GuidRef id, DateTimeRef attemptedAt, string status, CancellationTokenRef token)
    {
        await FileLock.WaitAsync(token);
        try
        {
            var rows = await ReadInquiriesLockedAsync(token);
            var inquiry = rows.FirstOrDefault(row => row.Id == id && row.NotificationAttemptedAtUtc == attemptedAt && row.NotificationStatus == "unknown");
            if (inquiry is null) return false;
            inquiry.NotificationStatus = status;
            await WriteInquiriesLockedAsync(rows, token); return true;
        }
        finally { FileLock.Release(); }
    }
    public async TaskOfBooleanRef UpdateNotesAsync(GuidRef id, string notes, string actor, DateTimeRef expectedUpdatedAt, DateTimeRef updatedAt, CancellationTokenRef token)
    {
        await FileLock.WaitAsync(token);
        try
        {
            var rows = await ReadInquiriesLockedAsync(token); var inquiry = rows.FirstOrDefault(row => row.Id == id && row.UpdatedAtUtc == expectedUpdatedAt);
            if (inquiry is null) return false;
            inquiry.AdminNotes = notes; inquiry.NotesUpdatedBy = actor; inquiry.UpdatedAtUtc = updatedAt; await WriteInquiriesLockedAsync(rows, token); return true;
        }
        finally { FileLock.Release(); }
    }
    public async TaskOfIReadOnlyListRef ExportAsync(GuidRef[] ids, CancellationTokenRef token)
    {
        await FileLock.WaitAsync(token); try { return (await ReadInquiriesLockedAsync(token)).Where(row => ids.Contains(row.Id)).ToList(); } finally { FileLock.Release(); }
    }
    public async TaskOfInt32Ref ImportMissingAsync(InquiryRef[] rows, CancellationTokenRef token)
    {
        await FileLock.WaitAsync(token);
        try
        {
            var stored = await ReadInquiriesLockedAsync(token); var ids = stored.Select(row => row.Id).ToHashSet(); var references = stored.Select(row => row.ReferenceId).ToHashSet();
            var added = rows.Where(row => !ids.Contains(row.Id) && !references.Contains(row.ReferenceId)).ToList();
            if (added.Count > 0) { stored.AddRange(added); await WriteInquiriesLockedAsync(stored, token); } return added.Count;
        }
        finally { FileLock.Release(); }
    }
    public async TaskOfInquiryPageRef ListAsync(InquiryFilterRef filter, CancellationTokenRef cancellationToken)
    {
        await FileLock.WaitAsync(cancellationToken);
        try
        {
            IEnumerableOfInquiryRef query = await ReadInquiriesLockedAsync(cancellationToken);
            if (filter.Search is { Length: > 0 } search)
                query = query.Where(i => i.Name.Contains(search) || i.Email.Contains(search) || i.ReferenceId.Contains(search));
            if (filter.Category is { Length: > 0 }) query = query.Where(i => i.InquiryCategory == filter.Category);
            if (filter.Status is { } status) query = query.Where(i => i.Status == status);
            if (filter.NotificationStatus is { Length: > 0 }) query = query.Where(i => i.NotificationStatus == filter.NotificationStatus);
            if (filter.From is { } from) query = query.Where(i => i.CreatedAtUtc >= from);
            if (filter.To is { } to) query = query.Where(i => i.CreatedAtUtc < to);
            if (filter.BeforeDate is { } before && filter.BeforeId is { } id)
                query = query.Where(i => i.CreatedAtUtc < before || (i.CreatedAtUtc == before && i.Id.CompareTo(id) < 0));
            var rows = query.OrderByDescending(i => i.CreatedAtUtc).ThenByDescending(i => i.Id).Take(filter.PageSize + 1)
                .Select(i => new InquirySummaryRef(i.Id, i.ReferenceId, i.Name, i.Email, i.InquiryCategory, i.ServiceKey,
                    i.Status.ToString(), i.NotificationStatus, i.CreatedAtUtc, i.UpdatedAtUtc)).ToList();
            var more = rows.Count > filter.PageSize;
            if (more) rows.RemoveAt(rows.Count - 1);
            var last = rows.LastOrDefault();
            return new InquiryPageRef(rows, more && last is not null ? InquiryPagingRef.Cursor(last.CreatedAtUtc, last.Id) : null);
        }
        finally { FileLock.Release(); }
    }

    public async TaskOfInquiryRef GetAsync(GuidRef id, CancellationTokenRef cancellationToken)
    {
        await FileLock.WaitAsync(cancellationToken);
        try { return (await ReadInquiriesLockedAsync(cancellationToken)).FirstOrDefault(i => i.Id == id); }
        finally { FileLock.Release(); }
    }

    public async TaskOfBooleanRef UpdateStatusAsync(GuidRef id, InquiryStatusRef status, DateTimeRef expectedUpdatedAt, DateTimeRef updatedAt, CancellationTokenRef cancellationToken)
    {
        await FileLock.WaitAsync(cancellationToken);
        try
        {
            var list = await ReadInquiriesLockedAsync(cancellationToken);
            var inquiry = list.FirstOrDefault(i => i.Id == id && i.UpdatedAtUtc == expectedUpdatedAt);
            if (inquiry is null) return false;
            inquiry.Status = status; inquiry.UpdatedAtUtc = updatedAt;
            await WriteInquiriesLockedAsync(list, cancellationToken);
            return true;
        }
        finally { FileLock.Release(); }
    }

    public async TaskRef RecordNotificationAsync(GuidRef id, string status, DateTimeRef attemptedAt, CancellationTokenRef cancellationToken = default)
    {
        await FileLock.WaitAsync(cancellationToken);
        try
        {
            var list = await ReadInquiriesLockedAsync(cancellationToken);
            var inquiry = list.FirstOrDefault(i => i.Id == id) ?? throw new InvalidOperationExceptionRef("Persisted inquiry not found.");
            inquiry.NotificationStatus = status; inquiry.NotificationAttemptedAtUtc = attemptedAt;
            await WriteInquiriesLockedAsync(list, cancellationToken);
        }
        finally { FileLock.Release(); }
    }
}
