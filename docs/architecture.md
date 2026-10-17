# System Architecture & Technical Specification

> Historical design record: the active site and administration deployment use the Cloudflare Workers described in [the current architecture map](current-architecture.md). The .NET/PostgreSQL design below remains in the repository as an alternative backend and is not the current production request path.

## 1. Architectural Overview

The Ahmad Makatreh personal portfolio and business platform is built upon a **provider-agnostic, multi-tier, modular architecture**. The system strictly separates concerns across the client interface, edge security layer, backend application core, and persistence tier.

```text
                                  +-----------------------+
                                  |      Client / Users    |
                                  +-----------+-----------+
                                              |
                                              | HTTPS
                                              v
+-----------------------------------------------------------------------------------------+
|                                      EDGE LAYER                                         |
|  - DNS, CDN, Edge Caching, TLS Termination                                              |
|  - WAF, DDoS Protection, Cloudflare Turnstile Bot Challenge                             |
|  (Portable: Cloudflare Pages / AWS CloudFront / Fastly / Azure Front Door / Akamai)    |
+---------------------------------------------+-------------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
        +-------------------------+                       +-------------------------+
        |     Frontend Tier       |                       |       Backend Tier      |
        |  - React 19 + Vite SPA  |                       |  - ASP.NET Core 10 API  |
        |  - Fully static assets  |                       |  - Clean Architecture   |
        |  - Framer Motion UI     |                       |  - Stateless Execution  |
        +-------------------------+                       +------------+------------+
                                                                       |
                                                                       v
                                                          +-------------------------+
                                                          |    Persistence Tier     |
                                                          |  - PostgreSQL (EF Core) |
                                                          |  - Durable & ACID       |
                                                          +-------------------------+
```

---

## 2. Backend Clean Architecture

The backend solution (`server/AhmadMakatrehSite.slnx`) enforces explicit architectural boundaries using separate .NET projects:

```text
server/
├── AhmadMakatrehSite.slnx
├── migrations/
│   └── 001_initial_create.sql
├── src/
│   ├── AhmadMakatreh.Domain/          # Pure Domain Entities & Value Objects (Zero Dependencies)
│   ├── AhmadMakatreh.Application/     # Use Cases, Business Logic, Validation, Interfaces
│   ├── AhmadMakatreh.Infrastructure/  # EF Core (PostgreSQL), Turnstile, MailKit, DevJson
│   └── AhmadMakatreh.Api/             # Minimal API Endpoints, Security Headers, Rate Limiting
└── tests/
    ├── AhmadMakatreh.UnitTests/       # Domain, Application, and Validator Unit Tests
    └── AhmadMakatreh.IntegrationTests/# ASP.NET Core TestServer HTTP End-to-End Tests
```

### Dependency Inversion Principle
1. **`AhmadMakatreh.Domain`**: Contains pure entities (`Inquiry`) and domain rules (`ReferenceIdGenerator`). Has zero external dependencies.
2. **`AhmadMakatreh.Application`**: Defines port interfaces (`IInquiryRepository`, `IBotVerificationService`, `IInquiryNotificationService`), commands, and orchestrator services (`BookingApplicationService`). Depends only on `Domain`.
3. **`AhmadMakatreh.Infrastructure`**: Implements port interfaces via adapters (`PostgreSqlInquiryRepository`, `CloudflareTurnstileVerificationService`, `MailKitNotificationService`, `DevJsonInquiryRepository`). Depends on `Application` and `Domain`.
4. **`AhmadMakatreh.Api`**: The composition root. Configures middleware, rate limiting, security headers, and maps endpoints.

---

## 3. Data Minimization & Privacy

- In compliance with privacy standards and `AGENTS.md` guidelines, raw client network metadata (such as `RemoteIp`) is **never** stored in the persistent `Inquiry` database table.
- To stop duplicate submissions across API instances, PostgreSQL stores a keyed HMAC of the client IP and a keyed HMAC of the submitted name, email, contact reason, and details in `booking_submission_guards`. The hashes are not reversible without the separately configured `BookingAbuse:HmacKey`; expired records are removed in batches every six hours.
- The first matching submission is stored and notified once. The next four matching submissions return a duplicate response without another inquiry or email; the fifth matching retry (sixth identical submission overall) starts a 30-minute IP block. The existing in-memory limit of three booking requests per 20 seconds remains in place.
- Application logging automatically masks sensitive customer contact information (e.g. `j***e@example.com`).

---

## 4. Scalability & Operational Modes

### Mode A: Single-Instance (Low Operational Complexity)
- **Deployment:** Single container or VPS running `AhmadMakatreh.Api` connected to a managed PostgreSQL database.
- **In-Memory Rate Limiting:** Sufficient for small to medium scale when pinned behind sticky edge caching or single ingress.

### Mode B: Horizontally Scaled Multi-Instance
- **Statelessness:** The API nodes store zero local session or state. Any request can be served by any node.
- **Data Store:** Managed PostgreSQL with connection pooling.
- **Abuse Guard State:** Shared PostgreSQL rows make duplicate detection and temporary blocks consistent across API instances. The API must use the same `BookingAbuse:HmacKey` value on every instance.
- **Health Probes:**
  - `/health/live`: Liveness probe for container orchestrator (Docker/Kubernetes).
  - `/health/ready`: Readiness probe verifying PostgreSQL database connectivity before traffic routing.
  - `/health`: Legacy-compatible general health endpoint.

---

## 5. Security & Edge Configuration

1. **Bot Protection:** Cloudflare Turnstile verification is abstracted behind `IBotVerificationService`. Outside local Development, it operates under a strict **fail-closed** policy.
2. **CORS:** Origin validation restricts access strictly to authorized domains (`ahmad-makatreh.vip`, `*.pages.dev`, `localhost`).
3. **Defensive Headers:** Every HTTP response includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.
4. **Container Security:** Multi-stage Docker image runs under an unprivileged non-root user (`app`, UID 1654).
