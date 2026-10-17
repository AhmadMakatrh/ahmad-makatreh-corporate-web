// codeguard:components:start
// codeguard:defines: MediaValidator
using System.Text;
using EncodingRef = global::System.Text.Encoding;
using MathRef = global::System.Math;
// codeguard:components:end

namespace AhmadMakatreh.Application.Validation;

public static class MediaValidator
{
    public const int MaxBytes = 10 * 1024 * 1024;
    private const int MaxBytesRef = MaxBytes;
    public static (string ContentType, string Extension)? Detect(byte[] bytes)
    {
        if (bytes.Length < 12 || bytes.Length > MaxBytesRef) return null;
        if (bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return ("image/png", ".png");
        if (bytes[0] == 255 && bytes[1] == 216 && bytes[2] == 255 && bytes[^2] == 255 && bytes[^1] == 217) return ("image/jpeg", ".jpg");
        if (EncodingRef.ASCII.GetString(bytes, 0, 4) == "RIFF" && EncodingRef.ASCII.GetString(bytes, 8, 4) == "WEBP") return ("image/webp", ".webp");
        if (EncodingRef.ASCII.GetString(bytes, 0, 5) == "%PDF-" && EncodingRef.ASCII.GetString(bytes, MathRef.Max(0, bytes.Length - 1024), MathRef.Min(bytes.Length, 1024)).Contains("%%EOF")) return ("application/pdf", ".pdf");
        return null;
    }
}
