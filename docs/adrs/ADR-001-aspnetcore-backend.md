# ADR-001: Retention and Hardening of ASP.NET Core Backend

## Status
Accepted

## Context
The platform requires a hardened, scalable backend API to handle contact bookings, bot verification, and persistence. While edge serverless functions (e.g. Cloudflare Pages Functions) were an option, they bind the application to a proprietary vendor runtime, create vendor lock-in, complicate local development, and lack full cross-platform portability.

## Decision
Retain and modernize ASP.NET Core 10 as the authoritative primary API:
1. Enforce Clean Architecture project boundaries (`Domain`, `Application`, `Infrastructure`, `Api`).
2. Package the application as a standard OCI container via Docker.
3. Treat Cloudflare purely as an edge infrastructure layer (CDN, DNS, TLS, WAF), preserving full portability to any cloud provider or bare metal.

## Consequences
- **Positive:** Complete cloud independence, high performance, rich ecosystem, type safety, straightforward local testing.
- **Negative:** Requires container hosting (VPS, ECS, Cloud Run, Kubernetes) rather than pure static edge hosting.
