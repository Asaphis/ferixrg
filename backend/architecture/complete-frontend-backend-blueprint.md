# FerixRG Complete Frontend-to-Backend Blueprint

## Purpose

This document is the complete implementation contract derived from the approved FerixRG frontend. It replaces the former piecemeal backend approach. Every visible frontend feature must receive an explicit backend owner, data model, permission rule, service contract, failure state, and implementation phase before it is connected to live data.

The approved frontend design is preserved. Backend work supplies the real state and actions behind it; it does not change the landing page, dashboard design, workspace shell, tool taxonomy, or mobile navigation.

## Existing foundation already completed

| Backend foundation | Current state |
|---|---|
| Database | Migrated tables for accounts, identities, verification/reset tokens, workspaces, memberships, invitations, stores, connections, projects, drafts, versions, tool runs, evidence, reports, releases, activity, usage, subscriptions, invoices, preferences, sessions, API keys, platform requests, support tickets, feedback, and audit records. |
| Authentication foundation | Local registration, password hashing, sign-in/sign-out session issuance, verification-token records, and account-status contracts exist. |
| Workspace foundation | Personal workspace bootstrap, membership checks, role-scoped stores, activity, usage, release, invitation, billing, and queued-tool contracts exist. |
| External AI | Cloudflare Workers AI was tested separately and successfully. It is **not** connected to FerixRG until the rest of this blueprint is implemented. |

## Complete frontend surface

| Frontend area | Approved user behavior | Backend owner |
|---|---|---|
| Public landing | Marketing, supported-platform display, sign-in and registration links | Public site configuration, product/status content only; no user workspace data |
| Authentication | Registration, login, verification, resend cooldown, password recovery/reset, onboarding, session-expiry recovery, return links, logout | Account service, identity/session service, verification delivery, password-reset service, redirect-safety policy, session/audit service |
| Dashboard | Store health, health lenses, issues, recommendations, recent analyses, drafts, transformation, release readiness, activity, quick actions | Dashboard aggregate service scoped to workspace and optional store |
| Stores | Store list, add platform, OAuth/key connection, URL-only analysis, connection health, store workspace, disconnect, store activity | Store registry, encrypted connection service, platform adapters, source snapshots, connection health, per-store aggregates |
| Tools Library | Exact 57 tools, categories, search/filter, inputs, source selection, capability messages, routes | Tool registry, tool entitlement policy, input validation, provider routing, run queue |
| Tool workflow | Setup → run → results → workspace → validation → finish; reports, evidence, exports, saved projects, developer handoff | Tool-run service, evidence service, result/report service, export service, draft/project service, run lifecycle/audit service |
| Shared editor | Manual edit controls, device view, AI conversation, proposals, references, versions, comparison, restore, validation | Project/draft/version service, document/object storage, change-set service, proposal service, validation service |
| Analysis & issues | Scan progress, score, evidence, filters, issue detail, recommended action | Analysis-run service, score service, issue/evidence service, resolution status service |
| Release | Readiness, blockers, store draft, review, explicit confirmation, publish, rollback, handoff/export | Release policy, validation gate, platform publish adapter, release approval/audit record, rollback service |
| Team | Members, roles, invitations, role edits, cancellation/removal | Workspace membership/invitation service, role policy, notification/audit service |
| Billing & usage | Plan, seats, analyses, AI credits, limits, alert thresholds, invoices | Entitlement service, metering, subscription/billing provider adapter, usage alert service, invoice store |
| Profile, preferences & security | Personal details, email change, password/security, sessions, workspace defaults, notifications, accessibility | Account profile service, email-change flow, credential/session service, preference service |
| Platform & developer | Integrations, developer handoff, API keys, platform requests | Integration registry, developer-export service, scoped API-key service, platform-request service |
| Resources & support | Documentation/help, release updates, terms/privacy, support, problem reports, feedback, feature requests | Content registry, legal-version service, support ticket/feedback service |

## Authentication and account contract

The approved screens require both local-account and optional supported OAuth sign-in. The backend must preserve the safe return path policy and never create a browser-only demo session.

| Required behavior | Backend records and contract |
|---|---|
| Register | `users`, `auth_identities(provider=local)`, hashed credential, account status `pending_verification`, verification token, audit event |
| Verify email / resend | Expiring single-use verification token, resend throttle, account status transition, delivery event |
| Sign in | Password verification, durable session record, secure cookie, session/audit event, safe `returnTo` allowlist |
| Forgot/reset password | Reset token, expiry, credential replacement, invalidation of other sessions where policy requires |
| Email change | Pending email record/token, confirmation to new address, audit event |
| Security settings | Two-step-verification state, security-alert preference, recovery method metadata |
| Connected sessions | Session list, current-session marker, revoke one/revoke others |
| Logout with unsaved work | Ask frontend only when a dirty draft exists; backend saves draft or revokes session based on the chosen action |
| Onboarding | Workspace setup progress and completion state; no fabricated workspace data |

## Workspace roles and permissions

| Role | Core access |
|---|---|
| Owner | Workspace billing, integrations, members, API keys, all stores, release approval/publish subject to platform permissions |
| Admin | Members, stores, drafts, tools, review and releases as allowed by the owner’s policy |
| Editor | Stores and projects explicitly available to the workspace; create/edit drafts, run tools, request review; no billing or unrestricted publish |
| Viewer | Read permitted stores, evidence, reports, and drafts; no edits, invitations, connections, or release actions |
| Developer / agency context | Technical input/handoff and code/theme analysis; no visual store publishing unless separately authorized |

Every API request is workspace-scoped and must check both membership and resource ownership. Store connection scopes and platform permissions are an additional requirement for private access, publishing, and rollback.

## Store and connection contract

| Frontend behavior | Required backend implementation |
|---|---|
| Add Shopify/WooCommerce/custom store | Connection record in pending state; provider adapter starts official authorization/key flow; no token in frontend |
| Analyze by public URL | URL validation, crawl/snapshot job, public-evidence source record, tool-run context; no store connection required |
| Connection feedback | Connection attempt/job state: queued, authorizing, verifying, connected, needs attention, failed; user-readable safe error code |
| Store list and health | Workspace-scoped store aggregates: connection state, last sync, latest score, issue count, current draft count, last activity |
| Store workspace sources | Linked source records for connected store, source snapshot, saved draft, screenshots, prior evidence, pages/theme files |
| Disconnect | Explicit confirmation, adapter token revocation where supported, encrypted credential removal/revocation state, audit event; historical reports remain available according to retention policy |
| Store platform boundaries | Shopify/WooCommerce/custom adapters define granted read/write scopes; private checkout/theme/publish actions cannot be implied from public URL access |

## Exact 57-tool backend contract

The frontend tool catalogue is the canonical registry. Every record has: tool identifier, category, kind, accepted sources, required connections, result schema, route/workspace, entitlement policy, provider routing policy, audit policy, and export/release policy.

| Category | Exact tools | Required backend capability |
|---|---|---|
| Store Analysis | Storefront Analyzer; Page Analyzer; Site Structure Analyzer | Crawl/snapshot/evidence run, page/site map, issue/result/report records |
| Design & Visual | Visual Design Analyzer; Layout Analyzer; Visual Hierarchy Analyzer; Typography Analyzer; Color & Contrast Analyzer | Screenshot/page evidence, visual finding objects, measurable contrast checks, reviewable recommendations |
| UX & Conversion | UX Analyzer; Conversion Analyzer; CTA Analyzer; Trust & Credibility Analyzer; Customer Journey Analyzer | Journey/page evidence, issue prioritization, recommendation and handoff records |
| Responsive | Responsive Analyzer; Mobile UX Analyzer; Breakpoint Analyzer | Multi-viewport capture/run records, viewport findings, responsive validation results |
| Product & Commerce | Product Page Analyzer; Product Presentation Analyzer; Product Content Analyzer; Navigation Analyzer; Collection Analyzer; Cart Analyzer; Checkout UX Analyzer | Product/page/store context, private-data scope checks, structured findings |
| Content & AI | Content Quality Analyzer; AI Content Improver; Product Description Generator; CTA Generator; SEO Content Generator; AI Design Copilot | Selected-text/draft/reference input records, proposal versions, AI conversation and action audit; provider remains disconnected until core backend is complete |
| SEO | SEO Analyzer; Meta Generator; Heading Structure Analyzer; Image SEO Analyzer | URL/theme/page inspection, metadata/heading/image findings, content proposal records |
| Performance | Performance Analyzer; Image Optimization Analyzer; Asset Analyzer | Measurement run, asset inventory, performance evidence, developer actions |
| Accessibility | Accessibility Analyzer; Accessibility Fix Assistant | Rule/check evidence, remediation proposal, validation result |
| Visual & Reference | Screenshot Analyzer; Design Reference Analyzer; AI Store Redesign | Uploaded reference/screenshot storage, visual evidence, reviewable alternative drafts |
| Design Workspaces | Layout Composer; Visual Style Studio; Responsive Studio; Content Editor; Component Builder | Project/draft/document model, versioned change sets, device state, assets, comparison, restore |
| Developer | Developer Handoff; Technical Analyzer; Theme/Code Analyzer | Theme/code file source permissions, structured issue/acceptance criteria, safe export package |
| Testing & Validation | Before/After Comparator; Visual Regression Analyzer; Responsive Regression Tester; Accessibility Regression Tester; SEO Regression Tester | Baseline/current artifact pairs, difference results, validation findings, created issues |
| Release | Publish Readiness Checker; Publish Manager; Rollback | Validation gate, release plan, approval confirmation, platform capability check, publish/rollback audit |

## Tool-run lifecycle

```text
source selected → source validated → tool run queued → evidence collected → checks/provider work executed
→ result and issues stored → report/export available → optional proposal/draft → validation → controlled release/export
```

| Lifecycle stage | Required persisted records |
|---|---|
| Setup | Tool run, selected source, actor, workspace/store/project context, capability mode |
| Running | Job state, stage events, cancellation, safe error state, usage estimate |
| Results | Result payload, score, result metrics, issue records, evidence links, confidence/measurement metadata |
| Workspace | Draft or proposal branch, selected element/page/device state, manual change set, AI conversations/proposals, version links |
| Review | Validation records, baseline/current comparisons, blockers, reviewer decision |
| Finish | Export package, developer handoff, saved project, release plan, or publish/rollback record |

## Capability policy

The current frontend’s four modes become backend policy, not display-only text:

| Mode | Backend boundary |
|---|---|
| Explorer | Public URL/screenshot evidence only; may run permitted public tools, save a project if authenticated, export reports; cannot access private store data or publish |
| Project user | Own workspace drafts/results/versions; may continue, compare, validate and export; cannot publish without a supported connection and permission |
| Connected-store user | Adds authorized store data and only the declared connection scopes; can create store draft/validate/publish only when tool, role, and platform scope permit |
| Developer / agency | Adds approved theme/code inputs and developer handoff; does not automatically grant visual store publishing |

## Editor, drafts, versions, and assets

The browser-only simulated drafts must be replaced exactly enough to preserve the approved editor behavior.

| Current frontend draft state | Backend record |
|---|---|
| Title, label, score, score delta, note, current marker | Project draft/version metadata |
| Device, selected element, spacing, accent color | Versioned JSON editor-state document |
| Original / AI redesign / manual change / current draft | Version parent/branch metadata and actor/action provenance |
| Screenshot/reference/theme upload | S3 object + file metadata + workspace/store/project authorization |
| Compare left/right and restore | Version-pair comparison record and restore action audit |
| AI proposal before apply | Proposal linked to tool run/evidence/draft, explicit apply/reject event |

## Dashboard, reports, and activity

The dashboard is an aggregate API, not a static object. It must calculate the selected workspace/store’s connected-store count, health score, lens scores, active issues, active drafts, recommendation, recent analysis runs, before/after movement, release readiness, and activity timeline. All old dashboard tool IDs must be reconciled to the exact 57-tool registry before wiring.

Reports need source/evidence snapshots, score/findings, issue state, recommendations, validation, export file, actor/time, and the originating tool run. Developer handoffs add affected location, current/expected behavior, recommended implementation, priority, acceptance criteria, and linked evidence.

## Team, billing, settings, platform, and support

| Frontend group | Required backend behavior |
|---|---|
| Team | Invite with role, pending/accepted/cancelled/expired state, role change, removal, activity notification/audit |
| Subscription | Plan catalog, workspace subscription status, seat entitlement, analysis/AI/version allowances; payment processor added only when billing provider is selected |
| Usage / AI credits | Metered events from tool run/proposal/export; period counters, limit enforcement, alert thresholds, usage history |
| Billing history | Invoice/receipt records from a future billing adapter; never fabricate payment records |
| Profile | Display details, title, verified email change process, security and session controls |
| Preferences | Default store/device, notification categories, product updates, accessibility preferences |
| Platform | Integration status/scopes, developer/API keys, API-key hashing/revocation/audit, requested platform queue |
| Resources | Versioned documentation, help topics, update/read state, terms/privacy versions |
| Support | Workspace-context support tickets, problem reports, feedback, feature requests, secure attachments, status/audit |

## Complete backend implementation order

1. **Identity completion**: connect approved registration/login/recovery/verification UI to existing local auth routes; add email delivery and session management UI state.
2. **Workspace and account connection**: bootstrap workspace at registration, replace local simulation/session state, connect profile/preferences/security/session UI.
3. **Team and permissions**: connect invitations, membership, roles, removal/cancellation, and activity audit UI.
4. **Store registry and source management**: connect store list, public URL sources, uploads, store records, connection lifecycle, and per-store dashboard data. Implement platform adapters after secure OAuth/key requirements are agreed.
5. **Project/editor persistence**: connect projects, drafts, versions, manual state, asset uploads, comparison, restore, and unsaved-work protection.
6. **Tool-run foundation**: connect exact tool registry, source setup, tool lifecycle, jobs, evidence, issues, result metrics, reports, exports, and developer handoff. No provider-specific AI required for initial deterministic/public-source flows.
7. **Dashboard/analysis/issues/reports**: replace static aggregates with workspace/store-scoped API data and reconcile legacy dashboard IDs.
8. **Validation and release**: connect validation, blockers, release plans, explicit approval, publish/rollback capability policy, and release audit. Add platform publish adapters only after connection scopes are configured.
9. **Billing/usage and platform APIs**: add paid billing provider only after a provider is selected; connect real receipts, plans, limits, alerts, API keys, and platform requests.
10. **Resources/support/system operations**: connect content, legal versions, ticketing, feedback, docs, notices, operational audit, and notification delivery.
11. **AI service layer**: after data, permission, source, draft, tool-run, usage, and audit foundation is operating, connect Cloudflare Workers AI to the Central AI Gateway for the applicable tool actions.

## Integration rule

No external provider token, store credential, AI request, publishing action, or billing operation is stored in frontend code. All are server-only, workspace-scoped, auditable, permission-checked, and represented in the frontend only through safe status/result APIs.

## Audit coverage check

The audit was cross-checked against the live frontend contract rather than relying only on screen descriptions. It covers **57 exact tools** in the canonical `toolCatalog`, **26 nested More actions** across billing, profile, preferences, platform, resources, and support, the public/authentication/workspace route table, the approved desktop/mobile workspace behavior tests, and the existing browser-only simulation helpers.

The cross-check also identified a required compatibility task before live dashboard wiring: `approvedDashboard`, `dashboardRecords`, and `storeWorkspace` still contain earlier IDs such as `storefront-scan`, `screenshot-reviewer`, `store-publisher`, `theme-patch`, `responsive-redesign`, `checkout-friction`, and `mobile-journey`. The backend will use the exact current 57-tool registry. The frontend compatibility layer must map or replace each legacy shortcut deliberately; it must never silently create a tool record for an obsolete ID.

## Sources within this project

- `web/frontend/src/pages/Workspace.tsx`
- `web/frontend/src/components/ApprovedToolWorkflow.tsx`
- `web/frontend/src/lib/toolCatalog.ts`
- `web/frontend/src/lib/toolCapabilities.ts`
- `web/frontend/src/lib/toolRouting.ts`
- `web/frontend/src/lib/approvedDashboard.ts`
- `web/frontend/src/lib/dashboardRecords.ts`
- `web/frontend/src/lib/storeWorkspace.ts`
- `web/frontend/src/components/MoreActionPanel.tsx`
- `web/frontend/src/pages/Auth.tsx`
- `web/frontend/src/pages/Auth.test.ts`
- `web/frontend/src/pages/Workspace.mobileBehavior.test.ts`
