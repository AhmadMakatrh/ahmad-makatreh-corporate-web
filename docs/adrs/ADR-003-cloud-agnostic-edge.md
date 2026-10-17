# ADR-003: Cloud-Agnostic Edge Architecture

## Status
Accepted

## Context
The platform leverages Cloudflare for DNS, CDN caching, TLS termination, and WAF rules. However, tight coupling with Cloudflare-specific SDKs or runtime environments prevents migration to alternative cloud providers (e.g. AWS, GCP, Azure, Fastly).

## Decision
1. Restrict Cloudflare's role strictly to the edge network boundary.
2. The core application logic and HTTP endpoints remain purely standard ASP.NET Core web standards (Minimal APIs, standard HTTP status codes, standard JSON contracts).
3. Any header-based functionality (e.g. `CF-Connecting-IP`) is guarded behind configurable reverse proxy options (`ReverseProxy:TrustCloudflareProxy=true`) and defaults to standard TCP socket remote IP resolution.

## Consequences
- **Positive:** The system can be migrated to AWS CloudFront, Fastly, Azure Front Door, or self-hosted Nginx reverse proxies without modifying a single line of application source code.
