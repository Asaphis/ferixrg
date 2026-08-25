# FerixRG Ready-Made AI and Specialist Service Map

## Purpose

FerixRG does not need to invent every AI capability. It should connect its backend to established services where a specialist already exists, then combine their outputs inside the FerixRG tool experience. This document maps the 57 current tools to those services.

NVIDIA is **not** included in the recommended production stack because its free access is for development and testing, not an unlimited public-service entitlement.

## The six service categories FerixRG needs

| Category | What FerixRG connects to | Why it exists |
|---|---|---|
| **Central design intelligence** | A general multimodal AI API chosen through the FerixRG model router | Understands user instructions, screenshots, page context, analysis findings, design references, and produces reviewable proposals. |
| **Website evidence service** | Screenshot, visual-diff, crawl, and structured-web-extraction APIs | Gives the Central AI the real storefront, page structure, mobile render, and before/after evidence instead of relying on assumptions. |
| **Visual asset AI service** | Dedicated image-editing and image-generation API | Handles background removal, product retouching, generation, expansion, relighting, and asset variation tasks. |
| **Browser agent service** | Controlled browser-agent SDK/API | Performs approved browser observations or actions reliably when a tool needs an actual rendered flow. |
| **Developer agent/service** | Coding-agent API and code-specialist model route | Prepares developer handoffs, code explanations, and controlled theme/code proposals. |
| **Deterministic validation service** | Standards-based analysis tools and platform APIs | Measures performance, accessibility, SEO, store data, release permissions, and regression changes. AI explains and helps fix; it does not invent measurements. |

## Actual ready-made services we can connect

| Service | Ready-made capability | Correct FerixRG role | Production position |
|---|---|---|---|
| **OpenRouter** | One API with hundreds of selectable models, including model metadata for image input, image output, embeddings, tool calling, and provider fallbacks. [1] | The **model selection gateway** used by FerixRG’s Central AI Gateway. It lets FerixRG test and route different AI models without rewriting tools. | Useful provider gateway. Its free models are only for limited development use; production model capacity must be configured deliberately. [2] |
| **Google Gemini API / AI Studio** | Google’s direct multimodal model API with text, image, audio, agent, and image-generation model families. [3] | Optional **central multimodal design-intelligence provider** for screenshot and design reasoning. | Free tier is useful for testing; a production route requires selecting an eligible paid/stable model and privacy setting. [3] |
| **Google Jules** | API-accessible asynchronous coding agent that works with GitHub repositories, plans changes, runs work in cloud VMs, and creates pull requests. [4] | **Internal engineering/developer workflow only**. It can help FerixRG’s team improve the FerixRG codebase. | Do not use as the AI behind a customer’s store-design tool. Its API is alpha. [4] |
| **GitHub Copilot cloud agent** | Repository-aware cloud coding agent that researches code, plans changes, writes on a branch, runs tests, and can open a pull request. [12] | Optional **internal FerixRG engineering agent** for repository maintenance, tests, and reviewed implementation tasks. | Internal engineering use only; requires an eligible paid Copilot plan and must not receive a merchant’s store credentials. [12] |
| **E2B** | API-accessible isolated Linux sandboxes where an approved coding agent can execute code, process data, and return controlled artifacts. [13] | Optional **safe execution environment** for developer-handoff experiments or isolated code-validation jobs. | A sandbox is infrastructure for an AI agent, not the AI model itself; it should be used only for code/drafts with strict access boundaries. [13] |
| **Snapshot Site** | API for full-page screenshots, mobile device emulation, AI webpage analysis, visual diffs, and mismatch metrics. [5] | **Storefront Analyzer, Page Analyzer, Screenshot Analyzer, responsive tools, Before/After Comparator, and visual regression tools.** | Strong ready-made visual-evidence service; free plan has 50 requests/month, then paid plans. [5] |
| **Firecrawl** | API for crawling, mapping, scraping, search, screenshots, and natural-language structured extraction from webpages. [6] | **Site Structure Analyzer, Navigation Analyzer, Content Quality Analyzer, SEO Analyzer, asset discovery, and storefront evidence collection.** | Strong website-context service. Its plan/API limits need to be selected before launch. [6] |
| **Stagehand** | Browser-agent SDK with AI actions, structured extraction, and browser control that can mix natural-language steps with deterministic browser operations. [7] | **Customer Journey Analyzer, checkout-flow observation, responsive flow validation, and supported browser-based evidence workflows.** | Use only for approved, observable flows. It is not a publishing shortcut and does not replace official store APIs. |
| **Photoroom API** | Specialized AI image editing: background removal, shadows, new backgrounds, relighting, expand, upscale, AI edit, and product-focused tools. [8] | **Product Presentation Analyzer follow-up, image optimization, product-image cleanup, and manual-editor image actions.** | Ready-made specialist image API; sandbox testing exists, but live usage is plan-based. [8] |
| **Bria** | API-first controllable image generation/editing with composable visual capabilities and a structured visual language. [9] | Optional **advanced creative-asset generation and controlled visual production** route. | Advanced/enterprise option; evaluate only if its visual-control needs justify it. |
| **Builder Visual Copilot / Figma Make** | Figma-centered AI workflows for design-to-code, responsive website creation, and design-system collaboration. [10] [11] | Optional **designer and developer workspace export/import integration**, not the core storefront AI backend. | Useful when FerixRG supports Figma-connected agency or developer workflows; not a replacement for FerixRG’s own editor. |

## Map from FerixRG tools to service combinations

| FerixRG tool groups | Ready-made service combination | What FerixRG adds |
|---|---|---|
| **Store Analysis**: Storefront, Page, Site Structure | Snapshot Site + Firecrawl + Central AI | FerixRG unifies evidence, identifies issues, saves reports, and turns findings into follow-up drafts. |
| **Design & Visual**: Visual Design, Layout, Hierarchy, Typography, Contrast | Snapshot Site + Central AI + deterministic color/contrast checks | FerixRG provides the scorecard, affected-element record, manual editor, and versioned fix proposal. |
| **UX & Conversion**: UX, Conversion, CTA, Trust, Customer Journey | Snapshot Site + Firecrawl + Stagehand where a real approved flow is needed + Central AI | FerixRG controls scope, evidence, recommendations, and whether a store connection is required. |
| **Responsive**: Responsive, Mobile UX, Breakpoints | Snapshot Site device emulation + visual diff + Central AI | FerixRG turns multi-viewport evidence into responsive drafts and developer actions. |
| **Product & Commerce**: Product, Collection, Cart, Checkout | Store platform API + Snapshot Site/Firecrawl + Central AI | FerixRG respects connection permissions and keeps private cart/checkout boundaries. |
| **Content & AI**: Content analysis, writing, CTAs, SEO content, AI Design Copilot | Central AI model provider + page/store context from Firecrawl or connected store | FerixRG owns the conversation, brand context, draft history, approval, and editor application. |
| **SEO, Performance, Accessibility** | Crawl/evidence service + standards-based measurement + Central AI | FerixRG turns factual checks into prioritised action plans and developer handoffs. |
| **Visual & Reference**: Screenshot, Reference, Store Redesign | Snapshot Site + Central AI + Photoroom/Bria if an asset must be changed | FerixRG creates comparable store drafts, not only isolated generated images. |
| **Design Workspaces**: Layout, Visual Style, Responsive, Content, Components | FerixRG editor + Central AI + optional asset service | The workspace itself is FerixRG’s own product; external AI proposes changes within it. |
| **Developer**: Handoff, Technical, Theme/Code | Store/theme access + Central AI code route + optional Jules for FerixRG’s internal engineering | FerixRG creates permission-aware issue packages and never gives a third-party agent unreviewed store publishing power. |
| **Testing & Validation** | Snapshot Site visual diff + deterministic checks + Central AI explanation | FerixRG owns baselines, pass/fail policy, report history, and release blocking. |
| **Release**: Readiness, Publish, Rollback | Official store platform API + FerixRG permissions and validation | No external AI service publishes by itself. FerixRG controls approval, audit, and rollback. |

## What must be built by FerixRG itself

Ready-made services do not replace the product. FerixRG must build these central parts:

| FerixRG-owned layer | Why it cannot be outsourced |
|---|---|
| One Central AI Gateway | It keeps user, store, page, draft, and permission context together and hides provider keys. |
| Tool router | It decides which service combination a selected tool is allowed to use. |
| Draft and version system | It keeps AI and manual work on the same editable, comparable draft. |
| Store permission and release system | It determines what can be read, changed, published, or rolled back for each connected store. |
| Evidence and report records | It makes every recommendation traceable to a screenshot, page, audit, or store record. |
| Quality evaluation and fallback rules | It tests providers and prevents a provider failure from creating a misleading user result. |

## Recommended approach now

FerixRG should build an **extensible service registry**, not choose one provider to do every job:

```text
FerixRG Central AI Gateway
      ├── central-model provider adapters
      ├── Snapshot Site adapter
      ├── Firecrawl adapter
      ├── Stagehand/browser-action adapter
      ├── Photoroom or Bria image adapter
      ├── official store-platform adapters
      └── FerixRG-owned editor, drafts, validation, and release controls
```

This is the way to use all suitable existing technologies without tying every FerixRG tool to one AI company or requiring the Ubuntu application server to run GPU models.

## References

[1] [OpenRouter model API](https://openrouter.ai/docs/guides/overview/models)

[2] [OpenRouter rate limits](https://openrouter.ai/docs/api_reference/limits)

[3] [Google Gemini API models](https://ai.google.dev/gemini-api/docs/models)

[4] [Google Jules API](https://developers.google.com/jules/api)

[5] [Snapshot Site API](https://snapshot-site.com/)

[6] [Firecrawl API reference](https://docs.firecrawl.dev/api-reference/introduction)

[7] [Stagehand browser-agent documentation](https://docs.stagehand.dev/)

[8] [Photoroom API](https://docs.photoroom.com/)

[9] [Bria Visual AI](https://bria.ai/)

[10] [Builder Visual Copilot](https://www.builder.io/blog/figma-to-code-visual-copilot)

[11] [Figma Make](https://www.figma.com/solutions/ai-web-design/)

[12] [GitHub Copilot cloud agent](https://docs.github.com/copilot/concepts/agents/cloud-agent/about-cloud-agent)

[13] [E2B coding-agent sandboxes](https://e2b.dev/docs/use-cases/coding-agents)
