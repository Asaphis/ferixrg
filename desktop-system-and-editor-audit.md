# FerixRG Complete Desktop System and Manual Editor Audit

## Audit outcome

The current product already has a polished **command-center dashboard**, a navigable desktop sidebar, a Tools Library, connected-store panels, setup and result states, simulated publishing/export safeguards, and an initial visual editor with local draft history. Those foundations are valuable. However, the current system does **not yet behave as a complete storefront editing platform** because the manual editor is still a narrow preview surface rather than the contextual, commerce-aware working environment required by the product.

The redesigned desktop system must therefore distinguish three related but different areas of work:

| Workspace | User goal | What it must show |
|---|---|---|
| **Command Center** | Decide what to work on and resume meaningful work | User mode, active store/project/draft, tool entry, work queue, latest evidence, drafts awaiting review, connection/capability status, and release readiness. |
| **Tool and Result Workspace** | Understand evidence and choose the next correct action | Analysis scope, evidence, ranked findings, capability-aware next actions, and routes into AI, a targeted manual workspace, validation, export, or developer handoff. |
| **Manual Design Editor** | Directly change a draft while seeing the storefront update | Contextual navigation, layers/pages/insert/assets/components, live canvas, selected-element controls, responsive overrides, AI assistance, draft history, validation, preview, and capability-aware release. |

## Current-system audit

| Area | Current implementation | Essential gap to correct |
|---|---|---|
| Dashboard | Strong dark command-center with health, issues, recommendation, stores, analysis, comparison, activity, and release panels. | It needs a clearer work-context rail: whether the user is an Explorer, Project user, connected-store user, or developer; the active **store/project/draft/page**; and explicit resume paths into AI/manual work. |
| Tools Library | Search, category filtering, tool choice, source chips, requirements, and setup route are present. | The library still visually assumes the active demo store. It needs a first-class scope indicator and an outcome/workspace route per tool, not a generic results path. |
| Store workspace | Store health, connection status, tool picker, capability guidance, activity, and current work are present. | It needs direct entry points into the page-aware editor, current draft, connected asset library, and platform-specific release controls. |
| Results and AI fix | Evidence, results tabs, an issue drill-in, a basic AI proposal, preview, version save, and export fallback are present. | The result must expose a capability-aware **What would you like to do next?** panel. AI requires a persistent conversation, selected-context attachment, image/reference upload, proposal comparison, apply/revise/revert actions, and the ability to return to manual work. |
| Visual Editor | It has an element list, canvas image, selected-element outline, desktop/tablet/mobile switcher, basic spacing/type/accent controls, browser draft save, and version comparison. | It is missing the actual editor operating model: page selection, insertion library, assets, components, contextual property categories, direct editing controls, layout system, design tokens, responsive overrides, interactions, AI collaboration, validation drawer, save state, safe release flow, and complexity levels. |
| Validation and release | There are preview, export, and connection-aware publishing concepts. | The editor needs continuous health feedback tied to the selected page/draft, a reviewable issue drawer, a release review, and a clear connected versus proposal-mode boundary. |

## Desktop dashboard corrections

The dashboard should remain a **calm decision board**, not turn into the editor. It should retain the current concise health, issue, store, analysis, transformation, release, and activity modules, while adding a compact top work-context strip:

> **Current context: Explorer / Project / Connected Store / Developer · Active project · Active draft · Active page · capability status.**

The main action area should route directly to the appropriate system: **Analyze URL**, **Open a connected store**, **Continue editing Draft V4**, **Ask AI about an issue**, or **Review release**. A connected store user sees store-aware shortcuts; an unconnected user sees proposal/save/export options, never publishing. The dashboard should also surface the latest editable draft as a first-class work item so manual work can be resumed without reopening a generic tool.

## Required manual-editor architecture

> **Page / Layers / Insert / Assets / Components / Theme → Select element → Content / Layout / Style / Responsive / Advanced → AI proposal or manual change → live preview → save version → validate → publish or export.**

The editor must be a separate full-width desktop workspace, not a dashboard panel. Its header carries the escape route and workflow controls:

| Header control | Purpose |
|---|---|
| **Back to project** | Returns to the relevant result, store, or dashboard without losing the draft context. |
| **Page selector** | Shows only platform-editable pages such as Homepage, Product, Collection, Cart, About, Contact, and custom pages. |
| **Save status** | States whether the user is editing a proposal, a local project draft, or a connected store draft. |
| **Undo / Redo** | Reverses atomic manual or applied-AI changes. |
| **Desktop / Tablet / Mobile, zoom** | Changes the live editable canvas and makes responsive overrides visible. |
| **Preview, Validate, Publish / Export** | Progresses the work safely; publishing appears only when actual platform capability permits it. |
| **AI Copilot** | Opens the contextual conversation without leaving the selected page, section, or element. |

### Left-side contextual workspace rail

The left rail should expose only one working panel at a time. Its primary modes are **Pages**, **Layers**, **Insert**, **Assets**, **Components**, and **Theme**. Selecting Pages shows the editable page list. Layers shows the nested storefront tree. Insert opens grouped sections and elements. Assets gives access to images, videos, icons, logos, and fonts. Components manages reusable storefront pieces. Theme exposes system-wide tokens and settings. This avoids placing every capability on-screen at once.

### Live canvas

The center canvas is a real working storefront preview. The user can select visible elements, drag and reorder sections, resize and align supported elements, duplicate, hide, lock, and copy/paste. Selection bounds, insertion indicators, alignment guides, and mobile/tablet/desktop viewport changes make direct work comprehensible. The canvas remains visible while editing—users never configure abstract numbers without seeing the effect.

### Right contextual inspector

The inspector changes with the selected target. A button exposes text, link, typography, spacing, background, border, effects, responsive, and interaction controls. A product card exposes product image, title, price, compare price, rating, variants, add-to-cart, inventory, badges, and the actual platform fields where supported. A section exposes structure, display, flex/grid, sizing, spacing, background, visibility, and responsive properties.

The inspector uses three deliberate levels:

| Level | Shown by default | Examples |
|---|---|---|
| **Simple** | Yes | Text, image, button, section, colours, fonts, spacing, layout, device visibility. |
| **Advanced** | Collapsed | Flex/grid, positioning, responsive overrides, reusable components, interactions, animation, detailed layers. |
| **Expert** | Explicit opt-in | CSS-like properties, custom attributes, custom CSS, HTML structure, code/embed, theme/repository controls. |

### AI and manual work together

AI is not another disconnected tool. The AI Copilot reads the currently selected page, section, element, analysis evidence, design tokens, device target, and any uploaded reference image. The user can ask, “Move the CTA below the description,” receive a scoped proposal, apply individual changes, revise the proposal, revert it, then continue manual editing in the same draft. The same collaboration path is available from results and from inside the editor.

### Editor health and release

The lower status drawer reports the current draft’s health without forcing a user out of the editor: design score, accessibility warnings, mobile warnings, SEO warnings, and changes awaiting validation. Selecting a warning brings the user to the relevant page/element and control. Preview opens a clean storefront state; Version History compares named drafts; Validate runs the selected checks; and Publish remains capability-aware. Proposal-mode users see **Save project** and **Export implementation package**. Connected-store users may see **Create store draft**, **Validate**, and **Publish** only where supported.

## Visual design required for approval

The regenerated desktop visual design must include these three actual screens, rather than a generic dashboard image:

1. **Complete Command Center** with mode/context, active work, stores, evidence, draft, tool/result action paths, release readiness, and capability status.
2. **Manual Design Editor — Simple/selected section** with page selector, contextual left rail, live central storefront canvas, selected Hero or Product card, right inspector, responsive mode, design health, version/save state, AI entry, and preview/release controls.
3. **Manual Design Editor — AI and Advanced work** showing a selected component, AI Copilot alongside the live canvas, reference-image upload, a proposed change set, responsive overrides, advanced layout controls, version history, validation drawer, and publish/export boundary.

The dashboard image must demonstrate how the user arrives at the editor. The editor images must demonstrate how manual and AI changes are made and how they return to preview, validation, and release. No mobile visual should be produced or presented until these desktop screens are approved.

## Direct visual verification

The regenerated complete Command Center board visibly separates context, active draft work, next decision, tool-result routes, health evidence, and release readiness without turning the dashboard into the editor. The regenerated simple Manual Editor board visibly keeps the storefront live preview in the center while Pages/Layers/Insert/Assets/Components/Theme remain contextual on the left and the selected Hero section’s inspector remains on the right. The board also shows header-level save, undo/redo, viewport, preview, validation, and publish/export controls, plus an inline Design Health surface and draft-version strip.

## Mobile visual verification

The matching mobile Command Center remains a decision board: it shows current store/page/draft context, active work, next decision, health, and safe release routes while retaining the approved four-item Home, Stores, Tools, and More navigation. The matching mobile Manual Editor removes the main navigation in favor of a dedicated contextual editor: device switcher, live phone canvas, selected-section summary, contextual Content/Layout/Style/Responsive controls, AI entry, Design Health, version state, and validation remain available without exposing the whole desktop editor at once.
