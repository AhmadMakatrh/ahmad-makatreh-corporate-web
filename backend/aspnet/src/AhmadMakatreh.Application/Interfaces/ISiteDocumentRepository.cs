// codeguard:components:start
// codeguard:defines: ISiteDocumentRepository, SiteVersionSummary, PublishedSiteSnapshot, IPublishedSiteReader
using AhmadMakatreh.Domain.Entities;
using TaskOfIReadOnlyDictionaryRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyDictionary<string, string>>;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Application.Interfaces.SiteVersionSummary>>;
using IReadOnlyDictionaryOfStringAndStringRef = global::System.Collections.Generic.IReadOnlyDictionary<string, string>;
using TaskOfIReadOnlyListRef2 = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.SiteDocument>>;
using TaskOfPublishedSiteSnapshotRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Interfaces.PublishedSiteSnapshot>;
using TaskOfSiteDocumentVersionRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion?>;
using TaskOfSiteDocumentRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.SiteDocument?>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

public interface ISiteDocumentRepository
{
    TaskOfSiteDocumentRef GetAsync(string key, CancellationTokenRef token);
    TaskOfBooleanRef SaveDraftAsync(string key, string json, long expectedRevision, CancellationTokenRef token, string actor = "system", string action = "save");
    TaskOfBooleanRef PublishAsync(string key, long expectedRevision, bool restorePrevious, CancellationTokenRef token, string actor = "system");
    TaskOfIReadOnlyDictionaryRef GetPublishedAsync(CancellationTokenRef token);
    TaskOfIReadOnlyListRef2 GetDocumentsAsync(CancellationTokenRef token);
    TaskOfIReadOnlyListRef HistoryAsync(string key, long beforeRevision, int limit, CancellationTokenRef token);
    TaskOfSiteDocumentVersionRef VersionAsync(string key, long revision, CancellationTokenRef token);
}

public record SiteVersionSummary(long Revision, string Action, string Actor, DateTimeRef CreatedAtUtc);

public record PublishedSiteSnapshot(string Json, string ETag, IReadOnlyDictionaryOfStringAndStringRef Documents);

public interface IPublishedSiteReader
{
    TaskOfPublishedSiteSnapshotRef ReadAsync(CancellationTokenRef token);
    void Invalidate();
}
