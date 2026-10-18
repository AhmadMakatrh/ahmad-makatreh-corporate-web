// codeguard:components:start
// codeguard:defines: ClientIpResolver
using System.Net;
using IConfigurationRef = global::Microsoft.Extensions.Configuration.IConfiguration;
using HttpContextRef = global::Microsoft.AspNetCore.Http.HttpContext;
using IPAddressRef = global::System.Net.IPAddress;
// codeguard:components:end

namespace AhmadMakatreh.Api.Security;

public static class ClientIpResolver
{
    public static string? Resolve(HttpContextRef context, IConfigurationRef configuration)
    {
        var trustCloudflare = configuration.GetValue<bool>("ReverseProxy:TrustCloudflareProxy", false);
        if (trustCloudflare
            && context.Request.Headers.TryGetValue("CF-Connecting-IP", out var cloudflareIp)
            && IPAddressRef.TryParse(cloudflareIp.ToString().Trim(), out var parsedCloudflareIp))
        {
            return parsedCloudflareIp.ToString();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }
}
