// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: BookingApiIntegrationTests
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AhmadMakatreh.Api.Contracts;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using IClassFixtureOfWebApplicationFactoryRef = global::Xunit.IClassFixture<global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>>;
using WebApplicationFactoryOfProgramRef = global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>;
using BookingResponseRef = global::AhmadMakatreh.Api.Contracts.BookingResponse;
using BookingRequestRef = global::AhmadMakatreh.Api.Contracts.BookingRequest;
using HttpStatusCodeRef = global::System.Net.HttpStatusCode;
using HttpClientRef = global::System.Net.Http.HttpClient;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using IPAddressRef = global::System.Net.IPAddress;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
using UriRef = global::System.Uri;
using IDisposableRef = global::System.IDisposable;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public class BookingApiIntegrationTests : IClassFixtureOfWebApplicationFactoryRef, IDisposableRef
{
    private readonly WebApplicationFactoryOfProgramRef _factory;
    private readonly HttpClientRef _client;

    public BookingApiIntegrationTests(WebApplicationFactoryOfProgramRef factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Persistence:Provider", "Json");
            builder.UseSetting("Turnstile:Enabled", "false");
            builder.UseSetting("Turnstile:AllowDevelopmentBypass", "true");
            builder.UseSetting("Email:Enabled", "false");
            builder.UseSetting("ReverseProxy:TrustCloudflareProxy", "false");
        });
        // TestServer has no TCP connection, so configure the peer address in its transport.
        _client = new HttpClientRef(_factory.Server.CreateHandler(context => context.Connection.RemoteIpAddress = IPAddressRef.Loopback))
        {
            BaseAddress = new UriRef("http://localhost")
        };
    }

    public void Dispose() => _client.Dispose();

    [FactAttributeRef]
    public async TaskRef PostBooking_WithoutPeerAddress_ReturnsBadRequestDespiteForwardedHeaders()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("CF-Connecting-IP", "203.0.113.10");
        client.DefaultRequestHeaders.Add("X-Forwarded-For", "203.0.113.10");
        var request = new BookingRequestRef("Integration Test User", "integration@example.com", "Need a website");

        var response = await client.PostAsJsonAsync("/api/booking", request);

        response.StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
        var json = await response.Content.ReadFromJsonAsync<BookingResponseRef>();
        json.Should().NotBeNull();
        json!.Success.Should().BeFalse();
        json.Message.Should().Be("Unable to determine the client network address.");
    }

    [FactAttributeRef]
    public async TaskRef PostBooking_WithInvalidData_ReturnsBadRequestWithErrors()
    {
        // Arrange: Missing name and invalid email
        var request = new BookingRequestRef(
            Name: "",
            Email: "not-an-email",
            ProjectDetails: ""
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/booking", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
        var json = await response.Content.ReadFromJsonAsync<BookingResponseRef>();
        json.Should().NotBeNull();
        json!.Success.Should().BeFalse();
        json.Errors.Should().NotBeEmpty();
    }

    [FactAttributeRef]
    public async TaskRef PostBooking_WithValidData_ReturnsOkWithReferenceId()
    {
        // Arrange
        var request = new BookingRequestRef(
            Name: "Integration Test User",
            Email: "integration@example.com",
            ProjectDetails: "End-to-end integration test inquiry verifying full HTTP pipeline."
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/booking", request);

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCodeRef.OK, $"server response was: {content}");
        var json = await response.Content.ReadFromJsonAsync<BookingResponseRef>();
        json.Should().NotBeNull();
        json!.Success.Should().BeTrue();
        json.ReferenceId.Should().NotBeNullOrWhiteSpace();
        json.ReferenceId.Should().StartWith("REQ-");
        json.NotificationStatus.Should().Be("disabled");
    }

    [FactAttributeRef]
    public async TaskRef PostBooking_WithUnknownService_ReturnsBadRequest()
    {
        var request = new BookingRequestRef("Integration Test User", "integration@example.com", "Need a website", ServiceKey: "unknown");

        var response = await _client.PostAsJsonAsync("/api/booking", request);

        response.StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
    }

    [FactAttributeRef]
    public async TaskRef PostBooking_WithUnknownInquiryCategory_ReturnsBadRequest()
    {
        var request = new BookingRequestRef("Integration Test User", "integration@example.com", "Need a website", InquiryCategory: "unknown-category");

        var response = await _client.PostAsJsonAsync("/api/booking", request);

        response.StatusCode.Should().Be(HttpStatusCodeRef.BadRequest);
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("software-project")]
    [InlineDataAttributeRef("technical-support")]
    [InlineDataAttributeRef("other")]
    public async TaskRef PostBooking_WithKnownInquiryCategory_ReturnsOk(string category)
    {
        var request = new BookingRequestRef("Integration Test User", "integration@example.com", "Need a website", InquiryCategory: category);

        var response = await _client.PostAsJsonAsync("/api/booking", request);

        response.StatusCode.Should().Be(HttpStatusCodeRef.OK);
    }
}
