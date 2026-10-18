// codeguard:components:start
// codeguard:defines: MailKitReplySender
using AhmadMakatreh.Application.Interfaces;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using AuthenticationExceptionRef = global::MailKit.Security.AuthenticationException;
using SocketExceptionRef = global::System.Net.Sockets.SocketException;
using OperationCanceledExceptionRef = global::System.OperationCanceledException;
using InvalidOperationExceptionRef = global::System.InvalidOperationException;
using ProtocolExceptionRef = global::MailKit.ProtocolException;
using CommandExceptionRef = global::MailKit.CommandException;
using CancellationTokenSourceRef = global::System.Threading.CancellationTokenSource;
using IOptionsOfEmailOptionsRef = global::Microsoft.Extensions.Options.IOptions<global::AhmadMakatreh.Infrastructure.Options.EmailOptions>;
using SslHandshakeExceptionRef = global::MailKit.Security.SslHandshakeException;
using SmtpCommandExceptionRef = global::MailKit.Net.Smtp.SmtpCommandException;
using IInquiryReplySenderRef = global::AhmadMakatreh.Application.Interfaces.IInquiryReplySender;
using CancellationTokenRef = global::System.Threading.CancellationToken;
using MailboxAddressRef = global::MimeKit.MailboxAddress;
using EmailOptionsRef = global::AhmadMakatreh.Infrastructure.Options.EmailOptions;
using TaskOfStringRef = global::System.Threading.Tasks.Task<string>;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using MimeMessageRef = global::MimeKit.MimeMessage;
using IOExceptionRef = global::System.IO.IOException;
using SmtpClientRef = global::MailKit.Net.Smtp.SmtpClient;
using ExceptionRef = global::System.Exception;
using TextPartRef = global::MimeKit.TextPart;
using TimeSpanRef = global::System.TimeSpan;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Notifications;

public class MailKitReplySender(IOptionsOfEmailOptionsRef options) : IInquiryReplySenderRef
{
    private readonly EmailOptionsRef _options = options.Value;
    public bool IsConfigured => _options.Enabled && !string.IsNullOrWhiteSpace(_options.SmtpHost) && MailboxAddressRef.TryParse(_options.FromEmail, out _);
    public async TaskOfStringRef SendAsync(InquiryRef inquiry, InquiryReplyRef reply, CancellationTokenRef token)
    {
        if (!IsConfigured) throw new InvalidOperationExceptionRef("Reply email is not configured.");
        var message = new MimeMessageRef { Subject = reply.Subject, MessageId = $"{reply.Id:N}@ahmad-makatreh.vip", Body = new TextPartRef("plain") { Text = reply.Body } };
        message.From.Add(new MailboxAddressRef("Ahmad Makatreh", _options.FromEmail)); message.To.Add(new MailboxAddressRef(inquiry.Name, inquiry.Email));
        using var timeout = CancellationTokenSourceRef.CreateLinkedTokenSource(token); timeout.CancelAfter(TimeSpanRef.FromSeconds(12));
        using var client = new SmtpClientRef { Timeout = 12000 };
        try
        {
            await client.ConnectAsync(_options.SmtpHost, _options.SmtpPort, _options.SocketOptions, timeout.Token);
            if (!string.IsNullOrWhiteSpace(_options.Username)) await client.AuthenticateAsync(_options.Username, _options.Password, timeout.Token);
        }
        catch (ExceptionRef exception) when (exception is IOExceptionRef or ProtocolExceptionRef or CommandExceptionRef or OperationCanceledExceptionRef or SocketExceptionRef or AuthenticationExceptionRef or SslHandshakeExceptionRef)
        { return "failed"; }
        try { await client.SendAsync(message, timeout.Token); return "accepted"; }
        catch (SmtpCommandExceptionRef) { return "failed"; }
        catch (ExceptionRef exception) when (exception is IOExceptionRef or ProtocolExceptionRef or OperationCanceledExceptionRef or SocketExceptionRef) { return "unknown"; }
    }
}
