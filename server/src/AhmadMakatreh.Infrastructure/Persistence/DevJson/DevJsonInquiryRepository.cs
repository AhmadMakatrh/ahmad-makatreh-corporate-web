// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: DevJsonInquiryRepository
using System.Text.Json;
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using ILoggerOfDevJsonInquiryRepositoryRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryRepository>;
using TaskOfBookingSubmissionOutcomeRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome>;
using BookingSubmissionOutcomeRef = global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome;
using IAdminInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IAdminInquiryRepository;
using JsonSerializerOptionsRef = global::System.Text.Json.JsonSerializerOptions;
using TaskOfListRef = global::System.Threading.Tasks.Task<global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.Inquiry>>;
using IInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryRepository;
using BookingAbuseHasherRef = global::AhmadMakatreh.Infrastructure.Persistence.BookingAbuseHasher;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using ArgumentExceptionRef = global::System.ArgumentException;
using StringComparisonRef = global::System.StringComparison;
using StringComparerRef = global::System.StringComparer;
using TaskOfInquiryRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.Inquiry?>;
using JsonSerializerRef = global::System.Text.Json.JsonSerializer;
using SemaphoreSlimRef = global::System.Threading.SemaphoreSlim;
using ListOfInquiryRef = global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.Inquiry>;
using AppContextRef = global::System.AppContext;
using DirectoryRef = global::System.IO.Directory;
using TimeSpanRef = global::System.TimeSpan;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using PathRef = global::System.IO.Path;
using MathRef = global::System.Math;
using TaskRef = global::System.Threading.Tasks.Task;
using FileRef = global::System.IO.File;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.DevJson;

/// <summary>
/// Lightweight local development inquiry repository writing to App_Data/inquiries.json.
/// STRICTLY RESTRICTED to local Development mode. Never permitted in Staging or Production.
/// </summary>
public partial class DevJsonInquiryRepository : IInquiryRepositoryRef, IAdminInquiryRepositoryRef
{
    private static readonly SemaphoreSlimRef FileLock = new(1, 1);
    private readonly string _filePath;
    private readonly BookingAbuseHasherRef _abuseHasher;
    private readonly ILoggerOfDevJsonInquiryRepositoryRef _logger;
    private readonly Dictionary<string, SubmissionGuardState> _submissionGuards = new(StringComparerRef.Ordinal);
    private DateTimeRef _lastGuardCleanupUtc = DateTimeRef.MinValue;

    public DevJsonInquiryRepository(BookingAbuseHasherRef abuseHasher, ILoggerOfDevJsonInquiryRepositoryRef logger, string? path = null)
    {
        _abuseHasher = abuseHasher;
        _logger = logger;
        var dataDir = PathRef.Combine(AppContextRef.BaseDirectory, "App_Data");
        DirectoryRef.CreateDirectory(dataDir);
        _filePath = path ?? PathRef.Combine(dataDir, "inquiries.json");
        DirectoryRef.CreateDirectory(PathRef.GetDirectoryName(_filePath)!);
    }

    public async TaskOfBookingSubmissionOutcomeRef AddUnlessDuplicateAsync(
        InquiryRef inquiry,
        string clientIp,
        CancellationTokenRef cancellationToken = default)
    {
        if (!_abuseHasher.TryGetClientIpHash(clientIp, out var ipHash))
        {
            throw new ArgumentExceptionRef("A valid client IP address is required.", nameof(clientIp));
        }

        var payloadHash = _abuseHasher.GetPayloadHash(inquiry);
        await FileLock.WaitAsync(cancellationToken);
        try
        {
            var now = DateTimeRef.UtcNow;
            if (now - _lastGuardCleanupUtc >= TimeSpanRef.FromMinutes(30))
            {
                foreach (var expired in _submissionGuards.Where(pair => pair.Value.ExpiresAtUtc <= now).Select(pair => pair.Key).ToArray())
                {
                    _submissionGuards.Remove(expired);
                }

                _lastGuardCleanupUtc = now;
            }

            _submissionGuards.TryGetValue(ipHash, out var previous);
            if (previous?.BlockedUntilUtc is { } blockedUntil && blockedUntil > now)
            {
                return BookingSubmissionOutcomeRef.Blocked(MathRef.Max(1, (int)MathRef.Ceiling((blockedUntil - now).TotalSeconds)));
            }

            var sameActivePayload = previous is not null
                && previous.ExpiresAtUtc > now
                && string.Equals(previous.PayloadHash, payloadHash, StringComparisonRef.Ordinal);

            if (sameActivePayload)
            {
                var attemptCount = previous!.AttemptCount + 1;
                if (attemptCount <= 5)
                {
                    _submissionGuards[ipHash] = previous with { AttemptCount = attemptCount };
                    return BookingSubmissionOutcomeRef.Duplicate;
                }

                var blockExpiresAt = now.AddMinutes(30);
                _submissionGuards[ipHash] = previous with
                {
                    AttemptCount = attemptCount,
                    BlockedUntilUtc = blockExpiresAt,
                    ExpiresAtUtc = blockExpiresAt
                };
                return BookingSubmissionOutcomeRef.Blocked(30 * 60);
            }

            _submissionGuards[ipHash] = new SubmissionGuardState(
                payloadHash,
                AttemptCount: 1,
                ExpiresAtUtc: now.AddMinutes(30),
                BlockedUntilUtc: null);

            try
            {
                var list = await ReadInquiriesLockedAsync(cancellationToken);
                list.Add(inquiry);
                await WriteInquiriesLockedAsync(list, cancellationToken);
                _logger.LogInformation("[DevJson] Inquiry {RefId} persisted to local JSON file.", inquiry.ReferenceId);
            }
            catch
            {
                if (previous is null) _submissionGuards.Remove(ipHash);
                else _submissionGuards[ipHash] = previous;
                throw;
            }

            return BookingSubmissionOutcomeRef.Stored;
        }
        finally
        {
            FileLock.Release();
        }
    }

    public async TaskRef AddAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken = default)
    {
        await FileLock.WaitAsync(cancellationToken);
        try
        {
            var list = await ReadInquiriesLockedAsync(cancellationToken);
            list.Add(inquiry);
            await WriteInquiriesLockedAsync(list, cancellationToken);
            _logger.LogInformation("[DevJson] Inquiry {RefId} persisted to local JSON file.", inquiry.ReferenceId);
        }
        finally
        {
            FileLock.Release();
        }
    }

    public async TaskOfInquiryRef GetByReferenceIdAsync(string referenceId, CancellationTokenRef cancellationToken = default)
    {
        await FileLock.WaitAsync(cancellationToken);
        try
        {
            if (!FileRef.Exists(_filePath)) return null;

            var content = await FileRef.ReadAllTextAsync(_filePath, cancellationToken);
            if (string.IsNullOrWhiteSpace(content)) return null;

            var existing = JsonSerializerRef.Deserialize<ListOfInquiryRef>(content);
            return existing?.FirstOrDefault(i => i.ReferenceId == referenceId);
        }
        finally
        {
            FileLock.Release();
        }
    }

    private async TaskOfListRef ReadInquiriesLockedAsync(CancellationTokenRef cancellationToken)
    {
        if (!FileRef.Exists(_filePath)) return new ListOfInquiryRef();

        var content = await FileRef.ReadAllTextAsync(_filePath, cancellationToken);
        if (string.IsNullOrWhiteSpace(content)) return new ListOfInquiryRef();

        return JsonSerializerRef.Deserialize<ListOfInquiryRef>(content) ?? new ListOfInquiryRef();
    }

    private async TaskRef WriteInquiriesLockedAsync(ListOfInquiryRef inquiries, CancellationTokenRef cancellationToken)
    {
        var updatedJson = JsonSerializerRef.Serialize(inquiries, new JsonSerializerOptionsRef { WriteIndented = true });
        await FileRef.WriteAllTextAsync(_filePath, updatedJson, cancellationToken);
    }

    private sealed record SubmissionGuardState(
        string PayloadHash,
        int AttemptCount,
        DateTimeRef ExpiresAtUtc,
        DateTimeRef? BlockedUntilUtc);
}
