# FerixRG Hosted Multi-Model AI Platforms

## The distinction that matters

There are many platforms where FerixRG can open a dashboard, create an API key, choose models, and call them from the backend. The user is correct that this avoids hosting each model on the existing Ubuntu server.

However, these three terms are different:

| Term | Meaning |
|---|---|
| **Open-source model** | The model weights/license allow the model to be downloaded and run by a provider or by FerixRG on its own infrastructure. |
| **Hosted API** | Another company runs the GPU infrastructure and FerixRG calls the model through an API key. |
| **Free API tier** | The provider lets developers test some models without payment, but normally applies model availability, request, rate, credit, privacy, or production limits. |

The dashboard is for the FerixRG team. Users of FerixRG never select or see a provider API key. FerixRG’s backend connects to the chosen platform, asks for a named model, and returns a FerixRG-controlled result.

## Relevant platforms for FerixRG

| Platform | What the dashboard/API gives us | Suitable FerixRG use | Free access reality |
|---|---|---|---|
| **OpenRouter** | One API and model dashboard for 400+ models; model metadata includes text, image, audio, embeddings, tool support, pricing, and provider alternatives. [1] | Best **central multi-model gateway** for development: select a model per tool, test alternatives, and configure fallback routing. | It has free model variants, but free use is capped at 20 requests/minute and 50 requests/day without paid credits; its own documentation says free models are usually not suitable for production. [2] |
| **NVIDIA Build / NIM API** | NVIDIA-hosted endpoints and model dashboard; visual AI, Qwen image endpoints, and downloadable model-serving systems. [3] | Strong testing route for visual/design agent capabilities and an optional fallback provider. | Free for prototyping, development, research, and testing; NVIDIA’s terms define real end-user service as production. [4] |
| **Google AI Studio / Gemini API** | One Google dashboard and API with multimodal Gemini, image, audio, and agent models. [5] | Optional specialist provider for testing advanced design/vision or image workflows. | Google offers a free tier for some models and small projects, but identifies it as limited and notes that free-tier content is used to improve its products. It is not an open-source model platform. [5] |
| **Hugging Face Inference Providers** | A dashboard/router for more than 200 models through multiple providers, with an API and model playground. [6] | Useful for model discovery, testing, and optional small specialist calls. | Free accounts currently receive $0.10 in monthly credits; continuing use is pay-as-you-go. [6] |
| **GroqCloud** | Extremely fast API for selected hosted language, code, safety, and transcription models. [7] | Optional fast text/code specialist after a model is selected. | Its published production models list token pricing; it is not a complete free visual/image platform. [7] |

## Where Google Jules fits

Google Jules is real, but it is not the central AI platform for FerixRG users. It is an **asynchronous coding agent**: it connects to a GitHub repository, works in a cloud VM, creates a plan, makes code changes, runs tests, and creates a pull request. Its API is currently alpha. [8] [9]

That makes Jules useful as an **internal development assistant for the FerixRG engineering team**, for example on future code changes. It should not power a user’s storefront inspection, AI Design Copilot, or design tool interactions. The direct Google model service for those tasks is the Gemini API, not Jules.

## The recommended connection design

FerixRG should build one provider-neutral model router in the backend now:

```text
FerixRG user interface
        ↓
FerixRG Central AI Gateway
        ↓
FerixRG Model Router
        ├── OpenRouter adapter — multi-model selection and fallback testing
        ├── NVIDIA adapter — visual/design testing route
        ├── Gemini adapter — optional multimodal specialist route
        └── Private vLLM adapter — future self-hosted open-model route
```

Each adapter uses a secure server-side key. The model router decides the model according to the FerixRG tool and deployment rules. A user never sends a request directly to OpenRouter, NVIDIA, Google, or any other provider.

## What to set up now

The practical no-rebuild route is:

1. Set up an **OpenRouter dashboard and API key** as the main model-selection and comparison dashboard. It gives the team one place to browse and test many available models.
2. Set up an **NVIDIA Build API key** as a second visual/design testing route.
3. Build the FerixRG Central AI Gateway and model router with both adapters from the beginning.
4. Use the free routes for development and evaluation. Record every model response, quality result, latency, and provider failure in FerixRG’s test data.
5. Before public launch, choose the models that pass FerixRG’s evaluation and attach an approved production capacity route—either paid hosted access, user-funded use, or self-hosted open models on GPU infrastructure.

This sets up all provider connections and all model roles now. It does not pretend that a provider’s development free tier is unlimited GPU capacity for real public user traffic.

## References

[1] [OpenRouter model API and capabilities](https://openrouter.ai/docs/guides/overview/models)

[2] [OpenRouter free model rate limits](https://openrouter.ai/docs/api_reference/limits)

[3] [NVIDIA NIM for Developers](https://developer.nvidia.com/nim)

[4] [NVIDIA NIM FAQ and production licensing](https://docs.api.nvidia.com/nim/docs/product)

[5] [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

[6] [Hugging Face Inference Providers pricing](https://huggingface.co/docs/inference-providers/en/pricing)

[7] [Groq supported models](https://console.groq.com/docs/models)

[8] [Google Jules](https://jules.google/)

[9] [Google Jules API](https://developers.google.com/jules/api)
