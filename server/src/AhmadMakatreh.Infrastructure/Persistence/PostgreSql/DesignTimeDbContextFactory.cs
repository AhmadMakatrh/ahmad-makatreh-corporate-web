// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: DesignTimeDbContextFactory
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using IDesignTimeDbContextFactoryOfAppDbContextRef = global::Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext>;
using DbContextOptionsBuilderOfAppDbContextRef = global::Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext>;
using AppDbContextRef = global::AhmadMakatreh.Infrastructure.Persistence.PostgreSql.AppDbContext;
using EnvironmentRef = global::System.Environment;
// codeguard:components:end

namespace AhmadMakatreh.Infrastructure.Persistence.PostgreSql;

/// <summary>
/// Design-time factory for EF Core migrations generation and tooling.
/// Enables 'dotnet ef migrations add' without requiring a running application.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactoryOfAppDbContextRef
{
    public AppDbContextRef CreateDbContext(string[] args)
    {
        var connectionString = EnvironmentRef.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=ahmad_makatreh_design;Username=postgres;Password=postgres";

        var builder = new DbContextOptionsBuilderOfAppDbContextRef();
        builder.UseNpgsql(connectionString, b =>
        {
            b.MigrationsAssembly(typeof(AppDbContextRef).Assembly.FullName);
        });

        return new AppDbContextRef(builder.Options);
    }
}
