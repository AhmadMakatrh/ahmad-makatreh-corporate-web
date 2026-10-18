// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: PostgreSqlInquiryRepository
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Persistence;
using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ILoggerOfPostgreSqlInquiryRepositoryRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.PostgreSqlInquiryRepository>;
using TaskOfBookingSubmissionOutcomeRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome>;
using BookingSubmissionDispositionRef = global::AhmadMakatreh.Application.Models.BookingSubmissionDisposition;
using DbCommandRef = global::System.Data.Common.DbCommand;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using BookingSubmissionOutcomeRef = global::AhmadMakatreh.Application.Models.BookingSubmissionOutcome;
using IAdminInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IAdminInquiryRepository;
using IInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryRepository;
using BookingAbuseHasherRef = global::AhmadMakatreh.Infrastructure.Persistence.BookingAbuseHasher;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using ArgumentExceptionRef = global::System.ArgumentException;
using ConnectionStateRef = global::System.Data.ConnectionState;
using TaskOfInquiryRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Domain.Entities.Inquiry?>;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using DbTypeRef = global::System.Data.DbType;
using DBNullRef = global::System.DBNull;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

/// <summary>
/// Production-grade inquiry persistence adapter using PostgreSQL and EF Core.
/// Guarantees ACID transactional durability, concurrency resilience, and horizontal scaling compatibility.
/// </summary>
public partial class PostgreSqlInquiryRepository : IInquiryRepositoryRef, IAdminInquiryRepositoryRef
{
    private readonly AppDbContextRef _context;
    private readonly BookingAbuseHasherRef _abuseHasher;
    private readonly ILoggerOfPostgreSqlInquiryRepositoryRef _logger;

    public PostgreSqlInquiryRepository(
        AppDbContextRef context,
        BookingAbuseHasherRef abuseHasher,
        ILoggerOfPostgreSqlInquiryRepositoryRef logger)
    {
        _context = context;
        _abuseHasher = abuseHasher;
        _logger = logger;
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
        var connection = _context.Database.GetDbConnection();
        var shouldCloseConnection = connection.State != ConnectionStateRef.Open;

        var strategy = _context.Database.CreateExecutionStrategy();
        var outcome = await strategy.ExecuteAsync(async () =>
        {
            if (shouldCloseConnection)
            {
                await connection.OpenAsync(cancellationToken);
            }

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = GateAndInsertSqlRef;
                AddParameter(command, "ip_hash", ipHash, DbTypeRef.String);
                AddParameter(command, "payload_hash", payloadHash, DbTypeRef.String);
                AddParameter(command, "id", inquiry.Id, DbTypeRef.Guid);
                AddParameter(command, "reference_id", inquiry.ReferenceId, DbTypeRef.String);
                AddParameter(command, "name", inquiry.Name, DbTypeRef.String);
                AddParameter(command, "email", inquiry.Email, DbTypeRef.String);
                AddParameter(command, "project_details", inquiry.ProjectDetails, DbTypeRef.String);
                AddParameter(command, "service_key", inquiry.ServiceKey, DbTypeRef.String);
                AddParameter(command, "inquiry_category", inquiry.InquiryCategory, DbTypeRef.String);
                AddParameter(command, "status", inquiry.Status.ToString(), DbTypeRef.String);
                AddParameter(command, "created_at_utc", inquiry.CreatedAtUtc, DbTypeRef.DateTime);
                AddParameter(command, "updated_at_utc", inquiry.UpdatedAtUtc, DbTypeRef.DateTime);

                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                if (!await reader.ReadAsync(cancellationToken))
                {
                    throw new InvalidOperationExceptionRef("The booking submission guard returned no result.");
                }

                var disposition = reader.GetString(0);
                if (disposition == "stored") return BookingSubmissionOutcomeRef.Stored;
                if (disposition == "duplicate") return BookingSubmissionOutcomeRef.Duplicate;

                return BookingSubmissionOutcomeRef.Blocked(reader.GetInt32(1));
            }
            finally
            {
                if (shouldCloseConnection)
                {
                    await connection.CloseAsync();
                }
            }
        });

        if (outcome.Disposition == BookingSubmissionDispositionRef.Stored)
        {
            _logger.LogDebug("Inquiry {ReferenceId} committed to PostgreSQL database.", inquiry.ReferenceId);
        }

        return outcome;
    }

    public async TaskRef AddAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken = default)
    {
        await _context.Inquiries.AddAsync(inquiry, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogDebug("Inquiry {ReferenceId} committed to PostgreSQL database.", inquiry.ReferenceId);
    }

    public async TaskOfInquiryRef GetByReferenceIdAsync(string referenceId, CancellationTokenRef cancellationToken = default)
    {
        return await _context.Inquiries
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.ReferenceId == referenceId, cancellationToken);
    }

    private static void AddParameter(DbCommandRef command, string name, object? value, DbTypeRef type)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.DbType = type;
        parameter.Value = value ?? DBNullRef.Value;
        command.Parameters.Add(parameter);
    }

    private const string GateAndInsertSql = """
        WITH guard AS (
            INSERT INTO booking_submission_guards (
                ip_hash, payload_hash, attempt_count, window_started_at_utc, blocked_until_utc, expires_at_utc)
            VALUES (
                @ip_hash, @payload_hash, 1, now(), NULL, now() + INTERVAL '30 minutes')
            ON CONFLICT (ip_hash) DO UPDATE SET
                payload_hash = CASE
                    WHEN booking_submission_guards.blocked_until_utc > now() THEN booking_submission_guards.payload_hash
                    WHEN booking_submission_guards.expires_at_utc <= now()
                         OR booking_submission_guards.payload_hash <> EXCLUDED.payload_hash THEN EXCLUDED.payload_hash
                    ELSE booking_submission_guards.payload_hash
                END,
                attempt_count = CASE
                    WHEN booking_submission_guards.blocked_until_utc > now() THEN booking_submission_guards.attempt_count
                    WHEN booking_submission_guards.expires_at_utc <= now()
                         OR booking_submission_guards.payload_hash <> EXCLUDED.payload_hash THEN 1
                    ELSE booking_submission_guards.attempt_count + 1
                END,
                window_started_at_utc = CASE
                    WHEN booking_submission_guards.blocked_until_utc > now() THEN booking_submission_guards.window_started_at_utc
                    WHEN booking_submission_guards.expires_at_utc <= now()
                         OR booking_submission_guards.payload_hash <> EXCLUDED.payload_hash THEN now()
                    ELSE booking_submission_guards.window_started_at_utc
                END,
                blocked_until_utc = CASE
                    WHEN booking_submission_guards.blocked_until_utc > now() THEN booking_submission_guards.blocked_until_utc
                    WHEN booking_submission_guards.expires_at_utc <= now()
                         OR booking_submission_guards.payload_hash <> EXCLUDED.payload_hash THEN NULL
                    WHEN booking_submission_guards.attempt_count >= 5 THEN now() + INTERVAL '30 minutes'
                    ELSE NULL
                END,
                expires_at_utc = CASE
                    WHEN booking_submission_guards.blocked_until_utc > now() THEN booking_submission_guards.expires_at_utc
                    WHEN booking_submission_guards.expires_at_utc <= now()
                         OR booking_submission_guards.payload_hash <> EXCLUDED.payload_hash THEN now() + INTERVAL '30 minutes'
                    WHEN booking_submission_guards.attempt_count >= 5 THEN now() + INTERVAL '30 minutes'
                    ELSE booking_submission_guards.expires_at_utc
                END
            RETURNING attempt_count, blocked_until_utc
        ), classified AS (
            SELECT
                CASE
                    WHEN blocked_until_utc > now() THEN 'blocked'
                    WHEN attempt_count = 1 THEN 'stored'
                    ELSE 'duplicate'
                END AS disposition,
                CASE
                    WHEN blocked_until_utc > now()
                        THEN GREATEST(1, CEIL(EXTRACT(EPOCH FROM (blocked_until_utc - now())))::integer)
                    ELSE NULL
                END AS retry_after_seconds
            FROM guard
        ), persisted_inquiry AS (
            INSERT INTO inquiries (
                "Id", "ReferenceId", "Name", "Email", "ProjectDetails", "ServiceKey",
                "InquiryCategory", "Status", "CreatedAtUtc", "UpdatedAtUtc")
            SELECT
                @id, @reference_id, @name, @email, @project_details, @service_key,
                @inquiry_category, @status, @created_at_utc, @updated_at_utc
            FROM classified
            WHERE disposition = 'stored'
            RETURNING 1
        )
        SELECT classified.disposition, classified.retry_after_seconds
        FROM classified
        CROSS JOIN (SELECT COUNT(*) FROM persisted_inquiry) AS persisted;
        """;
    private const string GateAndInsertSqlRef = GateAndInsertSql;
}
