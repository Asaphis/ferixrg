export type ToolWorkspace =
  | "Evidence Workspace"
  | "AI Design Copilot"
  | "Responsive Studio"
  | "Layout Composer"
  | "Visual Style Studio"
  | "Content Studio"
  | "Optimization Workbench"
  | "Developer Handoff"
  | "Version & Comparison"
  | "Validation Workspace"
  | "Release Review"
  | "Measurement Workspace";

export type ToolRoute = {
  workspace: ToolWorkspace;
  primaryAction: string;
  primaryDescription: string;
  hasVisualEditor: boolean;
  allowsAi: boolean;
  supportsStoreRelease: boolean;
};

const visualRoute = (workspace: ToolWorkspace, primaryAction: string, primaryDescription: string): ToolRoute => ({
  workspace,
  primaryAction,
  primaryDescription,
  hasVisualEditor: true,
  allowsAi: true,
  supportsStoreRelease: true,
});

const specialistRoute = (workspace: ToolWorkspace, primaryAction: string, primaryDescription: string, allowsAi = true): ToolRoute => ({
  workspace,
  primaryAction,
  primaryDescription,
  hasVisualEditor: false,
  allowsAi,
  supportsStoreRelease: workspace === "Release Review" || workspace === "Validation Workspace",
});

const routes: Record<string, ToolRoute> = {
  "storefront-scan": specialistRoute("Evidence Workspace", "Explore evidence", "Review the page inventory and evidence before choosing a focused follow-up."),
  "screenshot-reviewer": visualRoute("AI Design Copilot", "Create a visual proposal", "Use AI and reference images to turn the evidence board into a proposal."),
  "mobile-journey": visualRoute("Responsive Studio", "Open Responsive Studio", "Improve the mobile journey with responsive controls and AI guidance."),
  "page-inventory": specialistRoute("Evidence Workspace", "Explore page map", "Review the scoped page map and start a focused analysis where needed."),
  "search-metadata": visualRoute("Content Studio", "Open Content Studio", "Edit the resulting content and search proposal with AI guidance."),
  "accessibility-surface": specialistRoute("Developer Handoff", "Prepare accessibility plan", "Turn visible accessibility evidence into a prioritized remediation handoff."),
  "hierarchy-audit": visualRoute("Layout Composer", "Open Layout Composer", "Reorder hierarchy and CTA placement in the shared draft."),
  "checkout-friction": specialistRoute("Developer Handoff", "Prepare purchase-path plan", "Create an implementation plan for purchase-path issues that cannot be safely edited here."),
  "performance-evidence": specialistRoute("Optimization Workbench", "Open Optimization Workbench", "Review causes, estimated impact, and a developer-ready performance plan."),
  "trust-policy": visualRoute("Content Studio", "Open Content Studio", "Improve reassurance content and trust placement in the shared draft."),
  "analytics-map": specialistRoute("Measurement Workspace", "Open measurement plan", "Prepare the events, metrics, and handoff needed to verify the improvement."),
  "responsive-redesign": visualRoute("Responsive Studio", "Improve in Responsive Studio", "Use live responsive controls and AI in the same draft."),
  "product-composer": visualRoute("Layout Composer", "Open Layout Composer", "Compose product story, CTA, and trust context in the same draft."),
  "visual-editor": visualRoute("Visual Style Studio", "Open Visual Style Studio", "Adjust style and compare versions in the same draft."),
  "copy-clarity": visualRoute("Content Studio", "Open Content Studio", "Edit copy directions with contextual AI assistance."),
  "component-spec": specialistRoute("Developer Handoff", "Prepare component handoff", "Turn the selected design decision into an engineering-ready brief.", false),
  "theme-patch": specialistRoute("Developer Handoff", "Review theme patch", "Review technical patch guidance before a supported release.", false),
  "variant-compare": specialistRoute("Version & Comparison", "Open comparison", "Compare the two variants, review evidence movement, and select a direction."),
  "visual-regression": specialistRoute("Validation Workspace", "Open validation workspace", "Review the change report and turn meaningful differences into tracked issues."),
  "publish-readiness": specialistRoute("Release Review", "Open release review", "Review the publish-readiness checklist and capability boundary."),
  "theme-sync": specialistRoute("Release Review", "Open release review", "Review the staged theme release plan before any supported deployment.", false),
  "developer-handoff": specialistRoute("Developer Handoff", "Open developer handoff", "Package issue context, acceptance criteria, and selected recommendations.", false),
  "store-publisher": specialistRoute("Release Review", "Open release review", "Review the controlled store update and confirm a supported release.", false),
};

export function getToolRoute(toolId: string): ToolRoute {
  return routes[toolId] ?? specialistRoute("Evidence Workspace", "Explore evidence", "Review the result and choose an appropriate follow-up.");
}
