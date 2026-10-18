// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: EmailOptions
using SecureSocketOptionsRef = global::MailKit.Security.SecureSocketOptions;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Options;

/// <summary>
/// Email and notification delivery options.
/// </summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; } = false;
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public SecureSocketOptionsRef SocketOptions => !EnableSsl ? SecureSocketOptionsRef.None
        : SmtpPort == 465 ? SecureSocketOptionsRef.SslOnConnect : SecureSocketOptionsRef.StartTls;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@ahmad-makatreh.vip";
    public string RecipientEmail { get; set; } = "info@ahmad-makatreh.vip";
}
