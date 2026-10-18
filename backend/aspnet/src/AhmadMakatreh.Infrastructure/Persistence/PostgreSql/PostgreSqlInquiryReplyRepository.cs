// codeguard:components:start
// codeguard:defines: PostgreSqlInquiryReplyRepository
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.InquiryReply>>;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using IInquiryReplyRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplyRepository;
using TaskOfInquiryReplyRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.InquiryReply?>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

public class PostgreSqlInquiryReplyRepository(AppDbContextRef context) : IInquiryReplyRepositoryRef
{
    public async TaskOfBooleanRef AddAsync(InquiryReplyRef reply, CancellationTokenRef token) => await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO inquiry_replies ("Id", "InquiryId", "Subject", "Body", "Actor", "Status", "CreatedAtUtc")
        VALUES ({reply.Id}, {reply.InquiryId}, {reply.Subject}, {reply.Body}, {reply.Actor}, 'pending', {reply.CreatedAtUtc}) ON CONFLICT ("Id") DO NOTHING
        """, token) == 1;
    public TaskOfInquiryReplyRef GetAsync(GuidRef id, CancellationTokenRef token) => context.InquiryReplies.AsNoTracking().FirstOrDefaultAsync(row => row.Id == id, token);
    public async TaskOfIReadOnlyListRef ListAsync(GuidRef inquiryId, DateTimeRef? beforeDate, GuidRef? beforeId, int limit, CancellationTokenRef token) =>
        await context.InquiryReplies.AsNoTracking().Where(row => row.InquiryId == inquiryId && (beforeDate == null || row.CreatedAtUtc < beforeDate || (row.CreatedAtUtc == beforeDate && row.Id.CompareTo(beforeId!.Value) < 0)))
            .OrderByDescending(row => row.CreatedAtUtc).ThenByDescending(row => row.Id).Take(limit).ToListAsync(token);
    public async TaskRef CompleteAsync(GuidRef id, string status, CancellationTokenRef token)
    {
        var changed = await context.InquiryReplies.Where(row => row.Id == id && row.Status == "pending").ExecuteUpdateAsync(set => set.SetProperty(row => row.Status, status).SetProperty(row => row.CompletedAtUtc, DateTimeRef.UtcNow), token);
        if (changed != 1) throw new InvalidOperationExceptionRef("Reply state could not be recorded.");
    }
}
