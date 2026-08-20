# FerixRG Open-Source Model Inventory and Ubuntu Setup

## The direct answer

FerixRG does **not** need to install many AI models before it starts. The correct first setup is **one central multimodal model**. It can understand written instructions, storefront screenshots, page structure, visual design, and support tool actions. That one model is enough to power the first Central AI workflow across the tools.

The recommended first model is:

| Model | Role | Start with it? |
|---|---|---:|
| **Qwen3-VL-8B-Instruct** | Central FerixRG design AI: text, screenshot, visual-design understanding, user conversation, design proposals, structured tool actions, and basic code-aware suggestions | **Yes — this is the one required model** |

Qwen3-VL-8B-Instruct is Apache-2.0 licensed and supports image-plus-text input, visual/GUI understanding, visual coding, and agent interaction. [1] [2]

## Full model list: what is required and what is optional

The following is the complete planned model list. It does **not** mean that all four models should be installed now.

| Number | Model | Purpose in FerixRG | Required now? | When it is added |
|---:|---|---|---:|---|
| 1 | **Qwen3-VL-8B-Instruct** | The one central multimodal AI for Design Copilot, visual review, content assistance, screenshots, reference design, responsive reasoning, draft proposals, and most tool interactions | **Yes** | First |
| 2 | **BGE-M3** | Searches FerixRG’s saved reports, drafts, documentation, theme notes, and previous work so the Central AI can retrieve relevant context instead of forgetting it | No | Add when the knowledge/search memory feature is needed |
| 3 | **Qwen3-Coder** | Specialist for developer handoff, theme/code analysis, HTML/CSS explanations, and code changes where a proper code expert is useful | No | Add when technical/theme tools become real |
| 4 | **Qwen-Image / Qwen-Image-Edit** | Creates or edits new standalone visual assets and product/editor images | No | Add only if FerixRG adds real AI image generation or image editing |

### What this means

1. **Start with one model:** Qwen3-VL-8B-Instruct.
2. **Do not install BGE-M3 yet:** it is for future long-term memory and search, not for the first AI Copilot.
3. **Do not install Qwen3-Coder yet:** the central visual model can prepare early developer guidance; a dedicated coding model is added only when we implement real theme/code tools.
4. **Do not install Qwen-Image yet:** it is an optional creative-image model, not required to understand or redesign a storefront draft.

This avoids wasting storage, compute, and time on models that the first version does not need.

## Models versus software

The models above are the AI brains. These are different from the software that runs them:

| Software | Is it a model? | FerixRG role |
|---|---:|---|
| **Ollama** | No | The local model runner for development on an Ubuntu machine or personal computer. It exposes a local API. [3] |
| **vLLM** | No | The private production model server. It serves an open model through an OpenAI-compatible API. [4] |
| **FerixRG Central AI Gateway** | No | Our backend code that gives the model user context, tool access, action permissions, drafts, and approval rules. |
| **Agent workflow** | No | FerixRG’s controlled action sequence. It tells the AI which allowed task actions it can call; it is not a separate AI model. |

## Can Ubuntu run it?

**Yes. Ubuntu is the correct operating system for this setup.** Ollama and vLLM both run on Ubuntu/Linux. The FerixRG application backend connects privately to the model server over an internal URL.

However, the current Ubuntu development environment has approximately **3.8 GB of memory and no NVIDIA GPU**. That is not enough to run a useful self-hosted multimodal design model for FerixRG. It can run the application backend and documentation, but it must not be treated as the final AI model machine.

| Ubuntu environment | What it can do |
|---|---|
| **Current FerixRG development environment** | Build the Central AI Gateway, agent action registry, database records, frontend connection, and model-client code; it cannot reliably serve the required model. |
| **Your own Ubuntu computer with suitable GPU capacity** | Run Ollama and the model for free during development, as long as the computer stays on. |
| **Private Ubuntu GPU server** | Run vLLM and the same model for public FerixRG users. The open-source model remains free; the server hardware is what must be available. |

## Correct setup order

```text
1. Select the one central model: Qwen3-VL-8B-Instruct
2. Prepare an Ubuntu machine with sufficient model-serving capacity
3. Install Ollama for development or vLLM for a private production server
4. Download and start the Qwen3-VL model
5. Build the FerixRG Central AI Gateway inside the backend
6. Connect the gateway to AI Design Copilot first
7. Add optional models only when their specific feature is being implemented
```

## How the backend connects

```text
FerixRG frontend
      ↓
FerixRG backend Central AI Gateway
      ↓ private internal connection
Ubuntu model server: Ollama or vLLM
      ↓
Qwen3-VL-8B-Instruct
```

The frontend never needs a model key and never talks directly to Ubuntu. FerixRG’s backend keeps control of identity, current tool, permitted store data, draft state, and approved AI actions.

## References

[1] [Qwen3-VL official project](https://github.com/qwenlm/qwen3-vl)

[2] [Qwen3-VL-8B-Instruct model card](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct)

[3] [Ollama API introduction](https://docs.ollama.com/api/introduction)

[4] [vLLM quickstart](https://docs.vllm.ai/en/latest/getting_started/quickstart/)

[5] [BGE-M3 model card](https://huggingface.co/BAAI/bge-m3)

[6] [Qwen3-Coder official project](https://github.com/QwenLM/Qwen3-Coder)

[7] [Qwen-Image official project](https://github.com/QwenLM/Qwen-Image)
