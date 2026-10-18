// codeguard:components:start
// codeguard:defines: PublishedSiteReaderTests
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using TaskCompletionSourceOfIReadOnlyDictionaryRef = global::System.Threading.Tasks.TaskCompletionSource<global::System.Collections.Generic.IReadOnlyDictionary<string, string>>;
using MockOfISiteDocumentRepositoryRef = global::Moq.Mock<global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository>;
using DictionaryOfStringAndStringRef = global::System.Collections.Generic.Dictionary<string, string>;
using IServiceScopeFactoryRef = global::Microsoft.Extensions.DependencyInjection.IServiceScopeFactory;
using PublishedSiteReaderRef = global::AhmadMakatreh.Infrastructure.Persistence.PublishedSiteReader;
using TaskCreationOptionsRef = global::System.Threading.Tasks.TaskCreationOptions;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using ServiceCollectionRef = global::Microsoft.Extensions.DependencyInjection.ServiceCollection;
using EnumerableRef = global::System.Linq.Enumerable;
using TimesRef = global::Moq.Times;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
using ItRef = global::Moq.It;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Infrastructure;

public class PublishedSiteReaderTests
{
    [FactAttributeRef]
    public async TaskRef ConcurrentReadersShareOneQueryUntilExplicitInvalidation()
    {
        var repository = new MockOfISiteDocumentRepositoryRef();
        repository.Setup(r => r.GetPublishedAsync(ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(new DictionaryOfStringAndStringRef { ["content"] = "{}" });
        using var services = new ServiceCollectionRef().AddSingleton(repository.Object).BuildServiceProvider();
        var reader = new PublishedSiteReaderRef(services.GetRequiredService<IServiceScopeFactoryRef>());
        var snapshots = await TaskRef.WhenAll(EnumerableRef.Range(0, 100).Select(_ => reader.ReadAsync(default)));
        snapshots.Select(s => s.ETag).Distinct().Should().HaveCount(1);
        repository.Verify(r => r.GetPublishedAsync(ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
        reader.Invalidate(); await reader.ReadAsync(default);
        repository.Verify(r => r.GetPublishedAsync(ItRef.IsAny<CancellationTokenRef>()), TimesRef.Exactly(2));
    }

    [FactAttributeRef]
    public async TaskRef PublicationDuringAReadPreventsOldSnapshotFromEnteringCache()
    {
        var pending = new TaskCompletionSourceOfIReadOnlyDictionaryRef(TaskCreationOptionsRef.RunContinuationsAsynchronously);
        var repository = new MockOfISiteDocumentRepositoryRef();
        repository.SetupSequence(r => r.GetPublishedAsync(ItRef.IsAny<CancellationTokenRef>()))
            .Returns(pending.Task).ReturnsAsync(new DictionaryOfStringAndStringRef { ["content"] = "{\"version\":2}" });
        using var services = new ServiceCollectionRef().AddSingleton(repository.Object).BuildServiceProvider();
        var reader = new PublishedSiteReaderRef(services.GetRequiredService<IServiceScopeFactoryRef>());
        var oldRead = reader.ReadAsync(default);
        reader.Invalidate();
        pending.SetResult(new DictionaryOfStringAndStringRef { ["content"] = "{\"version\":1}" });
        await oldRead;
        (await reader.ReadAsync(default)).Json.Should().Contain("\"version\":2");
        repository.Verify(r => r.GetPublishedAsync(ItRef.IsAny<CancellationTokenRef>()), TimesRef.Exactly(2));
    }
}
