# FerixRG Beginner-Friendly Workflow Brief

## Purpose

The uploaded architecture defines **what FerixRG must be able to do**. It is not a wireframe and must not be copied into the interface as a long list of technical features. The interface should help a non-designer complete a storefront task without understanding tools, design systems, responsive overrides, drafts, or permissions in advance.

## The design rule

> **Show the user one understandable decision at a time. Keep advanced capabilities available, but out of the way until they are useful.**

The product should use plain language such as **Check my store**, **See what needs fixing**, **Let AI improve it**, **Change it myself**, **Preview the change**, and **Publish or download**. It should not lead with internal terms such as Input Engine, Result Engine, Layout Composer, capability flags, Flex, Grid, or responsive overrides.

## The simple user journey

| User step | What the user sees | The decision they make | Capabilities working in the background |
|---|---|---|---|
| 1. Find help | A searchable Tools Library with clear task cards such as “Check mobile layout,” “Improve page design,” and “Speed up my store.” | “What do I want help with?” | Tool category, accepted inputs, required access. |
| 2. Choose what to inspect | The selected tool asks in plain language: “What would you like to use?” with only valid options: connected store, existing connected store, URL, screenshot, reference image, or saved work. | “How should FerixRG look at my store?” | Source validation, connection permissions, scope. |
| 3. Let FerixRG check it | A calm loading screen with clear steps and a cancel option. | No technical decision required. | Analysis, evidence collection, draft/project creation. |
| 4. Understand the result | A readable summary: what FerixRG found, where it found it, why it matters, visible issue markers, a score, and a downloadable report. | “What do I want to do with these findings?” | Finding severity, evidence, score, report/export. |
| 5. Improve it | One prominent choice: **Open editor to improve this**. The editor contains the live preview, a manual controls panel, and an AI panel together. | “Do I type a request, change it myself, or combine both?” | Shared draft, selection context, AI proposal, manual controls. |
| 6. Review safely | The user sees the current version and proposed/previous version side by side, with simple Apply, Keep, Undo, and Restore controls. | “Do I keep this change?” | Version history, before/after comparison, revert. |
| 7. Finish | A clear final step. Connected users with granted publish access see Publish; everyone else sees Download / Export with an explanation of how to apply the package elsewhere. | “Do I publish or take this work away?” | Validation, platform capabilities, publish/export/handoff. |

## The shared editor, not two products

There is **one editing destination** for a visual result. The live storefront preview is always visible. The editor has:

1. A simple left rail for **Pages**, **Sections**, **Add**, and **History**.
2. A central live preview where the user can select the part they want to change.
3. A right panel that begins with simple controls such as text, image, button, colour, spacing, layout, and desktop/mobile.
4. A persistent **Ask AI** panel or drawer inside the same editor. AI knows the selected page, selected element, viewport, analysis finding, and current draft.
5. A preview comparison that appears when AI suggests a change. The user compares **Current** and **AI suggestion** side by side, then chooses Apply, Try again, or Keep current.

Manual changes and AI changes always update the **same draft**. AI is a helpful assistant inside the editor, not a separate route that takes the user away from their work.

## Progressive disclosure

| Level | Who it serves | Visible at first | Revealed only when needed |
|---|---|---|---|
| Simple | First-time store owner | Text, image, button, section, colours, spacing, layout, desktop/mobile, Ask AI. | Nothing technical by default. |
| Advanced | Designer | Alignment, grid, responsive controls, reusable components, interactions. | Shown after opening **More design controls**. |
| Expert | Developer | Theme files, custom CSS, code/embed, deeper technical rules. | Shown in a technical workspace or developer handoff, never in the first editing view. |

## Release language and safety

The final screen must never promise a live change without access. It should say exactly one of the following:

| Situation | Primary action | Plain explanation |
|---|---|---|
| Store connected and relevant permission granted | **Publish changes** | “Your approved changes will be sent to this store.” |
| Store connected but publishing is not granted or supported | **Create store draft** or **Download package** | “You can review this in your store or apply the download manually.” |
| URL, screenshot, or project-only user | **Download report and design package** | “Use this package to apply the changes in your own store system, or connect your store later.” |
| Technical finding | **Download developer handoff** | “Share the explanation, affected area, and recommended fix with your developer.” |

## Implication for the replacement desktop workflow images

The next visual sequence must show the **simple user journey**, not all architecture terminology or editor capability lists. The key visual proof is that the user can understand: choose a task → choose what to inspect → understand findings → open one shared editor with AI inside it → compare → publish or download.
