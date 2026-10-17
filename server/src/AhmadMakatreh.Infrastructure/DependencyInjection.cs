// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: DependencyInjection
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Infrastructure.BotVerification;
using AhmadMakatreh.Infrastructure.Notifications;
using AhmadMakatreh.Infrastructure.Options;
using AhmadMakatreh.Infrastructure.Persistence.DevJson;
using AhmadMakatreh.Infrastructure.Persistence;
using AhmadMakatreh.Infrastructure.Persistence.PostgreSql;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using AhmadMakatreh.Infrastructure.Storage;
using CloudflareTurnstileVerificationServiceRef = global::AhmadMakatreh.Infrastructure.BotVerification.CloudflareTurnstileVerificationService;
using PostgreSqlSiteDocumentRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.PostgreSqlSiteDocumentRepository;
using PostgreSqlInquiryReplyRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.PostgreSqlInquiryReplyRepository;
using DevJsonSiteDocumentRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonSiteDocumentRepository;
using DevJsonInquiryReplyRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryReplyRepository;
using PostgreSqlInquiryRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.PostgreSqlInquiryRepository;
using IInquiryNotificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IInquiryNotificationService;
using BookingAbuseCleanupServiceRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.BookingAbuseCleanupService;
using MailKitNotificationServiceRef = global::AhmadMakatreh.Infrastructure.Notifications.MailKitNotificationService;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using PostgreSqlMediaRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.PostgreSqlMediaRepository;
using DevJsonInquiryRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonInquiryRepository;
using IAdminInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IAdminInquiryRepository;
using ISiteDocumentRepositoryRef = global::AhmadMakatreh.Application.Interfaces.ISiteDocumentRepository;
using IInquiryReplyRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplyRepository;
using IBotVerificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IBotVerificationService;
using NoOpNotificationServiceRef = global::AhmadMakatreh.Infrastructure.Notifications.NoOpNotificationService;
using DevJsonMediaRepositoryRef = global::AhmadMakatreh.Infrastructure.Persistence.DevJson.DevJsonMediaRepository;
using RandomNumberGeneratorRef = global::System.Security.Cryptography.RandomNumberGenerator;
using IPublishedSiteReaderRef = global::AhmadMakatreh.Application.Interfaces.IPublishedSiteReader;
using PublishedSiteReaderRef = global::AhmadMakatreh.Infrastructure.Persistence.PublishedSiteReader;
using IInquiryReplySenderRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplySender;
using IServiceCollectionRef = global::Microsoft.Extensions.DependencyInjection.IServiceCollection;
using BookingAbuseHasherRef = global::AhmadMakatreh.Infrastructure.Persistence.BookingAbuseHasher;
using IInquiryRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IInquiryRepository;
using MailKitReplySenderRef = global::AhmadMakatreh.Infrastructure.Notifications.MailKitReplySender;
using LocalMediaStorageRef = global::AhmadMakatreh.Infrastructure.Storage.LocalMediaStorage;
using IHostEnvironmentRef = global::Microsoft.Extensions.Hosting.IHostEnvironment;
using TurnstileOptionsRef = global::AhmadMakatreh.Infrastructure.Options.TurnstileOptions;
using StringComparisonRef = global::System.StringComparison;
using IMediaRepositoryRef = global::AhmadMakatreh.Application.Interfaces.IMediaRepository;
using DatabaseOptionsRef = global::AhmadMakatreh.Infrastructure.Options.DatabaseOptions;
using IConfigurationRef = global::Microsoft.Extensions.Configuration.IConfiguration;
using R2MediaStorageRef = global::AhmadMakatreh.Infrastructure.Storage.R2MediaStorage;
using IMediaStorageRef = global::AhmadMakatreh.Application.Interfaces.IMediaStorage;
using EmailOptionsRef = global::AhmadMakatreh.Infrastructure.Options.EmailOptions;
using MediaOptionsRef = global::AhmadMakatreh.Infrastructure.Options.MediaOptions;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using EncodingRef = global::System.Text.Encoding;
using ConvertRef = global::System.Convert;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollectionRef AddInfrastructure(
        this IServiceCollectionRef services,
        IConfigurationRef configuration,
        IHostEnvironmentRef environment)
    {
        // 1. Options Configurations
        services.Configure<TurnstileOptionsRef>(configuration.GetSection(TurnstileOptionsRef.SectionName));
        services.Configure<EmailOptionsRef>(configuration.GetSection(EmailOptionsRef.SectionName));
        services.Configure<DatabaseOptionsRef>(configuration.GetSection(DatabaseOptionsRef.SectionName));
        services.Configure<MediaOptionsRef>(configuration.GetSection("Media"));
        if (environment.IsDevelopment() && (configuration["Media:Provider"] is null or "Local")) services.AddSingleton<IMediaStorageRef, LocalMediaStorageRef>();
        else services.AddSingleton<IMediaStorageRef, R2MediaStorageRef>();

        // 2. Persistence Provider Selection (Explicit & Fail-Closed)
        var persistenceProvider = configuration.GetValue<string>("Persistence:Provider") ?? "Postgres";
        var hmacKey = configuration["BookingAbuse:HmacKey"];
        if (string.IsNullOrWhiteSpace(hmacKey))
        {
            if (persistenceProvider.Equals("Postgres", StringComparisonRef.OrdinalIgnoreCase) && !environment.IsDevelopment())
            {
                throw new InvalidOperationExceptionRef(
                    "Configuration Error: BookingAbuse:HmacKey must be configured with at least 32 bytes outside Development.");
            }

            hmacKey = ConvertRef.ToBase64String(RandomNumberGeneratorRef.GetBytes(32));
        }

        var hmacKeyBytes = EncodingRef.UTF8.GetBytes(hmacKey);
        if (hmacKeyBytes.Length < 32)
        {
            throw new InvalidOperationExceptionRef("Configuration Error: BookingAbuse:HmacKey must contain at least 32 UTF-8 bytes.");
        }

        services.AddSingleton(new BookingAbuseHasherRef(hmacKeyBytes));

        if (persistenceProvider.Equals("Json", StringComparisonRef.OrdinalIgnoreCase))
        {
            if (!environment.IsDevelopment())
            {
                throw new InvalidOperationExceptionRef(
                    $"Security Error: Persistence provider 'Json' is strictly forbidden in '{environment.EnvironmentName}' environment. Only durable PostgreSQL persistence is allowed.");
            }

            services.AddSingleton<IInquiryRepositoryRef, DevJsonInquiryRepositoryRef>();
            services.AddSingleton<IAdminInquiryRepositoryRef>(provider => (DevJsonInquiryRepositoryRef)provider.GetRequiredService<IInquiryRepositoryRef>());
            services.AddSingleton<ISiteDocumentRepositoryRef, DevJsonSiteDocumentRepositoryRef>();
            services.AddSingleton<IMediaRepositoryRef, DevJsonMediaRepositoryRef>();
            services.AddSingleton<IInquiryReplyRepositoryRef, DevJsonInquiryReplyRepositoryRef>();
        }
        else if (persistenceProvider.Equals("Postgres", StringComparisonRef.OrdinalIgnoreCase))
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationExceptionRef(
                    "Configuration Error: Persistence:Provider is set to 'Postgres' but 'ConnectionStrings:DefaultConnection' is missing or empty.");
            }

            services.AddDbContext<AppDbContextRef>(options =>
                options.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly(typeof(AppDbContextRef).Assembly.FullName);
                    npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
                }));

            services.AddScoped<IInquiryRepositoryRef, PostgreSqlInquiryRepositoryRef>();
            services.AddScoped<IAdminInquiryRepositoryRef>(provider => (PostgreSqlInquiryRepositoryRef)provider.GetRequiredService<IInquiryRepositoryRef>());
            services.AddScoped<ISiteDocumentRepositoryRef, PostgreSqlSiteDocumentRepositoryRef>();
            services.AddScoped<IMediaRepositoryRef, PostgreSqlMediaRepositoryRef>();
            services.AddScoped<IInquiryReplyRepositoryRef, PostgreSqlInquiryReplyRepositoryRef>();
            services.AddHostedService<BookingAbuseCleanupServiceRef>();
        }
        else
        {
            throw new InvalidOperationExceptionRef($"Unsupported persistence provider: '{persistenceProvider}'. Must be 'Postgres' or 'Json'.");
        }

        // 3. Bot Challenge Verification (Turnstile)
        services.AddSingleton<IPublishedSiteReaderRef, PublishedSiteReaderRef>();
        services.AddHttpClient<IBotVerificationServiceRef, CloudflareTurnstileVerificationServiceRef>();

        // 4. Notifications (MailKit or NoOp)
        var emailEnabled = configuration.GetValue<bool>("Email:Enabled", false);
        services.AddScoped<IInquiryReplySenderRef, MailKitReplySenderRef>();
        if (emailEnabled)
        {
            services.AddScoped<IInquiryNotificationServiceRef, MailKitNotificationServiceRef>();
        }
        else
        {
            services.AddSingleton<IInquiryNotificationServiceRef, NoOpNotificationServiceRef>();
        }

        return services;
    }
}
