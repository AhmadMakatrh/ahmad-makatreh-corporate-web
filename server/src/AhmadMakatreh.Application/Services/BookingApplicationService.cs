// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: BookingApplicationService
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Application.Validation;
using AhmadMakatreh.Domain.Common;
using AhmadMakatreh.Domain.Entities;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using ILoggerOfBookingApplicationServiceRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Application.Services.BookingApplicationService>;
using TaskOfNotificationDispatchStatusRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.NotificationDispatchStatus>;
using BookingSubmissionDispositionRef = global::AhmadMakatreh.Application.Models.BookingSubmissionDisposition;
using IInquiryNotificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IInquiryNotificationService;
using IBookingApplicationServiceRef = global::AhmadMakatreh.Application.Services.IBookingApplicationService;
using OperationCanceledExceptionRef = global::System.OperationCanceledException;
using NotificationDispatchStatusRef = global::AhmadMakatreh.Application.Models.NotificationDispatchStatus;
using IBotVerificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IBotVerificationService;
using CancellationTokenSourceRef = global::System.Threading.CancellationTokenSource;
using SubmitBookingValidatorRef = global::AhmadMakatreh.Application.Validation.SubmitBookingValidator;
using SiteDocumentValidatorRef = global::AhmadMakatreh.Application.Validation.SiteDocumentValidator;
using IPublishedSiteReaderRef = global::AhmadMakatreh.Application.Interfaces.IPublishedSiteReader;
using SubmitBookingCommandRef = global::AhmadMakatreh.Application.Models.SubmitBookingCommand;
using ReferenceIdGeneratorRef = global::AhmadMakatreh.Domain.Common.ReferenceIdGenerator;
using TaskOfBookingResultRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.BookingResult>;
using IInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryRepository;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using BookingResultRef = global::AhmadMakatreh.Application.Models.BookingResult;
using PriceCatalogRef = global::AhmadMakatreh.Application.Models.PriceCatalog;
using ExceptionRef = global::System.Exception;
using IPAddressRef = global::System.Net.IPAddress;
using TimeSpanRef = global::System.TimeSpan;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Application.Services;

/// <summary>
/// Orchestrates the end-to-end booking workflow:
/// 1. Command Validation
/// 2. Bot Challenge Verification (Turnstile)
/// 3. Entity Creation with Cryptographic Reference ID
/// 4. Authoritative Persistence (PostgreSQL or configured provider)
/// 5. Safe Notification Dispatch Attempt (Resilient: failure does not roll back inquiry)
/// 6. Acknowledgment
/// </summary>
public class BookingApplicationService : IBookingApplicationServiceRef
{
    private readonly IInquiryRepositoryRef _repository;
    private readonly IBotVerificationServiceRef _botVerifier;
    private readonly IInquiryNotificationServiceRef _notifier;
    private readonly ILoggerOfBookingApplicationServiceRef _logger;
    private readonly IPublishedSiteReaderRef? _publishedSite;

    public BookingApplicationService(
        IInquiryRepositoryRef repository,
        IBotVerificationServiceRef botVerifier,
        IInquiryNotificationServiceRef notifier,
        ILoggerOfBookingApplicationServiceRef logger,
        IPublishedSiteReaderRef? publishedSite = null)
    {
        _repository = repository;
        _botVerifier = botVerifier;
        _notifier = notifier;
        _logger = logger;
        _publishedSite = publishedSite;
    }

    public async TaskOfBookingResultRef ProcessBookingAsync(SubmitBookingCommandRef command, CancellationTokenRef cancellationToken = default)
    {
        // Step 1: Input Validation
        var (isValid, validationErrors) = SubmitBookingValidatorRef.Validate(command);
        if (!isValid && validationErrors.Count == 1 && validationErrors[0] == "Please select a valid service."
            && command.ServiceKey is { Length: > 0 and <= 30 } && _publishedSite is not null)
        {
            try
            {
                var snapshot = await _publishedSite.ReadAsync(cancellationToken);
                if (snapshot.Documents.TryGetValue("pricing", out var json))
                {
                    var catalog = JsonSerializerRef.Deserialize<PriceCatalogRef>(json, SiteDocumentValidatorRef.JsonOptions);
                    if (catalog?.Packages.Any(p => p.Key == command.ServiceKey && !p.Hidden) == true)
                        (isValid, validationErrors) = SubmitBookingValidatorRef.Validate(command, allowPublishedService: true);
                }
            }
            catch (OperationCanceledExceptionRef) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (ExceptionRef exception)
            {
                _logger.LogError("Published service validation unavailable: {ErrorType}.", exception.GetType().Name);
                return BookingResultRef.Failed("Unable to process your inquiry at this time. Please try again later.");
            }
        }
        if (!isValid)
        {
            return BookingResultRef.Failed("Validation failed for submitted data.", validationErrors);
        }

        if (!IPAddressRef.TryParse(command.RemoteIp, out _))
        {
            return BookingResultRef.Failed("Unable to determine the client network address.");
        }

        // Step 2: Bot Challenge Verification
        var (botValid, botError) = await _botVerifier.VerifyTokenAsync(command.TurnstileToken, command.RemoteIp, cancellationToken);
        if (!botValid)
        {
            return BookingResultRef.Failed(botError ?? "Bot challenge validation failed.");
        }

        // Step 3: Cryptographic Reference ID & Inquiry Entity Creation
        InquiryRef? inquiry = null;
        const int maxCollisionRetries = 2;
        const int maxCollisionRetriesRef = maxCollisionRetries;

        for (var attempt = 0; attempt <= maxCollisionRetriesRef; attempt++)
        {
            var referenceId = ReferenceIdGeneratorRef.Generate();
            var candidate = new InquiryRef(
                id: GuidRef.NewGuid(),
                referenceId: referenceId,
                name: command.Name,
                email: command.Email,
                projectDetails: command.ProjectDetails,
                serviceKey: command.ServiceKey,
                inquiryCategory: command.InquiryCategory
            );

            try
            {
                // Step 4: Authoritative Persistence
                var submissionOutcome = await _repository.AddUnlessDuplicateAsync(candidate, command.RemoteIp, cancellationToken);
                if (submissionOutcome.Disposition == BookingSubmissionDispositionRef.Duplicate)
                {
                    return BookingResultRef.Failed(
                        "This request was already submitted.",
                        failureCode: BookingResultRef.DuplicateSubmissionCode);
                }

                if (submissionOutcome.Disposition == BookingSubmissionDispositionRef.IpBlocked)
                {
                    return BookingResultRef.Failed(
                        "Submissions from this network are temporarily blocked after repeated identical requests.",
                        failureCode: BookingResultRef.IpBlockedCode,
                        retryAfterSeconds: submissionOutcome.RetryAfterSeconds);
                }

                inquiry = candidate;
                break;
            }
            catch (ExceptionRef ex) when (attempt < maxCollisionRetriesRef && IsPotentialCollision(ex))
            {
                _logger.LogWarning("Potential ReferenceId collision for {RefId}, retrying generation...", referenceId);
            }
        }

        if (inquiry == null)
        {
            _logger.LogError("Failed to persist inquiry after retries.");
            return BookingResultRef.Failed("Unable to process your inquiry at this time. Please try again later.");
        }

        // Privacy-Preserving Audit Logging (masked contact, zero tokens or project details)
        _logger.LogInformation(
            "Booking inquiry successfully persisted. ReferenceId: {RefId}, Contact: {Contact}",
            inquiry.ReferenceId, MaskEmail(inquiry.Email));

        // Step 5: Safe Synchronous Notification Dispatch Attempt (Timeout-bounded, non-failing)
        var notificationStatus = await TryDispatchNotificationAsync(inquiry, cancellationToken);

        try
        {
            var storedStatus = notificationStatus switch
            {
                NotificationDispatchStatusRef.TimedOut => "timedOut",
                _ => notificationStatus.ToString().ToLowerInvariant()
            };
            using var outcomeTimeout = new CancellationTokenSourceRef(TimeSpanRef.FromSeconds(3));
            await _repository.RecordNotificationAsync(inquiry.Id, storedStatus, DateTimeRef.UtcNow, outcomeTimeout.Token);
        }
        catch (ExceptionRef ex)
        {
            _logger.LogWarning(ex, "Notification outcome could not be recorded for {RefId}. Inquiry remains saved.", inquiry.ReferenceId);
            notificationStatus = NotificationDispatchStatusRef.Unknown;
        }

        // Step 6: Return Result
        return BookingResultRef.Succeeded(
            inquiry.ReferenceId,
            "Your inquiry has been received successfully. We will get back to you shortly.",
            notificationStatus);
    }

    private async TaskOfNotificationDispatchStatusRef TryDispatchNotificationAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken)
    {
        try
        {
            // Enforce a strict 5-second timeout for notifications so client responses are not delayed
            using var cts = CancellationTokenSourceRef.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpanRef.FromSeconds(5));

            var status = await _notifier.SendNotificationAsync(inquiry, cts.Token);
            if (status == NotificationDispatchStatusRef.Failed)
            {
                _logger.LogWarning("Notification provider reported failure for ReferenceId: {RefId}.", inquiry.ReferenceId);
            }

            return status;
        }
        catch (OperationCanceledExceptionRef) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Notification dispatch timed out for ReferenceId: {RefId}. Inquiry remains safely persisted.", inquiry.ReferenceId);
            return NotificationDispatchStatusRef.TimedOut;
        }
        catch (OperationCanceledExceptionRef ex)
        {
            _logger.LogWarning(ex, "Notification dispatch was canceled for ReferenceId: {RefId}; delivery status is unknown.", inquiry.ReferenceId);
            return NotificationDispatchStatusRef.Unknown;
        }
        catch (ExceptionRef ex)
        {
            // Defensive: Notification failure must NEVER roll back or fail the inquiry
            _logger.LogError(ex, "Notification dispatch failed for ReferenceId: {RefId}. Inquiry remains safely persisted.", inquiry.ReferenceId);
            return NotificationDispatchStatusRef.Failed;
        }
    }

    private static bool IsPotentialCollision(ExceptionRef ex)
    {
        var msg = ex.Message.ToLowerInvariant();
        return msg.Contains("unique") || msg.Contains("duplicate") || msg.Contains("referenceid");
    }

    private static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "anonymous";
        var atIndex = email.IndexOf('@');
        if (atIndex <= 1) return "***" + (atIndex >= 0 ? email[atIndex..] : "");
        return $"{email[0]}***{email[atIndex - 1]}{email[atIndex..]}";
    }
}
