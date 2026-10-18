# ADR-005: Durable State and Health Probes for the Alternative Backend

## Status
Retained for the alternative ASP.NET Core backend. These probes and container settings do not describe the current [Cloudflare Worker runtime](../current-architecture.md).

## Context
The containerized API needs durable application data and separate signals for process availability and database connectivity. Process-local data should not be treated as the durable record of inquiries or published content.

## Decision
1. Keep non-development inquiry and content persistence in PostgreSQL.
2. Keep health checks in `backend/aspnet/src/AhmadMakatreh.Api/Endpoints/HealthEndpoints.cs`.
3. Expose differentiated health probes:
   - `/health/live`: Fast, non-blocking check confirming the process is alive.
   - `/health/ready`: Calls `Database.CanConnectAsync` when the Postgres provider is selected; returns 503 when the database is unavailable. This is not a schema or end-to-end operation check.
   - `/health`: Legacy-compatible process and runtime information.
4. Containerize the service using standard multi-stage Docker builds running non-root `app` user.

## Consequences
- A host can use separate liveness and readiness endpoints when routing traffic.
- Database-backed state does not prove capacity or make every control distributed: the ASP.NET Core rate limiters in `Program.cs` are process-local.
- Multi-instance operation still requires appropriate infrastructure settings and measured testing. The repository does not establish a supported concurrent-user limit.
