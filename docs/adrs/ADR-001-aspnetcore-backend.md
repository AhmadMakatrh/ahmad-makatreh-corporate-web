# ADR-001: Retained ASP.NET Core Backend

## Status
Retained for the alternative backend in `backend/aspnet/src/`. Superseded as the production runtime by the [Cloudflare Worker architecture](../current-architecture.md).

## Context
The repository includes an ASP.NET Core implementation of booking, administration and content APIs. It provides a container deployment option with PostgreSQL independently of the current Worker API.

## Decision
Retain the ASP.NET Core 10 implementation with these boundaries:
1. Enforce Clean Architecture project boundaries (`Domain`, `Application`, `Infrastructure`, `Api`).
2. Package the application as a standard OCI container via Docker.
3. Keep its application interfaces separate from infrastructure adapters for persistence, bot verification, notifications and media storage.

## Consequences
- This backend can be developed and tested independently of `backend/cloudflare/`.
- Deploying it requires a .NET host or container runtime and its own configured services. The existing Cloudflare Worker bindings do not configure this backend.
- Changes to shared public request/response contracts must account for both implementations while both remain in the repository.
