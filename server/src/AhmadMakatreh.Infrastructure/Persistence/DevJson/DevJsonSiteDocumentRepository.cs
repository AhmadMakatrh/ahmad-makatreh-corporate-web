// codeguard:components:start
// codeguard:defines: DevJsonSiteDocumentRepository
using System.Text.Json;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using TaskOfIReadOnlyDictionaryRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyDictionary<string, string>>;
using TaskOfIReadOnlyListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Application.Interfaces.SiteVersionSummary>>;
using TaskOfDictionaryRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.Dictionary<string, global::AhmadMakatreh.Domain.Entities.SiteDocument>>;
using TaskOfIReadOnlyListRef2 = global::System.Threading.Tasks.Task<global::System.Collections.Generic.IReadOnlyList<global::AhmadMakatreh.Domain.Entities.SiteDocument>>;
using DictionaryOfStringAndSiteDocumentRef = global::System.Collections.Generic.Dictionary<string, global::AhmadMakatreh.Domain.Entities.SiteDocument>;
using TaskOfSiteDocumentVersionRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion?>;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using TaskOfSiteDocumentRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.SiteDocument?>;
using SiteDocumentVersionRef = global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion;
using SiteVersionSummaryRef = global::AhmadMakatreh.Application.Interfaces.SiteVersionSummary;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using SemaphoreSlimRef = global::System.Threading.SemaphoreSlim;
using SiteDocumentRef = global::AhmadMakatreh.Domain.Entities.SiteDocument;
using AppContextRef = global::System.AppContext;
using TaskOfBooleanRef = global::System.Threading.Tasks.Task<bool>;
using DirectoryRef = global::System.IO.Directory;
using PathRef = global::System.IO.Path;
using FileRef = global::System.IO.File;
using TaskRef = global::System.Threading.Tasks.Task;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.DevJson;

public class DevJsonSiteDocumentRepository : ISiteDocumentRepositoryRef
{
    private readonly SemaphoreSlimRef _gate = new(1, 1);
    private readonly string _path;
    public DevJsonSiteDocumentRepository(string? path = null) => _path = path ?? PathRef.Combine(AppContextRef.BaseDirectory, "App_Data", "site-documents.json");

    public async TaskOfSiteDocumentRef GetAsync(string key, CancellationTokenRef token)
    {
        await _gate.WaitAsync(token);
        try { return (await Read(token)).GetValueOrDefault(key); }
        finally { _gate.Release(); }
    }

    public async TaskOfBooleanRef SaveDraftAsync(string key, string json, long expectedRevision, CancellationTokenRef token, string actor = "system", string action = "save")
    {
        await _gate.WaitAsync(token);
        try
        {
            var documents = await Read(token);
            var document = documents.GetValueOrDefault(key);
            if ((document?.Revision ?? 0) != expectedRevision) return false;
            document ??= new SiteDocumentRef { Key = key };
            document.DraftJson = json; document.Revision++; document.UpdatedAtUtc = DateTimeRef.UtcNow;
            AddVersion(document, action, actor, json);
            documents[key] = document;
            await Write(documents, token); return true;
        }
        finally { _gate.Release(); }
    }

    public async TaskOfBooleanRef PublishAsync(string key, long expectedRevision, bool restorePrevious, CancellationTokenRef token, string actor = "system")
    {
        await _gate.WaitAsync(token);
        try
        {
            var documents = await Read(token);
            var document = documents.GetValueOrDefault(key);
            if (document is null || document.Revision != expectedRevision || (restorePrevious && document.PreviousPublishedJson is null)) return false;
            if (!restorePrevious && document.DraftJson == document.PublishedJson) return false;
            var oldPublished = document.PublishedJson;
            document.PublishedJson = restorePrevious ? document.PreviousPublishedJson : document.DraftJson;
            document.PreviousPublishedJson = oldPublished; document.Revision++;
            document.UpdatedAtUtc = DateTimeRef.UtcNow;
            document.PublishedAtUtc = document.UpdatedAtUtc;
            AddVersion(document, restorePrevious ? "rollbackPublished" : "publish", actor, document.PublishedJson!);
            await Write(documents, token); return true;
        }
        finally { _gate.Release(); }
    }

    private static void AddVersion(SiteDocumentRef document, string action, string actor, string json) => document.History.Add(new SiteDocumentVersionRef
    { DocumentKey = document.Key, Revision = document.Revision, Action = action, Actor = actor, DataJson = json, CreatedAtUtc = document.UpdatedAtUtc });

    public async TaskOfIReadOnlyListRef2 GetDocumentsAsync(CancellationTokenRef token)
    {
        await _gate.WaitAsync(token);
        try { return (await Read(token)).Values.ToList(); }
        finally { _gate.Release(); }
    }
    public async TaskOfIReadOnlyListRef HistoryAsync(string key, long beforeRevision, int limit, CancellationTokenRef token)
    {
        var document = await GetAsync(key, token);
        return (document?.History ?? []).Where(version => version.Revision < beforeRevision).OrderByDescending(version => version.Revision)
            .Take(limit).Select(version => new SiteVersionSummaryRef(version.Revision, version.Action, version.Actor, version.CreatedAtUtc)).ToList();
    }
    public async TaskOfSiteDocumentVersionRef VersionAsync(string key, long revision, CancellationTokenRef token) =>
        (await GetAsync(key, token))?.History.FirstOrDefault(version => version.Revision == revision);

    public async TaskOfIReadOnlyDictionaryRef GetPublishedAsync(CancellationTokenRef token)
    {
        await _gate.WaitAsync(token);
        try { return (await Read(token)).Values.Where(d => d.PublishedJson is not null).ToDictionary(d => d.Key, d => d.PublishedJson!); }
        finally { _gate.Release(); }
    }

    private async TaskOfDictionaryRef Read(CancellationTokenRef token) => FileRef.Exists(_path)
        ? JsonSerializerRef.Deserialize<DictionaryOfStringAndSiteDocumentRef>(await FileRef.ReadAllTextAsync(_path, token)) ?? [] : [];
    private async TaskRef Write(DictionaryOfStringAndSiteDocumentRef documents, CancellationTokenRef token)
    {
        DirectoryRef.CreateDirectory(PathRef.GetDirectoryName(_path)!);
        var temp = _path + ".tmp";
        await FileRef.WriteAllTextAsync(temp, JsonSerializerRef.Serialize(documents), token);
        FileRef.Move(temp, _path, true);
    }
}
