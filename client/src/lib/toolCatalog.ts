export type ToolCategory = "Observe" | "Diagnose" | "Create" | "Validate & ship";
export type ToolSource = "Public URL" | "Screenshots" | "Connected store" | "Theme files" | "Saved draft";

export type ToolDefinition = {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  outcome: string;
  sources: ToolSource[];
  connections: string[];
  requiresConnection: boolean;
};

export const toolCatalog: ToolDefinition[] = [
  { id: "storefront-scan", name: "Storefront scan", category: "Observe", description: "Render a public storefront and map the visible experience by page and viewport.", outcome: "A page inventory with evidence captures.", sources: ["Public URL", "Connected store"], connections: [], requiresConnection: false },
  { id: "screenshot-reviewer", name: "Screenshot reviewer", category: "Observe", description: "Inspect annotated screenshots when a public crawl is not the right starting point.", outcome: "A visual evidence board.", sources: ["Screenshots"], connections: [], requiresConnection: false },
  { id: "mobile-journey", name: "Mobile journey mapper", category: "Observe", description: "Follow the product-to-purchase path at target mobile widths.", outcome: "A mobile journey map with friction points.", sources: ["Public URL", "Screenshots", "Connected store"], connections: [], requiresConnection: false },
  { id: "page-inventory", name: "Page inventory", category: "Observe", description: "Find core product, collection, cart, and policy surfaces before deeper analysis.", outcome: "A scoped page map.", sources: ["Public URL", "Connected store"], connections: [], requiresConnection: false },
  { id: "search-metadata", name: "Search & metadata survey", category: "Observe", description: "Review public titles, descriptions, headings, and discoverability cues.", outcome: "A search-readiness inventory.", sources: ["Public URL"], connections: [], requiresConnection: false },
  { id: "accessibility-surface", name: "Accessibility surface check", category: "Observe", description: "Identify visible contrast, hierarchy, and interaction-label risks from available renders.", outcome: "An accessibility evidence list.", sources: ["Public URL", "Screenshots"], connections: [], requiresConnection: false },
  { id: "hierarchy-audit", name: "Visual hierarchy audit", category: "Diagnose", description: "Test whether the page makes its most important decision obvious at first glance.", outcome: "Ranked hierarchy improvements.", sources: ["Public URL", "Screenshots", "Saved draft"], connections: [], requiresConnection: false },
  { id: "checkout-friction", name: "Checkout friction review", category: "Diagnose", description: "Examine the available purchase path and identify blockers before checkout handoff.", outcome: "A purchase-path issue list.", sources: ["Public URL", "Connected store"], connections: [], requiresConnection: false },
  { id: "performance-evidence", name: "Performance evidence", category: "Diagnose", description: "Turn visible loading and media choices into practical performance observations.", outcome: "A performance evidence summary.", sources: ["Public URL", "Theme files"], connections: [], requiresConnection: false },
  { id: "trust-policy", name: "Trust & policy audit", category: "Diagnose", description: "Locate shipping, returns, payment, and assurance context around the decision point.", outcome: "A trust-placement review.", sources: ["Public URL", "Screenshots"], connections: [], requiresConnection: false },
  { id: "analytics-map", name: "Analytics signal map", category: "Diagnose", description: "Map the store events and reports needed to validate an improvement after release.", outcome: "A measurement plan.", sources: ["Connected store"], connections: ["Store analytics connection"], requiresConnection: true },
  { id: "responsive-redesign", name: "Responsive redesign", category: "Create", description: "Generate an evidence-led responsive direction from a URL, screenshots, or current draft.", outcome: "Comparable redesign alternatives.", sources: ["Public URL", "Screenshots", "Saved draft"], connections: [], requiresConnection: false },
  { id: "product-composer", name: "Product page composer", category: "Create", description: "Recompose the product page around product story, purchase action, and trust context.", outcome: "A product-page composition proposal.", sources: ["Public URL", "Screenshots", "Connected store"], connections: [], requiresConnection: false },
  { id: "visual-editor", name: "Visual editor", category: "Create", description: "Adjust layers and compare saved alternatives in the interactive editor.", outcome: "A local saved preview draft.", sources: ["Saved draft", "Screenshots"], connections: [], requiresConnection: false },
  { id: "copy-clarity", name: "Copy clarity pass", category: "Create", description: "Refine visible product, navigation, and reassurance copy without changing implementation.", outcome: "Suggested copy directions.", sources: ["Public URL", "Screenshots"], connections: [], requiresConnection: false },
  { id: "component-spec", name: "Component spec writer", category: "Create", description: "Convert a selected issue or redesign into a concise engineering-ready component brief.", outcome: "A developer handoff specification.", sources: ["Saved draft", "Theme files"], connections: [], requiresConnection: false },
  { id: "theme-patch", name: "Theme patch proposal", category: "Create", description: "Propose targeted theme-code changes from a verified issue and selected redesign.", outcome: "A proposed theme patch.", sources: ["Theme files", "Saved draft"], connections: ["Theme or code repository"], requiresConnection: true },
  { id: "variant-compare", name: "Compare variants", category: "Validate & ship", description: "Place two drafts side by side and explain their evidence and score movement.", outcome: "A decision-ready comparison.", sources: ["Saved draft", "Screenshots"], connections: [], requiresConnection: false },
  { id: "visual-regression", name: "Visual regression check", category: "Validate & ship", description: "Compare supplied or connected renders against a saved visual baseline.", outcome: "A visual change report.", sources: ["Screenshots", "Saved draft", "Connected store"], connections: [], requiresConnection: false },
  { id: "publish-readiness", name: "Publish readiness", category: "Validate & ship", description: "Check whether a selected draft has enough evidence and scope to move into release.", outcome: "A publish-readiness checklist.", sources: ["Saved draft", "Connected store"], connections: ["Store connection"], requiresConnection: true },
  { id: "theme-sync", name: "Theme sync & release", category: "Validate & ship", description: "Prepare an approved theme change for a connected store or repository workflow.", outcome: "A staged release plan.", sources: ["Theme files", "Saved draft", "Connected store"], connections: ["Shopify store", "WooCommerce store", "GitHub repository"], requiresConnection: true },
  { id: "developer-handoff", name: "Developer handoff", category: "Validate & ship", description: "Bundle issues, visual decisions, and implementation detail for a delivery team.", outcome: "A clear development handoff.", sources: ["Saved draft", "Theme files", "Screenshots"], connections: [], requiresConnection: false },
  { id: "store-publisher", name: "Store change publisher", category: "Validate & ship", description: "Apply an approved change to a connected store only after explicit confirmation.", outcome: "A controlled store update.", sources: ["Saved draft", "Connected store"], connections: ["Shopify store", "WooCommerce store", "Custom store API"], requiresConnection: true },
];

export const toolCategories: Array<ToolCategory | "All tools"> = ["All tools", "Observe", "Diagnose", "Create", "Validate & ship"];
