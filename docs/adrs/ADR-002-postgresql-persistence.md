# ADR-002: PostgreSQL Persistence with Explicit Development Fallback

## Status
Retained for the alternative ASP.NET Core backend. Current production persistence is Cloudflare D1; see the [runtime map](../current-architecture.md).

## Context
The ASP.NET Core implementation needs durable inquiry and content storage across process restarts. Its local JSON repositories remain useful for development but are not intended for shared production writes.

## Decision
1. Use PostgreSQL for non-development deployments of this backend through Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`).
2. Maintain EF Core migrations under `server/src/AhmadMakatreh.Infrastructure/Persistence/PostgreSql/Migrations/`.
3. Retain an explicit local file-based repository (`DevJsonInquiryRepository`) strictly for local offline `Development` environments via configuration `Persistence:Provider=Json`.
4. Enforce a fail-closed startup check: If `Persistence:Provider=Json` is detected in any non-Development environment (Staging/Production), the application immediately throws an exception and halts startup.

## Consequences
- `DependencyInjection.cs` selects the repositories and requires a PostgreSQL connection string for the Postgres provider.
- PostgreSQL migrations and Cloudflare D1 migrations belong to separate implementations; neither can be applied to the other database.
- PostgreSQL integration tests require an isolated test database. The setup is documented in the [root README](../../README.md).
