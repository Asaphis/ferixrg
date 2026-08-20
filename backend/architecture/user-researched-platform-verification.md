# FerixRG Verification of User-Researched AI Platforms

## Summary

The user’s research correctly identifies a broad ecosystem of hosted AI APIs, serverless model platforms, and model gateways. FerixRG can use this ecosystem and does **not** need to self-host every model on its Ubuntu application server.

However, a model being open-source, a provider offering a free tier, and a provider being permanently free for a public application are three different things. The official terms and limits below are the source of truth for the FerixRG design.

> **FerixRG decision:** build one provider-neutral Central AI Gateway. It will support several provider adapters and select a model or specialist service per tool. It must not depend on a single free tier remaining unlimited forever.

## Verified platform comparison

| User-researched platform | What it genuinely provides | Verified free access | FerixRG role | Production assessment |
|---|---|---|---|---|
| **Vercel AI Gateway** | One endpoint for hundreds of providers/models, routing, retry, spend controls, embeddings, and BYOK. [1] | Free tier exists for a subset of models and has lower per-model limits. Purchasing credits ends the monthly free-credit arrangement. [2] | **Gateway adapter**, allowing FerixRG to choose providers without rewriting tool logic. | Useful gateway, not an unlimited free model provider. Its provider terms and input-data terms still apply. [3] |
| **Cloudflare Workers AI** | Serverless API access to 50+ open-source models, including text, reasoning, vision, embeddings, image generation, translation, audio, and safety models. [4] | 10,000 Neurons per day at no charge. Usage above that needs Workers Paid; some frontier models require paid billing. [5] | Strong **open-model inference provider**, especially for lightweight AI tasks, embeddings, safety checks, and some visual/image workflows. | Good production option with consumption billing and no GPU administration; free allocation is a development/small-use allowance, not unlimited user traffic. |
| **Mistral API** | Multimodal, agentic, coding, OCR, transcription, embeddings, moderation, and agent tools. [6] | A few specialist/labs features are free, but the main API model catalog is priced per token/page/tool call. [7] | Optional **multimodal and document/coding specialist** provider. | Production-capable when paid; do not treat its “open” model licenses as a free hosted API. Mistral’s commercial terms apply to end-user product use. [8] |
| **Cerebras Inference** | Very fast API inference for selected text, reasoning, coding, and vision-capable models. [9] | Current new-account offer is $5 in credits that expires after 30 days. Official docs explicitly say there is no automatically renewing permanently free allowance. [10] | Optional **fast inference** adapter for interactive text/reasoning or selected vision. | Excellent for testing and speed, but not a free permanent production foundation. |
| **GroqCloud** | Fast text, reasoning, tool use, audio and vision API; its Qwen 3.6 27B endpoint supports images, JSON mode, and tool calls. [11] [12] | A free plan exists with per-model request/day and token limits; limits apply at organization level and can return `429`. [12] | Strong **fast central design-analysis and tool-call fallback** during development and modest traffic. | Groq’s agreement permits use in customer applications, but model terms, limits, and provider availability still govern. It cannot be treated as unlimited capacity. [13] |
| **Google AI Studio / Gemini API** | Multimodal reasoning, vision, coding, image generation/editing, audio, embeddings, agent tools, computer use, and function calling. [14] [15] | Free tier has free tokens for selected models with rate limits. Google states free-tier content is used to improve its products; paid tier content is not. [14] [16] | The strongest **creative/design AI and image-editing candidate** for FerixRG, subject to the user’s privacy decision. | Excellent capability coverage. Use paid tier and stable model IDs for user/store data in public production; free tier is appropriate for safe non-sensitive testing only. |
| **Free LLM API resources list** | Community-maintained directory of free providers, trial credits, and model listings. [17] | It discovers options; it is not a provider. Its README was last updated September 2025 and still lists GitHub Models, which GitHub retired in July 2026. [17] [18] | **Discovery source only**. | Never use a directory’s summary as a production guarantee. Verify every selected provider’s current official documentation first. |

## Corrections to the screenshot claims

| Screenshot claim | Verified current position |
|---|---|
| “Vercel AI Gateway — five dollars every month” | Vercel has a free tier for only a subset of models, with lower rate limits. The exact free-credit behavior is tied to the team and changes after credits are purchased; it is not a promise of permanent unrestricted inference. [2] |
| “Cloudflare Workers AI — 10,000 neurons/day” | Correct. It is an official daily free allocation. It resets daily and requests fail after limits; higher use needs a paid Workers plan. [5] |
| “Mistral — every model it ships free” | Not correct for the hosted API. Mistral publishes token/page/tool prices for its main API models. “Open” describes some model licenses, not a permanent free hosted API. [6] [7] |
| “Cerebras — one million tokens every day” | Outdated. Cerebras currently documents $5 trial credits that expire in 30 days and explicitly says it has no automatically renewing permanent free allowance. [10] |
| “Groq — free forever” | A free plan exists, but every model has organization-level rate limits. FerixRG must receive `429` handling and a fallback. [12] |
| “Google AI Studio — permanent free tier” | Free access exists for selected models, but its limits vary by project/model and free-tier content is used to improve Google products. It should not process sensitive connected-store content. [14] [16] |

## Recommended FerixRG provider stack

FerixRG should not choose one provider for every job. It should configure provider roles from the beginning.

| FerixRG service role | First provider route | Fallback route | Why |
|---|---|---|---|
| Central user-facing text/design copilot | **Gemini API**, limited to approved non-sensitive development/test content until the paid privacy tier is enabled | Groq vision/tool model or Cloudflare hosted vision model | Gemini covers complex multimodal design, image editing, function calling, and agent interactions; the fallback protects availability. [14] [15] |
| High-speed general analysis/chat | **Groq** | Cerebras or Cloudflare Workers AI | Fast interactive responses, structured output, tool use, and free development capacity. [11] [12] |
| Open-model visual and retrieval work | **Cloudflare Workers AI** | Groq vision model | Serverless open-model access; useful for vision, embeddings, safety, and image workflows without an Ubuntu GPU. [4] [5] |
| Image generation and editing | **Gemini image models** only after the user accepts the provider/privacy/billing route | Cloudflare image models, then specialist image API as needed | Supports native image editing and generation; all output remains a reviewable FerixRG draft. [15] |
| Document/OCR and code specialist | **Mistral** when a specific task needs its OCR/coding capability | FerixRG central model + deterministic parser | Use only where the specialist capability adds value; do not use it by default merely because it is available. [6] [7] |
| Model marketplace / provider abstraction | **FerixRG-owned provider registry**; optionally Vercel AI Gateway adapter | Direct provider adapters | FerixRG controls user privacy, quotas, fallbacks, tool permissions, and future provider changes. [1] [2] |

## What FerixRG must build before connecting keys

FerixRG’s own backend must own all customer context and action controls. No provider gets direct access to a connected store or permission to publish.

```text
FerixRG frontend tool
        ↓
FerixRG Central AI Gateway
        ├── provider registry and model router
        ├── per-user/per-workspace budget and rate guard
        ├── prompt/context builder
        ├── safe action registry
        ├── draft/version and approval controls
        ├── evidence and evaluation log
        └── privacy policy enforcement
        ↓
Gemini / Groq / Cloudflare / Mistral / Cerebras / Vercel adapters
```

This backend-first pattern lets FerixRG start testing with free allowances, then move individual roles to paid capacity without changing the approved frontend or retraining users on another workflow.

## References

[1] [Vercel AI Gateway overview](https://vercel.com/docs/ai-gateway)

[2] [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)

[3] [Vercel AI Product Terms](https://vercel.com/legal/ai-product-terms)

[4] [Cloudflare Workers AI overview](https://developers.cloudflare.com/workers-ai/)

[5] [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

[6] [Mistral model overview](https://docs.mistral.ai/models)

[7] [Mistral API pricing](https://mistral.ai/pricing/api/)

[8] [Mistral Commercial Terms](https://legal.mistral.ai/terms/commercial-terms-of-service)

[9] [Cerebras Inference documentation](https://inference-docs.cerebras.ai/)

[10] [Cerebras rate limits and free trial](https://inference-docs.cerebras.ai/support/rate-limits)

[11] [Groq supported models](https://console.groq.com/docs/models)

[12] [Groq vision and rate limits](https://console.groq.com/docs/vision) [Groq rate limits](https://console.groq.com/docs/rate-limits)

[13] [Groq Services Agreement](https://console.groq.com/docs/legal/services-agreement)

[14] [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

[15] [Gemini API models](https://ai.google.dev/gemini-api/docs/models)

[16] [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

[17] [Free LLM API resources](https://github.com/cheahjs/free-llm-api-resources)

[18] [GitHub Models retirement](https://docs.github.com/github-models)
