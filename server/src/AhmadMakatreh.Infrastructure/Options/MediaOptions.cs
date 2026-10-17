// codeguard:components:start
// codeguard:defines: MediaOptions
// codeguard:components:end
namespace AhmadMakatreh.Infrastructure.Options;

public class MediaOptions
{
    public string Provider { get; set; } = "Disabled";
    public string AccountId { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string PublicBaseUrl { get; set; } = string.Empty;
}
