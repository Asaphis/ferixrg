# FerixRG Launch AI Foundation

## Decision to make before implementation

FerixRG should set up the **complete AI foundation now**, before activating individual real tool workflows. This does not mean installing every heavyweight model on the current development machine. It means building every model connection, route, safety boundary, test suite, and production switch now, so a new tool later reuses the same foundation rather than requiring a new AI system.

The AI foundation has two possible compute routes:

| Route | What it is | Appropriate use |
|---|---|---|
| **NVIDIA NIM API** | NVIDIA hosts the model endpoint and FerixRG’s backend calls it using a server-side API key. NVIDIA documents free access for development and prototyping through its Developer Program. [1] | Fastest way to test the complete foundation without owning a GPU machine. |
| **Self-hosted NVIDIA NIM or vLLM** | FerixRG runs the same open model on a private Ubuntu server with NVIDIA GPU capacity. | The long-term route when FerixRG needs complete data control, fixed deployment control, and production reliability. |

> **Recommendation:** Build FerixRG so it supports both routes from day one. Use NVIDIA NIM API for development and full integration testing first, then use the open Qwen models through private Ubuntu **vLLM** for public launch. This prevents a future rewrite and does not make public FerixRG users depend on an NVIDIA trial API. NVIDIA’s free API access and free self-hosted NIM license are explicitly for development, research, testing, and experimentation; real users are production use. [1]

## The full launch model set

| Model role | Recommended model family | What it powers | NVIDIA route | Self-hosted route |
|---|---|---|---|---|
| **Central visual and reasoning AI** | Qwen vision-language family | Every FerixRG AI Copilot interaction; storefront screenshots; design references; visual diagnosis; responsive guidance; content and design proposals; controlled tool actions | NVIDIA NIM VLM endpoint/model catalog | Qwen model through NVIDIA NIM VLM or vLLM |
| **Developer and theme-code specialist** | Qwen3-Coder | Developer Handoff, theme/code explanations, HTML/CSS suggestions, structured code-change proposals | NVIDIA NIM endpoint where available, or a compatible model endpoint | Qwen3-Coder through vLLM |
| **Image-generation and image-editing specialist** | Qwen-Image and Qwen-Image-Edit | New visual assets; in-editor image changes; reference-inspired asset creation; optional generated product imagery | NVIDIA NIM image endpoints | Qwen-Image service on an NVIDIA GPU |
| **Knowledge and memory retrieval** | BGE-M3 | Finds the right saved report, previous tool run, draft, store note, documentation, and user instruction before the Central AI answers | Run privately as a small retrieval service | Run privately as a small retrieval service |
| **Safety and action review** | FerixRG policy engine with optional model safety service | Stops unauthorized action requests; flags unsafe content; blocks unsupported publish actions | Can use NVIDIA safety capabilities where selected | Core FerixRG policy rules are always local |

The first three are generative AI models. BGE-M3 is different: it stores semantic search representations so the Central AI can find relevant FerixRG knowledge and previous work instead of relying only on the open chat window. BGE-M3 is MIT-licensed and supports retrieval across more than 100 languages. [2]

## What one user request does

```text
User request from any FerixRG tool
            ↓
Central AI Gateway in the FerixRG backend
            ↓
Loads permitted store, page, screenshot, evidence, draft, user, and tool context
            ↓
Retrieval service finds relevant saved FerixRG context
            ↓
Model router selects the central visual model, code specialist, or image specialist
            ↓
FerixRG action registry validates every requested action
            ↓
Returns a typed proposal, preview, evidence-backed report, or developer handoff
            ↓
User reviews and approves any meaningful change
```

The frontend never decides which AI provider to call. It calls one FerixRG backend endpoint. The Central AI Gateway makes every provider/model decision on the server and can change from NVIDIA hosted API to self-hosted NVIDIA NIM or vLLM without changing the frontend or each of the 57 tools.

## How NVIDIA fits

NVIDIA NIM is not an AI model. It is NVIDIA’s model-serving system. It provides hosted endpoints for experimentation and Docker-based self-hosted model microservices for NVIDIA GPU environments. Its VLM documentation confirms OpenAI-compatible APIs, tool/function features, and deployment on NVIDIA GPU infrastructure. [1] [3]

This is why NVIDIA is a practical option for FerixRG:

| FerixRG need | NVIDIA NIM contribution |
|---|---|
| Test without owning a GPU now | Hosted API endpoint with a secure `NVIDIA_API_KEY` stored only in the FerixRG backend |
| Use visual AI for storefront screenshots | VLM-capable NIM models and vision-language API support [3] |
| Use Qwen image creation/editing | NVIDIA catalog currently exposes Qwen-Image and Qwen-Image-Edit endpoints [4] |
| Move to a private launch server later | Same model-serving architecture can run as a private NIM container on Ubuntu/NVIDIA GPU infrastructure [1] [3] |
| Keep code simple | NIM exposes an OpenAI-compatible API surface, so the FerixRG model client does not need to be rewritten when routes change [3] |

## What FerixRG will build now

| FerixRG component | Purpose |
|---|---|
| **AI provider interface** | One internal contract that supports `nvidia-nim`, `private-nim`, and `private-vllm`; each model route conforms to this contract. |
| **Central AI Gateway** | Authenticates the user, identifies the selected FerixRG tool, loads only authorized context, and calls the model router. |
| **Model router** | Chooses central visual AI, code AI, image AI, retrieval, or fallback according to the tool task. |
| **Agent action registry** | Contains the only actions AI can request. Every action has typed input, permission checks, audit record, and human-review requirement where needed. |
| **AI run records** | Saves model route, input references, output, action requests, latency, error state, user decision, and cost/usage record. |
| **Evaluation suite** | Tests design understanding, screenshot reading, tool-action correctness, proposal structure, refusal behavior, and failure fallback against saved FerixRG examples. |
| **Monitoring and fallback** | Detects unavailable model routes, slow requests, malformed responses, and failed actions; returns a clear retry state rather than a false answer. |

## Credentials and connection

During NVIDIA hosted development, FerixRG needs one secret: `NVIDIA_API_KEY`. It is stored in secure backend configuration, never in frontend code, browser storage, or user prompts.

```text
Browser → FerixRG backend → NVIDIA NIM endpoint
                    ↑
          NVIDIA_API_KEY remains here only
```

During private launch deployment, the same FerixRG backend changes only the internal model base URL and service authentication. The frontend does not change.

## Ubuntu and production reality

Ubuntu is appropriate for both FerixRG backend services and private model serving. However, the current development machine does not have an NVIDIA GPU and has insufficient memory for the central vision model. It can build, test, and connect the AI gateway to NVIDIA’s hosted API, but it cannot be the final model-serving machine.

For launch, the model server must be a separate Ubuntu system with NVIDIA GPU capacity. For the requested free/open-source route, FerixRG should serve the open Qwen models through **vLLM**, not self-hosted NVIDIA NIM. vLLM and the selected Qwen model software avoid an NVIDIA NIM production license, while the GPU machine still has to exist.

NVIDIA’s current documentation is clear: the NVIDIA Developer Program gives free NIM API and container access only for prototyping, research, development, testing, and experimentation. It says that real-user production use requires an NVIDIA AI Enterprise license, currently listed from $4,500 per GPU per year. [6] Therefore, self-hosted NVIDIA NIM is not the right long-term public-launch choice if FerixRG must avoid NVIDIA software licensing cost.

| Route | Software/model cost | Hardware cost | Can serve real FerixRG users? | Recommendation |
|---|---:|---:|---:|---|
| NVIDIA NIM hosted API | Free for development/testing trial access | None for FerixRG | No — it is not a public-production entitlement | Use now for building and testing |
| Self-hosted NVIDIA NIM | Requires NVIDIA production licensing for real users | Ubuntu NVIDIA GPU machine required | Yes, with paid NVIDIA AI Enterprise | Do not choose if the free requirement remains |
| **Self-hosted Qwen through vLLM** | **Free open-source model and serving software** | Ubuntu NVIDIA GPU machine required | **Yes, subject to the model license and normal operational responsibilities** | **Choose for public launch** |

## Setup sequence

1. Create or use a verified NVIDIA Developer account.
2. Generate the `NVIDIA_API_KEY` for development/testing.
3. Add the AI provider interface, Central AI Gateway, model router, action registry, run records, evaluation suite, and monitoring in FerixRG’s backend.
4. Connect all five AI model roles through the route registry, even if some specialist models are initially disabled until their user-facing tools are activated.
5. Run the full evaluation suite against FerixRG example screenshots, drafts, reports, and tool requests.
6. Connect the gateway to the approved frontend AI Copilot and tool workflows.
7. Before public launch, deploy the private Ubuntu/NVIDIA GPU model route, run the same evaluation suite again, and switch the provider setting without changing tool code.

## References

[1] [NVIDIA NIM for Developers](https://developer.nvidia.com/nim)

[2] [BGE-M3 model card](https://huggingface.co/BAAI/bge-m3)

[3] [NVIDIA NIM for Vision Language Models](https://docs.nvidia.com/nim/vision-language-models/latest/introduction.html)

[4] [NVIDIA Qwen-Image endpoint](https://build.nvidia.com/qwen/qwen-image)

[5] [Qwen3-Coder official project](https://github.com/QwenLM/Qwen3-Coder)

[6] [NVIDIA NIM FAQ and production licensing](https://docs.api.nvidia.com/nim/docs/product)
