// codeguard:components:start
// codeguard:defines: MailKitReplySenderTests
using System.Net;
using System.Net.Sockets;
using AhmadMakatreh.Domain.Entities;
using AhmadMakatreh.Infrastructure.Notifications;
using AhmadMakatreh.Infrastructure.Options;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;
using CancellationTokenSourceRef = global::System.Threading.CancellationTokenSource;
using MailKitReplySenderRef = global::AhmadMakatreh.Infrastructure.Notifications.MailKitReplySender;
using StreamReaderRef = global::System.IO.StreamReader;
using StreamWriterRef = global::System.IO.StreamWriter;
using ListOfStringRef = global::System.Collections.Generic.List<string>;
using EmailOptionsRef = global::AhmadMakatreh.Infrastructure.Options.EmailOptions;
using InquiryReplyRef = global::AhmadMakatreh.Domain.Entities.InquiryReply;
using TcpListenerRef = global::System.Net.Sockets.TcpListener;
using InlineDataAttributeRef = global::Xunit.InlineDataAttribute;
using IPEndPointRef = global::System.Net.IPEndPoint;
using IPAddressRef = global::System.Net.IPAddress;
using TimeSpanRef = global::System.TimeSpan;
using OptionsRef = global::Microsoft.Extensions.Options.Options;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using TheoryAttributeRef = global::Xunit.TheoryAttribute;
using TaskRef = global::System.Threading.Tasks.Task;
using GuidRef = global::System.Guid;
using SecureSocketOptionsRef = global::MailKit.Security.SecureSocketOptions;
// codeguard:components:end

namespace AhmadMakatreh.UnitTests.Infrastructure;

public class MailKitReplySenderTests
{
    [TheoryAttributeRef]
    [InlineDataAttributeRef(465, true, SecureSocketOptionsRef.SslOnConnect)]
    [InlineDataAttributeRef(587, true, SecureSocketOptionsRef.StartTls)]
    [InlineDataAttributeRef(2525, true, SecureSocketOptionsRef.StartTls)]
    [InlineDataAttributeRef(465, false, SecureSocketOptionsRef.None)]
    [InlineDataAttributeRef(587, false, SecureSocketOptionsRef.None)]
    public void EmailOptions_SelectRequiredTransportForBothMailSenders(int port, bool ssl, SecureSocketOptionsRef expected)
    {
        new EmailOptionsRef { SmtpPort = port, EnableSsl = ssl }.SocketOptions.Should().Be(expected);
    }

    [TheoryAttributeRef]
    [InlineDataAttributeRef(true, "accepted")]
    [InlineDataAttributeRef(false, "unknown")]
    public async TaskRef RealSmtpRoundTripDistinguishesAcceptanceFromLostAcknowledgement(bool acknowledge, string expected)
    {
        var listener = new TcpListenerRef(IPAddressRef.Loopback, 0); listener.Start();
        using var timeout = new CancellationTokenSourceRef(TimeSpanRef.FromSeconds(20));
        var server = TaskRef.Run(async () =>
        {
            using var peer = await listener.AcceptTcpClientAsync(timeout.Token); using var stream = peer.GetStream();
            using var reader = new StreamReaderRef(stream); using var writer = new StreamWriterRef(stream) { NewLine = "\r\n", AutoFlush = true };
            await writer.WriteLineAsync("220 local test SMTP");
            while (await reader.ReadLineAsync(timeout.Token) is { } line)
            {
                if (line.StartsWith("EHLO") || line.StartsWith("HELO")) await writer.WriteLineAsync("250 localhost");
                else if (line == "DATA")
                {
                    await writer.WriteLineAsync("354 send data"); var lines = new ListOfStringRef();
                    while (await reader.ReadLineAsync(timeout.Token) is { } body && body != ".") lines.Add(body);
                    lines.Should().Contain(line => line.StartsWith("Message-Id:")); lines.Should().Contain(line => line.Contains("Reply body"));
                    if (acknowledge) await writer.WriteLineAsync("250 queued");
                    break;
                }
                else await writer.WriteLineAsync("250 OK");
            }
        }, timeout.Token);
        try
        {
            var options = OptionsRef.Create(new EmailOptionsRef { Enabled = true, SmtpHost = "127.0.0.1", SmtpPort = ((IPEndPointRef)listener.LocalEndpoint).Port, EnableSsl = false, FromEmail = "owner@example.test" });
            var sender = new MailKitReplySenderRef(options); sender.IsConfigured.Should().BeTrue();
            var inquiry = new InquiryRef(GuidRef.NewGuid(), "TEST", "Test", "recipient@example.test", "Details");
            var result = await sender.SendAsync(inquiry, new InquiryReplyRef { Id = GuidRef.NewGuid(), Subject = "Reply subject", Body = "Reply body" }, timeout.Token);
            result.Should().Be(expected); await server;
        }
        finally { listener.Stop(); }
    }
}
