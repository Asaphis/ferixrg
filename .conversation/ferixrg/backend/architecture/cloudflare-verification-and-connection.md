# Cloudflare Workers AI: Capability Verification and Connection

## Verdict

**Yes. Cloudflare Workers AI can power the complete first FerixRG AI foundation.** It provides serverless GPU inference through a real API, and FerixRG can call it from the existing Ubuntu backend without a local GPU or a Cloudflare frontend deployment. Cloudflare documents that Workers AI models can be invoked from anywhere through the Cloudflare API. [1]

Cloudflare does not replace normal website capture, store connections, version storage, or publishing permissions. Those are FerixRG backend services or official connected-store APIs. It provides the AI model capability behind the tools: reasoning, visual understanding, controlled tool calls, image creation, search embeddings, safety checks, and future audio functions.

## Capability match

| FerixRG requirement | Cloudflare Workers AI coverage | Verdict |
|---|---|---|
| Central user-facing AI Copilot | Current text/reasoning/function-calling model families include Gemma, GPT-OSS, DeepSeek, GLM, and Kimi. [2] | **Covered** |
| Storefront screenshot and design understanding | The catalog includes vision-capable Llama, Gemma, Kimi, and multimodal model families. [2] | **Covered** |
| AI asks FerixRG to take an action | Workers AI supports function calling and JSON mode; FerixRG validates every requested action itself. [3] | **Covered** |
| Image generation and basic image-to-image work | The API supports text-to-image and image input; the catalog includes FLUX and Lucid image families. [2] [4] | **Covered for first foundation** |
| Semantic search and workspace memory | BGE-M3, EmbeddingGemma, and reranking models are available. [2] | **Covered** |
| Prompt/output safety | Llama Guard model family is available. [2] | **Covered** |
| User text or audio in a future tool | Catalog includes speech recognition and text-to-speech providers. [2] | **Covered when needed** |
| Browser reading / website screenshot collection | Not a Workers AI model task. FerixRG must use its evidence/crawler/browser layer. | **Separate non-AI service** |
| Store connection, editing a real theme, publish, rollback | Not an AI model task. FerixRG uses Shopify/WooCommerce APIs and its release permissions. | **Separate non-AI service** |

## It is a real API

FerixRG will connect from the Ubuntu backend with a normal HTTPS `POST` request. Cloudflare’s current endpoint is:

```text
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL_NAME}
Authorization: Bearer {CLOUDFLARE_AI_API_TOKEN}
```

Cloudflare documents the `Execute AI model` endpoint as `POST /accounts/{account_id}/ai/run/{model_name}`. It accepts model-specific structured input and returns structured output, including generated response text, tool-call requests, token usage, image/audio data, embeddings, classifications, and detection results depending on the model. [4]

```text
FerixRG frontend
       ↓ authenticated FerixRG request
FerixRG Ubuntu backend
       ↓ server-only HTTPS request
Cloudflare Workers AI REST API
       ↓ structured model response
FerixRG backend validates, saves draft/evidence, returns safe result
       ↓
FerixRG frontend
```

The browser does not call Cloudflare. The browser cannot see the token, account identifier, provider response metadata, or unrestricted model choices.

## Credentials required when implementation starts

| Backend secret | How the user gets it | Required permission |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Workers AI → **Use REST API** → copy Account ID. [5] | Not a secret, but stored as server configuration. |
| `CLOUDFLARE_AI_API_TOKEN` | Cloudflare Dashboard → Workers AI → **Use REST API** → **Create a Workers AI API Token**. [5] | Workers AI Read and Workers AI Edit. [5] |

The token is shown once by Cloudflare, so it will be stored only through FerixRG’s secret configuration. It must never be added to frontend code, committed to GitHub, or placed in browser storage. [6]

## FerixRG implementation pattern

1. Build the `CloudflareWorkersAIProvider` server adapter in `backend/api`.
2. Store a model/capability policy in FerixRG configuration, not in the frontend.
3. Send a test request to a low-cost text model only after the user provides the two credentials securely.
4. Add the daily-Neuron usage guard, retry policy, provider fallback contract, and audit event log.
5. Connect the first approved workflow: AI Design Copilot creates a reviewable draft proposal only.
6. Add screenshot/visual analysis, image generation, embeddings, safety, and other tool capabilities under the same provider contract.

## Important limit

Cloudflare’s recurring no-charge allowance is 10,000 Neurons per day. It is sufficient to build, test, and run controlled early workflows, but it is not unlimited public-user traffic. FerixRG must track usage and queue, fall back, or use a paid plan as the user base grows. [7]

## References

[1] [Cloudflare Workers AI overview](https://developers.cloudflare.com/workers-ai/)

[2] [Cloudflare Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)

[3] [Cloudflare Workers AI features](https://developers.cloudflare.com/workers-ai/features/)

[4] [Cloudflare Execute AI model API](https://developers.cloudflare.com/api/resources/ai/methods/run/)

[5] [Cloudflare Workers AI REST API quickstart](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)

[6] [Cloudflare API token guidance](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

[7] [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
