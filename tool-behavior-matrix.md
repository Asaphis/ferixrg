# FerixRG Tool Behavior Matrix

## Audit conclusion

The existing FerixRG interface has a strong **starting layer**. It already provides a discoverable library, input selection, URL analysis, store connection, progress states, evidence-led results, drafts, preview, export-safe publishing, and desktop/mobile workspace shells. However, it is **not yet aligned** with the supplied product architecture at the behavior level.

The main problem is that current flows still center the connected demo store, Atelier Forma, even where a URL or screenshot user should be a first-class user. A result must be produced by four explicit variables—**selected tool, supplied input, user mode, and connected-platform capability**—then expose only the next actions that are true for that situation.

| Interface area | Current state | Required correction |
|---|---|---|
| Tool discovery and setup | Strong. The library has categories, search, selected-tool details, sources, and requirement guidance. | Add a persistent user-mode/scope indicator so URL, screenshot, draft, theme, and store runs do not all appear to use Atelier Forma. |
| URL and screenshot analysis | Partially aligned. URL mode explains that editing/publishing require connection. | Make one-off analysis a complete path: evidence, AI conversation, proposal draft, compare, project save, export, and optional connection conversion. |
| Results | Partially aligned. Existing tabs show overview, issues, recommendations, and preview. | Replace generic action paths with a shared context-aware **What would you like to do next?** action engine. |
| AI correction | Not aligned. The current AI fix is a one-way proposal. | Build a persistent AI Design Copilot with conversation, evidence/context attachments, reference-image upload, before/after proposal, revision, apply, and revert. |
| Manual correction | Partially aligned. Existing editor access is broad. | Route users to specific workspaces—Layout, Visual Style, Responsive, Content, Optimization, or Developer Handoff—rather than one generic editor. |
| Connected stores | Partially aligned. Connection UI shows capabilities and publishing limits. | Use a capability model to govern every result action dynamically. Show draft, validate, and publish only where platform permissions permit them. |
| Version, validation, release | Partially aligned. The current flow includes save, preview, export, and an honest publishing boundary. | Unify all meaningful AI and manual changes into a version chain, then validate and either publish or export based on actual capability. |

## User modes

| Mode | Valid inputs | What the user receives | Not available until connection/permissions |
|---|---|---|---|
| **Explorer** | Public URL, screenshots, reference images | Visible analysis, evidence, AI discussion, proposal drafts, comparison, export | Private product data, theme data, live edits, publishing |
| **Project user** | Explorer inputs plus saved projects/drafts | Persistent AI conversations, saved proposals, versions, comparisons, share/export | Live-store reads, platform-specific draft/publish actions |
| **Connected-store user** | Store, public URL, screenshots, saved draft, permitted theme data | Deeper context, store-specific drafts, supported validation and publishing | Any action not granted by the platform capability model |
| **Developer/agency user** | Theme files, repository, screenshots, drafts, issue context | Technical diagnosis, implementation brief, theme-patch proposal, delivery package | Visual publishing unless a compatible store/repository release capability exists |

## Shared result grammar

> **Input → tool operation → result/evidence → What would you like to do next? → correct workspace → proposed draft → preview/compare → validate → publish or export.**

Every result starts with an honest **analysis scope** statement. For example: “Visible storefront evidence only. No private checkout, product, or theme data was accessed.” The action engine then selects only applicable actions. An unconnected URL user can receive `ask_ai`, `create_proposal`, `save_project`, and `export_report`; a connected Shopify user with the right permissions might additionally receive `create_store_draft`, `validate`, and `publish`.

## Tool matrix

| Tool | Inputs | Primary result | One-off URL/screenshot next actions | Connected-store or developer additions | Correct workspace |
|---|---|---|---|---|---|
| Storefront scan | URL, connected store | Page inventory and evidence captures | Ask AI, save project, export report | Create store-specific issue set | Evidence workspace / AI Design Copilot |
| Screenshot reviewer | Screenshots | Visual evidence board | Ask AI, add reference, create proposal, export | Attach to store draft | AI Design Copilot / Visual Style Studio |
| Mobile journey mapper | URL, screenshots, store | Mobile friction map | Ask AI, open mobile proposal, export | Create mobile store draft | Responsive Studio |
| Page inventory | URL, store | Scoped page map | Start a focused analysis, export | Include store pages and products where permitted | Evidence workspace |
| Search & metadata survey | URL | Search-readiness inventory | Generate SEO plan, edit content proposal, export | Attach approved content to store draft | Content/SEO workspace |
| Accessibility surface check | URL, screenshots | Visible accessibility evidence | Ask AI for plan, open issue, export | Developer handoff or supported element draft | Accessibility plan / Developer Handoff |
| Visual hierarchy audit | URL, screenshots, saved draft | Ranked hierarchy improvements | Ask AI, create redesign, open layout proposal | Store draft and validate | AI Design Copilot / Layout Composer |
| Checkout friction review | URL, store | Purchase-path issue list | Ask AI, proposal, export | Deeper store context only where permitted | Layout Composer / Developer Handoff |
| Performance evidence | URL, theme files | Performance observations | AI optimization plan, export | Developer handoff, theme/repository action | Optimization Workbench |
| Trust & policy audit | URL, screenshots | Trust-placement review | Ask AI, content/layout proposal, export | Store-specific draft | Layout Composer / Content Studio |
| Analytics signal map | Connected store | Measurement plan | Not available without a permitted connection | Create analytics handoff | Measurement / Developer Handoff |
| Responsive redesign | URL, screenshots, saved draft | Comparable redesign alternatives | Ask AI, edit proposal, compare, save/export | Store-specific draft, validate, publish if supported | AI Design Copilot / Responsive Studio |
| Product page composer | URL, screenshots, store | Product-page composition proposal | Ask AI, manual composition, export | Create store draft | Layout Composer |
| Visual editor | Saved draft, screenshots | Local proposal draft | Edit, compare, version, export | Attach draft to a connected store | Visual Style Studio / Layout Composer |
| Copy clarity pass | URL, screenshots | Suggested copy directions | Ask AI, content edit, export | Add approved content to store draft | Content Studio |
| Component spec writer | Saved draft, theme files | Engineering-ready component brief | Export or developer handoff | Link to repository/store issue | Developer Handoff |
| Theme patch proposal | Theme files, saved draft | Targeted theme patch proposal | Not available without permitted code/theme input | Review, validate, release to supported target | Developer Handoff / Code review |
| Compare variants | Saved drafts, screenshots | Decision-ready comparison | Approve, revise with AI, export | Promote a selected store draft | Version and comparison workspace |
| Visual regression check | Screenshots, drafts, store | Visual change report | Ask AI, create issue, export | Validate against store baseline | Validation workspace |
| Publish readiness | Saved draft, store | Release-readiness checklist | Export implementation package | Validate and publish only if capability allows | Release Review |
| Theme sync & release | Theme files, draft, store | Staged release plan | Export release package | Apply/release only to compatible repository or store | Release Review / Developer Handoff |
| Developer handoff | Drafts, theme files, screenshots | Development handoff package | Export, copy issue brief | Send to connected repository/workspace when available | Developer Handoff |
| Store change publisher | Saved draft, connected store | Controlled store update | Not available without a supported connection | Preview, confirm, publish or export fallback | Release Review |

## Required shared workspaces

| Workspace | Used for | Required interaction model |
|---|---|---|
| **AI Design Copilot** | Design, hierarchy, content, responsive, and reference-driven requests | Persistent conversation, current-page and selected-element context, evidence attachments, screenshot/reference upload, AI proposal, revision, apply/revert controls |
| **Layout Composer** | Section order, content hierarchy, CTA placement, grids, spacing | Page outline, selected section, structural controls, responsive preview, draft versioning |
| **Visual Style Studio** | Typography, colour, imagery, cards, borders, visual polish | Element-level style controls, token-aware decisions, reference comparison, draft preview |
| **Responsive Studio** | Breakpoint layout, order, visibility, mobile overflow | Desktop/tablet/mobile controls, issue pins, before/after viewport comparison |
| **Content Studio** | Product copy, navigation, reassurance, SEO content | Content blocks, AI suggestions, character/structure guidance, versioned proposal |
| **Optimization Workbench** | Performance, SEO, and accessible implementation planning | Evidence, causes, recommendations, estimated impact, AI plan, developer handoff—no visual canvas by default |
| **Developer Handoff** | Theme, component, repository, and technical work | Issue context, acceptance criteria, affected pages, technical recommendations, export/send controls |
| **Release Review** | Validation and deployment | Preview, comparison, capability-aware checklist, explicit confirmation, publish or export fallback |

## Visual deck scope

The approval visuals cover the four representative routes needed to validate the complete system: a casual URL analysis, AI-assisted redesign with a reference image, a connected-store draft/validation/publish flow, and a developer handoff. Each is shown in the desktop workspace and deliberately reflowed for mobile, while retaining the same information and capability boundaries.
