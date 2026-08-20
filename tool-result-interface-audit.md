# FerixRG Tool-Result Interface Audit

## Current interface alignment

The current application already establishes several important foundations. The desktop and mobile Tools Library exposes the catalogue, categories, tool selection, input choices, and a setup transition. The Stores flow distinguishes connection from public URL analysis, communicates connection availability, and shows loading/error feedback. The connected-store workspace keeps a store context while users choose an inspection, analysis, editing, validation, or publishing intent. The existing result journey contains evidence, issues, recommendations, a preliminary AI-fix state, preview, version save, and export-safe publishing behavior.

## Gaps against the supplied architecture

The current interface does not yet treat the URL/screenshot user as a first-class mode: most tool surfaces still assume the active connected store, Atelier Forma. Results are not generated from a shared **tool + input + user mode + platform capability** rule, so all tools tend toward the same generic result and AI-fix path. The product needs an explicit **What would you like to do next?** action panel that offers only contextually valid actions.

The present AI fix is a one-way proposal, not the required persistent AI Design Copilot. It has no conversational thread, reference-image upload, selected-element context, attached evidence, revision loop, or user-controlled apply/revert actions. The current manual path points at a broad editor rather than distinct Layout, Visual Style, Responsive, Content, Optimization, and Developer Handoff workspaces. Finally, connection capabilities are displayed in places but do not yet dynamically govern every result action.

## Required behavior direction

The proposed system must route every run through **Input → Tool → Result → What next? → Correct workspace → Draft/compare → Validate → Publish or export**. Casual URL or screenshot users can analyze, ask AI, create proposal drafts, compare, save projects after authentication, and export. They must not be offered live-store edits or publishing. Connected users gain only the specific drafting, validation, and publishing controls permitted by their declared platform capabilities. Developer-oriented work must open an implementation handoff rather than a visual editor.

## Direct visual-board verification

The directly attachable desktop AI Design Copilot board clearly shows the required transition from an evidence-led issue result to a persistent conversation, reference-driven revision, and controlled draft proposal. The directly attachable mobile casual URL board preserves the same four-step information architecture—tool input, evidence, AI discussion, and proposal draft—without offering false connection or publish controls. Both board families use the approved dark FerixRG command-center language, clear directional connectors, and Ferix Blue decision actions.
