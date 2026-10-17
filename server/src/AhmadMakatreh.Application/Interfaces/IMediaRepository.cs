// codeguard:components:start
// codeguard:defines: IMediaRepository, IMediaStorage
using AhmadMakatreh.Domain.Entities;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.MediaAsset>>;
using TaskOfMediaAssetRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.MediaAsset?>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using MediaAssetRef = global::AhmadMakatreh.Domain.Entities.MediaAsset;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

public interface IMediaRepository
{
    TaskOfMediaAssetRef GetAsync(GuidRef id, CancellationTokenRef token);
    TaskOfIReadOnlyListRef ListAsync(DateTimeRef? beforeDate, GuidRef? beforeId, int limit, CancellationTokenRef token);
    TaskOfBooleanRef AddAsync(MediaAssetRef asset, CancellationTokenRef token);
    TaskOfBooleanRef ArchiveAsync(GuidRef id, CancellationTokenRef token);
}

public interface IMediaStorage
{
    bool IsConfigured { get; }
    string PublicUrl(string key);
    TaskRef PutAsync(string key, byte[] data, string contentType, CancellationTokenRef token);
    TaskRef DeleteAsync(string key, CancellationTokenRef token);
}
