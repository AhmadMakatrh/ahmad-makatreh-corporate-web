// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ProductionStartupFailureTests
using System.Security.Cryptography;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using IClassFixtureOfWebApplicationFactoryRef = global::Xunit.IClassFixture<global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>>;
using WebApplicationFactoryOfProgramRef = global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>;
using RandomNumberGeneratorRef = global::System.Security.Cryptography.RandomNumberGenerator;
using ExceptionRef = global::System.Exception;
using ConvertRef = global::System.Convert;
using FactAttributeRef = global::Xunit.FactAttribute;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using IOptionsOfForwardedHeadersOptionsRef = global::Microsoft.Extensions.Options.IOptions<global::Microsoft.AspNetCore.Builder.ForwardedHeadersOptions>;
using IPAddressRef = global::System.Net.IPAddress;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public class ProductionStartupFailureTests : IClassFixtureOfWebApplicationFactoryRef
{
    private readonly WebApplicationFactoryOfProgramRef _factory;

    public ProductionStartupFailureTests(WebApplicationFactoryOfProgramRef factory)
    {
        _factory = factory;
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("nginx")]
    [InlineDataAttributeRef("10.0.0.0/24")]
    [InlineDataAttributeRef("")]
    public void StartApi_WithInvalidKnownProxy_FailsBeforeServingRequests(string invalidProxy)
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Persistence:Provider", "Json");
            builder.UseSetting("ReverseProxy:KnownProxies:0", "127.0.0.1");
            builder.UseSetting("ReverseProxy:KnownProxies:1", invalidProxy);
        });

        var start = () => factory.CreateClient();
        start.Should().Throw<ExceptionRef>().Where(error => error.ToString().Contains("ReverseProxy:KnownProxies"));
    }

    [FactAttributeRef]
    public void StartApi_WithValidKnownProxies_PreservesOnlyExplicitAddresses()
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Persistence:Provider", "Json");
            builder.UseSetting("ReverseProxy:KnownProxies:0", "192.0.2.10");
            builder.UseSetting("ReverseProxy:KnownProxies:1", "2001:db8::1");
        });
        using var client = factory.CreateClient();
        var options = factory.Services.GetRequiredService<IOptionsOfForwardedHeadersOptionsRef>().Value;

        options.KnownProxies.Should().Equal(IPAddressRef.Parse("192.0.2.10"), IPAddressRef.Parse("2001:db8::1"));
        options.KnownIPNetworks.Should().BeEmpty();
    }

    [FactAttributeRef]
    public void StartApi_InProduction_WithMissingPostgresConnectionString_FailsStartupImmediately()
    {
        // Act & Assert: Creating the client in Production with missing connection string must fail immediately
        var act = () =>
        {
            var client = _factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Production");
                builder.UseSetting("Persistence:Provider", "Postgres");
                builder.UseSetting("BookingAbuse:HmacKey", ConvertRef.ToBase64String(RandomNumberGeneratorRef.GetBytes(32)));
                builder.UseSetting("ConnectionStrings:DefaultConnection", "");
            }).CreateClient();

            // Force pipeline initialization
            _ = client.GetAsync("/health").GetAwaiter().GetResult();
        };

        act.Should().Throw<ExceptionRef>()
            .Where(e => e.ToString().Contains("ConnectionStrings:DefaultConnection"));
    }

    [FactAttributeRef]
    public void StartApi_InProduction_WithJsonProviderConfigured_FailsStartupImmediately()
    {
        // Act & Assert: Setting Json provider in Production must trigger security exception on startup
        var act = () =>
        {
            var client = _factory.WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Production");
                builder.UseSetting("Persistence:Provider", "Json");
            }).CreateClient();

            _ = client.GetAsync("/health").GetAwaiter().GetResult();
        };

        act.Should().Throw<ExceptionRef>()
            .Where(e => e.ToString().Contains("strictly forbidden in 'Production' environment"));
    }
}
