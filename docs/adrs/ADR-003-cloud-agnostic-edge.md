# ADR-003: Reverse Proxy Boundary for the Alternative Backend

## Status
The original edge-only Cloudflare decision is superseded for production. The proxy configuration below remains applicable to the retained ASP.NET Core backend. See the [current architecture](../current-architecture.md).

## Context
The ASP.NET Core API may run behind a reverse proxy. Client address resolution must distinguish a trusted proxy header from an untrusted request header. The current production API instead runs directly in Cloudflare Workers and uses Cloudflare D1 bindings.

## Decision
1. Keep the alternative API as an ASP.NET Core HTTP application that can run in its own container.
2. Resolve client addresses in `server/src/AhmadMakatreh.Api/Security/ClientIpResolver.cs`. `CF-Connecting-IP` is used only when `ReverseProxy:TrustCloudflareProxy=true`; otherwise the resolver uses the connection's remote address.
3. Configure forwarded headers and known proxies in `Program.cs` for the actual hosting environment.

## Consequences
- Proxy trust must match the network boundary. Enabling header trust is not a substitute for restricting direct access to an origin.
- Moving the current Worker deployment to this backend requires explicit configuration and data migration; the presence of an alternative implementation does not provide automatic provider portability.
