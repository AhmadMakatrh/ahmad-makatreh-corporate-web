// codeguard:components:start
// codeguard:defines: DevJsonMediaRepository
using System.Text.Json;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.MediaAsset>>;
using TaskOfListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.MediaAsset>>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TaskOfMediaAssetRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.MediaAsset?>;
using IMediaRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IMediaRepository;
using ListOfMediaAssetRef = global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.MediaAsset>;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using SemaphoreSlimRef = global::System.Threading.SemaphoreSlim;
using AppContextRef = global::System.AppContext;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using MediaAssetRef = global::AhmadMakatreh.Domain.Entities.MediaAsset;
using DirectoryRef = global::System.IO.Directory;
using PathRef = global::System.IO.Path;
using FileRef = global::System.IO.File;
using TaskRef = global::System.Threading.Tasks.Task;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.DevJson;

public class DevJsonMediaRepository(string? path = null) : IMediaRepositoryRef
{
    private readonly SemaphoreSlimRef _gate = new(1, 1);
    private readonly string _path = path ?? PathRef.Combine(AppContextRef.BaseDirectory, "App_Data", "media-assets.json");
    private async TaskOfListRef Read(CancellationTokenRef token) => FileRef.Exists(_path) ? JsonSerializerRef.Deserialize<ListOfMediaAssetRef>(await FileRef.ReadAllTextAsync(_path, token)) ?? [] : [];
    private async TaskRef Write(ListOfMediaAssetRef rows, CancellationTokenRef token)
    {
        DirectoryRef.CreateDirectory(PathRef.GetDirectoryName(_path)!); await FileRef.WriteAllTextAsync(_path + ".tmp", JsonSerializerRef.Serialize(rows), token); FileRef.Move(_path + ".tmp", _path, true);
    }
    public async TaskOfMediaAssetRef GetAsync(GuidRef id, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { return (await Read(token)).FirstOrDefault(row => row.Id == id); } finally { _gate.Release(); }
    }
    public async TaskOfIReadOnlyListRef ListAsync(DateTimeRef? beforeDate, GuidRef? beforeId, int limit, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { return (await Read(token)).Where(row => !row.Archived && (beforeDate is null || row.CreatedAtUtc < beforeDate || (row.CreatedAtUtc == beforeDate && row.Id.CompareTo(beforeId) < 0)))
            .OrderByDescending(row => row.CreatedAtUtc).ThenByDescending(row => row.Id).Take(limit).ToList(); } finally { _gate.Release(); }
    }
    public async TaskOfBooleanRef AddAsync(MediaAssetRef asset, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { var rows = await Read(token); if (rows.Any(row => row.Id == asset.Id)) return false; rows.Add(asset); await Write(rows, token); return true; } finally { _gate.Release(); }
    }
    public async TaskOfBooleanRef ArchiveAsync(GuidRef id, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token); try { var rows = await Read(token); var row = rows.FirstOrDefault(row => row.Id == id && !row.Archived); if (row is null) return false; row.Archived = true; await Write(rows, token); return true; } finally { _gate.Release(); }
    }
}
