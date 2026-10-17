// codeguard:components:start
// codeguard:defines: PostgreSqlTestDatabase, PostgreSqlFactAttribute, PostgreSqlTestConfigurationTests
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using DbContextOptionsBuilderRef = global::Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext>;
using NpgsqlConnectionStringBuilderRef = global::Npgsql.NpgsqlConnectionStringBuilder;
using NpgsqlConnectionRef = global::Npgsql.NpgsqlConnection;
using NpgsqlCommandRef = global::Npgsql.NpgsqlCommand;
using PostgreSqlTestDatabaseRef = global::AhmadMakatreh.IntegrationTests.PostgreSqlTestDatabase;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using StringComparisonRef = global::System.StringComparison;
using IAsyncLifetimeRef = global::Xunit.IAsyncLifetime;
using FactAttributeRef = global::Xunit.FactAttribute;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using EnvironmentRef = global::System.Environment;
using IPAddressRef = global::System.Net.IPAddress;
using GuidRef = global::System.Guid;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.IntegrationTests;

public sealed class PostgreSqlTestDatabase : IAsyncLifetimeRef
{
    public const string ConnectionVariable = "AHMAD_TEST_POSTGRES_CONNECTION";
    private const string ConnectionVariableRef = ConnectionVariable;
    private readonly string _databaseName = "ahmad_makatreh_test_" + GuidRef.NewGuid().ToString("N");
    private string? _administrationConnection;
    private bool _created;
    public string ConnectionString { get; private set; } = string.Empty;

    public static NpgsqlConnectionStringBuilderRef ParseSettings(string configured)
    {
        var settings = new NpgsqlConnectionStringBuilderRef(configured);
        var local = string.Equals(settings.Host, "localhost", StringComparisonRef.OrdinalIgnoreCase)
            || (IPAddressRef.TryParse(settings.Host, out var address) && IPAddressRef.IsLoopback(address));
        if (!local || settings.Database != "postgres" || string.IsNullOrWhiteSpace(settings.Username))
            throw new InvalidOperationExceptionRef("PostgreSQL tests require an explicitly configured loopback test server, Database=postgres, and a test role allowed to create databases.");

        settings.Pooling = false;
        settings.Timeout = 5;
        settings.CommandTimeout = 15;
        settings.IncludeErrorDetail = false;
        settings.ApplicationName = "AhmadMakatreh isolated tests";
        return settings;
    }

    public async TaskRef InitializeAsync()
    {
        var configured = EnvironmentRef.GetEnvironmentVariable(ConnectionVariableRef);
        if (string.IsNullOrWhiteSpace(configured)) return;
        var settings = ParseSettings(configured);
        _administrationConnection = settings.ConnectionString;
        await using var administration = new NpgsqlConnectionRef(_administrationConnection);
        await administration.OpenAsync();
        // Only this fixture's generated database is created, migrated, or dropped.
        await using var create = new NpgsqlCommandRef($"CREATE DATABASE \"{_databaseName}\"", administration);
        await create.ExecuteNonQueryAsync();
        _created = true;
        settings.Database = _databaseName;
        ConnectionString = settings.ConnectionString;
        try
        {
            await using var context = new AppDbContextRef(new DbContextOptionsBuilderRef().UseNpgsql(ConnectionString).Options);
            await context.Database.MigrateAsync();
        }
        catch
        {
            await DisposeAsync();
            throw;
        }
    }

    public async TaskRef DisposeAsync()
    {
        if (!_created) return;
        await using var administration = new NpgsqlConnectionRef(_administrationConnection);
        await administration.OpenAsync();
        await using var drop = new NpgsqlCommandRef($"DROP DATABASE \"{_databaseName}\"", administration);
        await drop.ExecuteNonQueryAsync();
        _created = false;
    }
}

public sealed class PostgreSqlFactAttribute : FactAttributeRef
{
    public PostgreSqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(EnvironmentRef.GetEnvironmentVariable(PostgreSqlTestDatabaseRef.ConnectionVariable)))
            Skip = $"Set {PostgreSqlTestDatabaseRef.ConnectionVariable} to a dedicated loopback PostgreSQL test server (Database=postgres); tests create and drop their own isolated database.";
    }
}

public class PostgreSqlTestConfigurationTests
{
    [TheoryAttributeRef]
    [InlineDataAttributeRef("Host=remote.example;Database=postgres;Username=test")]
    [InlineDataAttributeRef("Host=127.0.0.1;Database=ahmad_makatreh_prod;Username=test")]
    [InlineDataAttributeRef("Host=127.0.0.1;Database=ahmad_makatreh_dev;Username=test")]
    [InlineDataAttributeRef("Host=127.0.0.1;Database=postgres")]
    public void RejectsSharedApplicationDatabaseAndNonlocalServer(string configured)
    {
        var parse = () => PostgreSqlTestDatabaseRef.ParseSettings(configured);
        parse.Should().Throw<InvalidOperationExceptionRef>();
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef("localhost")]
    [InlineDataAttributeRef("127.0.0.1")]
    [InlineDataAttributeRef("::1")]
    public void ExplicitTestServerUsesBoundedConnectionsWithoutPooling(string host)
    {
        var settings = PostgreSqlTestDatabaseRef.ParseSettings($"Host={host};Database=postgres;Username=test;Port=55432");
        settings.Host.Should().Be(host);
        settings.Port.Should().Be(55432);
        settings.Pooling.Should().BeFalse();
        settings.Timeout.Should().Be(5);
    }
}
