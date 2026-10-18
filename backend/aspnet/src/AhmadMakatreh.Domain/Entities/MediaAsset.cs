// codeguard:components:start
// codeguard:defines: MediaAsset
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end
namespace AhmadMakatreh.Domain.Entities;

public class MediaAsset
{
    public GuidRef Id { get; set; }
    public string ObjectKey { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Sha256 { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTimeRef CreatedAtUtc { get; set; }
    public string Actor { get; set; } = string.Empty;
    public bool Archived { get; set; }
}
