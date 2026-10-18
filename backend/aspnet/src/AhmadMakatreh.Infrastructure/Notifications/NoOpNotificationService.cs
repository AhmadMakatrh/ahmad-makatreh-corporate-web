// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: NoOpNotificationService
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Application.Models;
using AhmadMakatreh.Domain.Entities;
using Microsoft.Extensions.Logging;
using ILoggerOfNoOpNotificationServiceRef = global::Microsoft.Extensions.Logging.ILogger<global::AhmadMakatreh.Infrastructure.Notifications.NoOpNotificationService>;
using TaskOfNotificationDispatchStatusRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.NotificationDispatchStatus>;
using IInquiryNotificationServiceRef = global::AhmadMakatreh.Application.Interfaces.IInquiryNotificationService;
using NotificationDispatchStatusRef = global::AhmadMakatreh.Application.Models.NotificationDispatchStatus;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using TaskRef = global::System.Threading.Tasks.Task;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Notifications;

/// <summary>
/// No-op notification adapter used when external notifications are disabled or in testing environments.
/// </summary>
public class NoOpNotificationService : IInquiryNotificationServiceRef
{
    private readonly ILoggerOfNoOpNotificationServiceRef _logger;

    public NoOpNotificationService(ILoggerOfNoOpNotificationServiceRef logger)
    {
        _logger = logger;
    }

    public TaskOfNotificationDispatchStatusRef SendNotificationAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken = default)
    {
        _logger.LogDebug("[Notification] NoOp notifier active. Notification skipped for {RefId}.", inquiry.ReferenceId);
        return TaskRef.FromResult(NotificationDispatchStatusRef.Disabled);
    }
}
