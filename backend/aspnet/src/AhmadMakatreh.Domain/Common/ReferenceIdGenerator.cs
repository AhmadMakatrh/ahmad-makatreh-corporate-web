// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ReferenceIdGenerator
using System.Security.Cryptography;
using RandomNumberGeneratorRef = global::System.Security.Cryptography.RandomNumberGenerator;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end

namespace AhmadMakatreh.Domain.Common;

/// <summary>
/// Generates human-friendly, cryptographically strong reference IDs for booking inquiries.
/// Format: REQ-yyyyMMdd-XXXXXX (e.g. REQ-20260905-8F2K7Q)
/// Uses an unambiguous alphanumeric charset avoiding confusing characters (0, O, 1, I).
/// </summary>
public static class ReferenceIdGenerator
{
    private const string Charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 characters
    private const string CharsetRef = Charset;
    private const int RandomComponentLength = 6;
    private const int RandomComponentLengthRef = RandomComponentLength;

    public static string Generate(DateTimeRef? utcDate = null)
    {
        var datePart = (utcDate ?? DateTimeRef.UtcNow).ToString("yyyyMMdd");
        var randomBytes = new byte[RandomComponentLengthRef];
        RandomNumberGeneratorRef.Fill(randomBytes);

        var chars = new char[RandomComponentLengthRef];
        for (var i = 0; i < RandomComponentLengthRef; i++)
        {
            chars[i] = CharsetRef[randomBytes[i] % CharsetRef.Length];
        }

        return $"REQ-{datePart}-{new string(chars)}";
    }
}
