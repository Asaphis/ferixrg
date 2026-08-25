# FerixRG Tool Execution Map

## Purpose

FerixRG will not use one general AI response to power every tool. Each tool will be backed by the combination of **evidence collection**, **deterministic checks**, **AI interpretation or generation**, and—where the user explicitly connects a store—**permission-scoped platform data or publishing actions**. This keeps results explainable, prevents unsupported publishing promises, and lets a user see what was observed separately from what AI recommends.

> **Core rule:** AI may explain, prioritize, propose, rewrite, and generate reviewable changes. It must not invent evidence, claim access that has not been granted, or publish a change without a supported connection, the required permission, validation, and an explicit user confirmation.

## Execution engines

| Engine | What it does | Appropriate tool behavior |
|---|---|---|
| **Evidence service** | Collects public HTML, DOM structure, screenshots, page metadata, crawl paths, supplied images, selected text, or authorized store/theme records. | Creates immutable evidence snapshots that tools can cite and compare later. |
| **Rules service** | Runs measurable checks for headings, labels, contrast, assets, page structure, links, responsive breakpoints, and other repeatable conditions. | Produces exact issues, locations, severity, and pass/fail checks before any AI narrative. |
| **AI service** | Uses structured inputs and JSON-shaped outputs to explain issues, prioritize improvements, draft content, create design proposals, and answer within the editor. | Produces proposals with evidence references, confidence, rationale, and change operations; it never becomes the source of factual metrics by itself. |
| **Store connector** | Reads or changes only the data and theme resources authorized by a connected platform. | Enables product, collection, theme, draft, and supported release work. Tokens remain server-side and encrypted. |
| **Draft service** | Stores a shared editable change set, editor state, versions, approvals, and comparisons. | Makes AI and manual editing operate on the same versioned draft rather than separate products. |
| **Validation and release service** | Re-runs relevant checks, compares evidence, enforces permissions, and records every release action. | Allows export for unsupported contexts and allows publish or rollback only when the connector supports it. |

## Tool families and their real execution path

| Tool family | Included FerixRG tools | Real backend path |
|---|---|---|
| **Store, page, design, UX, and responsive analysis** | Storefront Analyzer; Page Analyzer; Site Structure Analyzer; Visual Design Analyzer; Layout Analyzer; Visual Hierarchy Analyzer; Typography Analyzer; Color & Contrast Analyzer; UX Analyzer; Conversion Analyzer; CTA Analyzer; Trust & Credibility Analyzer; Customer Journey Analyzer; Responsive Analyzer; Mobile UX Analyzer; Breakpoint Analyzer | Evidence service captures the selected source. Rules service measures DOM, navigation, semantic, viewport, and contrast signals. AI then turns the evidence into prioritized explanations and proposes only reviewable fixes. |
| **Product and commerce analysis** | Product Page Analyzer; Product Presentation Analyzer; Product Content Analyzer; Navigation Analyzer; Collection Analyzer; Cart Analyzer; Checkout UX Analyzer | Public URLs and screenshots support visual review. A connected store adds authorized product, collection, content, and theme context. Checkout remains capability-limited: the system must never infer write access or checkout access where the platform does not support it. |
| **Content and AI generation** | Content Quality Analyzer; AI Content Improver; Product Description Generator; CTA Generator; SEO Content Generator; AI Design Copilot | Text and page context are normalized first. AI returns structured alternatives, rationale, warnings, and editable operations. The Design Copilot receives the current draft, selected element, permitted evidence, and user instruction, then produces a proposed change set for preview and manual adjustment. |
| **SEO, performance, and accessibility** | SEO Analyzer; Meta Generator; Heading Structure Analyzer; Image SEO Analyzer; Performance Analyzer; Image Optimization Analyzer; Asset Analyzer; Accessibility Analyzer; Accessibility Fix Assistant | Rules service owns measurable signals such as metadata, headings, image dimensions, asset inventory, labels, and contrast. AI translates findings into clear remediation, content alternatives, or developer handoff. Performance reporting must retain its original measured source and timestamp. |
| **Visual reference and redesign** | Screenshot Analyzer; Design Reference Analyzer; AI Store Redesign | Vision-capable AI extracts design patterns from user-supplied screenshots or reference designs, while the evidence service retains the original asset and source. The redesign engine creates draft alternatives, not direct production pages, so users can compare, edit, validate, and approve a chosen direction. |
| **Manual design workspaces** | Layout Composer; Visual Style Studio; Responsive Studio; Content Editor; Component Builder | Draft service stores a normalized change set with version history. The editor applies manual changes and approved AI changes to the same draft. Content assistance may rewrite user-supplied material, but FerixRG must never fabricate customer reviews, ratings, testimonials, or other user-generated proof. |
| **Developer analysis and handoff** | Developer Handoff; Technical Analyzer; Theme/Code Analyzer | Evidence and rules services inspect only legitimately available code, theme, and technical resources. AI formats a developer-ready package containing evidence, affected location, recommended change, acceptance criteria, and risk; it does not claim a code change was made until a validated release action records it. |
| **Comparison and regression validation** | Before/After Comparator; Visual Regression Analyzer; Responsive Regression Tester; Accessibility Regression Tester; SEO Regression Tester | Validation service compares immutable baseline and candidate snapshots. Rules service reruns targeted tests. Vision AI may describe visual differences, but image or structural diffs and rule checks remain the record of regressions. |
| **Release operations** | Publish Readiness Checker; Publish Manager; Rollback | Release service checks draft status, required validation, granted platform scopes, user role, and connector capability. If any requirement is missing, the only valid outcomes are save, export, handoff, or reconnect—not publish. Every release and rollback is auditable. |

## How AI works inside FerixRG

The AI layer is a service behind the backend; it is never called directly from the browser. Each request is constructed from a **tool contract**: the tool identifier, user instruction, trusted evidence references, store capability, selected draft context, and output schema. The response must be structured into findings, proposal operations, rationale, confidence, and citations back to the evidence snapshot.

| AI job | Default model route | Why |
|---|---|---|
| Fast content rewrites, labels, metadata, CTA options, classification, and issue summaries | `gpt-5-mini` | Fast lower-cost structured generation for high-volume everyday work. |
| Screenshots, reference designs, long page context, visual comparison, and multimodal evidence review | `gemini-3-flash-preview` | Multimodal and long-context analysis for visual evidence. |
| Complex redesign reasoning, conflict resolution, theme/code plans, and high-stakes release explanations | `gpt-5` or `claude-sonnet-4-6` | Stronger reasoning should be reserved for requests where the extra quality is useful. |
| Difficult expert review or evaluation of competing complex proposals | `gpt-5.5`, `claude-opus-4-7`, or `gemini-3.1-pro-preview` | Premium models are opt-in for bounded expert work, not the default for every run. |

The live model catalog must be checked by the server rather than hard-coded. FerixRG will also use tool-specific output schemas, limits per workspace, run-level cost records, caching for unchanged evidence, and a stronger-model fallback only when a lightweight model fails a schema or confidence gate.

## Connected-store architecture

FerixRG needs one connector contract with platform adapters beneath it. The application does not treat “connected” as a universal permission. Every adapter reports the exact capabilities it has: read store, read products, read theme, write draft, publish, rollback, and event delivery.

| Platform | Supported connection approach | Initial FerixRG use | Important boundary |
|---|---|---|---|
| **Shopify** | Merchant authorization through a registered app, verified callback, requested scopes, and server-side token exchange. | Begin with minimum read scopes for shop, products, content, and theme analysis; request write scopes only when a user explicitly chooses a supported editing or publishing workflow. | Shopify requires validating authorization requests and callbacks, and access is scope-based. It also supports webhook subscriptions for store events. [1] [2] [3] |
| **WooCommerce** | Merchant-authorized API-key flow over HTTPS, using the application authorization endpoint where available. | Read products, collections, pages, and supported order-independent store content; create explicit separate permissions for writes. | API keys inherit the selected WordPress user’s capabilities. Webhooks can notify FerixRG about product, order, customer, and other store events. [4] [5] [6] |
| **Other platforms** | Separate adapter per platform; no generic token field or shared publish assumption. | Add only after its official authorization, scope, and release capabilities are verified. | The frontend must show only supported actions for each adapter. |

Connection secrets are encrypted at rest, never returned to the browser, redacted from logs, rotated or revoked on disconnect, and stored separately from normal store metadata. A connection record saves the platform, store identity, granted scopes, supported capabilities, connection status, and the user who granted the connection.

## Required backend records

The current user and draft records are a starting point only. The production backend needs the following normal domain records before real connections are turned on.

| Record | Responsibility |
|---|---|
| `stores` and `store_members` | Store identity, organization ownership, collaborators, and roles. |
| `store_connections` and `connection_secrets` | Platform identity, encrypted credentials, granted scopes, capability flags, health, expiry, revocation, and webhook configuration. |
| `evidence_snapshots` and `evidence_assets` | Immutable source captures, screenshots, parsed page information, theme file references, content hashes, and collection time. |
| `tool_runs`, `tool_findings`, and `tool_reports` | Tool request, execution status, source snapshot, machine findings, AI findings, confidence, cost, report, and retry state. |
| `drafts`, `draft_versions`, and `change_sets` | Shared manual and AI editing state, previewable operations, version ancestry, approval state, and comparison baseline. |
| `validations` and `release_records` | Exact checks run, blockers, user approval, connector permission, publish/rollback action, target store version, and audit history. |

## User-safe execution flow

1. The user chooses a tool and supplies a public URL, screenshot, saved draft, theme file, or connected store.
2. FerixRG creates an evidence snapshot and records what is actually available.
3. The deterministic rules service produces measurable findings first.
4. The AI service receives only permitted evidence and returns a structured explanation or proposal.
5. The user reviews the result, then opens the shared editor if a change is wanted.
6. Manual changes and AI changes create versions of the same draft.
7. Validation compares the draft with its baseline and checks release requirements.
8. FerixRG exports a package when no supported publish capability exists; otherwise it asks for explicit user approval before a connector performs a release.

## References

[1] [Shopify authorization code grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant)

[2] [Shopify API access scopes](https://shopify.dev/docs/api/usage/access-scopes)

[3] [Shopify webhooks](https://shopify.dev/docs/api/webhooks/latest)

[4] [WooCommerce REST API](https://developer.woocommerce.com/docs/apis/rest-api/)

[5] [WooCommerce REST API authentication](https://developer.woocommerce.com/docs/apis/rest-api/authentication/)

[6] [WooCommerce webhooks](https://woocommerce.com/document/webhooks/)
