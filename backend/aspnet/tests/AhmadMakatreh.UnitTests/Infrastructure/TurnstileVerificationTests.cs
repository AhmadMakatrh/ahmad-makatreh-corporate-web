// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: TurnstileVerificationTests
using System.Net;
using AhmadMakatreh.Infrastructure.BotVerification;
using AhmadMakatreh.Infrastructure.Options;
using FluentAssertions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Xunit;
using NullLoggerOfCloudflareTurnstileVerificationServiceRef = global::Microsoft.Extensions.Logging.Abstractions.NullLogger<global::AhmadMakatreh.Infrastructure.BotVerification.CloudflareTurnstileVerificationService>;
using CloudflareTurnstileVerificationServiceRef = global::AhmadMakatreh.Infrastructure.BotVerification.CloudflareTurnstileVerificationService;
using OptionsRef = global::Microsoft.Extensions.Options.Options;
using TaskOfHttpResponseMessageRef = global::System.Threading.Tasks.Task<global::System.Net.Http.HttpResponseMessage>;
using MockOfHttpMessageHandlerRef = global::Moq.Mock<global::System.Net.Http.HttpMessageHandler>;
using MockOfIHostEnvironmentRef = global::Moq.Mock<global::Microsoft.Extensions.Hosting.IHostEnvironment>;
using HttpResponseMessageRef = global::System.Net.Http.HttpResponseMessage;
using HttpRequestMessageRef = global::System.Net.Http.HttpRequestMessage;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using TurnstileOptionsRef = global::AhmadMakatreh.Infrastructure.Options.TurnstileOptions;
using HttpStatusCodeRef = global::System.Net.HttpStatusCode;
using StringContentRef = global::System.Net.Http.StringContent;
using HttpClientRef = global::System.Net.Http.HttpClient;
using ItExprRef = global::Moq.Protected.ItExpr;
using FactAttributeRef = global::Xunit.FactAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Infrastructure;

public class TurnstileVerificationTests
{
    private static (CloudflareTurnstileVerificationServiceRef service, MockOfHttpMessageHandlerRef httpMock) CreateService(
        string environmentName,
        bool enabled,
        string secretKey = "0x4AAAAAA...",
        bool allowDevelopmentBypass = false)
    {
        var envMock = new MockOfIHostEnvironmentRef();
        envMock.Setup(e => e.EnvironmentName).Returns(environmentName);

        var options = OptionsRef.Create(new TurnstileOptionsRef
        {
            Enabled = enabled,
            SecretKey = secretKey,
            AllowDevelopmentBypass = allowDevelopmentBypass,
            VerifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        });

        var httpHandlerMock = new MockOfHttpMessageHandlerRef();
        var httpClient = new HttpClientRef(httpHandlerMock.Object);

        var service = new CloudflareTurnstileVerificationServiceRef(
            httpClient,
            options,
            envMock.Object,
            NullLoggerOfCloudflareTurnstileVerificationServiceRef.Instance
        );

        return (service, httpHandlerMock);
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InProduction_WhenTurnstileDisabled_ShouldFailClosed()
    {
        // Arrange: Production with Turnstile disabled
        var (service, _) = CreateService("Production", enabled: false);

        // Act
        var result = await service.VerifyTokenAsync("any_token", "127.0.0.1");

        // Assert: Must reject immediately
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Security verification service is required in this environment");
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InStaging_WhenTurnstileDisabled_ShouldFailClosed()
    {
        // Arrange: Staging with Turnstile disabled
        var (service, _) = CreateService("Staging", enabled: false);

        // Act
        var result = await service.VerifyTokenAsync("any_token", "127.0.0.1");

        // Assert: Must reject immediately (never bypass outside Development)
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Security verification service is required in this environment");
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InDevelopment_WhenDisabledAndBypassTrue_ShouldAllow()
    {
        // Arrange: Development with Turnstile disabled and AllowDevelopmentBypass=true
        var (service, _) = CreateService("Development", enabled: false, allowDevelopmentBypass: true);

        // Act
        var result = await service.VerifyTokenAsync(null, "127.0.0.1");

        // Assert: Allowed
        result.IsValid.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InDevelopment_WhenDisabledAndBypassFalse_ShouldReject()
    {
        // Arrange: Development with Turnstile disabled and AllowDevelopmentBypass=false
        var (service, _) = CreateService("Development", enabled: false, allowDevelopmentBypass: false);

        // Act
        var result = await service.VerifyTokenAsync(null, "127.0.0.1");

        // Assert: Rejected
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Security verification service is disabled");
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InProduction_WithMissingToken_ShouldReject()
    {
        // Arrange: Production with Turnstile enabled
        var (service, _) = CreateService("Production", enabled: true);

        // Act
        var result = await service.VerifyTokenAsync("", "127.0.0.1");

        // Assert: Rejected
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Verification token is required");
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InProduction_WhenApiReturnsSuccess_ShouldPass()
    {
        // Arrange: Production with Turnstile enabled and API returning success: true
        var (service, httpMock) = CreateService("Production", enabled: true);

        httpMock.Protected()
            .Setup<TaskOfHttpResponseMessageRef>(
                "SendAsync",
                ItExprRef.IsAny<HttpRequestMessageRef>(),
                ItExprRef.IsAny<CancellationTokenRef>())
            .ReturnsAsync(new HttpResponseMessageRef(HttpStatusCodeRef.OK)
            {
                Content = new StringContentRef("{\"success\":true}")
            });

        // Act
        var result = await service.VerifyTokenAsync("valid_token", "127.0.0.1");

        // Assert: Pass
        result.IsValid.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [FactAttributeRef]
    public async TaskRef VerifyToken_InProduction_WhenApiReturnsFail_ShouldReject()
    {
        // Arrange: Production with Turnstile enabled and API returning success: false
        var (service, httpMock) = CreateService("Production", enabled: true);

        httpMock.Protected()
            .Setup<TaskOfHttpResponseMessageRef>(
                "SendAsync",
                ItExprRef.IsAny<HttpRequestMessageRef>(),
                ItExprRef.IsAny<CancellationTokenRef>())
            .ReturnsAsync(new HttpResponseMessageRef(HttpStatusCodeRef.OK)
            {
                Content = new StringContentRef("{\"success\":false,\"error-codes\":[\"invalid-input-response\"]}")
            });

        // Act
        var result = await service.VerifyTokenAsync("bad_token", "127.0.0.1");

        // Assert: Rejected
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Bot verification challenge failed");
    }
}
