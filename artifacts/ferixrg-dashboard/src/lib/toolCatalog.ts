export type ToolCategory = "Store Analysis" | "Design & Visual" | "UX & Conversion" | "Responsive" | "Content & AI" | "SEO" | "Accessibility" | "Design Workspaces" | "Testing & Validation" | "Release";
export type ToolKind = "analysis" | "generator" | "workspace" | "validation" | "release";
export type ToolSource = "Connected store" | "Public URL" | "Specific page URL" | "Screenshots" | "Saved draft" | "Reference design" | "Analysis result" | "Selected page";
export type ToolDefinition = {
  id: string;
  name: string;
  category: ToolCategory;
  kind: ToolKind;
  description: string;
  outcome: string;
  analysisFocus: string[];
  sources: ToolSource[];
};

const tool = (id: string, name: string, category: ToolCategory, kind: ToolKind, description: string, focus: string, sources: ToolSource[], outcome: string): ToolDefinition => ({
  id, name, category, kind, description, outcome, analysisFocus: focus.split(" | "), sources,
});

export const toolCatalog: ToolDefinition[] = [
  tool("storefront-analyzer", "Storefront Analyzer", "Store Analysis", "analysis", "Give the user an overall assessment of a storefront.", "Visual design | Layout | Navigation | Content structure | Product presentation | CTA placement | Mobile responsiveness", ["Connected store", "Public URL", "Specific page URL", "Screenshots"], "Overall store health with evidence, issues, and clear next actions."),
  tool("page-analyzer", "Page Analyzer", "Store Analysis", "analysis", "Analyze one selected storefront page.", "Homepage | Product page | Collection | Cart | Contact | Landing pages", ["Specific page URL", "Screenshots", "Connected store"], "Page health with structure, hierarchy, UX, and conversion findings."),
  tool("visual-design-analyzer", "Visual Design Analyzer", "Design & Visual", "analysis", "Evaluate the visual quality and consistency of a storefront.", "Color consistency | Typography | Spacing | Alignment | Visual hierarchy | Image quality", ["Public URL", "Specific page URL", "Screenshots", "Saved draft"], "A visual design score with evidence and recommendations."),
  tool("ux-analyzer", "UX Analyzer", "UX & Conversion", "analysis", "Evaluate the overall storefront user experience.", "Navigation | Clarity | Discoverability | Interaction | Forms | Product discovery", ["Specific page URL", "Screenshots", "Connected store"], "UX findings with priority opportunities."),
  tool("conversion-analyzer", "Conversion Analyzer", "UX & Conversion", "analysis", "Evaluate whether the store encourages meaningful customer action.", "CTA placement | Product presentation | Trust | Social proof | Pricing | Purchase path", ["Public URL", "Specific page URL", "Screenshots"], "Conversion friction points and recommended changes."),
  tool("responsive-analyzer", "Responsive Analyzer", "Responsive", "analysis", "Check responsive behavior from desktop through mobile.", "Desktop | Tablet | Mobile | Overflow | Tiny text | Navigation | CTA", ["Public URL", "Specific page URL", "Screenshots", "Saved draft"], "Mobile health with affected viewports and priority fixes."),
  tool("seo-analyzer", "SEO Analyzer", "SEO", "analysis", "Check available page SEO and structural indicators.", "Title | Meta description | Headings | Canonical | Image alt text | Structured data", ["Connected store", "Public URL", "Specific page URL"], "SEO evidence with issues and passed checks."),
  tool("accessibility-analyzer", "Accessibility Analyzer", "Accessibility", "analysis", "Check visible accessibility indicators and semantic structure.", "Color contrast | Alt text | Heading hierarchy | Labels | Keyboard indicators", ["Connected store", "Public URL", "Screenshots", "Specific page URL"], "Accessibility findings with remediation priority."),
  tool("ai-design-copilot", "AI Design Copilot", "Content & AI", "generator", "Use natural language to redesign, fix, restyle, or create a store direction.", "Current page | Selected element | Analysis results | Previous changes", ["Connected store", "Public URL", "Saved draft", "Analysis result"], "A scoped design proposal that stays reviewable before application."),
  tool("ai-store-redesign", "AI Store Redesign", "Design & Visual", "generator", "Generate a redesigned storefront version from evidence and a project.", "URL | Connected store | Screenshot | Existing project", ["Connected store", "Public URL", "Screenshots", "Saved draft"], "Comparable redesign alternatives ready for AI and manual refinement."),
  tool("content-editor", "Content Editor", "Design Workspaces", "workspace", "Manually edit text, headings, product descriptions, buttons, and navigation.", "Text | Headings | Product descriptions | Buttons | Navigation", ["Saved draft", "Selected page", "Analysis result"], "A saved content draft with AI-assisted revisions."),
  tool("visual-style-studio", "Visual Style Studio", "Design Workspaces", "workspace", "Edit colors, typography, borders, shadows, backgrounds, and effects.", "Colors | Typography | Borders | Shadows | Backgrounds | Effects", ["Saved draft", "Selected page", "Analysis result"], "A saved visual-style draft with live preview and history."),
  tool("layout-composer", "Layout Composer", "Design Workspaces", "workspace", "Arrange sections, containers, columns, grids, spacing, and order.", "Sections | Containers | Columns | Grid | Alignment | Spacing", ["Saved draft", "Selected page", "Analysis result"], "A saved layout draft with live preview and version history."),
  tool("before-after-comparator", "Before/After Comparator", "Testing & Validation", "validation", "Compare original and current results across score and issue movement.", "Before | After | Score movement | Issue movement", ["Saved draft", "Screenshots", "Analysis result"], "A decision-ready before/after comparison."),
  tool("publish-readiness-checker", "Publish Readiness Checker", "Release", "release", "Check every required condition before a supported release.", "Validation | Responsive checks | Accessibility | SEO | Unresolved issues", ["Saved draft", "Connected store", "Analysis result"], "A release checklist including validation, permissions, and unresolved risks."),
];

export const toolCategories: Array<ToolCategory | "All tools"> = ["All tools", "Store Analysis", "Design & Visual", "UX & Conversion", "Responsive", "Content & AI", "SEO", "Accessibility", "Design Workspaces", "Testing & Validation", "Release"];