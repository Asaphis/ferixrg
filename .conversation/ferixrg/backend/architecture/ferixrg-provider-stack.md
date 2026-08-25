# FerixRG Provider Stack Design

## What FerixRG will build

FerixRG will build **its own Central AI Gateway** inside `backend/api`. It will not place provider keys in the frontend, and it will not let one external provider control the product.

The Central AI Gateway will hold a list of approved providers, models, limits, privacy rules, costs, tool permissions, and fallbacks. A selected FerixRG tool asks the gateway for a capability, such as visual understanding, image editing, fast structured analysis, code support, or embeddings. The gateway selects the provider that is allowed for that capability and returns one FerixRG-standard response to the product.

```text
FerixRG frontend
        ↓
FerixRG Central AI Gateway on the Ubuntu application server
        ├── provider registry
        ├── model/capability router
        ├── privacy and workspace rules
        ├── rate, budget, and retry guard
        ├── safe action registry
        ├── draft/version/evidence log
        └── fallback manager
        ↓
Google Gemini  ·  GroqCloud  ·  Cloudflare Workers AI  ·  Mistral  ·  optional Vercel Gateway adapter
```

## Initial full foundation

The complete foundation can be built now, even before every provider account is connected. FerixRG will support these roles from the beginning; an administrator can enable or disable each provider through server-side configuration.

| Provider | FerixRG role | Initial use | Why it belongs in the stack |
|---|---|---|---|
| **Google Gemini API** | Primary multimodal design copilot and image-creation/editing provider | Design Copilot, screenshot reasoning, content proposals, visual drafts, function calling | Google provides multimodal text/image understanding, agent tools, and native image generation/editing in the Gemini API. [1] |
| **GroqCloud** | Fast interactive reasoning and structured-analysis fallback | Fast issue explanation, JSON reports, lightweight tool-agent calls, visual review fallback | Groq supports production models plus a vision model with image input, JSON mode, and tool calls. [2] [3] |
| **Cloudflare Workers AI** | Open-model and lightweight inference provider | Embeddings, safety tasks, inexpensive classifiers, selected vision/text fallback | Cloudflare provides serverless access to 50+ open models, including text, vision, image, embeddings, and safety options. [4] |
| **Mistral API** | Optional specialist for document/OCR and code-adjacent work | Enable only for a tool that benefits from Mistral-specific OCR, coding, or document capability | Mistral has specialist models and tools, but the main hosted API is metered. [5] [6] |
| **Vercel AI Gateway** | Optional provider gateway adapter, not the FerixRG brain | Enable only if its routing, observability, or supported provider catalog benefits a deployment | It routes many providers behind one endpoint, but FerixRG retains its own registry so the platform does not become dependent on Vercel. [7] [8] |

## Roles deliberately not selected as the central production path

| Provider or product | Reason |
|---|---|
| **NVIDIA NIM** | Excluded at the user’s request. Its hosted free access is for development/prototyping and it is not the preferred permanent FerixRG route. |
| **Cerebras** | Retained only as an optional experimentation adapter. Its current offer is a time-bounded $5 trial, not a renewing free production allowance. [9] |
| **Google Jules** | Useful for internal engineering work on the FerixRG repository, but not the API that powers customer storefront tools. |
| **GitHub Models** | Retired July 30, 2026, so it cannot be connected. [10] |

## How the central gateway chooses a provider

The user should never choose a provider. They choose a FerixRG tool and state the task they want completed. The tool declares the capabilities it needs, and the gateway applies a policy.

| FerixRG capability | First route | Fallback route | User-visible behavior |
|---|---|---|---|
| Screenshot and storefront understanding | Gemini multimodal | Groq vision, then Cloudflare vision | The user sees a single evidence-backed report and never sees provider names. |
| Design proposal and image edit | Gemini image model | Review-only visual proposal when image provider is unavailable | The user receives a draft and preview; no AI proposal is published automatically. |
| Fast text analysis, report wording, structured JSON | Groq | Gemini Flash, then Cloudflare text model | The user sees the same FerixRG analysis result. |
| Embeddings, similarity, and draft/report search | Cloudflare Workers AI | Gemini embeddings | Used internally for the workspace memory and search experience. |
| Complex document/OCR or specific coding need | Mistral when enabled | Gemini or deterministic parser | The gateway uses it only where it adds a genuine specialist capability. |

## Privacy and free-tier rule

Free access is excellent for development, but it must not silently become the public product’s privacy model. The gateway must label every provider/model with one of these rules before any tool can call it:

| Provider status | Allowed content |
|---|---|
| **Development-safe free tier** | Synthetic test store content, public URLs, non-sensitive sample images, and internal test prompts only. |
| **Production privacy tier** | Connected-store content, saved drafts, customer uploads, customer data, and team workspace context. |
| **Disabled** | The provider cannot receive any FerixRG content. |

Google’s free tier uses submitted content to improve Google products, while its paid tier does not. Therefore the gateway must block connected-store and private user data from Google’s free tier. [11]

## Implementation order

The backend foundation comes first. This does not change the approved frontend design.

1. Create the provider registry, capability contracts, encrypted provider settings, request log, and fallback policy.
2. Implement a mock provider adapter so the current frontend remains fully functional without provider keys.
3. Implement Gemini, Groq, Cloudflare, and Mistral adapters behind the same contract.
4. Add privacy labels, per-workspace quotas, rate-limit handling, retries, and audit logs.
5. Connect the first real workflow: AI Design Copilot using a saved draft and review-only action contract.
6. Add the tool groups in controlled order; every provider action remains a draft until the user approves it.

## References

[1] [Gemini API model catalog](https://ai.google.dev/gemini-api/docs/models)

[2] [Groq supported models](https://console.groq.com/docs/models)

[3] [Groq vision documentation](https://console.groq.com/docs/vision)

[4] [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)

[5] [Mistral model overview](https://docs.mistral.ai/models)

[6] [Mistral API pricing](https://mistral.ai/pricing/api/)

[7] [Vercel AI Gateway overview](https://vercel.com/docs/ai-gateway)

[8] [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)

[9] [Cerebras free trial and rate limits](https://inference-docs.cerebras.ai/support/rate-limits)

[10] [GitHub Models retirement](https://docs.github.com/github-models)

[11] [Gemini API pricing and data-use tiers](https://ai.google.dev/gemini-api/docs/pricing)
