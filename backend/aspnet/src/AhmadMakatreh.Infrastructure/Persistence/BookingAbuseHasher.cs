// codeguard:components:start
// codeguard:defines: BookingAbuseHasher
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Buffers.Binary;
using AhmadMakatreh.Domain.Entities;
using ArgumentExceptionRef = global::System.ArgumentException;
using BinaryPrimitivesRef = global::System.Buffers.Binary.BinaryPrimitives;
using MemoryStreamRef = global::System.IO.MemoryStream;
using HMACSHA256Ref = global::System.Security.Cryptography.HMACSHA256;
using IPAddressRef = global::System.Net.IPAddress;
using EncodingRef = global::System.Text.Encoding;
using InquiryRef = global::AhmadMakatreh.Domain.Entities.Inquiry;
using ConvertRef = global::System.Convert;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence;

/// <summary>
/// Produces keyed, non-reversible identifiers for short-lived booking abuse state.
/// </summary>
public sealed class BookingAbuseHasher
{
    private readonly byte[] _key;

    public BookingAbuseHasher(byte[] key)
    {
        if (key.Length < 32)
        {
            throw new ArgumentExceptionRef("The booking abuse HMAC key must contain at least 32 bytes.", nameof(key));
        }

        _key = key.ToArray();
    }

    public bool TryGetClientIpHash(string clientIp, out string ipHash)
    {
        if (!IPAddressRef.TryParse(clientIp, out var address))
        {
            ipHash = string.Empty;
            return false;
        }

        var normalizedAddress = address.MapToIPv6().GetAddressBytes();
        ipHash = ComputeHash("booking-ip-v1", normalizedAddress);
        return true;
    }

    public string GetPayloadHash(InquiryRef inquiry)
    {
        var fields = new[]
        {
            inquiry.Name,
            inquiry.Email,
            inquiry.InquiryCategory ?? string.Empty,
            inquiry.ProjectDetails
        };

        using var payload = new MemoryStreamRef();
        foreach (var field in fields)
        {
            var fieldBytes = EncodingRef.UTF8.GetBytes(field);
            var length = new byte[sizeof(int)];
            BinaryPrimitivesRef.WriteInt32BigEndian(length, fieldBytes.Length);
            payload.Write(length);
            payload.Write(fieldBytes);
        }

        return ComputeHash("booking-payload-v1", payload.ToArray());
    }

    private string ComputeHash(string purpose, byte[] value)
    {
        var purposeBytes = EncodingRef.UTF8.GetBytes(purpose);
        var input = new byte[purposeBytes.Length + 1 + value.Length];
        purposeBytes.CopyTo(input, 0);
        input[purposeBytes.Length] = 0;
        value.CopyTo(input, purposeBytes.Length + 1);
        return ConvertRef.ToHexString(HMACSHA256Ref.HashData(_key, input));
    }
}
