# ADR-004: Bot Verification Abstraction & Strict Fail-Closed Policy

## Status
Retained for the alternative ASP.NET Core backend. The current Worker API implements Turnstile verification separately in `server/cloudflare/src/turnstile.js`.

## Context
The booking application service needs a verification result without owning the external Turnstile HTTP integration. A missing or disabled verification configuration must not silently allow submissions outside local development.

## Decision
1. Define the port interface `IBotVerificationService` in `AhmadMakatreh.Application`.
2. Implement `CloudflareTurnstileVerificationService` as an infrastructure adapter.
3. Enforce a strict **fail-closed** security policy outside of local `Development`:
   - Outside Development: a disabled verifier or missing secret causes verification to fail.
   - In Development: a disabled verifier may be bypassed only when `Turnstile:AllowDevelopmentBypass=true`.

## Consequences
- `BookingApplicationService` depends on the application interface; `CloudflareTurnstileVerificationService` owns provider communication and failure handling.
- Provider failures reject verification rather than returning success. This behavior is an anti-bot check, not user authentication.
- Replacing the provider would require a new adapter and verification of its contract; no additional provider is currently implemented.
