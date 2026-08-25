# FerixRG Free Open-Source AI Plan

## Decision

FerixRG can use a **free open-source AI model** as its central design AI. We will not pay a commercial AI provider for the model itself and we will not train a model from zero.

The recommended starting stack is:

| Layer | Choice | Why it is used |
|---|---|---|
| **Central model** | `Qwen3-VL-8B-Instruct` | It is an Apache-2.0 open model that understands both text and images. Its documented abilities include visual reasoning, screenshot/GUI understanding, visual coding, long context, and tool interaction—matching a storefront-design platform. [1] [2] |
| **Local development model server** | Ollama | It runs open models locally and exposes a simple local API. It is the easiest way to develop FerixRG’s AI connection without a paid API account. [3] |
| **Production model server** | vLLM | It serves an open model behind an OpenAI-compatible API, so FerixRG’s backend calls it in the same secure way it would call any internal service. [4] |
| **FerixRG agent layer** | FerixRG backend code and action registry | This is the part we build. It owns tool selection, design context, safe actions, draft rules, permissions, approvals, and saved agent state. |

## The connection path

```text
FerixRG user interface
        ↓
FerixRG backend — Central AI Gateway
        ↓
FerixRG agent router and approved action registry
        ↓
Private Qwen3-VL model server
        ↓
Open-source Qwen3-VL model
```

The browser never connects directly to the model. The FerixRG backend is the only system allowed to speak to the model server. It sends the model only the current user instruction and permitted page, screenshot, draft, or tool context. It receives a structured response, checks it, saves it as a draft or report, and returns the safe user-facing result.

## What “agentic AI” means for FerixRG

The central model is not a coding agent controlling the entire product. It is a **multimodal design agent** that can understand design and choose from FerixRG’s allowed actions.

For example, if a user writes, “Make my product page feel more premium and easier to use on mobile,” the Central AI Gateway gives the model the authorized current page, screenshot, responsive findings, and current draft. The model can request actions such as `readCurrentDraft`, `inspectSelectedSection`, `createLayoutProposal`, and `createContentProposal`. It cannot call arbitrary code, browse unrelated stores, or publish a change.

| AI can do | FerixRG backend controls |
|---|---|
| Understand screenshots, references, page content, and user instructions | Which evidence it sees |
| Plan a design improvement | Which actions it can request |
| Create a structured proposed change | How a proposal is validated and stored |
| Answer inside the AI Copilot | Which store and draft the conversation belongs to |
| Ask to compare or validate a draft | Whether the action is allowed for that user and store |

## Why this model fits FerixRG

Qwen3-VL is not only a text chatbot. Its official project describes visual/GUI understanding, tool invocation, visual coding, image and document understanding, OCR, spatial reasoning, and multimodal text-plus-image interaction. The 8B Instruct model is a practical first model size for a self-hosted product experiment, while the same family offers larger variants only if FerixRG later needs more reasoning quality. [1] [2]

This means one open model can be the central AI for:

| FerixRG need | Qwen3-VL role |
|---|---|
| AI Design Copilot | Understand the page and reference, then create a design proposal |
| Screenshot and reference analysis | Read the visual hierarchy, UI elements, typography, spacing, and design patterns |
| Content and CTA work | Understand page/product context and draft a controlled alternative |
| Responsive work | Compare desktop and mobile screenshots and propose a targeted change |
| Developer handoff | Explain visual issue context and produce HTML/CSS-oriented recommendations when appropriate |
| Shared AI conversation | Keep a tool-specific conversation over the selected draft and evidence |

## The important truth about “free”

The **model weights and serving software can be free and open source**. However, the model still needs a computer with enough compute to run it. There are only two honest ways to run it:

| Route | Is the model free? | What it means |
|---|---:|---|
| **Your own computer for development** | Yes | Run Ollama and the open model locally. FerixRG can use it while that computer is on and reachable. This is the best no-provider-cost way to build and test the AI. |
| **A dedicated GPU server for public users** | Yes | The model is still free, but the server/GPU that runs it needs to be provided by you or a hosting company. This is necessary for a reliable public product; the current web application backend cannot itself host a multimodal 8B model. |

The current FerixRG web backend remains the **application backend**. It stores users, stores, drafts, permissions, and AI runs. The model server is a separate private service because the model requires specialized compute and must not be exposed directly to the public internet.

## First implementation sequence

1. Create the **Central AI Gateway** in `backend/api` with a model-provider interface that points to a local Ollama server during development.
2. Create the **FerixRG action registry**: the only safe functions the AI may request.
3. Add a **Qwen3-VL connector** that sends text and screenshot/design context to the private model server.
4. Connect it first to **AI Design Copilot**, creating a structured draft proposal rather than editing or publishing directly.
5. Reuse the same Central AI Gateway for the remaining tools with different tool instructions and action permissions.
6. When FerixRG is ready for public users, move the same Qwen3-VL connector from local Ollama to a private vLLM GPU server; the user-facing application does not need to change.

## References

[1] [Qwen3-VL official project](https://github.com/qwenlm/qwen3-vl)

[2] [Qwen3-VL-8B-Instruct model card](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct)

[3] [Ollama API introduction](https://docs.ollama.com/api/introduction)

[4] [vLLM quickstart](https://docs.vllm.ai/en/latest/getting_started/quickstart/)
