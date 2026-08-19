export type DashboardDestination =
  | "Overview"
  | "Analysis"
  | "Issues"
  | "Redesign"
  | "Visual editor"
  | "Reports"
  | "Tools Library";

export type ApprovedDashboardAction = {
  id: string;
  label: string;
  description: string;
  destination: DashboardDestination;
  toolId?: string;
  tone: "blue" | "green" | "violet" | "slate";
};

export const approvedDashboard = {
  greeting: {
    name: "Maya",
    copy: "Monitor, analyze, and improve your storefronts from one place.",
  },
  summary: [
    { id: "stores", value: "3", label: "Connected stores", tone: "blue" },
    { id: "health", value: "91", label: "Store health", tone: "green" },
    { id: "issues", value: "3", label: "Priority issues", tone: "coral" },
    { id: "designs", value: "2", label: "Active designs", tone: "violet" },
  ],
  primaryAction: {
    title: "What would you like to improve?",
    copy: "Analyze a public store URL or connect your store for deeper access and continuous improvement.",
    actions: [
      { id: "analyze-url", label: "Analyze store URL", destination: "Tools Library" as DashboardDestination, toolId: "storefront-scan" },
      { id: "connect-shopify", label: "Connect Shopify", destination: "Tools Library" as DashboardDestination, toolId: "store-publisher" },
    ],
  },
  quickActions: [
    { id: "analyze", label: "Analyze Store", description: "Start from a public URL or connected store.", destination: "Analysis", toolId: "storefront-scan", tone: "blue" },
    { id: "connect", label: "Connect Store", description: "Link Shopify, WooCommerce, or a custom API.", destination: "Tools Library", toolId: "store-publisher", tone: "green" },
    { id: "redesign", label: "AI Redesign", description: "Generate an evidence-based redesign direction.", destination: "Redesign", tone: "violet" },
    { id: "studio", label: "Design Studio", description: "Continue a saved storefront design.", destination: "Visual editor", tone: "blue" },
    { id: "responsive", label: "Responsive Test", description: "Check the storefront across viewports.", destination: "Analysis", toolId: "mobile-journey", tone: "slate" },
    { id: "report", label: "Create Report", description: "Prepare a store improvement report.", destination: "Reports", tone: "slate" },
  ] satisfies ApprovedDashboardAction[],
  stores: [
    {
      id: "atelier-forma",
      name: "Atelier Forma",
      platform: "Shopify",
      connection: "Connected",
      status: "Redesign in progress",
      health: 91,
      scores: { Design: 94, UX: 91, Mobile: 88, Performance: 86, SEO: 92 },
      actions: [
        { label: "View store", destination: "Overview" as DashboardDestination },
        { label: "Analyze", destination: "Analysis" as DashboardDestination, toolId: "storefront-scan" },
        { label: "Improve", destination: "Redesign" as DashboardDestination },
      ],
    },
    { id: "north-studio", name: "North Studio", platform: "WooCommerce", connection: "Connected", status: "Analysis complete", health: 91 },
    { id: "haven-goods", name: "Haven Goods", platform: "Shopify", connection: "Connected", status: "Analysis required", health: 87 },
  ],
  health: {
    score: 91,
    label: "Excellent",
    scores: [
      { label: "Design", value: 94 },
      { label: "UX", value: 91 },
      { label: "Mobile", value: 88 },
      { label: "Performance", value: 86 },
      { label: "SEO", value: 92 },
    ],
  },
  issues: [
    { id: "mobile-navigation", title: "Mobile navigation overflows", action: "Fix with AI", destination: "Redesign" as DashboardDestination, severity: "critical" },
    { id: "hero-cta", title: "Hero CTA lacks emphasis", action: "Improve with AI", destination: "Redesign" as DashboardDestination, severity: "improvement" },
    { id: "imagery", title: "Product imagery needs consistency", action: "View recommendation", destination: "Issues" as DashboardDestination, severity: "suggestion" },
  ],
  recommendation: { title: "Improve mobile experience", copy: "5 responsive issues found", action: "Fix with AI", destination: "Redesign" as DashboardDestination },
  analyses: [
    { store: "Atelier Forma", type: "Homepage analysis", score: 91 },
    { store: "North Studio", type: "Responsive analysis", score: 87 },
  ],
  transformation: { before: 72, after: 94, gain: 22 },
  publish: {
    title: "Modern storefront redesign",
    status: "Approved design ready",
    actions: [
      { label: "Preview", destination: "Overview" as DashboardDestination },
      { label: "Validate", destination: "Tools Library" as DashboardDestination, toolId: "publish-readiness" },
      { label: "Publish", destination: "Tools Library" as DashboardDestination, toolId: "store-publisher" },
    ],
  },
  activity: ["Analysis complete", "AI redesign ready", "Mobile navigation fixed"],
} as const;

export const approvedDashboardParity = {
  desktopOnlyNavigation: ["Dashboard", "Stores", "Analyze", "Design Studio", "AI Assistant", "Reports", "Settings", "More"],
  mobileNavigation: ["Home", "Stores", "Analyze", "More"],
  requiredModules: ["primaryAction", "quickActions", "summary", "stores", "health", "issues", "recommendation", "analyses", "transformation", "publish", "activity"],
  requiredHealthLabels: ["Design", "UX", "Mobile", "Performance", "SEO"],
} as const;
