# Cookie Audit — Mayasah Style

Generated: 2025-10-07

## Overview
This project includes a PDPL-compliant cookie consent manager and server-side consent logging for audit.

Files of interest:
- `pdpl-cookie-manager.js` — client-side consent manager. Stores consent in `localStorage` under `mayasah_cookie_consent` and `mayasah_consent_timestamp`. It also POSTs consent to a server endpoint `/log-consent` and attempts to set a server-side cookie via `/set-consent-cookie`.
- `index.html` — protects analytics and marketing scripts with `data-cookie-category` attributes so they are only loaded when consent is granted.
- `backend/data/consents.json` — server-side persisted consent logs (append-only JSON array).
- `backend/data/payments.json` — processed payments log (for payment webhook idempotency).

## What is stored and where
- Client-side: `mayasah_cookie_consent` in `localStorage` — stores an object like:

```json
{
  "necessary": true,
  "analytics": false,
  "marketing": false,
  "timestamp": "2025-10-07T...",
  "version": "1.0"
}
```

- Server-side audit: `backend/data/consents.json` — each entry includes consent object, timestamp, user agent, URL, and optionally `source: 'cookie-endpoint'` when set via server cookie endpoint.

- Server-side cookie: `mayasah_cookie_consent` (URL-encoded JSON) — set via POST to `/set-consent-cookie`. This cookie is not HttpOnly so client JS can still read it if needed; it's set Secure in production.

## How to use the data
1. Legal/audit: Keep `backend/data/consents.json` as an append-only audit. For production use, migrate to a database and ensure retention policy meets PDPL requirements.
2. Server-side rendering: Read `req.cookies.mayasah_cookie_consent` to decide whether to include tracking scripts or personalized content server-side.
3. Analytics segmentation: Use consent flags (`analytics`, `marketing`) to control which events you send to GA/Facebook; the client manager already enforces this.
4. Reconciliation: When reconciling payments, you can pair `consents.json` entries with `payments.json` based on timestamps and user agent to answer questions like "Did this user consent to marketing at time of purchase?"

## Recommended retention & policy
- Consent records: keep for at least 1–3 years (depending on legal advice). Ensure secure storage and access controls.
- Cookie lifetime in browser: current cookie is set for 1 year by default; that is reasonable for preferences.

## Next steps (optional upgrades)
- Move `consents.json` to a proper DB (SQLite/Postgres) and index by transaction/order id and user id.
- Add an admin page to search/filter consent logs.
- Add server-side middleware that reads `mayasah_cookie_consent` cookie and exposes `req.userConsent` for server rendering.

If you want, I can implement any of these next steps — which would you like to do first?
