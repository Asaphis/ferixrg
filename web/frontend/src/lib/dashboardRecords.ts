export type DashboardQuickAction = {
  id: string;
  title: string;
  description: string;
  route: string;
  toolId?: string;
  cue: "url" | "evidence" | "draft" | "shopify" | "theme" | "publish";
};

export const dashboardQuickActions: DashboardQuickAction[] = [
  { id: "scan", title: "Scan a public URL", description: "Start with any storefront, no connection required.", route: "Tools Library", toolId: "storefront-scan", cue: "url" },
  { id: "evidence", title: "Review screenshots", description: "Bring in visual evidence when crawling is not the right path.", route: "Tools Library", toolId: "screenshot-reviewer", cue: "evidence" },
  { id: "draft", title: "Continue a draft", description: "Return to the selected responsive redesign alternative.", route: "Visual editor", cue: "draft" },
  { id: "shopify", title: "Connect Shopify", description: "Use private catalogue and theme context when you are ready.", route: "Tools Library", toolId: "store-publisher", cue: "shopify" },
  { id: "theme", title: "Prepare a theme patch", description: "Turn a verified issue into an implementation-ready proposal.", route: "Tools Library", toolId: "theme-patch", cue: "theme" },
  { id: "publish", title: "Check release readiness", description: "Validate a chosen draft before any store action is staged.", route: "Tools Library", toolId: "publish-readiness", cue: "publish" },
];

export const dashboardRecords = {
  signal: { health: 82, delta: "+11", baseline: 71, focus: "Mobile purchase path", lenses: ["Design 88", "Responsive 71", "Conversion 79", "Accessibility 92"] },
  connection: { platform: "Shopify", store: "Atelier Forma", status: "Connected", sync: "Last synced 4 min ago", access: ["Catalogue reading", "Theme preview"], environment: "Preview connection" },
  focus: { title: "Purchase action hierarchy at 390px", status: "Fix in progress", issue: "The buy action competes with secondary detail after the product gallery.", owner: "Responsive redesign / Alternative B", next: "Compare draft against baseline" },
  queue: [
    { state: "Found", count: "3", title: "High-priority mobile issues", detail: "Purchase hierarchy, header overlap, and trust timing.", route: "Issues" },
    { state: "Drafting", count: "2", title: "Responsive alternatives", detail: "Premium path and conversion-led hierarchy are ready.", route: "Visual editor" },
    { state: "Implemented", count: "4", title: "Validated improvements", detail: "Contrast, media spacing, and metadata changes have a record.", route: "Reports" },
  ],
  drafts: [
    { name: "Draft v3", tag: "Current", score: "+4", detail: "Purchase action / 390px", tone: "current" },
    { name: "Alternative B", tag: "Ready to compare", score: "+8", detail: "Trust at decision point", tone: "ready" },
    { name: "Alternative A", tag: "Saved", score: "+5", detail: "Premium narrative spacing", tone: "saved" },
  ],
  recentTools: [
    { name: "Responsive redesign", activity: "Opened 18 min ago", route: "Tools Library", toolId: "responsive-redesign", state: "Working" },
    { name: "Visual editor", activity: "Saved a browser draft", route: "Visual editor", state: "Drafting" },
    { name: "Checkout friction review", activity: "Issue evidence collected", route: "Tools Library", toolId: "checkout-friction", state: "Complete" },
    { name: "Storefront scan", activity: "Last scan completed", route: "Tools Library", toolId: "storefront-scan", state: "Complete" },
  ],
  history: [
    { time: "4 min", title: "Mobile scan recorded", detail: "3 high-priority findings surfaced.", route: "Tools Library", toolId: "mobile-journey" },
    { time: "18 min", title: "Alternative B opened", detail: "Conversion-led hierarchy is under review.", route: "Visual editor" },
    { time: "Yesterday", title: "Contrast adjustment validated", detail: "Homepage body copy passed its target ratio.", route: "Issues" },
  ],
};
