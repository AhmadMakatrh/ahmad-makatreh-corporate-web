// codeguard:components:start
// codeguard:defines: PublishedSiteReader
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AhmadMakatreh.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using TaskOfPublishedSiteSnapshotRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Interfaces.PublishedSiteSnapshot>;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using PublishedSiteSnapshotRef = global::AhmadMakatreh.Application.Interfaces.PublishedSiteSnapshot;
using IServiceScopeFactoryRef = global::Microsoft.Extensions.DependencyInjection.IServiceScopeFactory;
using IPublishedSiteReaderRef = global::AhmadMakatreh.Application.Interfaces.IPublishedSiteReader;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using SemaphoreSlimRef = global::System.Threading.SemaphoreSlim;
using JsonElementRef = global::System.Text.Json.JsonElement;
using EncodingRef = global::System.Text.Encoding;
using ConvertRef = global::System.Convert;
using SHA256Ref = global::System.Security.Cryptography.SHA256;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence;

public class PublishedSiteReader(IServiceScopeFactoryRef scopes) : IPublishedSiteReaderRef
{
    private readonly SemaphoreSlimRef _gate = new(1, 1);
    private readonly object _cacheLock = new();
    private PublishedSiteSnapshotRef? _snapshot;
    private DateTimeRef _expires;
    private long _generation;

    public void Invalidate()
    {
        lock (_cacheLock) { _generation++; _snapshot = null; }
    }

    public async TaskOfPublishedSiteSnapshotRef ReadAsync(CancellationTokenRef token)
    {
        await _gate.WaitAsync(token);
        try
        {
            long generation;
            lock (_cacheLock)
            {
                if (_snapshot is not null && _expires > DateTimeRef.UtcNow) return _snapshot;
                generation = _generation;
            }
            using var scope = scopes.CreateScope();
            var documents = await scope.ServiceProvider.GetRequiredService<ISiteDocumentRepositoryRef>().GetPublishedAsync(token);
            var json = JsonSerializerRef.Serialize(documents.ToDictionary(p => p.Key, p => JsonSerializerRef.Deserialize<JsonElementRef>(p.Value)));
            var snapshot = new PublishedSiteSnapshotRef(json, '"' + ConvertRef.ToHexString(SHA256Ref.HashData(EncodingRef.UTF8.GetBytes(json))) + '"', documents);
            lock (_cacheLock)
            {
                if (generation == _generation)
                {
                    _expires = DateTimeRef.UtcNow.AddSeconds(30);
                    _snapshot = snapshot;
                }
            }
            return snapshot;
        }
        finally { _gate.Release(); }
    }
}
