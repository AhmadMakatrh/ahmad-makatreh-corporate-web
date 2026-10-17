// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: BookingApplicationServiceTests
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Application.Services;
using AhmadMakatreh.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;
using NullLoggerOfBookingApplicationServiceRef = global::Microsoft.Extensions.Logging.Abstractions.NullLogger<global::AhmadMakatreh.Application.Services.BookingApplicationService>;
using MockOfIInquiryNotificationServiceRef = global::Moq.Mock<global::AhmadMakatreh.Application.Interfaces.IInquiryNotificationService>;
using TaskOfNotificationDispatchStatusRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.NotificationDispatchStatus>;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using MockOfIBotVerificationServiceRef = global::Moq.Mock<global::AhmadMakatreh.Application.Interfaces.IBotVerificationService>;
using MockOfIPublishedSiteReaderRef = global::Moq.Mock<global::AhmadMakatreh.Application.Interfaces.IPublishedSiteReader>;
using DictionaryOfStringAndStringRef = global::System.Collections.Generic.Dictionary<string, string>;
using NotificationDispatchStatusRef = global::AhmadMakatreh.Application.Models.NotificationDispatchStatus;
using BookingApplicationServiceRef = global::AhmadMakatreh.Application.Services.BookingApplicationService;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using MockOfIInquiryRepositoryRef = global::Moq.Mock<global::AhmadMakatreh.Application.Interfaces.IInquiryRepository>;
using BookingSubmissionOutcomeRef = global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome;
using PublishedSiteSnapshotRef = global::AhmadMakatreh.Application.Interfaces.PublishedSiteSnapshot;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IOExceptionRef = global::System.IO.IOException;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using TimeoutRef = global::System.Threading.Timeout;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using TimesRef = global::Moq.Times;
using TaskRef = global::System.Threading.Tasks.Task;
using FactAttributeRef = global::Xunit.FactAttribute;
using GuidRef = global::System.Guid;
using ItRef = global::Moq.It;
using DateTimeRef = global::System.DateTime;
using ArrayRef = global::System.Array;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Application;

public class BookingApplicationServiceTests
{
    [TheoryAttributeRef]
    [InlineDataAttributeRef("resume", false, true, 0)]
    [InlineDataAttributeRef("published-package", false, true, 1)]
    [InlineDataAttributeRef("published-package", true, false, 1)]
    public async TaskRef PublishedPackageSelectionIsValidatedWithoutLookingUpExistingKeys(string serviceKey, bool hidden, bool accepted, int reads)
    {
        var reader = new MockOfIPublishedSiteReaderRef();
        var json = JsonSerializerRef.Serialize(new { packages = new[] { new { key = "published-package", hidden } }, offers = ArrayRef.Empty<object>() });
        reader.Setup(r => r.ReadAsync(ItRef.IsAny<CancellationTokenRef>())).ReturnsAsync(new PublishedSiteSnapshotRef(json, "etag", new DictionaryOfStringAndStringRef { ["pricing"] = json }));
        _botVerifierMock.Setup(b => b.VerifyTokenAsync(ItRef.IsAny<string>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>())).ReturnsAsync((true, (string?)null));
        var service = new BookingApplicationServiceRef(_repositoryMock.Object, _botVerifierMock.Object, _notifierMock.Object, NullLoggerOfBookingApplicationServiceRef.Instance, reader.Object);
        var result = await service.ProcessBookingAsync(new SubmitBookingCommandRef("Visitor", "visitor@example.com", "Please discuss my project requirements.", "token", "127.0.0.1", serviceKey, "software-project"));
        result.Success.Should().Be(accepted);
        reader.Verify(r => r.ReadAsync(ItRef.IsAny<CancellationTokenRef>()), TimesRef.Exactly(reads));
    }

    [FactAttributeRef]
    public async TaskRef AFailedNotificationRecordDoesNotLoseTheStoredInquiry()
    {
        _botVerifierMock.Setup(b => b.VerifyTokenAsync(ItRef.IsAny<string>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>())).ReturnsAsync((true, (string?)null));
        _repositoryMock.Setup(r => r.RecordNotificationAsync(ItRef.IsAny<GuidRef>(), ItRef.IsAny<string>(), ItRef.IsAny<DateTimeRef>(), ItRef.IsAny<CancellationTokenRef>())).ThrowsAsync(new IOExceptionRef("Test persistence failure"));
        var result = await _service.ProcessBookingAsync(new SubmitBookingCommandRef("Visitor", "visitor@example.com", "Please discuss my project requirements.", "token", "127.0.0.1", "resume", "software-project"));
        result.Success.Should().BeTrue(); result.NotificationStatus.Should().Be(NotificationDispatchStatusRef.Unknown);
        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
    }
    private readonly MockOfIInquiryRepositoryRef _repositoryMock;
    private readonly MockOfIBotVerificationServiceRef _botVerifierMock;
    private readonly MockOfIInquiryNotificationServiceRef _notifierMock;
    private readonly BookingApplicationServiceRef _service;

    public BookingApplicationServiceTests()
    {
        _repositoryMock = new MockOfIInquiryRepositoryRef();
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);
        _botVerifierMock = new MockOfIBotVerificationServiceRef();
        _notifierMock = new MockOfIInquiryNotificationServiceRef();
        _notifierMock
            .Setup(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(NotificationDispatchStatusRef.Accepted);

        _service = new BookingApplicationServiceRef(
            _repositoryMock.Object,
            _botVerifierMock.Object,
            _notifierMock.Object,
            NullLoggerOfBookingApplicationServiceRef.Instance
        );
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WithInvalidInput_ShouldFailBeforeBotVerificationOrRepository()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "", // Invalid empty name
            Email: "john@example.com",
            ProjectDetails: "Some project details",
            TurnstileToken: "valid_token",
            RemoteIp: "127.0.0.1"
        );

        // Act
        var result = await _service.ProcessBookingAsync(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Errors.Should().Contain("Name is required.");
        _botVerifierMock.Verify(b => b.VerifyTokenAsync(ItRef.IsAny<string>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenBotVerificationFails_ShouldFailWithoutPersisting()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: "Some project details",
            TurnstileToken: "bad_token",
            RemoteIp: "127.0.0.1"
        );

        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("bad_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((false, "Bot verification challenge failed."));

        // Act
        var result = await _service.ProcessBookingAsync(command);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Bot verification challenge failed.");
        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenValid_ShouldPersistAndNotify()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: "Architecture consulting",
            TurnstileToken: "good_token",
            RemoteIp: "127.0.0.1"
        );

        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));

        InquiryRef? persistedInquiry = null;
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .Callback<InquiryRef, string, CancellationTokenRef>((inq, _, _) => persistedInquiry = inq)
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);

        _notifierMock
            .Setup(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(NotificationDispatchStatusRef.Accepted);

        // Act
        var result = await _service.ProcessBookingAsync(command);

        // Assert
        result.Success.Should().BeTrue();
        result.NotificationStatus.Should().Be(NotificationDispatchStatusRef.Accepted);
        result.ReferenceId.Should().NotBeNullOrWhiteSpace();
        result.ReferenceId.Should().StartWith("REQ-");

        persistedInquiry.Should().NotBeNull();
        persistedInquiry!.Name.Should().Be("John Doe");
        persistedInquiry.Email.Should().Be("john@example.com");
        persistedInquiry.ProjectDetails.Should().Be("Architecture consulting");
        persistedInquiry.ReferenceId.Should().Be(result.ReferenceId);

        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenSubmissionIsDuplicate_ShouldNotPersistOrNotifyAgain()
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Architecture consulting", "good_token", "127.0.0.1");
        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Duplicate);

        var result = await _service.ProcessBookingAsync(command);

        result.Success.Should().BeFalse();
        result.FailureCode.Should().Be("duplicate_submission");
        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenClientIpIsBlocked_ShouldReturnRemainingBlockTime()
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Architecture consulting", "good_token", "127.0.0.1");
        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Blocked(900));

        var result = await _service.ProcessBookingAsync(command);

        result.Success.Should().BeFalse();
        result.FailureCode.Should().Be("ip_blocked");
        result.RetryAfterSeconds.Should().Be(900);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Never);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WithSelectedService_ShouldPersistServiceForNotification()
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Need a website", "good_token", "127.0.0.1", "business");
        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));

        InquiryRef? persistedInquiry = null;
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .Callback<InquiryRef, string, CancellationTokenRef>((inquiry, _, _) => persistedInquiry = inquiry)
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);

        await _service.ProcessBookingAsync(command);

        persistedInquiry!.ServiceKey.Should().Be("business");

        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.Is<InquiryRef>(i => i.ServiceKey == "business"), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WithInquiryCategory_ShouldPersistItForNotification()
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Need a website", "good_token", "127.0.0.1", InquiryCategory: "software-project");
        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);

        var result = await _service.ProcessBookingAsync(command);

        result.Success.Should().BeTrue();
        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.Is<InquiryRef>(i => i.InquiryCategory == "software-project"), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
        _notifierMock.Verify(n => n.SendNotificationAsync(ItRef.Is<InquiryRef>(i => i.InquiryCategory == "software-project"), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenNotificationIsDisabled_ShouldKeepInquiryAndReportDisabled()
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Need a website", "good_token", "127.0.0.1");
        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);
        _notifierMock
            .Setup(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(NotificationDispatchStatusRef.Disabled);

        var result = await _service.ProcessBookingAsync(command);

        result.Success.Should().BeTrue();
        result.NotificationStatus.Should().Be(NotificationDispatchStatusRef.Disabled);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenNotificationFails_InquiryStillSucceeds()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: "Architecture consulting",
            TurnstileToken: "good_token",
            RemoteIp: "127.0.0.1"
        );

        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));

        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);

        // Notifier throws an exception
        _notifierMock
            .Setup(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()))
            .ThrowsAsync(new InvalidOperationExceptionRef("SMTP connection failed"));

        // Act
        var result = await _service.ProcessBookingAsync(command);

        // Assert: The inquiry MUST still succeed because persistence succeeded!
        result.Success.Should().BeTrue();
        result.NotificationStatus.Should().Be(NotificationDispatchStatusRef.Failed);
        result.Message.Should().NotContain("SMTP connection failed");
        result.ReferenceId.Should().NotBeNullOrWhiteSpace();
        _repositoryMock.Verify(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()), TimesRef.Once);
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenNotificationTimesOut_ShouldReportTimedOut()
    {
        var command = new SubmitBookingCommandRef("John Doe", "john@example.com", "Architecture consulting", "good_token", "127.0.0.1");
        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync(BookingSubmissionOutcomeRef.Stored);
        _notifierMock
            .Setup(n => n.SendNotificationAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<CancellationTokenRef>()))
            .Returns((InquiryRef _, CancellationTokenRef token) => WaitUntilCancelledAsync(token));

        var result = await _service.ProcessBookingAsync(command);

        result.Success.Should().BeTrue();
        result.NotificationStatus.Should().Be(NotificationDispatchStatusRef.TimedOut);
    }

    private static async TaskOfNotificationDispatchStatusRef WaitUntilCancelledAsync(CancellationTokenRef cancellationToken)
    {
        await TaskRef.Delay(TimeoutRef.Infinite, cancellationToken);
        return NotificationDispatchStatusRef.Accepted;
    }

    [FactAttributeRef]
    public async TaskRef ProcessBookingAsync_WhenCollisionOccurs_ShouldRetryAndSucceed()
    {
        // Arrange
        var command = new SubmitBookingCommandRef(
            Name: "John Doe",
            Email: "john@example.com",
            ProjectDetails: "Architecture consulting",
            TurnstileToken: "good_token",
            RemoteIp: "127.0.0.1"
        );

        _botVerifierMock
            .Setup(b => b.VerifyTokenAsync("good_token", "127.0.0.1", ItRef.IsAny<CancellationTokenRef>()))
            .ReturnsAsync((true, null));

        var attempts = 0;
        _repositoryMock
            .Setup(r => r.AddUnlessDuplicateAsync(ItRef.IsAny<InquiryRef>(), ItRef.IsAny<string>(), ItRef.IsAny<CancellationTokenRef>()))
            .Returns(() =>
            {
                attempts++;
                if (attempts == 1)
                {
                    throw new InvalidOperationExceptionRef("duplicate key value violates unique constraint 'ix_inquiries_reference_id'");
                }
                return TaskRef.FromResult(BookingSubmissionOutcomeRef.Stored);
            });

        // Act
        var result = await _service.ProcessBookingAsync(command);

        // Assert
        result.Success.Should().BeTrue();
        attempts.Should().Be(2); // Retried once on collision
    }
}
