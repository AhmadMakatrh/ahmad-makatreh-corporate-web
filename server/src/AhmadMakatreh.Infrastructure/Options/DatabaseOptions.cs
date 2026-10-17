// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: DatabaseOptions
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Options;

/// <summary>
/// Configuration options for database persistence.
/// </summary>
public class DatabaseOptions
{
    public const string SectionName = "Persistence";

    /// <summary>
    /// Explicit persistence provider: "Postgres" (default & production) or "Json" (Development only).
    /// </summary>
    public string Provider { get; set; } = "Postgres";

    /// <summary>
    /// Enable automatic migration execution on startup (Development only).
    /// Disabled by default in Production/Staging for migration safety.
    /// </summary>
    public bool AutoMigrateInDevelopment { get; set; } = false;
}
