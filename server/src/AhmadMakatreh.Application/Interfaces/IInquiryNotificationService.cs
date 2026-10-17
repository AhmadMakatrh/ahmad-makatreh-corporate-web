// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: IInquiryNotificationService
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Application.Models;
using TaskOfNotificationDispatchStatusRef = global::System.Threading.Tasks.Task<global::AhmadMakatreh.Application.Models.NotificationDispatchStatus>;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
// codeguard:components:end

namespace AhmadMakatreh.Application.Interfaces;

/// <summary>
/// Abstraction for customer booking inquiry notifications (email, webhook, SMS, etc.).
/// Decouples persistence from external dispatch channels.
/// </summary>
public interface IInquiryNotificationService
{
    TaskOfNotificationDispatchStatusRef SendNotificationAsync(InquiryRef inquiry, CancellationTokenRef cancellationToken = default);
}
