# FerixRG Central AI Gateway operations design

The Central AI Gateway is the only backend boundary permitted to send model requests. It receives a workspace-authorized, bounded task, selects an approved adapter, records provider/model/usage metadata, and returns a reviewable proposal or evidence-linked result. Browser clients never receive model-provider credentials, merchant credentials, or an authorization shortcut.

> **Fail-closed rule.** If a capability has no configured adapter, no eligible evidence, or no authorized workspace scope, FerixRG returns an explicit unavailable state. It does not fabricate a result, store mutation, publication, rollback, or customer-facing recommendation.

| Route class | Current state | Gateway inputs | Allowed result | Prohibited result |
|---|---|---|---|---|
| Design Copilot | Active with Cloudflare adapter when server configuration is present | Bounded editor context and user message | Reviewable text proposal with model and neuron attribution | Claiming a store was changed, published, inspected, or deployed |
| Public URL inspection | Active deterministic executor | Validated public URL only | Persisted observed metadata, evidence, issue records, and JSON artifact | AI-generated page facts or access to private infrastructure |
| Evidence summarization | Designed, not active | Workspace-scoped evidence IDs and extracted facts | Citation-linked plain-language summary | Cross-workspace retrieval or unsupported factual claims |
| Screenshot/vision analysis | Designed, not active | User-owned or server-captured evidence asset | Observation linked to an evidence asset | Visual certification or source-rights assumptions |
| Store mutation and release | Explicitly gated | Approved release plan plus configured provider adapter | Provider adapter execution receipt | Direct AI publishing, rollback, or theme mutation |

## Safe action registry

Every AI or agentic action must be represented as an explicit backend registry item with the following fields: `actionId`, `requiredRole`, `acceptedEvidenceKinds`, `adapterCapability`, `inputSchema`, `outputSchema`, `mayWrite`, `mayPublish`, `auditEvent`, and `fallback`. A route can execute only when all its preconditions are satisfied. Write or release actions require an independent approval record and a configured provider adapter; the AI response itself is never an approval.

The first implemented action is `design_copilot.propose`. It is editor-scoped, accepts no secrets or authorization-like content, writes a usage ledger entry and audit metadata, and returns a non-binding proposal. `public_url.inspect` is deterministic rather than AI-driven and produces the evidence that future assisted routes may summarize.

## Evaluation and monitoring

| Control | Requirement |
|---|---|
| Contract tests | Validate provider configuration absence, workspace authorization, sensitive-content rejection, free-capacity guard, bounded input, structured response parsing, and unavailable-provider handling. |
| Evidence evaluation | Evaluate claims against attached evidence IDs. A response without evidence must be labelled as a proposal, not an observation. |
| Human review | Require user review before a draft is applied and administrator approval before an eligible release plan advances. |
| Telemetry | Record provider, model, route, latency category, success/failure, Neurons when returned, and a message-free audit record. |
| Alerting | Monitor provider-unavailable failures, daily capacity rejections, malformed responses, repeated authorization failures, and issue-creation errors. |
| Retention | Keep raw secrets out of prompts, evidence metadata, and activity events. Store only the minimum record required for usage, authorization, and traceability. |

Cloudflare documents Workers AI model invocation through its authenticated API and lists the available model catalog separately from plan availability. [1] [2] FerixRG’s gateway therefore treats model selection as an adapter capability and checks readiness at runtime rather than assuming that a catalog model is accessible on every plan.

## Fallback sequence

First, retry no more than one transient provider failure within the server timeout budget. Second, return a clear unavailable response with no fabricated output. Third, preserve the queued/run/audit context so the user can retry after configuration or capacity changes. A future second provider may be introduced only as a new adapter with the same privacy, authorization, evaluation, and audit contract; the UI must not branch directly by provider.

## References

[1]: https://developers.cloudflare.com/workers-ai/get-started/rest-api/ "Cloudflare Workers AI REST API"
[2]: https://developers.cloudflare.com/workers-ai/models/ "Cloudflare Workers AI model catalog"
