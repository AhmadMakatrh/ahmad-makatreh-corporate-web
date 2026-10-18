// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: PostgreSqlLiveIntegrationTests
using System.Net;
using System.Net.Http.Json;
using AhmadMakatreh.Api.Contracts;
using AhmadMakatreh.Application.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Xunit;
using IClassFixtureOfPostgreSqlTestDatabaseRef = global::Xunit.IClassFixture<global::AhmadMakatreh.IntegrationTests.PostgreSqlTestDatabase>;
using WebApplicationFactoryOfProgramRef = global::Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<global::Program>;
using IInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryRepository;
using BookingResponseRef = global::AhmadMakatreh.Api.Contracts.BookingResponse;
using BookingRequestRef = global::AhmadMakatreh.Api.Contracts.BookingRequest;
using HttpStatusCodeRef = global::System.Net.HttpStatusCode;
using TimeSpanRef = global::System.TimeSpan;
using PostgreSqlFactAttributeRef = global::AhmadMakatreh.IntegrationTests.PostgreSqlFactAttribute;
using PostgreSqlTestDatabaseRef = global::AhmadMakatreh.IntegrationTests.PostgreSqlTestDatabase;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using BookingAbuseCleanupServiceRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.BookingAbuseCleanupService;
using NullCleanupLoggerRef = global::Microsoft.Extensions.Logging.Abstractions.NullLogger<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.BookingAbuseCleanupService>;
using NpgsqlConnectionStringBuilderRef = global::Npgsql.NpgsqlConnectionStringBuilder;
using NpgsqlConnectionRef = global::Npgsql.NpgsqlConnection;
using NpgsqlCommandRef = global::Npgsql.NpgsqlCommand;
using ServiceCollectionRef = global::Microsoft.Extensions.DependencyInjection.ServiceCollection;
using IServiceScopeFactoryRef = global::Microsoft.Extensions.DependencyInjection.IServiceScopeFactory;
using CancellationTokenSourceRef = global::System.Threading.CancellationTokenSource;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using IPAddressRef = global::System.Net.IPAddress;
using HttpClientRef = global::System.Net.Http.HttpClient;
using UriRef = global::System.Uri;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public class PostgreSqlLiveIntegrationTests : IClassFixtureOfPostgreSqlTestDatabaseRef
{
    private readonly PostgreSqlTestDatabaseRef _database;

    public PostgreSqlLiveIntegrationTests(PostgreSqlTestDatabaseRef database)
    {
        _database = database;
    }

    [PostgreSqlFactAttributeRef]
    public async TaskRef PostBooking_WithRealPostgreSql_PersistsInquirySuccessfully()
    {
        await using var customFactory = CreateFactory();
        using var client = new HttpClientRef(customFactory.Server.CreateHandler(context => context.Connection.RemoteIpAddress = IPAddressRef.Loopback))
        {
            BaseAddress = new UriRef("http://localhost")
        };

        var request = new BookingRequestRef(
            Name: "PostgreSQL Integration Tester",
            Email: "postgres_test@example.com",
            ProjectDetails: "Verifying live database persistence directly against real PostgreSQL instance."
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/booking", request);

        // Assert HTTP response
        response.StatusCode.Should().Be(HttpStatusCodeRef.OK);
        var json = await response.Content.ReadFromJsonAsync<BookingResponseRef>();
        json.Should().NotBeNull();
        json!.Success.Should().BeTrue();
        json.ReferenceId.Should().NotBeNullOrWhiteSpace();

        // Assert Database Content: Query repository via service scope
        using var scope = customFactory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IInquiryRepositoryRef>();
        var persistedInquiry = await repository.GetByReferenceIdAsync(json.ReferenceId!);

        persistedInquiry.Should().NotBeNull();
        persistedInquiry!.ReferenceId.Should().Be(json.ReferenceId);
        persistedInquiry.Name.Should().Be("PostgreSQL Integration Tester");
        persistedInquiry.Email.Should().Be("postgres_test@example.com");
        persistedInquiry.ProjectDetails.Should().Be("Verifying live database persistence directly against real PostgreSQL instance.");
    }

    [PostgreSqlFactAttributeRef]
    public async TaskRef GetHealthReady_WithRealPostgreSql_ReturnsOkReady()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCodeRef.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Ready");
    }

    [PostgreSqlFactAttributeRef]
    public async TaskRef Cleanup_DoesNotDeleteGuardRenewedWhileWaitingForItsRowLock()
    {
        using var timeout = new CancellationTokenSourceRef(TimeSpanRef.FromSeconds(15));
        var token = timeout.Token;
        var hash = GuidRef.NewGuid().ToString("N");
        await using var monitor = new NpgsqlConnectionRef(_database.ConnectionString);
        await monitor.OpenAsync(token);
        await using (var seed = new NpgsqlCommandRef("INSERT INTO booking_submission_guards (ip_hash, payload_hash, attempt_count, window_started_at_utc, expires_at_utc) VALUES (@hash, @hash, 1, now() - INTERVAL '1 hour', now() - INTERVAL '30 minutes')", monitor))
        {
            seed.Parameters.AddWithValue("hash", hash);
            await seed.ExecuteNonQueryAsync(token);
        }

        await using var writer = new NpgsqlConnectionRef(_database.ConnectionString);
        await writer.OpenAsync(token);
        await using var transaction = await writer.BeginTransactionAsync(token);
        await using (var renew = new NpgsqlCommandRef("UPDATE booking_submission_guards SET expires_at_utc = now() + INTERVAL '30 minutes' WHERE ip_hash = @hash", writer, transaction))
        {
            renew.Parameters.AddWithValue("hash", hash);
            await renew.ExecuteNonQueryAsync(token);
        }

        var applicationName = "cleanup-race-" + hash;
        var cleanupSettings = new NpgsqlConnectionStringBuilderRef(_database.ConnectionString) { ApplicationName = applicationName };
        await using var services = new ServiceCollectionRef().AddDbContext<AppDbContextRef>(options => options.UseNpgsql(cleanupSettings.ConnectionString)).BuildServiceProvider();
        using var cleanup = new BookingAbuseCleanupServiceRef(services.GetRequiredService<IServiceScopeFactoryRef>(), NullCleanupLoggerRef.Instance);
        await cleanup.StartAsync(token);
        try
        {
            await WaitForCleanupAsync(monitor, applicationName, waitingForLock: true, token);
            await transaction.CommitAsync(token);
            await WaitForCleanupAsync(monitor, applicationName, waitingForLock: false, token);
            await using var read = new NpgsqlCommandRef("SELECT COUNT(*) FROM booking_submission_guards WHERE ip_hash = @hash AND expires_at_utc > now()", monitor);
            read.Parameters.AddWithValue("hash", hash);
            (await read.ExecuteScalarAsync(token)).Should().Be(1L);
        }
        finally
        {
            using var stop = new CancellationTokenSourceRef(TimeSpanRef.FromSeconds(5));
            await cleanup.StopAsync(stop.Token);
        }
    }

    private WebApplicationFactoryOfProgramRef CreateFactory() => new WebApplicationFactoryOfProgramRef().WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Persistence:Provider", "Postgres");
        builder.UseSetting("Persistence:AutoMigrateInDevelopment", "false");
        builder.UseSetting("ConnectionStrings:DefaultConnection", _database.ConnectionString);
        builder.UseSetting("Turnstile:Enabled", "false");
        builder.UseSetting("Turnstile:AllowDevelopmentBypass", "true");
        builder.UseSetting("Email:Enabled", "false");
        builder.UseSetting("ReverseProxy:TrustCloudflareProxy", "false");
    });

    private static async TaskRef WaitForCleanupAsync(NpgsqlConnectionRef monitor, string applicationName, bool waitingForLock, CancellationTokenRef token)
    {
        var sql = waitingForLock
            ? "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = @name AND wait_event_type = 'Lock')"
            : "SELECT NOT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = @name AND state = 'active')";
        await using var command = new NpgsqlCommandRef(sql, monitor);
        command.Parameters.AddWithValue("name", applicationName);
        while (!(bool)(await command.ExecuteScalarAsync(token))!)
            await TaskRef.Delay(10, token);
    }
}
