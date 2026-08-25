/* Quiet Intelligence UI direction: static dashboard-only workflow definitions; no live execution or backend wiring. */
export type ToolSource =
  | "Connected store"
  | "Public URL"
  | "Specific page URL"
  | "Screenshots"
  | "Saved draft"
  | "Theme files"
  | "Selected page"
  | "Selected text"
  | "Reference design"
  | "Analysis result";

export type ToolKind = "analysis" | "generator" | "workspace" | "validation" | "release";
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
  | "Release Review";

export type ToolDefinition = {
  id: string;
  name: string;
  category: string;
  kind: ToolKind;
  description: string;
  sources: ToolSource[];
  workspace: ToolWorkspace;
  outcome: string;
};

const t = (id: string, name: string, category: string, kind: ToolKind, description: string, sources: ToolSource[], workspace: ToolWorkspace, outcome: string): ToolDefinition => ({ id, name, category, kind, description, sources, workspace, outcome });

const publicStore: ToolSource[] = ["Public URL", "Connected store"];
const pageEvidence: ToolSource[] = ["Specific page URL", "Screenshots", "Connected store"];
const visualEvidence: ToolSource[] = ["Public URL", "Specific page URL", "Screenshots", "Saved draft"];

export const toolCatalog: ToolDefinition[] = [
  t("storefront-analyzer", "Storefront Analyzer", "Store Analysis", "analysis", "Assess a storefront across design, UX, content, responsiveness, trust, and conversion.", ["Connected store", "Public URL", "Specific page URL", "Screenshots"], "Evidence Workspace", "Overall store health with scoped issues and clear next actions."),
  t("page-analyzer", "Page Analyzer", "Store Analysis", "analysis", "Analyze one selected storefront page.", pageEvidence, "Evidence Workspace", "Page health with affected elements and priority fixes."),
  t("site-structure-analyzer", "Site Structure Analyzer", "Store Analysis", "analysis", "Examine site architecture, hierarchy, and discoverability.", publicStore, "Evidence Workspace", "A site structure map with navigation findings."),
  t("visual-design-analyzer", "Visual Design Analyzer", "Design & Visual", "analysis", "Evaluate visual consistency, hierarchy, typography, and composition.", visualEvidence, "Visual Style Studio", "Visual findings with design recommendations."),
  t("layout-analyzer", "Layout Analyzer", "Design & Visual", "analysis", "Examine section arrangement, alignment, grids, spacing, and structure.", visualEvidence, "Layout Composer", "Structural recommendations for affected sections."),
  t("visual-hierarchy-analyzer", "Visual Hierarchy Analyzer", "Design & Visual", "analysis", "Check what visitors notice first and where attention competes.", visualEvidence, "Layout Composer", "A hierarchy map with focused next changes."),
  t("typography-analyzer", "Typography Analyzer", "Design & Visual", "analysis", "Check typography selection, hierarchy, readability, and consistency.", visualEvidence, "Visual Style Studio", "Typography findings with recommended changes."),
  t("color-contrast-analyzer", "Color & Contrast Analyzer", "Design & Visual", "analysis", "Check palette consistency and visible contrast.", visualEvidence, "Visual Style Studio", "Contrast findings and palette guidance."),
  t("ux-analyzer", "UX Analyzer", "UX & Conversion", "analysis", "Evaluate storefront navigation, clarity, discovery, interaction, and forms.", pageEvidence, "Evidence Workspace", "A prioritized UX evidence review."),
  t("conversion-analyzer", "Conversion Analyzer", "UX & Conversion", "analysis", "Evaluate whether a store supports meaningful customer action.", pageEvidence, "Layout Composer", "Conversion opportunities with impact and confidence."),
  t("cta-analyzer", "CTA Analyzer", "UX & Conversion", "analysis", "Check CTA visibility, wording, placement, contrast, and hierarchy.", visualEvidence, "Content Studio", "CTA evidence and alternative strategies."),
  t("trust-credibility-analyzer", "Trust & Credibility Analyzer", "UX & Conversion", "analysis", "Find missing trust signals and useful placements.", visualEvidence, "Content Studio", "Trust-gap findings with recommended placement."),
  t("customer-journey-analyzer", "Customer Journey Analyzer", "UX & Conversion", "analysis", "Map the journey from landing through purchase.", publicStore, "Evidence Workspace", "A journey map with friction points."),
  t("responsive-analyzer", "Responsive Analyzer", "Responsive", "analysis", "Check desktop, tablet, and mobile behavior across a page.", visualEvidence, "Responsive Studio", "Mobile health and viewport-specific fixes."),
  t("mobile-ux-analyzer", "Mobile UX Analyzer", "Responsive", "analysis", "Evaluate mobile navigation, search, product discovery, controls, and flow.", pageEvidence, "Responsive Studio", "Mobile UX findings and recommendations."),
  t("breakpoint-analyzer", "Breakpoint Analyzer", "Responsive", "analysis", "Find layout problems between desktop, tablet, and mobile widths.", visualEvidence, "Responsive Studio", "Breakpoint behavior with affected ranges."),
  t("product-page-analyzer", "Product Page Analyzer", "Product & Commerce", "analysis", "Check the complete product-page decision experience.", pageEvidence, "Layout Composer", "Product-page findings ordered by purchase impact."),
  t("product-presentation-analyzer", "Product Presentation Analyzer", "Product & Commerce", "analysis", "Analyze product imagery, gallery, pricing, badges, and visual hierarchy.", pageEvidence, "Visual Style Studio", "Product-presentation recommendations."),
  t("product-content-analyzer", "Product Content Analyzer", "Product & Commerce", "analysis", "Check product content clarity, completeness, and persuasion.", ["Connected store", "Specific page URL", "Screenshots", "Selected text"], "Content Studio", "Product-content findings and rewrite directions."),
  t("navigation-analyzer", "Navigation Analyzer", "Product & Commerce", "analysis", "Check menus, search, breadcrumbs, and navigation clarity.", pageEvidence, "Layout Composer", "Navigation findings with structural recommendations."),
  t("collection-analyzer", "Collection Analyzer", "Product & Commerce", "analysis", "Check category organization, filtering, sorting, and discovery.", pageEvidence, "Layout Composer", "Collection findings with priority actions."),
  t("cart-analyzer", "Cart Analyzer", "Product & Commerce", "analysis", "Check cart clarity, actions, upsells, and shipping information.", pageEvidence, "Layout Composer", "Cart findings with conversion opportunities."),
  t("checkout-ux-analyzer", "Checkout UX Analyzer", "Product & Commerce", "analysis", "Check available checkout experience and friction indicators.", ["Connected store", "Public URL", "Specific page URL"], "Developer Handoff", "Checkout findings within the available access boundary."),
  t("content-quality-analyzer", "Content Quality Analyzer", "Content & AI", "analysis", "Check content clarity, grammar, consistency, and missing information.", ["Public URL", "Specific page URL", "Screenshots", "Selected text"], "Content Studio", "Content findings with focused improvements."),
  t("ai-content-improver", "AI Content Improver", "Content & AI", "generator", "Improve selected text with a clear tone and intent.", ["Selected text", "Screenshots", "Saved draft"], "Content Studio", "Reviewable content proposals."),
  t("product-description-generator", "Product Description Generator", "Content & AI", "generator", "Generate product descriptions, benefits, and SEO variations.", ["Connected store", "Selected text", "Saved draft"], "Content Studio", "Product content variations ready for review."),
  t("cta-generator", "CTA Generator", "Content & AI", "generator", "Generate conversion-focused CTA variations.", ["Selected text", "Specific page URL", "Saved draft"], "Content Studio", "CTA alternatives with rationale."),
  t("seo-content-generator", "SEO Content Generator", "Content & AI", "generator", "Generate metadata, headings, alt text, and structured content.", ["Public URL", "Specific page URL", "Selected text", "Saved draft"], "Content Studio", "SEO content proposals ready for review."),
  t("ai-design-copilot", "AI Design Copilot", "Content & AI", "generator", "Create a scoped redesign, fix, or visual direction from provided context.", ["Connected store", "Public URL", "Screenshots", "Saved draft", "Reference design", "Analysis result"], "AI Design Copilot", "A reviewable design proposal or draft."),
  t("seo-analyzer", "SEO Analyzer", "SEO", "analysis", "Check page SEO and structural indicators.", ["Connected store", "Public URL", "Specific page URL", "Theme files"], "Content Studio", "SEO evidence with an action plan."),
  t("meta-generator", "Meta Generator", "SEO", "generator", "Generate meta titles, descriptions, and social descriptions.", ["Public URL", "Specific page URL", "Selected text", "Saved draft"], "Content Studio", "Metadata variations for review."),
  t("heading-structure-analyzer", "Heading Structure Analyzer", "SEO", "analysis", "Check H1, H2, and H3 hierarchy.", ["Public URL", "Specific page URL", "Theme files", "Saved draft"], "Content Studio", "Heading findings and a corrected outline."),
  t("image-seo-analyzer", "Image SEO Analyzer", "SEO", "analysis", "Check image alt text, filenames, dimensions, and optimization opportunities.", ["Connected store", "Public URL", "Specific page URL", "Theme files"], "Developer Handoff", "Image SEO opportunities and handoff actions."),
  t("performance-analyzer", "Performance Analyzer", "Performance", "analysis", "Check page load, assets, images, scripts, fonts, and requests.", ["Connected store", "Public URL", "Specific page URL", "Theme files"], "Optimization Workbench", "Performance evidence with expected impact."),
  t("image-optimization-analyzer", "Image Optimization Analyzer", "Performance", "analysis", "Find oversized images, inefficient formats, and responsive-image gaps.", ["Connected store", "Public URL", "Specific page URL", "Theme files"], "Optimization Workbench", "Image optimization actions ready for handoff."),
  t("asset-analyzer", "Asset Analyzer", "Performance", "analysis", "Analyze CSS, JavaScript, images, fonts, video, and third-party assets.", ["Connected store", "Public URL", "Theme files"], "Optimization Workbench", "An asset inventory with delivery recommendations."),
  t("accessibility-analyzer", "Accessibility Analyzer", "Accessibility", "analysis", "Check visible accessibility indicators and technical context where available.", ["Connected store", "Public URL", "Specific page URL", "Screenshots", "Theme files"], "Developer Handoff", "Accessibility evidence with remediation priority."),
  t("accessibility-fix-assistant", "Accessibility Fix Assistant", "Accessibility", "generator", "Turn detected accessibility problems into clear suggested fixes.", ["Analysis result", "Selected page", "Theme files", "Saved draft"], "Content Studio", "Accessible labels and developer-ready fixes."),
  t("screenshot-analyzer", "Screenshot Analyzer", "Visual & Reference", "analysis", "Analyze uploaded screenshots for design structure and visual quality.", ["Screenshots"], "Visual Style Studio", "Design analysis with visual recommendations."),
  t("design-reference-analyzer", "Design Reference Analyzer", "Visual & Reference", "analysis", "Extract a usable visual direction from a design reference.", ["Reference design", "Screenshots"], "Visual Style Studio", "Reference guidance for a similar direction."),
  t("ai-store-redesign", "AI Store Redesign", "Visual & Reference", "generator", "Generate a redesign direction from a URL, store, screenshot, or project.", ["Connected store", "Public URL", "Screenshots", "Saved draft"], "AI Design Copilot", "Comparable redesign alternatives for review."),
  t("layout-composer", "Layout Composer", "Design Workspaces", "workspace", "Manually arrange sections, grids, alignment, spacing, and order.", ["Saved draft", "Selected page", "Analysis result"], "Layout Composer", "A saved layout draft with version history."),
  t("visual-style-studio", "Visual Style Studio", "Design Workspaces", "workspace", "Manually edit colors, typography, borders, shadows, backgrounds, and effects.", ["Saved draft", "Selected page", "Analysis result"], "Visual Style Studio", "A saved visual-style draft with version history."),
  t("responsive-studio", "Responsive Studio", "Design Workspaces", "workspace", "Control devices, breakpoints, visibility, and mobile-specific layout.", ["Saved draft", "Selected page", "Analysis result"], "Responsive Studio", "A responsive draft with side-by-side device review."),
  t("content-editor", "Content Editor", "Design Workspaces", "workspace", "Edit text, headings, product descriptions, buttons, navigation, and FAQs.", ["Saved draft", "Selected page", "Analysis result"], "Content Studio", "A saved content draft with assisted revisions."),
  t("component-builder", "Component Builder", "Design Workspaces", "workspace", "Create reusable buttons, cards, sections, headers, footers, and product components.", ["Saved draft", "Selected page", "Analysis result"], "Layout Composer", "A reusable component proposal or draft."),
  t("developer-handoff", "Developer Handoff", "Developer", "analysis", "Convert findings into an implementation-ready package.", ["Analysis result", "Saved draft", "Theme files", "Screenshots"], "Developer Handoff", "Issue, evidence, behavior, fix, and priority in one handoff."),
  t("technical-analyzer", "Technical Analyzer", "Developer", "analysis", "Analyze available technical structure, styling, assets, and responsive rules.", ["Theme files", "Connected store", "Analysis result"], "Developer Handoff", "Technical evidence and a safe remediation plan."),
  t("theme-code-analyzer", "Theme/Code Analyzer", "Developer", "analysis", "Analyze relevant theme or code files where access exists.", ["Theme files", "Connected store", "Analysis result"], "Developer Handoff", "Theme findings with implementation recommendations."),
  t("before-after-comparator", "Before/After Comparator", "Testing & Validation", "validation", "Compare original and current results across scores and issue movement.", ["Saved draft", "Screenshots", "Analysis result"], "Version & Comparison", "A decision-ready before/after comparison."),
  t("visual-regression-analyzer", "Visual Regression Analyzer", "Testing & Validation", "validation", "Compare versions and identify unexpected visual changes.", ["Saved draft", "Screenshots", "Connected store"], "Validation Workspace", "A visual change report with reviewable differences."),
  t("responsive-regression-tester", "Responsive Regression Tester", "Testing & Validation", "validation", "Check whether a modification affected another viewport.", ["Saved draft", "Screenshots", "Connected store"], "Validation Workspace", "A viewport-by-viewport regression report."),
  t("accessibility-regression-tester", "Accessibility Regression Tester", "Testing & Validation", "validation", "Recheck accessibility after modifications.", ["Saved draft", "Screenshots", "Connected store", "Theme files"], "Validation Workspace", "An accessibility comparison with remaining issues."),
  t("seo-regression-tester", "SEO Regression Tester", "Testing & Validation", "validation", "Check whether a redesign introduced SEO problems.", ["Saved draft", "Connected store", "Theme files"], "Validation Workspace", "An SEO regression report with affected signals."),
  t("publish-readiness-checker", "Publish Readiness Checker", "Release", "release", "Check conditions before a supported release.", ["Saved draft", "Connected store", "Analysis result"], "Release Review", "A release checklist with blockers and permission status."),
  t("publish-manager", "Publish Manager", "Release", "release", "Move a supported store change through draft, validate, review, approve, and publish.", ["Saved draft", "Connected store"], "Release Review", "A controlled release plan with explicit confirmation."),
  t("rollback", "Rollback", "Release", "release", "Restore a previous published version when a supported integration allows it.", ["Connected store", "Saved draft"], "Release Review", "A controlled restore plan with version context."),
];

export const toolCategories = ["All tools", ...Array.from(new Set(toolCatalog.map((tool) => tool.category)))];

export const sourceDetail: Record<ToolSource, { short: string; prompt: string }> = {
  "Connected store": { short: "A selected authorized storefront", prompt: "Choose an existing store or begin the store-connection UI." },
  "Public URL": { short: "A publicly visible storefront", prompt: "Paste the public homepage or storefront URL." },
  "Specific page URL": { short: "One specific page", prompt: "Paste the exact product, collection, cart, or landing-page URL." },
  Screenshots: { short: "Visual evidence", prompt: "Choose the screenshots that represent the page or state to review." },
  "Saved draft": { short: "A prior FerixRG project version", prompt: "Choose a project and the saved version to continue or compare." },
  "Theme files": { short: "Permitted code or theme assets", prompt: "Attach the relevant files to frame a technical review." },
  "Selected page": { short: "A page from an existing project", prompt: "Choose the page that should open in the specialist workspace." },
  "Selected text": { short: "A focused content selection", prompt: "Paste or select the copy that should be improved." },
  "Reference design": { short: "A design direction", prompt: "Attach a design reference that should guide the direction." },
  "Analysis result": { short: "A prior FerixRG finding", prompt: "Choose the finding or result that should drive the next workstream." },
};
