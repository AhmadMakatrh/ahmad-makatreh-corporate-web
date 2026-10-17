// codeguard:components:start
// codeguard:defines: BookingAbuseCleanupService
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ILoggerOfBookingAbuseCleanupServiceRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.BookingAbuseCleanupService>;
using OperationCanceledExceptionRef = global::System.OperationCanceledException;
using IServiceScopeFactoryRef = global::Microsoft.Extensions.DependencyInjection.IServiceScopeFactory;
using BackgroundServiceRef = global::Microsoft.Extensions.Hosting.BackgroundService;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using PeriodicTimerRef = global::System.Threading.PeriodicTimer;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using ExceptionRef = global::System.Exception;
using TimeSpanRef = global::System.TimeSpan;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

/// <summary>
/// Removes expired keyed abuse metadata so the guard table remains bounded.
/// </summary>
public sealed class BookingAbuseCleanupService : BackgroundServiceRef
{
    private static readonly TimeSpanRef CleanupInterval = TimeSpanRef.FromHours(6);
    private const int BatchSize = 1000;
    private const int BatchSizeRef = BatchSize;

    private readonly IServiceScopeFactoryRef _scopeFactory;
    private readonly ILoggerOfBookingAbuseCleanupServiceRef _logger;

    public BookingAbuseCleanupService(
        IServiceScopeFactoryRef scopeFactory,
        ILoggerOfBookingAbuseCleanupServiceRef logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async TaskRef ExecuteAsync(CancellationTokenRef stoppingToken)
    {
        using var timer = new PeriodicTimerRef(CleanupInterval);
        do
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContextRef>();
                // Recheck expiry after any row-lock wait: a booking can renew a selected guard.
                var deleted = await db.Database.ExecuteSqlRawAsync(
                    "WITH expired AS (SELECT ip_hash FROM booking_submission_guards WHERE expires_at_utc <= now() ORDER BY expires_at_utc LIMIT {0}) DELETE FROM booking_submission_guards WHERE ip_hash IN (SELECT ip_hash FROM expired) AND expires_at_utc <= now()",
                    new object[] { BatchSizeRef },
                    stoppingToken);

                if (deleted > 0)
                {
                    _logger.LogDebug("Removed {Count} expired booking abuse records.", deleted);
                }
            }
            catch (OperationCanceledExceptionRef) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (ExceptionRef exception)
            {
                _logger.LogWarning(exception, "Booking abuse record cleanup failed; it will retry on the next interval.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
