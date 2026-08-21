# Cloudflare Workers AI capability map for FerixRG

**Status:** Architecture decision record. **Default production provider:** Cloudflare Workers AI through the FerixRG Central AI Gateway. The gateway is provider-neutral; Cloudflare is its first configured adapter. This document is a capability map, not an assertion that every mapped tool is live.

> **Execution rule.** AI may summarize, classify, propose, and generate a draft. It must not claim to have inspected, changed, published, or rolled back a storefront unless the corresponding deterministic executor or provider adapter has completed that action and emitted evidence.

Cloudflare’s current catalog includes text generation, multimodal/vision models, text embeddings, image generation, image classification and detection, and a content-safety model. [1] The Free Workers allocation is 10,000 Neurons per day, resets at 00:00 UTC, and some frontier models require paid billing; FerixRG therefore uses the Free-plan-tested `@cf/meta/llama-3.2-3b-instruct` only for the current Design Copilot route. [2]

| FerixRG tool group and exact tools | Primary execution path | Cloudflare capability role | Production boundary |
|---|---|---|---|
| **Store Analysis:** Storefront Analyzer, Page Analyzer, Site Structure Analyzer | Public URL fetch, HTML parsing, response measurements, saved evidence | Text model may explain observed evidence; embeddings may later support evidence retrieval | The bounded public-URL executor is live. AI cannot substitute for the fetch or invent page facts. |
| **Design & Visual:** Visual Design Analyzer, Layout Analyzer, Visual Hierarchy Analyzer, Typography Analyzer, Color Contrast Analyzer | Screenshot/DOM evidence plus deterministic contrast or layout measurements | Vision/image-to-text for screenshot interpretation; text model for guidance | Vision is not yet activated. Every visual conclusion requires an attached screenshot or deterministic measurement. |
| **UX & Conversion:** UX Analyzer, Conversion Analyzer, CTA Analyzer, Trust & Credibility Analyzer, Customer Journey Analyzer | Evidence-led heuristic and analytics inputs | Text generation for reviewable recommendations | No conversion outcome may be claimed without measured input. |
| **Responsive:** Responsive Analyzer, Mobile UX Analyzer, Breakpoint Analyzer | Browser/device viewport evidence and deterministic layout checks | Vision may prioritize visual anomalies | Screenshot/browser executor remains required before AI interpretation. |
| **Product & Commerce:** Product Page Analyzer, Product Presentation Analyzer, Product Content Analyzer, Navigation Analyzer, Collection Analyzer, Cart Analyzer, Checkout UX Analyzer | Public page or connected-platform source evidence | Text and vision-assisted synthesis | Cart/checkout/private data requires a supported active connection and provider permission. |
| **Content & AI:** Content Quality Analyzer, AI Content Improver, Product Description Generator, CTA Generator, SEO Content Generator, AI Design Copilot | Saved text, selected editor element, user instruction, source evidence | Text generation; current live path is **AI Design Copilot** | All output is a proposal that the user reviews before applying. The active model is Llama 3.2 3B Instruct. |
| **SEO:** SEO Analyzer, Meta Generator, Heading Structure Analyzer, Image SEO Analyzer | Deterministic metadata, heading, image-alt and canonical extraction | Text generation for draft metadata; embeddings for future retrieval | Public URL inspection can supply observed metadata. Generated copy requires user review. |
| **Performance:** Performance Analyzer, Image Optimization Analyzer, Asset Analyzer | Response headers, sizes, format and browser-performance measurements | Text model may explain measured deficits | Performance scores cannot be generated from language-model inference alone. |
| **Accessibility:** Accessibility Analyzer, Accessibility Fix Assistant | DOM/screenshot evidence, contrast and semantic checks | Text model can draft remediation instructions | Automated recommendations do not certify compliance; tests and review remain required. |
| **Visual & Reference:** Screenshot Analyzer, Design Reference Analyzer, AI Store Redesign, Layout Composer, Visual Style Studio, Responsive Studio | Uploaded screenshots/references and editor state | Vision analysis and, later, image generation/editing | Image generation is deferred; source rights, review, and persistent asset storage are required. |
| **Design Workspaces:** Content Editor, Component Builder, Developer Handoff, Technical Analyzer, Theme Code Analyzer | Persistent draft/version records and code/store source | Text model drafts specifications or code guidance; embeddings may retrieve workspace context | Code/theme access and any live change require a connected-store adapter and permission. |
| **Testing & Validation:** Before/After Comparator, Visual Regression Analyzer, Responsive Regression Tester, Accessibility Regression Tester, SEO Regression Tester | Deterministic side-by-side snapshots and test reports | Vision may triage differences, text model may summarize | Pass/fail remains deterministic and evidence-backed. |
| **Release:** Publish Readiness Checker, Publish Manager, Rollback | Validation, issues, approval, active provider connection | None for the authoritative execution decision | AI cannot publish or roll back. Provider-side execution remains explicitly disabled until adapters are implemented and configured. |

## Central gateway routing policy

| Route | Current model/service | Input boundary | Output boundary |
|---|---|---|---|
| Design Copilot | `@cf/meta/llama-3.2-3b-instruct` via Cloudflare REST | Bounded editor context; credentials and authorization-like strings are rejected before transmission | Text proposal, provider/model attribution, neuron usage, and message-free audit metadata |
| Evidence retrieval (future) | Cloudflare embedding model through a gateway adapter | Only workspace-authorized text/evidence records | Retrieved record identifiers and snippets; no cross-workspace recall |
| Screenshot understanding (future) | Vision-capable Cloudflare model through a gateway adapter | User-provided or server-captured screenshot with source metadata | Reviewable observations linked to evidence IDs |
| Image generation/editing (future) | Image model through a gateway adapter | User-owned prompt and approved references | Versioned asset stored server-side; never automatic live store replacement |
| Content safety (future) | `@cf/meta/llama-guard-3-8b` or equivalent approved adapter | Prompt and generated-output policy checks | Allow/block classification; do not store unnecessary raw prompt text in audits |

## Implementation sequence

The next integrations are intentionally ordered: first a server-side embedding/retrieval implementation for authorized workspace evidence; then vision tied to persistent screenshot evidence; then image generation with asset provenance and review; finally provider-backed store mutation only after secure authorization callbacks, encrypted credential storage, least-privilege scope verification, and rollback testing. The gateway keeps these routes behind typed adapter interfaces so a capability can be added without changing the approved frontend or reusing the Design Copilot model for an unsuitable task.

## References

[1]: https://developers.cloudflare.com/workers-ai/models/ "Cloudflare Workers AI models catalog"
[2]: https://developers.cloudflare.com/workers-ai/platform/pricing/ "Cloudflare Workers AI pricing and Free-plan allocation"
