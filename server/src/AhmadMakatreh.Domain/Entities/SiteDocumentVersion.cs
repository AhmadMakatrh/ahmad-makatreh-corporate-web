// codeguard:components:start
// codeguard:defines: SiteDocumentVersion
using DateTimeRef = global::System.DateTime;
// codeguard:components:end
namespace AhmadMakatreh.Domain.Entities;

public class SiteDocumentVersion
{
    public string DocumentKey { get; set; } = string.Empty;
    public long Revision { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Actor { get; set; } = string.Empty;
    public DateTimeRef CreatedAtUtc { get; set; }
    public string DataJson { get; set; } = "{}";
}
