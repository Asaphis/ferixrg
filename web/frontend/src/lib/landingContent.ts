export const supportedPlatforms = [
  { name: "Shopify", mark: "S", tone: "shopify" },
  { name: "WooCommerce", mark: "woo", tone: "woocommerce" },
  { name: "BigCommerce", mark: "B", tone: "bigcommerce" },
  { name: "Shopware", mark: "S", tone: "shopware" },
  { name: "Custom / Headless", mark: "</>", tone: "headless" },
  { name: "URL Analysis", mark: "⌁", tone: "url" },
] as const;

export const landingOutcomes = [
  { value: "91", suffix: "/100", label: "Store Health", icon: "⌁" },
  { value: "18", suffix: "", label: "Improvements surfaced", icon: "↑" },
  { value: "2", suffix: "", label: "Redesign alternatives", icon: "✎" },
  { value: "3", suffix: "", label: "Connected stores", icon: "↗" },
] as const;

export const landingHealthMetrics = [
  { name: "Design", value: 94, tone: "green" },
  { name: "UX", value: 91, tone: "blue" },
  { name: "Responsive", value: 88, tone: "cyan" },
  { name: "Performance", value: 86, tone: "orange" },
  { name: "SEO", value: 92, tone: "lime" },
] as const;

export const landingWorkflow = [
  ["01", "Analyze", "Scan your store or paste a URL."],
  ["02", "Discover", "Uncover issues and opportunities."],
  ["03", "Improve", "Get AI-powered recommendations."],
  ["04", "Publish", "Preview and ship supported changes safely."],
] as const;

export const heroMotionLayers = ["workspace", "browser", "phone", "insight", "impact", "badge", "connector"] as const;

export const desktopParallaxConfig = {
  enabledAbovePx: 600,
  maxOffsetPx: 4,
  disabledWhenReducedMotion: true,
} as const;

export const sharedLandingModules = [
  "navigation", "hero-copy", "url-analyzer", "hero-montage", "platform-marquee", "outcomes",
  "issue-cards", "change-story", "ai-prompts", "evidence-cards", "redesign-comparison",
  "workflow", "health-report", "final-cta", "footer",
] as const;
