# ADR-002: PostgreSQL Persistence with Explicit Development Fallback

## Status
Accepted

## Context
The legacy application utilized local JSON files (`bookings.json`) for inquiry persistence. This approach cannot scale to multi-instance environments, lacks ACID transaction guarantees, and risks data corruption under concurrent load.

## Decision
1. Introduce PostgreSQL as the primary production persistence store via Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`).
2. Generate EF Core migrations and idempotent SQL deployment scripts.
3. Retain an explicit local file-based repository (`DevJsonInquiryRepository`) strictly for local offline `Development` environments via configuration `Persistence:Provider=Json`.
4. Enforce a fail-closed startup check: If `Persistence:Provider=Json` is detected in any non-Development environment (Staging/Production), the application immediately throws an exception and halts startup.

## Consequences
- **Positive:** Multi-instance scalability, ACID durability, indexed lookups on `ReferenceId`, and clear separation between enterprise DB and offline testing.
- **Negative:** Production deployments require a PostgreSQL instance or managed database service.
