// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: HealthEndpointsIntegrationTests
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using IClassFixtureOfWebApplicationFactoryRef = global::Xunit.IClassFixture<global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>>;
using WebApplicationFactoryOfProgramRef = global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>;
using HttpStatusCodeRef = global::System.Net.HttpStatusCode;
using JsonElementRef = global::System.Text.Json.JsonElement;
using HttpClientRef = global::System.Net.Http.HttpClient;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public class HealthEndpointsIntegrationTests : IClassFixtureOfWebApplicationFactoryRef
{
    private readonly HttpClientRef _client;

    public HealthEndpointsIntegrationTests(WebApplicationFactoryOfProgramRef factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Persistence:Provider", "Json");
        }).CreateClient();
    }

    [FactAttributeRef]
    public async TaskRef GetHealth_ReturnsOkWithStatus()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCodeRef.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElementRef>();
        json.GetProperty("status").GetString().Should().Be("Healthy");
    }

    [FactAttributeRef]
    public async TaskRef GetHealthLive_ReturnsOkWithLiveStatus()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCodeRef.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElementRef>();
        json.GetProperty("status").GetString().Should().Be("Live");
    }

    [FactAttributeRef]
    public async TaskRef GetHealthReady_WithJsonPersistence_ReturnsOkReady()
    {
        // Act
        var response = await _client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCodeRef.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElementRef>();
        json.GetProperty("status").GetString().Should().Be("Ready");
    }
}
