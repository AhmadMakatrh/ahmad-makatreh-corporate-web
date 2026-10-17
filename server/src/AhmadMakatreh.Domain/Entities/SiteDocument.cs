// codeguard:components:start
// codeguard:defines: SiteDocument
using ListOfSiteDocumentVersionRef = global::System.Collections.Generic.List<global::AhmadMakatreh.Domain.Entities.SiteDocumentVersion>;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end
namespace AhmadMakatreh.Domain.Entities;

public class SiteDocument
{
    public string Key { get; set; } = string.Empty;
    public string DraftJson { get; set; } = "{}";
    public string? PublishedJson { get; set; }
    public string? PreviousPublishedJson { get; set; }
    public long Revision { get; set; }
    public DateTimeRef UpdatedAtUtc { get; set; }
    public DateTimeRef? PublishedAtUtc { get; set; }
    public ListOfSiteDocumentVersionRef History { get; set; } = [];
}
