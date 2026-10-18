// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: PersistenceSafetyTests
using System.Security.Cryptography;
using AhmadMakatreh.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Moq;
using Xunit;
using DictionaryOfStringAndStringRef = global::System.Collections.Generic.Dictionary<string, string?>;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using MockOfIHostEnvironmentRef = global::Moq.Mock<global::Microsoft.Extensions.Hosting.IHostEnvironment>;
using RandomNumberGeneratorRef = global::System.Security.Cryptography.RandomNumberGenerator;
using ConfigurationBuilderRef = global::Microsoft.Extensions.Configuration.ConfigurationBuilder;
using ServiceCollectionRef = global::Microsoft.Extensions.DependencyInjection.ServiceCollection;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using ConvertRef = global::System.Convert;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using FactAttributeRef = global::Xunit.FactAttribute;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Infrastructure;

public class PersistenceSafetyTests
{
    [FactAttributeRef]
    public void AddInfrastructure_InProduction_WhenJsonProviderRequested_ThrowsSecurityException()
    {
        // Arrange: Production environment requesting "Json" provider
        var envMock = new MockOfIHostEnvironmentRef();
        envMock.Setup(e => e.EnvironmentName).Returns("Production");

        var config = new ConfigurationBuilderRef()
            .AddInMemoryCollection(new DictionaryOfStringAndStringRef
            {
                ["Persistence:Provider"] = "Json"
            })
            .Build();

        var services = new ServiceCollectionRef();

        // Act & Assert: Must fail immediately and never activate JSON
        var act = () => services.AddInfrastructure(config, envMock.Object);

        act.Should().Throw<InvalidOperationExceptionRef>()
            .WithMessage("*strictly forbidden in 'Production' environment*");
    }

    [FactAttributeRef]
    public void AddInfrastructure_InStaging_WhenJsonProviderRequested_ThrowsSecurityException()
    {
        // Arrange: Staging environment requesting "Json" provider
        var envMock = new MockOfIHostEnvironmentRef();
        envMock.Setup(e => e.EnvironmentName).Returns("Staging");

        var config = new ConfigurationBuilderRef()
            .AddInMemoryCollection(new DictionaryOfStringAndStringRef
            {
                ["Persistence:Provider"] = "Json"
            })
            .Build();

        var services = new ServiceCollectionRef();

        // Act & Assert: Must fail immediately in Staging
        var act = () => services.AddInfrastructure(config, envMock.Object);

        act.Should().Throw<InvalidOperationExceptionRef>()
            .WithMessage("*strictly forbidden in 'Staging' environment*");
    }

    [FactAttributeRef]
    public void AddInfrastructure_InProduction_WhenPostgresConnectionStringMissing_ThrowsConfigurationException()
    {
        // Arrange: Production environment with Postgres provider but missing connection string
        var envMock = new MockOfIHostEnvironmentRef();
        envMock.Setup(e => e.EnvironmentName).Returns("Production");

        var config = new ConfigurationBuilderRef()
            .AddInMemoryCollection(new DictionaryOfStringAndStringRef
            {
                ["Persistence:Provider"] = "Postgres",
                ["BookingAbuse:HmacKey"] = ConvertRef.ToBase64String(RandomNumberGeneratorRef.GetBytes(32)),
                ["ConnectionStrings:DefaultConnection"] = ""
            })
            .Build();

        var services = new ServiceCollectionRef();

        // Act & Assert: Must fail clearly rather than falling back to JSON
        var act = () => services.AddInfrastructure(config, envMock.Object);

        act.Should().Throw<InvalidOperationExceptionRef>()
            .WithMessage("*ConnectionStrings:DefaultConnection' is missing or empty*");
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef(null)]
    [InlineDataAttributeRef("")]
    [InlineDataAttributeRef("short")]
    public void AddInfrastructure_InProduction_WhenHmacKeyMissingOrShort_ThrowsConfigurationException(string? hmacKey)
    {
        var envMock = new MockOfIHostEnvironmentRef();
        envMock.Setup(e => e.EnvironmentName).Returns("Production");
        var config = new ConfigurationBuilderRef()
            .AddInMemoryCollection(new DictionaryOfStringAndStringRef
            {
                ["Persistence:Provider"] = "Postgres",
                ["BookingAbuse:HmacKey"] = hmacKey
            })
            .Build();
        var services = new ServiceCollectionRef();

        var act = () => services.AddInfrastructure(config, envMock.Object);

        act.Should().Throw<InvalidOperationExceptionRef>()
            .WithMessage("*BookingAbuse:HmacKey*32*bytes*");
    }

    [FactAttributeRef]
    public void AddInfrastructure_InDevelopment_WhenJsonExplicitlyChosen_AllowsRegistration()
    {
        // Arrange: Development environment with Json provider
        var envMock = new MockOfIHostEnvironmentRef();
        envMock.Setup(e => e.EnvironmentName).Returns("Development");

        var config = new ConfigurationBuilderRef()
            .AddInMemoryCollection(new DictionaryOfStringAndStringRef
            {
                ["Persistence:Provider"] = "Json"
            })
            .Build();

        var services = new ServiceCollectionRef();

        // Act & Assert: Allowed in Development
        var act = () => services.AddInfrastructure(config, envMock.Object);

        act.Should().NotThrow();
    }
}
