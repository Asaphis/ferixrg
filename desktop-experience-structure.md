# FerixRG Desktop Experience Structure

## Design decision

FerixRG will use the **current dark command-center visual language**—the existing grouped sidebar, utility header, charcoal panels, Ferix Blue primary actions, and evidence-led cards. The experience will not copy the uploaded document’s feature list into the screen. The document establishes the product’s capability; this structure decides **where users find each capability** and **when it becomes visible**.

> **The user should feel that FerixRG is guiding them through one simple task, not asking them to operate a design system.**

## What remains visible at each point

| Stage | Main user question | What is visibly presented | What remains behind the interface until needed |
|---|---|---|---|
| Tools Library | “What do you want help with?” | Clear task-led tool cards, search, short categories, and one selected-tool explanation. | Technical tool metadata, capability logic, and every possible tool option. |
| Tool setup | “What should I use for this?” | Only eligible source choices: an existing connected store, connect a store, paste a URL, upload screenshot/reference, or resume saved work. | Permission checking and source-specific technical rules. |
| Results | “What did FerixRG find?” | A plain-language summary, score/impact, evidence preview, issue list with priority, and one **Download report** action. | Raw engine outputs and technical implementation detail. |
| Improvement choice | “What do you want to do now?” | One primary action—**Improve this in the editor**—plus safe secondary actions such as download report, save project, or send to developer when relevant. | Irrelevant tools and paths. |
| Shared editor | “What should change?” | Live page preview, simple manual controls, always-available **Ask AI**, current draft name, device picker, Undo/Redo, and Design Health. | Advanced layout/code controls until the user opens More design controls. |
| Review and finish | “Do you want to keep and release this?” | Side-by-side Current and Proposed preview, version controls, validation warnings, and one finish action: Publish, Create store draft, or Download package. | Unsupported publish controls. |

## Screen 1 — Tools Library: choose a task, not a technical tool

The current Tool Library stays in its familiar desktop location under **Create & ship**. Its headline becomes plain language: **“What would you like to improve?”** The left/middle area remains a searchable, grouped tool list. Cards lead with outcomes that a store owner recognizes:

- **Check my mobile layout**
- **Improve how this page looks**
- **Find what is hurting sales**
- **Check speed, SEO, or accessibility**
- **Ask AI to redesign something**

Selecting a card updates the existing right-side selection panel. That panel explains, in one sentence, what FerixRG will do and asks **“What would you like to use?”** It does not make the user decide between internal systems or editor types.

## Screen 2 — Tool setup: one source chooser that knows the tool

After selecting a tool, the user sees a calm setup panel. The tool determines which choices appear. The simple order is:

1. **Use a connected store**—the user selects an already connected store from a short list.
2. **Connect a store**—only shown if this tool can benefit from private store access.
3. **Paste a store URL**—shown for tools that can inspect public storefronts.
4. **Upload screenshots or reference images**—shown for visual/design tools.
5. **Continue a saved project**—shown when the user has compatible saved work.

Each choice contains an ordinary sentence that explains what it gives the user. For example, the URL choice says: **“I will check the pages visitors can see. You can download the improvements afterwards.”** The connected-store choice says: **“I can use the access you have granted and may be able to prepare a store draft.”**

The user never sees a disconnected fork diagram. They choose one source, press **Check my store** or **Start analysis**, and processing begins.

## Screen 3 — Results: explain the finding, show evidence, provide the report

The result screen is an evidence-led dashboard panel, not a technical report dump. Its header reads:

> **We found 3 things that could make this page easier to use.**

It contains four readable areas:

1. A score/health summary and a one-sentence conclusion.
2. A visual page preview with numbered issue markers that can be selected.
3. A short priority list: **Fix first**, **Improve next**, and **Good already**.
4. A report action—**Download report**—available to every eligible user.

At the bottom, a clearly separated action card asks **“What would you like to do next?”** For a visual/design result, its primary action is **Improve this in the editor**. Secondary actions can be **Ask AI for ideas**, **Save this project**, **Download report**, or **Connect store for publishing**, but only when they make sense for the completed tool run.

## Screen 4 — One shared editor: manual work and AI in the same place

There is **one visual editor destination**. Entering it carries the same page, selected issue, selected element, device, evidence, and draft forward from results.

The desktop editor uses this layout:

| Placement | User-facing purpose | Contents |
|---|---|---|
| Header | Keep orientation and leave safely | Back to results, page name, draft status, Undo, Redo, device picker, Preview, Finish. |
| Left rail | Find what to work on | Pages, Layers, Add section, Assets, History. This rail stays narrow and expands only when selected. |
| Center canvas | See the real storefront while changing it | A live storefront preview; click an element or section to select it. |
| Right workspace panel | Change the selected item or ask for help | Tabs: **Edit**, **Ask AI**, **History**. This is one integrated panel, not separate editor products. |
| Bottom health strip | Understand what still needs attention | Design Health, current warnings, and **Review issues**. |

### Right workspace panel

The **Edit** tab begins with only the friendly, useful controls for the selected target:

- Text, image, link, button
- Colours and fonts
- Spacing and layout
- Desktop / tablet / mobile

An **More design controls** disclosure reveals advanced choices only for users who need them. Code, theme files, and developer-level controls never appear in the first editing view.

The **Ask AI** tab is always part of the same editor. It knows what the user selected and shows a short context line such as: **“Editing: Product page · Buy button · Mobile.”** The user can type a request or attach an image/reference. The AI never silently changes the store or takes the user into another product.

## Screen 5 — AI proposal and manual control in one draft

When the user asks AI to improve something, the editor stays open. The centre canvas changes into a comparison view:

| Left preview | Right preview |
|---|---|
| **Current draft** | **AI suggestion** |

The **Ask AI** panel remains open on the right and explains the proposed changes in simple language. The manual **Edit** tab remains one click away. The user can choose **Apply change**, **Try again**, or **Keep current**. If they apply it, the same draft updates; they can immediately continue changing it manually.

This is the intended loop: **manual edit → ask AI → compare → apply → continue manual edit**. It is not an AI route followed by a separate manual route.

## Screen 6 — Preview, validation, and the right finishing action

The user opens **Finish** from the editor. This is not a complex release workflow. It is a simple review page with:

1. Current versus original side-by-side preview.
2. Saved versions with Restore and Compare.
3. A short validation list: mobile, accessibility, SEO, and design warnings.
4. One action based on actual access:

| User’s situation | Visible primary action | Secondary action |
|---|---|---|
| Connected store with granted publishing permission | **Publish changes** | Create store draft, download package. |
| Connected store without publish permission | **Create store draft** | Download package. |
| URL, screenshot, or project-only user | **Download design package** | Save project, connect a store later. |
| Technical result | **Download developer handoff** | Save report. |

The package tells the unconnected user what it contains and how they can use it in their own store system. The UI never shows a disabled **Publish** button that suggests a feature is available when it is not.

## Features that exist without crowding the UI

The system keeps all required feature capability, but exposes it contextually:

| Capability | Where it belongs |
|---|---|
| Pages, layers, sections, elements, assets, components, theme | Left rail in the shared editor. |
| Text, layout, style, responsive editing | Edit tab for the selected item. |
| Image generation/improvement, content improvements, references | Ask AI tab or a small AI action beside the relevant control. |
| Flex/grid, positioning, component rules, interactions | More design controls, shown only when opened. |
| Custom CSS, theme files, technical implementation detail | Developer workspace/handoff; not the standard visual editor. |
| Version comparison and restore | Header draft menu and Finish review, not a separate intimidating screen. |
| Score, evidence, issues, downloadable report | Result screen and editor Health strip. |
| Publish or export | Finish review, capability-aware. |

## Required proof in the corrected desktop image sequence

The replacement images should prove six simple user-facing moments, in this order:

1. **Choose a task** in the current Tools Library.
2. **Choose what to use** for that selected task.
3. **Understand the result**, issues, evidence, and report action.
4. **Open one shared editor**, with live preview, manual controls, and AI inside it.
5. **Compare current versus AI suggestion** side by side and apply/revise without leaving the editor.
6. **Review and finish** with Publish, Create store draft, or Download package according to the user’s real access.

The screens will use the current FerixRG dark dashboard visual language; they will not become generic dashboards or literal visual copies of the uploaded architecture.
