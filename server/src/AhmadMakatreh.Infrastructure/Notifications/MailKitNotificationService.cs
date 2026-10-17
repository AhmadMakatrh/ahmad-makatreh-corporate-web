// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: MailKitNotificationService
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using ILoggerOfMailKitNotificationServiceRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Infrastructure.Notifications.MailKitNotificationService>;
using TaskOfNotificationDispatchStatusRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.NotificationDispatchStatus>;
using IInquiryNotificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IInquiryNotificationService;
using NotificationDispatchStatusRef = global::AhmadMakatreh.Application.Models.NotificationDispatchStatus;
using IOptionsOfEmailOptionsRef = global::Microsoft.Extensions.Options.IOptions<global::AhmadMakatreh.Infrastructure.Options.EmailOptions>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using InquiryCategoriesRef = global::AhmadMakatreh.Application.Models.InquiryCategories;
using ServicePackagesRef = global::AhmadMakatreh.Application.Models.ServicePackages;
using MailboxAddressRef = global::MimeKit.MailboxAddress;
using EmailOptionsRef = global::AhmadMakatreh.Infrastructure.Options.EmailOptions;
using MimeMessageRef = global::MimeKit.MimeMessage;
using BodyBuilderRef = global::MimeKit.BodyBuilder;
using SmtpClientRef = global::MailKit.Net.Smtp.SmtpClient;
using ExceptionRef = global::System.Exception;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Notifications;

/// <summary>
/// Modern, actively maintained SMTP notification adapter using MailKit.
/// Replaces obsolete System.Net.Mail.SmtpClient.
/// </summary>
public class MailKitNotificationService : IInquiryNotificationServiceRef
{
    private readonly EmailOptionsRef _options;
    private readonly ILoggerOfMailKitNotificationServiceRef _logger;

    public MailKitNotificationService(IOptionsOfEmailOptionsRef options, ILoggerOfMailKitNotificationServiceRef logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async TaskOfNotificationDispatchStatusRef SendNotificationAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken = default)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            _logger.LogDebug("Email notifications are disabled or not configured. Skipping dispatch for {RefId}.", inquiry.ReferenceId);
            return NotificationDispatchStatusRef.Disabled;
        }

        var message = new MimeMessageRef();
        message.From.Add(new MailboxAddressRef("Ahmad Makatreh Site", _options.FromEmail));
        message.To.Add(new MailboxAddressRef("Admin", _options.RecipientEmail));
        var serviceName = ServicePackagesRef.GetName(inquiry.ServiceKey);
        var category = InquiryCategoriesRef.GetDetails(inquiry.InquiryCategory);
        var subject = serviceName is null
            ? $"New Booking Inquiry [{inquiry.ReferenceId}] from {inquiry.Name}"
            : $"New {serviceName} Inquiry [{inquiry.ReferenceId}] from {inquiry.Name}";
        message.Subject = category is null ? subject : $"[{category.Value.Tag}] {subject}";

        var bodyBuilder = new BodyBuilderRef
        {
            TextBody = $"""
            Reference ID: {inquiry.ReferenceId}
            Timestamp (UTC): {inquiry.CreatedAtUtc:u}

            Client Name: {inquiry.Name}
            Client Email: {inquiry.Email}

            Requested Service: {serviceName ?? "General inquiry"}
            Inquiry Category: {category?.Label ?? "Not specified"}

            Project Details & Scope:
            {inquiry.ProjectDetails}
            """
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClientRef();
        await client.ConnectAsync(_options.SmtpHost, _options.SmtpPort, _options.SocketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            await client.AuthenticateAsync(_options.Username, _options.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        try
        {
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (ExceptionRef ex)
        {
            _logger.LogWarning(ex, "SMTP disconnect failed after accepting notification for ReferenceId: {RefId}", inquiry.ReferenceId);
        }

        _logger.LogInformation("Email notification accepted by SMTP for ReferenceId: {RefId}", inquiry.ReferenceId);
        return NotificationDispatchStatusRef.Accepted;
    }
}
