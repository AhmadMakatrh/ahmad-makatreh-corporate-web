// codeguard:components:start
// codeguard:defines: DevJsonInquiryReplyRepository
using System.Text.Json;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.InquiryReply>>;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using TaskOfListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.InquiryReply>>;
using IInquiryReplyRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplyRepository;
using TaskOfInquiryReplyRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.InquiryReply?>;
using ListOfInquiryReplyRef = global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.InquiryReply>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using SemaphoreSlimRef = global::System.Threading.SemaphoreSlim;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using AppContextRef = global::System.AppContext;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using DirectoryRef = global::System.IO.Directory;
using PathRef = global::System.IO.Path;
using FileRef = global::System.IO.File;
using TaskRef = global::System.Threading.Tasks.Task;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.DevJson;

public class DevJsonInquiryReplyRepository(string? path = null) : IInquiryReplyRepositoryRef
{
    private readonly SemaphoreSlimRef _gate = new(1, 1);
    private readonly string _path = path ?? PathRef.Combine(AppContextRef.BaseDirectory, "App_Data", "inquiry-replies.json");
    private async TaskOfListRef Read(CancellationTokenRef token) => FileRef.Exists(_path) ? JsonSerializerRef.Deserialize<ListOfInquiryReplyRef>(await FileRef.ReadAllTextAsync(_path, token)) ?? [] : [];
    private async TaskRef Write(ListOfInquiryReplyRef rows, CancellationTokenRef token)
    {
        DirectoryRef.CreateDirectory(PathRef.GetDirectoryName(_path)!); await FileRef.WriteAllTextAsync(_path + ".tmp", JsonSerializerRef.Serialize(rows), token); FileRef.Move(_path + ".tmp", _path, true);
    }
    public async TaskOfBooleanRef AddAsync(InquiryReplyRef reply, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { var rows = await Read(token); if (rows.Any(row => row.Id == reply.Id)) return false; rows.Add(reply); await Write(rows, token); return true; } finally { _gate.Release(); }
    }
    public async TaskOfInquiryReplyRef GetAsync(GuidRef id, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { return (await Read(token)).FirstOrDefault(row => row.Id == id); } finally { _gate.Release(); }
    }
    public async TaskOfIReadOnlyListRef ListAsync(GuidRef inquiryId, DateTimeRef? beforeDate, GuidRef? beforeId, int limit, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { return (await Read(token)).Where(row => row.InquiryId == inquiryId && (beforeDate is null || row.CreatedAtUtc < beforeDate || (row.CreatedAtUtc == beforeDate && row.Id.CompareTo(beforeId) < 0)))
            .OrderByDescending(row => row.CreatedAtUtc).ThenByDescending(row => row.Id).Take(limit).ToList(); } finally { _gate.Release(); }
    }
    public async TaskRef CompleteAsync(GuidRef id, string status, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { var rows = await Read(token); var row = rows.FirstOrDefault(row => row.Id == id && row.Status == "pending") ?? throw new InvalidOperationExceptionRef("Reply state could not be recorded.");
            row.Status = status; row.CompletedAtUtc = DateTimeRef.UtcNow; await Write(rows, token); } finally { _gate.Release(); }
    }
}
