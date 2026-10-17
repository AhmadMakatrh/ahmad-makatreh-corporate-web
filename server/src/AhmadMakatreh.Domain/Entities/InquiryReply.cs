// codeguard:components:start
// codeguard:defines: InquiryReply
using GuidRef = global::System.Guid;
using DateTimeRef = global::System.DateTime;
// codeguard:components:end
namespace AhmadMakatreh.Domain.Entities;

public class InquiryReply
{
    public GuidRef Id { get; set; }
    public GuidRef InquiryId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Actor { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTimeRef CreatedAtUtc { get; set; }
    public DateTimeRef? CompletedAtUtc { get; set; }
}
