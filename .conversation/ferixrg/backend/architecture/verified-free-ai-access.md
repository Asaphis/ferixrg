# Verified Free AI Access for FerixRG

## Meaning of “genuinely free”

For this list, **genuinely recurring free** means a provider currently documents a no-cost allocation that renews or remains available under a free plan. It does **not** mean unlimited requests, unlimited public users, no rate limit, or a guarantee that the provider will never change its terms.

> No hosted AI provider in this evaluation offers unlimited, permanently guaranteed free inference for an unrestricted public FerixRG launch. The recurring free platforms are appropriate for development, testing, small controlled usage, and fallback capacity. FerixRG must enforce quotas and retain a paid/self-hosted transition route.

## Genuinely recurring free access

| Platform | Current recurring free access | Important condition | FerixRG suitability |
|---|---|---|---|
| **Cloudflare Workers AI** | **10,000 Neurons per day** at no charge; the allocation resets daily. [1] | Models have different Neuron costs; requests over the free allocation need Workers Paid. | Yes. Strong open-model adapter for embeddings, safety, lightweight inference, and selected vision/image tasks. |
| **Google AI Studio / Gemini API** | A **Free tier** provides free input/output tokens for selected models with per-model/project rate limits. [2] [3] | Free-tier content is used to improve Google products. Private connected-store and user workspace content must be blocked from it. [2] | Yes for safe testing and public/non-sensitive inputs; use paid privacy tier before processing connected-store data. |
| **GroqCloud** | A **Free Plan** with published per-model request/day and token limits. [4] | Limits are organization-level, can change per model, and return `429` on exhaustion. | Yes for fast development, low-volume interactive work, and fallback; never treat as unlimited user traffic. |
| **OpenRouter free models** | A continuing free-model catalog with **20 requests/minute and 50 requests/day** before lifetime-credit expansion. [5] | Free models and availability can change; models share the quota. | Yes for model testing and emergency fallback, not a central public-service capacity plan. |
| **Vercel AI Gateway** | Its free tier makes a limited subset of models available with lower rate limits. [6] | It is a gateway, not a model owner. Provider terms and model-specific limits still apply. | Optional gateway adapter; do not depend on it as the only FerixRG model route. |

## Free only for development/testing or under limited consent conditions

| Platform | What is free | Why it is not a simple public-user “free forever” route |
|---|---|---|
| **Mistral API** | Some labs/specialist features, moderation, and experimentation access may be free. [7] | Main hosted API models are metered. Its open-weight models do not make hosted inference free. [8] |
| **Google AI Studio / Gemini API** | Free for selected models, as above. | It is technically recurring free, but it is unsuitable for private FerixRG data while free-tier content is used to improve Google products. [2] |
| **Hugging Face Inference Providers** | Small monthly credit allocation for account holders. [9] | Credit is useful for testing, but too small to make it a primary FerixRG provider. |
| **Together free models** | Some specifically designated model endpoints may be offered with free limits. [10] | Model availability and limits are endpoint-specific; verify in the current console before enabling any FerixRG workflow. |
| **Cohere** | A small free development plan with common quota. [11] | It is development capacity with shared/monthly limits, not launch capacity. |

## Trial credit only — do not call these permanently free

| Platform | Current official position |
|---|---|
| **Cerebras** | $5 trial credits after verified payment method; credits expire after 30 days. Its official documentation explicitly says there is no automatically renewing permanently free allowance. [12] |
| **Fireworks, Baseten, Nebius, AI21, Upstage, Modal, SambaNova, Scaleway, and similar marketplace providers** | Offer a defined welcome credit or time-bound promotional credit. These are useful for comparing models, not permanent free FerixRG infrastructure. [13] |
| **GitHub Models** | Not a trial and not a free option: the service was retired July 30, 2026. [14] |
| **NVIDIA NIM hosted APIs** | Excluded from the FerixRG production recommendation. Its hosted free availability is development/prototyping access, not the chosen permanent public-user route. [15] |

## FerixRG rule

FerixRG can connect to **all five recurring-free routes** through the Central AI Gateway. The gateway will do three things before sending any request: choose an allowed provider, check a workspace quota, and reject sensitive data when the selected provider’s free-tier privacy rule is unsuitable.

For public launch, the same provider adapters remain. Only the provider model/plan configuration changes when a free limit is exhausted; the frontend and all 57 tools remain unchanged.

## References

[1] [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

[2] [Gemini API pricing and data-use tiers](https://ai.google.dev/gemini-api/docs/pricing)

[3] [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

[4] [Groq rate limits](https://console.groq.com/docs/rate-limits)

[5] [OpenRouter free model limits](https://openrouter.ai/docs/api_reference/limits)

[6] [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)

[7] [Mistral models](https://docs.mistral.ai/models)

[8] [Mistral API pricing](https://mistral.ai/pricing/api/)

[9] [Hugging Face Inference Providers pricing](https://huggingface.co/docs/inference-providers/en/pricing)

[10] [Together AI models](https://www.together.ai/models)

[11] [Cohere rate limits](https://docs.cohere.com/docs/rate-limits)

[12] [Cerebras rate limits and free trial](https://inference-docs.cerebras.ai/support/rate-limits)

[13] [Free LLM API resources — discovery list](https://github.com/cheahjs/free-llm-api-resources)

[14] [GitHub Models retirement](https://docs.github.com/github-models)

[15] [NVIDIA NIM](https://developer.nvidia.com/nim)
