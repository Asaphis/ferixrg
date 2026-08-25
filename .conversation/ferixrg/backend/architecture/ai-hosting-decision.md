# FerixRG AI hosting decision

**Decision:** Run the FerixRG web application, database integration, authentication, queue contracts, evidence persistence, and central gateway on the existing Ubuntu application server. Run model inference through **Cloudflare Workers AI** from the server-side Central AI Gateway. Do not attempt to host visual or language foundation models on the current two-core, 8 GB, no-GPU application host.

> The application server is the control plane, not the inference cluster. It authenticates users, applies workspace permissions, limits usage, persists evidence, and calls a remote model adapter. Model providers never receive direct browser credentials or unrestricted store access.

## Selected operating model

| Layer | Selected location | Responsibility | Constraint |
|---|---|---|---|
| FerixRG application | Existing Ubuntu server | React/Express delivery, tRPC, database access, local account sessions, audits, tool lifecycle, source/evidence records | Keep CPU/RAM capacity for application reliability; do not schedule model serving here. |
| Central AI Gateway | FerixRG backend | Provider selection, input boundary enforcement, privacy filtering, usage ledger, response attribution, fallback errors | Server-only tokens; no provider key reaches the client. |
| Text Design Copilot | Cloudflare Workers AI | Current `@cf/meta/llama-3.2-3b-instruct` response route | Free-plan allocation is guarded per workspace. |
| Future vision/image inference | Cloudflare Workers AI through typed gateway adapters | Screenshot understanding, image generation/editing after evidence/asset governance is implemented | Requires model-availability, plan, safety, and asset-provenance validation before activation. |
| Future external fallback | Additional gateway adapter, not a frontend rewrite | Only when Cloudflare cannot provide a required capability or approved capacity | Must satisfy the same server-side privacy, audit, and cost controls. |

Cloudflare documents Workers AI as serverless model inference available through its API, including model classes for text, embeddings, vision/image-related work, and image generation. [1] The current Free allocation is 10,000 Neurons per day, resets at 00:00 UTC, and some frontier models require paid billing; therefore the free route is an initial controlled development and low-volume launch route, not a claim of unlimited production capacity. [2]

## Decision closure and scope boundary

The provider decision was reconfirmed against Cloudflare's current pricing, model-catalog, and REST API documentation on **21 August 2026**. Workers AI retains a 10,000-Neuron daily free allocation that resets at 00:00 UTC; use above that allocation requires a Workers Paid plan. [2] The catalog currently exposes a broad set of text, image-text, vision, embedding, image, and safety-capable models, but individual availability and plan eligibility must be checked per adapter before any route is enabled. [3]

| Decision area | Closed decision | Explicit non-decision |
|---|---|---|
| First live provider | Cloudflare Workers AI is the initial and only configured inference provider. The deployed Design Copilot uses the free-plan-tested Llama 3.2 3B Instruct model through the backend gateway. | This is not a commitment to use one model for every FerixRG tool. |
| Hosting model | Ubuntu remains the application control plane; remote Workers AI performs inference. | FerixRG will not run an open-source model server on the current two-core, 8 GB, no-GPU host. |
| Multi-provider design | The Central AI Gateway retains typed provider-neutral adapter boundaries and fail-closed fallbacks. | No secondary provider is selected, credentialed, or silently invoked. |
| Future capability routes | Embedding, vision, image-generation/editing, and safety adapters may be added only after model availability, plan eligibility, evidence provenance, evaluation, and policy checks pass. | The capability catalog is not evidence that those routes are live. |
| API boundary | Cloudflare requires an Account ID and API token for REST use; FerixRG keeps both server-only and exposes protected product procedures instead. [4] | No browser receives a Cloudflare token or direct model endpoint. |

This decision closes the historical comparison work for self-hosting, NVIDIA development access, multi-model dashboards, and free-access classifications. It does **not** close implementation work for vision, image generation, self-hosting, store mutations, provider callbacks, payment services, or per-tool execution. Those remain separately gated because they require capabilities, evidence, credentials, or approval paths that have not been activated.

## Security and launch transition

The backend retains `CF_ACCOUNT_ID` and `CF_API_TOKEN` as server-only deployment configuration. The gateway limits request size, removes sensitive credential-like content, enforces editor/workspace access, records returned Neuron use, and stores audit metadata without retaining the user’s message. The active request path is therefore Ubuntu server → FerixRG Central AI Gateway → Cloudflare Workers AI REST API. Browser clients call only protected FerixRG procedures.

At public launch, monitor daily Neurons, latency, provider errors, blocked requests, and content-review outcomes. If measured usage requires a paid route or another model family, add it as a new backend adapter with the same typed readiness contract and explicit cost policy. Do not install a local open model on the present application server merely to avoid an API dependency: it lacks the GPU capacity intended for visual AI workloads.

## References

[1]: https://developers.cloudflare.com/workers-ai/ "Cloudflare Workers AI overview"
[2]: https://developers.cloudflare.com/workers-ai/platform/pricing/ "Cloudflare Workers AI pricing and Free-plan allocation"
[3]: https://developers.cloudflare.com/workers-ai/models/ "Cloudflare Workers AI models catalog"
[4]: https://developers.cloudflare.com/workers-ai/get-started/rest-api/ "Cloudflare Workers AI REST API"
