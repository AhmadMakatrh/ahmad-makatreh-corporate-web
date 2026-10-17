// codeguard:components:start
// codeguard:defines: BookingDuplicateApiIntegrationTests
using System.Net;
using System.Net.Http.Json;
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
using IPAddressRef = global::System.Net.IPAddress;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
using GuidRef = global::System.Guid;
using UriRef = global::System.Uri;
using IDisposableRef = global::System.IDisposable;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public class BookingDuplicateApiIntegrationTests : IClassFixtureOfWebApplicationFactoryRef, IDisposableRef
{
    private readonly HttpClientRef _client;

    public BookingDuplicateApiIntegrationTests(WebApplicationFactoryOfProgramRef factory)
    {
        var testFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Persistence:Provider", "Json");
            builder.UseSetting("Turnstile:Enabled", "false");
            builder.UseSetting("Turnstile:AllowDevelopmentBypass", "true");
            builder.UseSetting("Email:Enabled", "false");
        });
        _client = new HttpClientRef(testFactory.Server.CreateHandler(context => context.Connection.RemoteIpAddress = IPAddressRef.Loopback))
        {
            BaseAddress = new UriRef("http://localhost")
        };
    }

    public void Dispose() => _client.Dispose();

    [FactAttributeRef]
    public async TaskRef PostBooking_WithIdenticalSubmission_ReturnsConflictWithoutSecondNotification()
    {
        var unique = GuidRef.NewGuid().ToString("N");
        var request = new BookingRequestRef(
            Name: "Duplicate Guard Test",
            Email: $"duplicate-{unique}@example.com",
            ProjectDetails: $"Testing identical booking submission protection {unique}.",
            InquiryCategory: "software-project");

        var firstResponse = await _client.PostAsJsonAsync("/api/booking", request);
        var duplicateResponse = await _client.PostAsJsonAsync("/api/booking", request);

        firstResponse.StatusCode.Should().Be(HttpStatusCodeRef.OK);
        duplicateResponse.StatusCode.Should().Be(HttpStatusCodeRef.Conflict);
        var duplicate = await duplicateResponse.Content.ReadFromJsonAsync<BookingResponseRef>();
        duplicate.Should().NotBeNull();
        duplicate!.Success.Should().BeFalse();
        duplicate.Code.Should().Be("duplicate_submission");
    }
}
