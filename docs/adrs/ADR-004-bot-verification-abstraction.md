# ADR-004: Bot Verification Abstraction & Strict Fail-Closed Policy

## Status
Accepted

## Context
Form submission endpoints are vulnerable to automated bot spam and abuse. While Cloudflare Turnstile is the current bot detection technology of choice, hardcoding Turnstile into domain services couples business workflows to an external SaaS vendor. Additionally, previous configurations permitted silent bypass of verification in Staging environments.

## Decision
1. Define the port interface `IBotVerificationService` in `AhmadMakatreh.Application`.
2. Implement `CloudflareTurnstileVerificationService` as an infrastructure adapter.
3. Enforce a strict **fail-closed** security policy outside of local `Development`:
   - In Production/Staging: Turnstile is mandatory. If misconfigured or disabled, inquiries are immediately rejected with an audit error.
   - In Development: Turnstile may be bypassed ONLY when `IsDevelopment=true` AND `AllowDevelopmentBypass=true`.

## Consequences
- **Positive:** Guarantees zero unauthenticated bypass in publicly accessible staging/production environments, and allows swapping Turnstile for reCAPTCHA, hCaptcha, or custom challenges without altering application use cases.
