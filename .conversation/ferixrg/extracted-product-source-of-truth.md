# FerixRG Product Source of Truth

This document is an extraction of the supplied product requirements. It is the reference for all future FerixRG tool, result, correction-workspace, editor, validation, and release design work. It does **not** prescribe a new dashboard visual direction. It defines the behavior the product must support.

## 1. The fundamental product rule

> **A tool is not an editor. A tool is an intelligent operation that produces a result. The result determines what the user can do next.**

The product must follow one common lifecycle:

> **Tools Library → Select a Tool → Tool Setup / Input → Run Analysis or Create → Result Engine → Insights / Issues / Preview → “What would you like to do next?” → AI or a specific manual workspace → Proposed Change → Preview / Compare → Save Version → Validate → Publish or Export.**

The four concepts must remain distinct.

| Product concept | The question it answers | Examples |
|---|---|---|
| **Tool** | What should FerixRG investigate or accomplish? | Responsive Analyzer, Design Analyzer, SEO Analyzer, Structure Analyzer, AI Redesign, Accessibility Analyzer. |
| **Result** | What did FerixRG discover or create? | Seven mobile issues, a weak Hero hierarchy, CTA below the primary conversion area, an alternate homepage proposal. |
| **Workspace** | How should the user work with the result? | AI Design Copilot, Layout Composer, Visual Style Studio, Responsive Studio, Content Editor, Optimization Workbench, Developer Handoff. |
| **Action** | What should happen to the result? | Apply, save, compare, export, send to developer, publish, revert. |

## 2. Core product engines

The product has an **Input Engine**, **Tool Engine**, **Project Engine**, **Result Engine**, **Action Engine**, **Draft/Version Engine**, **Validation Engine**, and **Publish/Export Engine**.

| Engine | Responsibility |
|---|---|
| Input Engine | Accepts URL, connected store, screenshot, image/reference, theme files, and saved work. |
| Tool Engine | Runs analysis, design, AI, testing, or developer tools. |
| Project Engine | Stores saved analysis, drafts, references, selected page/element, and return-later work. |
| Result Engine | Produces findings, evidence, scores, issues, recommendations, proposed alternatives, and a tool-specific next-action list. |
| Action Engine | Determines the appropriate next routes: ask AI, design proposal, manual workspace, technical workspace, save, export, validate, or release. |
| Draft/Version Engine | Saves original, AI, manual, and current states for comparison, restore, duplication, rename, deletion, and release. |
| Validation Engine | Checks design, mobile, accessibility, SEO, visual regression, and release readiness. |
| Publish/Export Engine | Publishes only where actual platform capability permits it; otherwise creates an export or developer handoff. |

## 3. User modes and capability boundaries

Different users are valid users of the platform. A public URL user is not a failed connected-store user.

| Mode | Typical inputs | They can do | They cannot do without a supported connection |
|---|---|---|---|
| **URL / casual user** | Public URL, screenshot, reference image | Analyze visible pages, inspect responsive/design evidence, ask AI, upload screenshots/references, generate design proposals, create drafts, compare, export, save a project after authentication. | Change a real store, publish, access private products, theme files, private checkout logic, or claim deeper private context. |
| **Project user** | URL, screenshots, saved draft, images/references | Save work, return later, AI conversation, proposal drafts, manual proposal workspace, compare, validate, export/handoff, connect later. | Store-specific publication or private-store operations. |
| **Connected-store user** | Store/pages/products/theme resources/draft according to granted permissions | Deeper analysis, store-aware drafts, supported manual editing, validate, create store draft, and publish when capability permits. | Unsupported platform actions or ungranted/private operations. |
| **Developer / agency user** | Theme files, repository, selected draft, screenshots | Technical diagnosis, component spec, patch proposal, developer handoff, repository/store release where supported. | Visual editing where the result is purely technical and no visual work is needed. |

Every connected platform must be represented by capabilities, not hard-coded platform buttons. Illustrative capability flags are: `inspect`, `analyze`, `read_products`, `read_pages`, `read_theme`, `modify_theme`, `create_draft`, and `publish`.

The interface must always state: **what was analyzed, what FerixRG knows and does not know, and which next actions are available in the user’s current mode.**

## 4. Tool-result and next-action system

Every result must include a structured next-action list:

```text
RESULT {
  findings,
  severity,
  evidence,
  recommendations,
  supported_actions
}
```

The result screen’s primary question is always:

> **What would you like to do next?**

Only relevant actions appear. Examples include **Ask AI**, **Create redesign**, **Open Responsive Studio**, **Open Layout Composer**, **Edit manually**, **Create developer handoff**, **Create version**, **Validate**, **Publish**, and **Export report**.

| Result type | Correct next actions | Workspace that should open |
|---|---|---|
| Performance evidence | Why it matters, possible causes, recommended fixes, AI Optimization Plan, Developer Handoff. | Optimization Workbench or Developer Handoff; not necessarily visual editing. |
| SEO issue | Generate SEO fix, Ask AI, possibly edit content. | SEO/content workspace; no generic editor. |
| Accessibility issue | AI Fix Plan, Open Element, Developer Handoff. | Accessibility plan, relevant element, or technical handoff. |
| Responsive issue | Fix with AI, Open Responsive Studio, View Mobile. | Responsive Studio. |
| Design / hierarchy issue | Ask AI, AI Redesign, Open Layout Composer. | AI Design Copilot or Layout Composer. |
| Create/design result | Compare alternatives, use AI, open manual workspace, save draft, validate. | AI Design Copilot, Layout Composer, Visual Style Studio, Content Editor, or Manual Editor. |
| Technical creation | Review implementation impact, export, create handoff, release where supported. | Developer Handoff. |
| Validation/release result | Compare, review warnings, create version, publish when supported, export otherwise. | Version, Validation, Release Review. |

The user can also start **AI Design Assistant** directly from the Tools Library. It asks what the user wants to improve and accepts a connected store, URL, screenshot, design reference, and description. AI can propose analyzing first before designing.

## 5. AI Design Copilot

The AI Design Copilot is a persistent, conversational storefront design assistant, not a one-shot “Fix with AI” button.

It understands the current **store, page, selected element, device viewport, current tool, detected issue, current draft, existing design system, previous changes, attached analysis, and uploaded references**. For example, when the user is on Homepage → Hero Section → Mobile → Responsive Analyzer → Draft V3, the user can say “Fix this” without repeating the context.

The AI interface must support:

| AI interaction | Required behavior |
|---|---|
| Natural design conversation | The user can ask to make a page premium, move testimonials, adjust CTA placement, fix crowded cards, or improve spacing. |
| Context attachment | The user can attach an image, screenshot, reference, selected element, analysis, or another page. |
| Reference image | A user can say “use this as inspiration, but do not copy it exactly.” |
| Scoped proposal | AI creates a proposed change against the current draft and selected context. |
| Before/after review | User sees current and proposed states before a change is applied. |
| Control | User can apply selected changes, apply all, revise, try again, keep original, revert, and then continue manual editing. |
| Safety | AI must not silently modify the real store. It proposes first; only user approval enters the change into the draft. |

The intended collaboration loop is:

> **Manual edit → AI request → AI proposal → apply → manual edit → AI revision → apply.**

AI and manual editing work on the **same draft**. They are not separate products.

## 6. Draft and version system

Every meaningful modification must create or update a draft/version state. A representative page history is:

```text
Homepage
├── Original
├── AI Redesign V1
├── Manual Changes V2
├── AI Revision V3
└── Current Draft
```

Users must be able to **compare, restore, duplicate, rename, delete, and publish** versioned work when release is supported. This removes fear from experimentation.

## 7. Manual storefront editor

The manual editor is a substantial contextual storefront design workspace. It is not a basic text editor and not one giant panel showing every control at once.

### 7.1 Major systems

```text
Manual Design Editor
├── Canvas
├── Layers
├── Pages
├── Sections
├── Elements
├── Assets
├── Components
├── Layout
├── Typography
├── Colors
├── Background
├── Spacing
├── Borders
├── Effects
├── Responsive
├── Position
├── Interactions
├── Content
├── Visibility
├── Advanced
├── Theme / Design System
├── History
├── Preview
└── Publish
```

The system is contextual. Selecting a page, section, element, or component exposes only the controls relevant to that target.

### 7.2 Editor header

The editor header includes **Back**, current **Page**, **Save**, **Preview**, **Publish**, **Undo**, **Redo**, **Desktop**, **Tablet**, **Mobile**, **Zoom**, **Share**, and **More**. Availability and wording respect the current platform and capability mode.

### 7.3 Page selector

The user selects only pages editable for the destination platform. Candidate page types include Homepage, Product Page, Collection Page, Cart, About, Contact, FAQ, Blog, Search, Login, Register, and Custom Pages. The platform may offer **Add Page** where supported.

### 7.4 Live canvas

The canvas is the actual storefront preview. Users can select, drag, resize, move/reorder sections, duplicate, delete, copy/paste, align, group/ungroup, lock, hide, and reposition sections where the platform supports it. It supports desktop, tablet, mobile, and custom viewport sizes where appropriate. The user sees changes beside or within the editing controls as changes are made.

### 7.5 Section and element library

Users should begin with storefront-aware sections rather than build everything from zero.

| Section family | Examples |
|---|---|
| Header | Logo, navigation, search, account, cart, announcement bar. |
| Hero | Heading, description, CTA, image/video, background. |
| Products | Product grid, carousel, featured products, categories, best sellers, new arrivals. |
| Marketing | Promotional/sale banner, countdown, newsletter, reviews, testimonials, trust badges. |
| Content | Rich text, image + text, video, gallery, FAQ, blog posts. |
| Footer | Navigation, social links, newsletter, payment methods, legal links. |

Within sections, the element library includes basic text/heading/paragraph/button/link/image/video/icon/divider/spacer, commerce product/product image/title/price/compare price/variant/quantity/add-to-cart/buy-now/rating/badges/collection/product grid, and advanced tabs/accordion/carousel/modal/form/search/navigation/breadcrumb/countdown/social feed elements.

The **Insert** panel groups additions into Sections, Elements, Commerce, Media, Forms, Navigation, Marketing, and Components.

### 7.6 Layers and drag-and-drop

The Layers tree reflects the actual page hierarchy, for example Announcement Bar, Header with Logo/Navigation/Search/Cart, Hero with Container/Heading/Description/Button/Hero Image, Featured Products, and Footer. Users can select anything from the tree. Drag-and-drop must support section-to-section, element-to-element, column-to-column, and component-to-component movement with clear insertion indicators such as “Drop here.”

### 7.7 Contextual inspector

The right-side inspector changes based on the selected target. For a button it exposes content, link, style, typography, spacing, border, background, effects, and responsive settings. For commerce-aware product components it exposes product image, title, price, compare price, rating, variant, quantity, add-to-cart, buy now, badge, inventory, and product link fields where the platform supports connected values.

### 7.8 Layout, position, and spacing

The Layout controls support width (auto/full/fixed/max), height (auto/fixed/min/max), display (block/flex/grid/inline), flex direction/justify/align/gap/wrap, and grid columns/rows/gap/alignment. Advanced Position supports static/relative/absolute/sticky, top/right/bottom/left, and z-index. Advanced controls remain collapsed for ordinary users.

Spacing supports margin, padding, and row/column gaps with linked/unlinked values. Users can set all sides together or independent sides.

### 7.9 Typography, visual style, and media

Typography includes family, size, weight, style, line height, letter spacing, transform, decoration, alignment, and responsive device values. Visual style includes text/background/border color, gradients, opacity, global color tokens, solid/gradient/image/video background, image position/size/repeat/overlay/opacity, border widths/styles/colors/radius including independent corners, shadows, and advanced effects such as blur, backdrop blur, rotate, scale, translate, filters, and opacity.

Selecting an image exposes replace/upload/media library/crop/resize/position/fit/object position/border radius/overlay/opacity/alt text/link, plus AI actions such as remove background, generate variation, improve image, replace with AI, and generate alt text.

Content is directly editable for headings, paragraphs, button text, product title/description, labels, navigation, FAQ, and testimonial content. AI can appear beside an editable content field with **Improve with AI**, Apply, Try Again, and Keep Original.

### 7.10 Responsive editing and overrides

Desktop, tablet, and mobile can be modified independently. The system clearly shows when a property overrides the desktop value and displays device values side by side. Elements and sections can be shown/hidden per device, enabling intentional mobile arrangements.

### 7.11 Components, design system, theme, and assets

Reusable components such as a Primary Button can be created once and reused across pages; a global update can update instances when chosen. The Design System manages colors (primary/secondary/accent/background/surface/text/muted), typography roles, button variants, and card styles. Theme settings cover logo, favicon, colors, typography, buttons, forms, cards, navigation, header, footer, product pages, and checkout appearance where supported. Assets include images, videos, icons, logos, and fonts with upload, search, filter, replace, delete, and rename.

### 7.12 Editing safety and advanced behavior

The editor has a history stack with undo/redo. It supports copy, paste, duplicate, delete, duplicate section/page, lock, hide, and responsive hiding. Platform-supported interactions may include open URL/modal/menu, add to cart, scroll to section, hover changes, and scroll animations. Animations can offer fade, slide, scale, zoom, bounce, duration, delay, direction, and trigger where appropriate.

### 7.13 SEO, accessibility, and continuous validation

Page settings include title, meta description, URL, canonical URL, social image, robots, and AI metadata generation. The editor warns about missing image alt text, incorrect heading hierarchy, insufficient contrast, and inaccessible button labels. It presents continuous Design Health with accessibility, mobile, and SEO warnings and a **Review Issues** route that opens the exact relevant page/element.

### 7.14 Complexity levels

| Level | Intended user | Controls |
|---|---|---|
| **Simple** | Ordinary users | Text, images, buttons, sections, colors, fonts, spacing, layout, desktop/mobile. |
| **Advanced** | Experienced designers | Flex, grid, position, responsive overrides, components, interactions, animations, layers. |
| **Expert** | Developers | CSS-like properties, custom attributes, custom CSS, HTML structure, code/embed, theme files, advanced responsive rules. |

The editor is storefront-aware. A product card is understood as a product component rather than a generic rectangle, and connected values remain attached to actual store data where platform support allows.

## 8. Validation and release

Preview, comparison, save/versioning, validation, publishing, and export all operate on the same current result/project/draft context.

| User mode | Finishing actions |
|---|---|
| URL/casual | Save project, compare proposals, export report/design/implementation package, optionally connect later. |
| Project user | Save draft, return later, compare, validate, export, create handoff, optionally connect later. |
| Connected-store user | Create store draft, validate platform-supported changes, publish only after explicit confirmation and capability checks. |
| Developer/agency | Export developer handoff, component spec, patch proposal, repository/store release plan where supported. |

The manual editor and release flow must never assume that every user can publish. A publish button appears only for a supported, connected, approved change. All other paths use save/export/handoff honestly.

## 9. Mobile rule

The bottom navigation gets users to Tools. It does not contain the full editor. Once a user enters a manual, AI, technical, validation, or release workspace, that workspace uses its own contextual navigation and controls.

## 10. Required design sequence before implementation

Future workflow visual boards must be desktop-first and must show, in order:

1. Tools Library and tool selection.
2. Input setup and mode/scope disclosure.
3. Connected-store versus URL/screenshot route.
4. Processing and a tool-specific evidence result.
5. The capability-aware **What would you like to do next?** action system.
6. AI Design Copilot, including context and reference upload.
7. The manual editor as part of the same draft workflow with live preview and contextual controls.
8. Preview, compare, version, validation, and capability-aware publish/export/developer handoff.

No dashboard screen is a substitute for this workflow sequence.
