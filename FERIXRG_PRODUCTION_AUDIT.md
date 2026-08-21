# FerixRG Production Audit

**Audit status:** In progress toward production readiness. The verified fixes below are complete in the local repository, but the updated backend and frontend artifacts still need to be copied to the server and restarted/reloaded there.

## Executive result

FerixRG has independent frontend and backend package boundaries. The frontend and backend type checks pass, the frontend suite passes **68 tests**, the backend suite passes **137 tests**, and both production builds complete successfully.

The deployed registration error was traced to two separate facts. The implemented backend route is `POST /api/account/register`; `POST /api/auth/register` does not exist. The frontend source already called the correct `/api/account/register` route, so the wrong-path error was caused by the request client or stale deployed frontend rather than by a missing backend implementation.

The deployed backend also used Drizzle’s Neon HTTP driver while account and workspace persistence uses interactive transactions. The HTTP driver cannot support those transactions. The database layer has now been changed to Drizzle’s Neon WebSocket Pool driver, with `DATABASE_URL_UNPOOLED` preferred for transaction-safe production access and `ws`, `bufferutil`, and `@types/ws` added to the isolated backend package.

## Changes completed

| Area | Result |
|---|---|
| Neon transactions | Replaced `drizzle-orm/neon-http` with `drizzle-orm/neon-serverless` and a Neon `Pool` configured with Node’s WebSocket constructor. |
| Backend dependencies | Added `ws`, `bufferutil`, and `@types/ws` only to `backend/`. |
| Frontend build | Removed the unresolved `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` script from `index.html`; production builds no longer ship a broken analytics URL when analytics is not configured. |
| Package installation | Added valid per-boundary pnpm allowlists so frontend and backend installs succeed independently with required esbuild/native builds. |
| Existing applications | No existing PM2 process or Nginx route was changed by the repository fixes. |

## Verified controls

The tRPC middleware rejects unauthenticated protected procedures with `UNAUTHORIZED` and rejects non-admin access to admin procedures with `FORBIDDEN`. Workspace procedures consistently receive a workspace ID and enforce membership/role boundaries in the backend router. Account session, password, token, two-step, invitation, draft, validation, and release paths are backed by database procedures rather than browser-only state.

The active dashboard overview uses live workspace queries for stores, issues, runs, reports, drafts, health, and activity. Public URL inspection is a real backend fetch and records evidence. The frontend test suite verifies protected navigation, authenticated logout, workspace mutations, invitations, URL inspection, draft comparison, and honest unavailable states.

## Features that are real and connected

Local email-account registration and login, session cookies, email verification token persistence, password-reset token persistence, account profile updates, preferences, session revocation, two-step setup/confirmation, workspace membership and invitations, store source records, public URL analysis, workspace tool-run records, evidence-backed issues/reports, draft/version persistence, validation records, release-plan records, billing usage/ledger reads, legal-document reads, and security-event records are implemented through backend procedures and database persistence.

## Features intentionally not operational yet

The current code is honest about several provider-dependent capabilities and does not claim that they are live:

| Capability | Current state |
|---|---|
| Shopify/WooCommerce/Magento/custom live publishing | Not implemented. Provider adapters report `supportsPublish: false` and `supportsRollback: false`; release execution is gated as unsupported. |
| AI editor chat and AI redesign execution | Not a live server-side AI operation in the current workflow. The UI presents a reviewable proposal boundary rather than pretending to have executed a provider action. |
| Billing plan changes, payment collection, receipts | Read-only workspace records. A payment provider adapter is not configured. |
| Email delivery | Token/security flows persist records, but delivery reports `not_configured` unless a transactional email provider is supplied. |
| OAuth | The optional OAuth server URL is not configured in the current test environment. Local account authentication remains separate. |
| Developer API keys and handoff | The settings panel still contains preview/simulated language for API-key and handoff actions; these must not be represented as production capabilities until server-side key and artifact endpoints are implemented. |
| Rendered visual snapshots | Draft/version metadata is persisted, but the editor explicitly states that provider-rendered snapshots are not stored. |

These are product implementation boundaries, not bugs to hide. They need provider adapters, credentials, and server-side execution before being advertised as live functionality.

## Remaining deployment actions

1. Copy the updated repository to the server, install the independent backend and frontend packages, and rebuild both artifacts.
2. Ensure the backend production environment contains `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, `STORE_CONNECTION_ENCRYPTION_KEY`, `FERIXRG_APP_ORIGIN=https://ferixrg.ferixas.com`, and the provider variables required for any capability that should become live. Never print these values in diagnostics.
3. Run the already-applied Drizzle migration command only if the migration status requires it; do not fabricate a journal or move migration files manually.
4. Restart only `ferixrg-backend` after the new backend build is present. Keep the static frontend out of PM2.
5. Serve `/home/ubuntu/ferixrg/web/frontend/dist/` from the dedicated `ferixrg.ferixas.com` Nginx server block and keep `ferixrgapi.ferixas.com` proxied to port `5010`.
6. Test `POST /api/account/register`, not `/api/auth/register`. Use a real registration only after confirming the correct route with a validation-only request.

## External reference

The [Drizzle ORM Neon guide](https://orm.drizzle.team/docs/connect-neon) and [Neon serverless driver documentation](https://neon.com/docs/serverless/serverless-driver) distinguish HTTP one-shot queries from WebSocket session/interactive transaction support. They document the WebSocket Pool setup used by this fix.
