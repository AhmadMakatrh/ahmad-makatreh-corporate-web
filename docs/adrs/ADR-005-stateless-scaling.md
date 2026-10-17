# ADR-005: Stateless Backend API Design for Horizontal Scalability

## Status
Accepted

## Context
As traffic grows, the API backend must scale across multiple instances without requiring sticky sessions or complex shared state synchronization.

## Decision
1. Eliminate all server-side in-memory session state from the API tier.
2. Delegate persistent state exclusively to PostgreSQL.
3. Expose differentiated health probes:
   - `/health/live`: Fast, non-blocking check confirming the process is alive.
   - `/health/ready`: Deep check confirming PostgreSQL connectivity and query readiness before load balancers route incoming customer requests.
   - `/health`: Legacy-compatible combined check.
4. Containerize the service using standard multi-stage Docker builds running non-root `app` user.

## Consequences
- **Positive:** Nodes can be dynamically provisioned, auto-scaled, or terminated in container orchestrators without impact to in-flight sessions or inquiry integrity.
