# FerixRG Routed Tool Workflow Audit

## Product correction

The current product has many of the right pieces, but they are not yet connected by the required behavioral system. The work to design now is **not the dashboard**. It is the route a user takes from a tool into an input, a truthful scope, a result, the appropriate correction environment, preview, validation, and a capability-aware release or export.

> **Tool selection → input and scope → processing → result and evidence → choose next action → AI/manual/technical workspace → preview/version → validate → publish or export.**

The dashboard is only one possible entrance. It is never the screen that explains the tool behavior.

## Current interface inventory

| Current screen or capability | Present today | Missing behavior that must be designed |
|---|---|---|
| Tools Library | Search, categories, source choices, requirements, setup start. | Tool selection does not first establish user mode, project identity, analysis scope, or the specific next workspace that the tool will open. |
| URL analysis | URL field, validation, loading, public-access explanation, results entry. | Public analysis still lands in a generic result state rather than a scoped evidence result with save, AI proposal, manual proposal draft, export, and optional connection paths. |
| Store connection | Platform selection, simulated connection/loading/error, capability explanation, settings/disconnect. | Connection does not create a durable store context that changes every relevant tool’s setup, results, editor, validation, and release controls. |
| Tool results | Tabs, score, issue detail, recommendation, a basic fix, preview, save/export. | Results are generic. They need different evidence layouts and different next actions for Observe, Diagnose, Create, technical, validation, connected, and unconnected work. |
| AI fix | One proposal screen and an Apply & Edit action. | No AI conversation, selected-context continuity, reference-image upload, proposal alternatives, apply one/all/revert, or path back into manual editing of the same draft. |
| Manual editor | Canvas image, short layer list, device toggle, limited properties, local save/version comparison. | It is not an editing engine yet: no Page/Insert/Assets/Components/Theme rail, no editable element model, no contextual inspector families, no actual edit operations, no responsive overrides, no AI collaboration, no validation drawer, and no capability-aware release. |
| Preview, validation, versions, publish/export | Conceptual routes are present. | They are not attached to a specific result/project/draft and do not distinguish proposal-mode, connected-store release, or developer handoff. |
| Developer path | Tool catalog includes performance, component spec, theme patch, theme sync, and handoff. | No dedicated implementation workspace showing evidence, affected files/components, acceptance criteria, export, repository/store capability, and release steps. |

## User modes are not optional

Every tool run must begin with a clear mode. The same tool can use the same visual shell but must not promise the same outcome.

| Mode | Valid inputs | Result ownership | Permitted next actions | Must not show |
|---|---|---|---|---|
| **Explorer** | Public URL or screenshots | Temporary analysis; may be saved by creating a project | View evidence, ask AI, attach inspiration, generate proposal, export report, create project, connect store | Live-store editing, publishing, private data claims |
| **Project user** | URL, screenshots, saved drafts, reference images | Saved project and proposal drafts | AI conversation, manual proposal editor, versions, preview, validation, export/handoff, connect later | Store-specific publishing or private platform data without a connection |
| **Connected-store user** | Connected store, pages, products, theme resources, drafts | Store-scoped drafts and evidence | All appropriate proposal actions plus store draft, platform validation, capability-aware publish | Unsupported platform actions or claims of direct checkout/theme access |
| **Developer/agency user** | Theme files, repository, selected draft, screenshots | Handoff package or supported code/store change | Technical evidence, component spec, theme patch proposal, repository/store release plan, export | Visual editor controls for technical-only remediation |

## Tool routing families

The catalog has 23 tools, but it should not create 23 unrelated user experiences. The tools route through seven behavior families.

| Family | Tools | Setup and scope | Result and required next actions |
|---|---|---|---|
| **Visible evidence scan** | Storefront scan, Screenshot reviewer, Mobile journey mapper, Page inventory, Search & metadata survey, Accessibility surface check | Public URL or screenshots; connected store adds private page context where allowed. | Evidence board, scope statement, issues by page/device, Save project, Ask AI, create proposal, export, connect for deeper context. |
| **Issue diagnosis** | Visual hierarchy audit, Checkout friction review, Trust & policy audit | URL, screenshots, saved draft, or connected store according to the tool. | Ranked issue list with confidence/impact and **Fix with AI**, **Edit manually**, **Create developer brief**, or **Export evidence** based on the issue type. |
| **Technical diagnosis** | Performance evidence, Analytics signal map | URL/theme files for performance; analytics connection for private signals. | Optimization workbench or measurement plan, performance findings, implementation steps, developer handoff, export; no visual editor unless a visual issue is explicitly selected. |
| **Design creation** | Responsive redesign, Product page composer, Copy clarity pass | URL/screenshots/saved draft/connected store according to tool. | Alternatives, proposed design/copy changes, AI Design Copilot, manual proposal editor, save version, compare, validate, export or create store draft. |
| **Manual editing** | Visual editor | Saved proposal draft, screenshots, or connected editable context. | Dedicated editor with page/layer/insert/assets/components/theme controls, live canvas, contextual inspector, AI collaboration, versioning, validation, and release. |
| **Technical creation** | Component spec writer, Theme patch proposal | Saved draft/theme files; a supported connection is required for actual patch/release. | Developer Handoff with component specification, implementation impact, acceptance criteria, patch proposal, export or repository/store release route. |
| **Validate and ship** | Compare variants, Visual regression check, Publish readiness, Theme sync & release, Developer handoff, Store change publisher | Saved draft/screenshots/store/theme files according to tool. | Comparison, regression evidence, validation checklist, publish gate, export package, developer handoff, or supported release confirmation. |

## Screen-by-screen workflow to design

The design boards must show the following screens in order. They are the core product behavior, not dashboard variations.

| Board | Screen sequence | What it proves |
|---|---|---|
| **1. Tool selection and scope** | Tools Library → tool detail → input selector → mode/capability statement | The user understands what the tool needs, what can be analyzed, and whether they are working with URL, screenshot, saved project, files, or a connected store. |
| **2. Connection and public-analysis fork** | Add Store → platform choice → connection capability screen **or** Analyze Public URL → scope disclosure → optional save/connect route | Unconnected users are first-class. Connection has a purpose and is never forced for a casual analysis. |
| **3. Processing and evidence result** | Processing stages → result header → evidence grid/list → issues and confidence → analysis scope | The result belongs to a specific tool/input/project and makes the limitations explicit. |
| **4. Next action routing** | Result → What would you like to do next? → AI Design Copilot / Manual editor / Optimization workbench / Developer handoff / Save or Export | No generic ‘fix’ button. The visible choices depend on tool family, issue type, user mode, and capability. |
| **5. AI correction workflow** | Contextual chat → reference-image upload → proposed changes → compare → apply selected/all → open same draft manually | AI is interactive and contextual. It works on a draft, not as a one-shot fix screen. |
| **6. Manual correction workflow** | Open proposal/editor → page/layer/insert/assets/components/theme → select element → live preview alongside contextual controls → manual changes → AI assist → save version | The manual editor is a serious storefront design workspace with live visual feedback. |
| **7. Validation and release workflow** | Preview → validation drawer → version comparison → connected draft/publish or export/developer handoff | Every user can finish with an honest next step; only supported connected users can publish. |

## Manual editor requirements within the workflow

The manual editor is entered only from a selected issue, proposal, draft, or appropriate Create tool. It must preserve that context. The initial desktop editor screen needs a left contextual rail for **Pages, Layers, Insert, Assets, Components, and Theme**; a live storefront canvas that supports selection, visible insertion/reorder states, and device view; and a right contextual inspector that changes according to the selected section, element, product component, or page.

The simple editor controls are Content, layout, typography, colours, background, spacing, visibility, and responsive values. Advanced controls are flex/grid, position, component rules, interactions, animation, responsive overrides, and layers. Expert controls are limited to explicit developer mode. AI must be attached to the selected element and current draft, with reference image upload and apply/revise/revert rather than a disconnected chat page.

## Immediate design correction

The next images must therefore be **desktop-only workflow boards**, in the precise order above. They must start with the Tools Library and end with release, and show where the manual editor fits in the route. A command-center image is not a substitute for these boards. Mobile is postponed until this desktop workflow is approved.

## Direct visual verification

The first rendered desktop workflow board begins with the Tools Library and shows the selected tool, its allowed inputs, and the outcome-aware distinction between Observe, Diagnose, Create, Technical, and Validate routes. It does not use the dashboard as the workflow starting point.

The manual-editor workflow board appears only after result routing and AI/manual choice. It visibly carries the selected product-page context and draft into a dedicated workspace with Pages/Layers/Insert/Assets/Components/Theme, a live storefront canvas, selected CTA and quantity controls, contextual layout/responsive controls, AI entry, design health, version state, validation, and publish/export boundary.

## Corrected beginner-friendly desktop flow verification

The corrected replacement flow starts with the question **“What would you like to improve?”** and describes tools through familiar store-owner tasks. The selected-task panel explains what the tool will do and defers technical details. The next screen asks only **“What would you like us to use?”**, with context-appropriate source choices.

The shared-editor comparison screen keeps the live draft context, page/layer navigation, device controls, and the right-side **Edit / Ask AI / History** workspace in one interface. AI shows **Current Draft** and **AI Suggestion** side by side, with Apply Change, Try Again, and Keep Current actions. Manual editing remains available inside the same editor and same draft rather than appearing as a separate product route.

## Actual-tools entry correction verification

The corrected desktop Tools Library keeps the complete **23 FerixRG tools** visible in four groups: Discover & Inspect, Diagnose & Improve, Create & Redesign, and Validate & Publish. The expanded **Tools** area in the existing sidebar exposes the selected group and its individual sub-tools, while the full library exposes every product tool through search, group filters, and an actual named-tool list.

The selected Responsive redesign detail keeps the product name prominent, explains what that particular tool can do, shows its supported source options, and makes the next step specific to the tool. Its setup screen preserves the same named tool and offers connected store, another existing connection, public URL, screenshots, and saved draft routes with clear outcome language. It does not replace the tool catalogue with generic task labels.

## Complete selected-tool flow verification

The completed replacement flow retains **Responsive redesign** as the active named tool after selection and setup. Its evidence result presents score, priority issue count, evidence confidence, redesign alternatives, a page-level evidence preview, a download-report action, and a selected-tool-specific next-action panel.

The completion screen carries the same Responsive redesign draft into a validation-aware finishing state. A connected store with publish permission can publish or create a store draft. An unconnected URL or screenshot user instead receives a design package and developer handoff, with a clear option to connect later. The interface never represents publishing as available unless the required access exists.

## Mobile flow verification

The mobile Tools screen exposes the same real catalogue through expandable groups with counts: Discover & Inspect, Diagnose & Improve, Create & Redesign, and Validate & Publish. The active Create & Redesign group visibly exposes its actual six sub-tools, while the selected Responsive redesign card preserves source information and a direct start action.

The mobile editor uses its own contextual interface rather than trying to place editor controls in the bottom navigation. It preserves the Product page and Draft 4 context, device picker, Edit / Ask AI / History tabs, side-by-side current/suggestion previews, applied-suggestion controls, and continued access to manual editing in the same draft.

## Implemented entry verification

The implemented desktop Tools Library retains the current FerixRG workspace shell while adding an expandable sidebar catalogue of actual grouped tools. The selected Responsive redesign tool is shown both in the expanded Create & redesign group and in the selected-tool detail panel, maintaining a clear relationship between discovery and action.

The implemented mobile Tools Library retains the focused existing mobile entry screen: filters and the searchable catalogue stay readable, while the selected Responsive redesign tool remains visible directly beneath the starter collection with its supported input chips and start action. The fixed bottom navigation is intentionally absent from full-page visual captures and remains part of the live mobile shell.

## Implemented shared-editor verification

The implemented desktop editor keeps the selected Responsive redesign context visible through the progress path and draft header. It shows the live storefront canvas, selected Buy button, page/layer rail, Edit / Ask AI / History inspector tabs, Design Health, explicit version saving, validation, and finish actions in one workspace.

The mobile editor converts that structure into a focused vertical sequence rather than removing its capabilities. The live Mobile preview appears first, followed by page tools and inspector tabs, manual properties, **Ask AI to improve this**, version saving, and more design controls. This maintains the shared-draft relationship between manual and AI work at phone width.

## Context-aware workspace routing verification

Performance evidence now opens the **Optimization Workbench** rather than the visual editor. Its desktop and mobile layouts keep the selected tool, source, outcome, and analysis scope visible alongside a prioritized cause, expected impact, delivery path, AI plan action, handoff review, and export action. This implements the intended boundary: technical performance work remains delivery-oriented and does not suggest that a visual canvas can safely change it.

Responsive redesign now opens **Responsive Studio** in the shared draft workspace. Desktop and mobile both expose responsive-specific controls—breakpoint, element order, visibility, and spacing—beside the same live Mobile preview, selected element, AI entry, history, Design Health, validation, and finish actions. The prior generic editor-control treatment is no longer used for this responsive tool.

## Capability-aware Explorer verification

The Responsive redesign result now identifies a public-URL run as **Explorer · Public analysis**. On desktop and mobile, the visible actions are limited to the correct boundary: enter Responsive Studio, ask AI, download the report, save the project, or connect a store later. The result does not offer live publishing; the connection option explains why private context, store drafts, validation, and publishing remain unavailable until a supported connection exists.

Store change publisher now identifies a permitted input as **Connected-store user · Connected store context**. Desktop and mobile both route its result into **Release Review** and limit the visible actions to the supported release review, report download, and project saving path. This preserves the explicit review boundary before any simulated draft or publish completion action.

Theme patch proposal now identifies its source as **Developer / agency · Technical input attached**. Desktop and mobile expose the appropriate technical path: review the theme patch, download the evidence report, or download the developer handoff. No visual canvas or live publishing action is presented for this technical result.
