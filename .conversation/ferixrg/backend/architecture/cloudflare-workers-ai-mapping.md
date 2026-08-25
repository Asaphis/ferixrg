# Cloudflare Workers AI Mapping for FerixRG

## Decision

Cloudflare Workers AI is the **first FerixRG AI provider**. FerixRG will call it through a provider adapter inside `backend/api`; users and the frontend never receive Cloudflare tokens or choose Cloudflare models directly.

Cloudflare’s current catalog contains 84 models and exposes function calling, JSON mode, asynchronous batch processing, prompt caching, and fine-tuning capabilities. [1] [2] Its catalog includes multimodal reasoning, vision, image generation, embeddings, reranking, safety, transcription, speech, translation, and text models. [1]

## FerixRG model-family roles

| FerixRG capability | Cloudflare model family to use | Why it fits |
|---|---|---|
| Central text/design copilot | Current **Gemma 4**, **GPT-OSS**, **DeepSeek**, **GLM**, or **Kimi** function-calling/reasoning family selected by the registry | The current catalog exposes agentic function calling and reasoning families. [1] |
| Storefront and screenshot understanding | Current **Gemma 4**, **Llama 4 Scout**, **Kimi**, or Llama vision family | These catalog entries support image/vision input and can return structured tool calls. [1] |
| AI Design Copilot actions | A current function-calling model with **JSON mode** | FerixRG supplies only approved actions; the model can propose calls but the backend validates each one. [2] |
| Image generation / visual exploration | Current **FLUX** or **Lucid** image-model family | The catalog includes image-generation providers, including FLUX and Lucid families. [1] |
| Draft/report/workspace search | **BGE-M3** or **EmbeddingGemma** embeddings plus BGE reranking | These current model families support semantic search, multilingual retrieval, classification, and relevance scoring. [1] |
| Prompt and output safety checks | **Llama Guard** family | It is designed to classify user inputs and model responses for safety. [1] |
| OCR/visual evidence support | Vision model plus deterministic OCR/evidence extraction | AI interpretation must stay separate from exact technical evidence collection. |
| Audio/transcription in a future workflow | Current speech-to-text/text-to-speech model family | Available through the catalog, but not required for the first FerixRG release. [1] |

## Routing rules

The adapter must select a current supported model at runtime through the Cloudflare catalog configuration, rather than hard-coding a stale model name into every FerixRG tool.

| Tool state | Routing rule |
|---|---|
| Public URL analysis | Use a low-cost model for report wording only after the evidence services collect source material. |
| Screenshot or design reference analysis | Use a vision-capable model; store its structured findings and cited evidence. |
| User asks the AI Copilot to modify a draft | Use a function-calling model and allow only the draft-safe action list. |
| User asks for a visual proposal | Use an image model; save its output as a reviewable asset rather than applying it automatically. |
| Tool run reaches the daily free allocation | Return a clear queued/limit state, try only an approved fallback, and never retry indefinitely. |
| Connected store or sensitive content | Apply FerixRG workspace privacy policy before sending any content to the provider. |

## Cloudflare free-use guard

Cloudflare documents a daily no-charge allocation of 10,000 Neurons. The FerixRG gateway must estimate usage, track the provider response, reserve a per-workspace allowance, and stop or queue work before a request would exceed the configured allowance. [3]

The free allocation is suitable for controlled testing, demonstration work, low-volume use, and early onboarding. It is not a promise of unlimited public inference. FerixRG retains its provider-neutral adapter contract so a paid Cloudflare plan or another provider can be enabled later without changing the frontend or tool contracts.

## Required Cloudflare credentials

The user will later create a Cloudflare API token restricted to Workers AI and provide the Cloudflare account identifier. FerixRG will store both only as backend secrets:

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Selects the user’s Cloudflare account endpoint. |
| `CLOUDFLARE_AI_API_TOKEN` | Authenticates the backend-only Workers AI request. |

No secret will be requested or connected until the provider adapter, test contract, and privacy guard are ready.

## References

[1] [Cloudflare Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)

[2] [Cloudflare Workers AI features](https://developers.cloudflare.com/workers-ai/features/)

[3] [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
