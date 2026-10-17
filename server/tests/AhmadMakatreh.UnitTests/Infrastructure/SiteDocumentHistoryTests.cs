// codeguard:components:start
// codeguard:defines: SiteDocumentHistoryTests
using AhmadMakatreh.Infrastructure.Persistence.DevJson;
using FluentAssertions;
using Xunit;
using DevJsonSiteDocumentRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonSiteDocumentRepository;
using EnumerableRef = global::System.Linq.Enumerable;
using DirectoryRef = global::System.IO.Directory;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
using PathRef = global::System.IO.Path;
using GuidRef = global::System.Guid;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Infrastructure;

public class SiteDocumentHistoryTests
{
    [FactAttributeRef]
    public async TaskRef ConcurrentSavesHistoryPaginationAndRestorePreservePublication()
    {
        var folder = PathRef.Combine(PathRef.GetTempPath(), "site-history-" + GuidRef.NewGuid());
        try
        {
            var repository = new DevJsonSiteDocumentRepositoryRef(PathRef.Combine(folder, "documents.json"));
            var saves = await TaskRef.WhenAll(EnumerableRef.Range(0, 5).Select(i => repository.SaveDraftAsync("content", "{\"en\":{\"title\":\"" + i + "\"}}", 0, default, "owner@example.test")));
            saves.Count(result => result).Should().Be(1);
            (await repository.PublishAsync("content", 1, false, default, "owner@example.test")).Should().BeTrue();
            var original = await repository.GetAsync("content", default);
            (await repository.SaveDraftAsync("content", "{\"en\":{\"title\":\"changed\"}}", 2, default)).Should().BeTrue();
            (await repository.HistoryAsync("content", long.MaxValue, 2, default)).Select(v => v.Revision).Should().Equal(3, 2);
            (await repository.HistoryAsync("content", 2, 2, default)).Select(v => v.Revision).Should().Equal(1);
            var version = await repository.VersionAsync("content", 1, default);
            version!.Actor.Should().Be("owner@example.test");
            (await repository.SaveDraftAsync("content", version.DataJson, 3, default)).Should().BeTrue();
            var restored = await new DevJsonSiteDocumentRepositoryRef(PathRef.Combine(folder, "documents.json")).GetAsync("content", default);
            restored!.PublishedJson.Should().Be(original!.PublishedJson);
            restored.History.Should().HaveCount(4);
            (await repository.SaveDraftAsync("content", "{}", 3, default)).Should().BeFalse();
        }
        finally { if (DirectoryRef.Exists(folder)) DirectoryRef.Delete(folder, true); }
    }
}
