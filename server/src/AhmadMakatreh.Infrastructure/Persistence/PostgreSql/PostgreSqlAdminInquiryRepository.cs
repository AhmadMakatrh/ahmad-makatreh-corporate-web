// codeguard:components:start
// codeguard:defines: PostgreSqlInquiryRepository
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.Inquiry>>;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using PostgresExceptionRef = global::Npgsql.PostgresException;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using DbUpdateExceptionRef = global::Microsoft.EntityFrameworkCore.DbUpdateException;
using TaskOfInquiryPageRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.InquiryPage>;
using InquirySummaryRef = global::AhmadMakatreh.Application.Models.InquirySummary;
using TaskOfInquiryRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.Inquiry?>;
using InquiryFilterRef = global::AhmadMakatreh.Application.Models.InquiryFilter;
using InquiryPagingRef = global::AhmadMakatreh.Application.Models.InquiryPaging;
using InquiryStatusRef = global::AhmadMakatreh.Domain.Enums.InquiryStatus;
using EntityStateRef = global::Microsoft.EntityFrameworkCore.EntityState;
using InquiryPageRef = global::AhmadMakatreh.Application.Models.InquiryPage;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using TaskOfInt32Ref = global::System.Threading.Tasks.Task<int>;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

public partial class PostgreSqlInquiryRepository
{
    public async TaskOfBooleanRef ClaimNotificationAsync(GuidRef id, DateTimeRef? expectedAttemptedAt, DateTimeRef attemptedAt, CancellationTokenRef token) =>
        await _context.Inquiries.Where(row => row.Id == id && row.NotificationAttemptedAtUtc == expectedAttemptedAt
            && row.NotificationStatus == "disabled")
            .ExecuteUpdateAsync(set => set.SetProperty(row => row.NotificationStatus, "unknown")
                .SetProperty(row => row.NotificationAttemptedAtUtc, attemptedAt), token) == 1;
    public async TaskOfBooleanRef CompleteNotificationAsync(GuidRef id, DateTimeRef attemptedAt, string status, CancellationTokenRef token) =>
        await _context.Inquiries.Where(row => row.Id == id && row.NotificationAttemptedAtUtc == attemptedAt && row.NotificationStatus == "unknown")
            .ExecuteUpdateAsync(set => set.SetProperty(row => row.NotificationStatus, status), token) == 1;
    public async TaskOfBooleanRef UpdateNotesAsync(GuidRef id, string notes, string actor, DateTimeRef expectedUpdatedAt, DateTimeRef updatedAt, CancellationTokenRef token) =>
        await _context.Inquiries.Where(row => row.Id == id && row.UpdatedAtUtc == expectedUpdatedAt).ExecuteUpdateAsync(set => set
            .SetProperty(row => row.AdminNotes, notes).SetProperty(row => row.NotesUpdatedBy, actor).SetProperty(row => row.UpdatedAtUtc, updatedAt), token) == 1;
    public async TaskOfIReadOnlyListRef ExportAsync(GuidRef[] ids, CancellationTokenRef token) => await _context.Inquiries.AsNoTracking().Where(row => ids.Contains(row.Id)).Take(100).ToListAsync(token);
    public async TaskOfInt32Ref ImportMissingAsync(InquiryRef[] rows, CancellationTokenRef token) => await _context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(token);
        var ids = rows.Select(row => row.Id).ToArray(); var references = rows.Select(row => row.ReferenceId).ToArray();
        var existing = await _context.Inquiries.AsNoTracking().Where(row => ids.Contains(row.Id) || references.Contains(row.ReferenceId)).Select(row => new { row.Id, row.ReferenceId }).ToListAsync(token);
        var added = rows.Where(row => !existing.Any(saved => saved.Id == row.Id || saved.ReferenceId == row.ReferenceId)).ToList();
        _context.Inquiries.AddRange(added);
        try { await _context.SaveChangesAsync(token); await transaction.CommitAsync(token); return added.Count; }
        catch (DbUpdateExceptionRef exception) when (exception.InnerException is PostgresExceptionRef { SqlState: "23505" })
        {
            await transaction.RollbackAsync(token); return -1;
        }
        // A transient failure may retry the transaction; do not carry pending entities into the next attempt.
        finally { foreach (var row in added) _context.Entry(row).State = EntityStateRef.Detached; }
    });
    public async TaskOfInquiryPageRef ListAsync(InquiryFilterRef filter, CancellationTokenRef cancellationToken)
    {
        var query = _context.Inquiries.AsNoTracking();
        if (filter.Search is { Length: > 0 } search)
            query = query.Where(i => i.Name.Contains(search) || i.Email.Contains(search) || i.ReferenceId.Contains(search));
        if (filter.Category is { Length: > 0 }) query = query.Where(i => i.InquiryCategory == filter.Category);
        if (filter.Status is { } status) query = query.Where(i => i.Status == status);
        if (filter.NotificationStatus is { Length: > 0 }) query = query.Where(i => i.NotificationStatus == filter.NotificationStatus);
        if (filter.From is { } from) query = query.Where(i => i.CreatedAtUtc >= from);
        if (filter.To is { } to) query = query.Where(i => i.CreatedAtUtc < to);
        if (filter.BeforeDate is { } before && filter.BeforeId is { } id)
            query = query.Where(i => i.CreatedAtUtc < before || (i.CreatedAtUtc == before && i.Id.CompareTo(id) < 0));
        var rows = await query.OrderByDescending(i => i.CreatedAtUtc).ThenByDescending(i => i.Id)
            .Select(i => new InquirySummaryRef(i.Id, i.ReferenceId, i.Name, i.Email, i.InquiryCategory, i.ServiceKey,
                i.Status.ToString(), i.NotificationStatus, i.CreatedAtUtc, i.UpdatedAtUtc))
            .Take(filter.PageSize + 1).ToListAsync(cancellationToken);
        var more = rows.Count > filter.PageSize;
        if (more) rows.RemoveAt(rows.Count - 1);
        var last = rows.LastOrDefault();
        return new InquiryPageRef(rows, more && last is not null ? InquiryPagingRef.Cursor(last.CreatedAtUtc, last.Id) : null);
    }

    public TaskOfInquiryRef GetAsync(GuidRef id, CancellationTokenRef cancellationToken) =>
        _context.Inquiries.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    public async TaskOfBooleanRef UpdateStatusAsync(GuidRef id, InquiryStatusRef status, DateTimeRef expectedUpdatedAt, DateTimeRef updatedAt, CancellationTokenRef cancellationToken) =>
        await _context.Inquiries.Where(i => i.Id == id && i.UpdatedAtUtc == expectedUpdatedAt)
            .ExecuteUpdateAsync(setters => setters.SetProperty(i => i.Status, status)
                .SetProperty(i => i.UpdatedAtUtc, updatedAt), cancellationToken) == 1;

    public async TaskRef RecordNotificationAsync(GuidRef id, string status, DateTimeRef attemptedAt, CancellationTokenRef cancellationToken = default)
    {
        var changed = await _context.Inquiries.Where(i => i.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(i => i.NotificationStatus, status)
                .SetProperty(i => i.NotificationAttemptedAtUtc, attemptedAt), cancellationToken);
        if (changed != 1) throw new InvalidOperationExceptionRef("Persisted inquiry was not found when recording notification.");
    }
}
