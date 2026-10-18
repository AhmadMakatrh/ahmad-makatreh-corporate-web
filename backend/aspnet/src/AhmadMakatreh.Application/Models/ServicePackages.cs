// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: ServicePackages
// codeguard:components:end

namespace AhmadMakatreh.Application.Models;

public static class ServicePackages
{
    public static string? GetName(string? key) => key switch
    {
        "resume" => "Résumé website",
        "landing" => "Landing page",
        "business" => "Business website",
        "system" => "Web system starter",
        "mobile" => "Mobile app prototype",
        "custom" => "Custom software solution",
        _ => null
    };
}
