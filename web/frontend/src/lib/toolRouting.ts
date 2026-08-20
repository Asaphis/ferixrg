export type ToolWorkspace = "Evidence Workspace" | "AI Design Copilot" | "Responsive Studio" | "Layout Composer" | "Visual Style Studio" | "Content Studio" | "Optimization Workbench" | "Developer Handoff" | "Version & Comparison" | "Validation Workspace" | "Release Review" | "Measurement Workspace";
export type ToolRoute = { workspace: ToolWorkspace; primaryAction: string; primaryDescription: string; hasVisualEditor: boolean; allowsAi: boolean; supportsStoreRelease: boolean };

const visual = (workspace: ToolWorkspace, primaryAction: string, primaryDescription: string): ToolRoute => ({ workspace, primaryAction, primaryDescription, hasVisualEditor: true, allowsAi: true, supportsStoreRelease: false });
const specialist = (workspace: ToolWorkspace, primaryAction: string, primaryDescription: string, allowsAi = true, supportsStoreRelease = false): ToolRoute => ({ workspace, primaryAction, primaryDescription, hasVisualEditor: false, allowsAi, supportsStoreRelease });

const layoutTools = new Set(["layout-analyzer", "visual-hierarchy-analyzer", "conversion-analyzer", "navigation-analyzer", "collection-analyzer", "cart-analyzer", "product-page-analyzer", "layout-composer"]);
const styleTools = new Set(["visual-design-analyzer", "typography-analyzer", "color-contrast-analyzer", "product-presentation-analyzer", "screenshot-analyzer", "design-reference-analyzer", "visual-style-studio"]);
const contentTools = new Set(["cta-analyzer", "trust-credibility-analyzer", "product-content-analyzer", "content-quality-analyzer", "ai-content-improver", "product-description-generator", "cta-generator", "seo-content-generator", "seo-analyzer", "meta-generator", "heading-structure-analyzer", "accessibility-fix-assistant", "content-editor"]);
const responsiveTools = new Set(["responsive-analyzer", "mobile-ux-analyzer", "breakpoint-analyzer", "responsive-studio"]);
const optimizationTools = new Set(["performance-analyzer", "image-optimization-analyzer", "asset-analyzer"]);
const developerTools = new Set(["developer-handoff", "technical-analyzer", "theme-code-analyzer", "accessibility-analyzer", "image-seo-analyzer", "checkout-ux-analyzer"]);
const validationTools = new Set(["visual-regression-analyzer", "responsive-regression-tester", "accessibility-regression-tester", "seo-regression-tester"]);

export function getToolRoute(toolId: string): ToolRoute {
  if (toolId === "ai-design-copilot" || toolId === "ai-store-redesign") return visual("AI Design Copilot", "Create a design proposal", "Use the current evidence, draft, and references to create a reviewable proposal.");
  if (responsiveTools.has(toolId)) return visual("Responsive Studio", "Open Responsive Studio", "Review desktop, tablet, and mobile changes in one shared draft.");
  if (layoutTools.has(toolId)) return visual("Layout Composer", "Open Layout Composer", "Make structural changes in the same live draft with AI available beside manual controls.");
  if (styleTools.has(toolId)) return visual("Visual Style Studio", "Open Visual Style Studio", "Apply visual system changes in the same live draft with evidence attached.");
  if (contentTools.has(toolId)) return visual("Content Studio", "Open Content Editor", "Review and improve content in the shared draft with contextual AI assistance.");
  if (toolId === "component-builder") return visual("Layout Composer", "Open Component Builder", "Create a reusable component with a live preview and developer-ready context.");
  if (optimizationTools.has(toolId)) return specialist("Optimization Workbench", "Open Optimization Workbench", "Review causes, expected impact, and a developer-ready optimization plan.");
  if (developerTools.has(toolId)) return specialist("Developer Handoff", "Open Developer Handoff", "Keep evidence, implementation context, expected behavior, and acceptance criteria together.", toolId !== "theme-code-analyzer");
  if (toolId === "before-after-comparator") return specialist("Version & Comparison", "Open comparison", "Compare versions, score movement, issue movement, and the final direction.");
  if (validationTools.has(toolId)) return specialist("Validation Workspace", "Open validation workspace", "Review regressions, create issues when needed, and export a focused check report.");
  if (["publish-readiness-checker", "publish-manager", "rollback"].includes(toolId)) return specialist("Release Review", "Open release review", "Review validation, platform permission, and the controlled release or rollback path.", false, true);
  if (toolId === "customer-journey-analyzer") return specialist("Evidence Workspace", "Explore journey evidence", "Review friction across the customer journey before choosing a focused fix.");
  if (["storefront-analyzer", "page-analyzer", "site-structure-analyzer"].includes(toolId)) return specialist("Evidence Workspace", "Explore evidence", "Review the scoped result, evidence, issues, and recommended follow-up.");
  return specialist("Evidence Workspace", "Explore evidence", "Review the result and choose an appropriate next action.");
}
