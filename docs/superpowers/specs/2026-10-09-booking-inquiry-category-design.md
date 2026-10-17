# Booking Inquiry Category Design

## Goal

Let a visitor select why they are contacting the site so the resulting email is easy to identify by its subject tag. Keep the form and labels bilingual.

## User experience

Add a required category selector to the shared form on `/booking` and `/start-project`, between contact details and the message field. Provide localized labels for six fixed choices: software project, employment opportunity, collaboration request, technical support, general inquiry, and other. Keep the existing service-specific subject display and `ServiceKey` behavior on `/start-project/:service`.

## Data flow

The client submits a stable category key alongside the existing booking fields. The API and application validator accept only the six allow-listed keys; arbitrary text must never be interpolated into an email subject. Persist the key as a nullable `InquiryCategory` on `Inquiry` with an additive PostgreSQL migration, preserving compatibility for existing API callers and old stored rows. Include the category tag in the notification subject and category label in the message body. Existing requests without a category continue to use the current subject format.

## Scope and compatibility

The change extends the booking request contract with an optional field, adds localized UI strings and required client-side selection, carries the validated key through the application flow, and stores it. Existing `ServiceKey` values, notification statuses, SMTP behavior, rate limiting, Turnstile verification, and prior inquiries remain unchanged.

## Verification

Add focused validation and application tests for accepted and rejected category keys, confirm the category reaches persisted inquiries and the notification service, run existing booking API tests, build and lint the client, and review the migration and diff. Do not send real email as part of automated tests.
