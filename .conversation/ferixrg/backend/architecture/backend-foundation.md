# FerixRG Backend Foundation

## Purpose

This is the foundation that must exist before FerixRG connects AI, a store platform, billing, or a live publishing action. It turns the approved frontend from a simulation into a product with real ownership, permissions, records, and safe actions.

## Authentication and identity

FerixRG will own a real product identity record. The current `users` table remains the canonical account table and will be expanded rather than replaced.

| Record | Purpose |
|---|---|
| **User** | A real person’s account profile, email, verification state, password-hash reference, account status, and last sign-in. |
| **Auth identity** | Links a user to an authentication method: email/password, Google, or the existing platform identity where it is enabled. No raw password is ever stored. |
| **Session / verification token** | Holds hashed, short-lived email-verification, password-reset, and secure session records. |

The currently approved sign-in, registration, verification, password-reset, and Google buttons will later connect to these records without changing their interface. Email delivery and Google OAuth configuration will be added only after the core account tables and protected APIs are complete.

## Workspaces and teams

| Record | Purpose |
|---|---|
| **Workspace** | The customer’s FerixRG organisation and ownership boundary. |
| **Workspace member** | Joins a user to a workspace with Owner, Admin, Editor, Viewer, or Billing role. |
| **Invitation** | A pending, expiring team invitation with a proposed role and audit history. |

All stores, drafts, reports, tool runs, usage, billing state, and releases belong to a workspace. A user can never access another workspace’s data just by knowing an identifier.

## Stores and working material

| Record | Purpose |
|---|---|
| **Store** | A saved store or public URL analysis target with platform, URL, display name, health state, and workspace owner. |
| **Store connection** | An encrypted reference to an authorised Shopify, WooCommerce, or later platform connection. It stores permission/scopes and connection health, not unencrypted merchant credentials. |
| **Store snapshot** | A timestamped evidence reference to a scanned page, page structure, product data, or visual capture. |
| **Draft** | A real saved manual/AI workspace draft with its source, state, and current version. The existing editor draft data will migrate into this ownership model. |
| **Draft version** | Each user or future AI change, comparison point, validation result, and restore point. |

## Tool, report, and release records

| Record | Purpose |
|---|---|
| **Tool run** | One selected FerixRG tool, its allowed input reference, status, owner, source store, and result reference. |
| **Evidence item** | A stored reference to the measurable source behind a tool result: page capture, screenshot, data extract, validation check, or provider response summary. |
| **Report** | A downloadable/tool-viewable result attached to a tool run and workspace. |
| **Validation run** | A set of checks performed against a draft/version before export or release. |
| **Release action** | A pending, approved, published, failed, reverted, or exported action; records the responsible person and the exact target. |

AI will later be one source of a `Tool run`. It will never bypass draft, validation, release, or workspace permission records.

## Activity, usage, and billing state

| Record | Purpose |
|---|---|
| **Activity event** | An immutable timeline event for authentication, store connection, team change, draft save, tool run, report export, validation, and release. |
| **Usage ledger** | A counted record of tool, AI, storage, and release use for workspace limits and billing. |
| **Subscription state** | The active plan, payment status, billing provider reference, and current usage period. It does not store payment card data. |

Billing integration comes after the records and permission rules exist. The database will be ready for it now, but no payment provider is connected in the first migration.

## First migration groups

The database change will be executed in dependency order:

1. Expand identity and create workspaces.
2. Add memberships and invitations.
3. Add stores and connection metadata.
4. Add tool runs, evidence, reports, validations, drafts, and release actions.
5. Add activity events, usage ledger, and subscription state.

## Backend API boundary

The frontend will use protected tRPC procedures. Every procedure will resolve the authenticated user, workspace membership, role, and resource ownership before reading or writing data.

```text
Approved FerixRG frontend
        ↓
Protected FerixRG tRPC API
        ↓
Authenticated user + workspace membership + role check
        ↓
FerixRG database records
        ↓
Only later: store platform APIs, AI providers, billing provider, email delivery
```

## What is deliberately deferred

The following are not part of the first backend migration because they require their own provider configuration after the foundation exists:

- Cloudflare Workers AI requests and model routing.
- Shopify/WooCommerce OAuth or merchant key exchange.
- Email delivery and Google OAuth connection.
- Payment collection and subscription provider integration.
- Public deployment and publishing operations.
