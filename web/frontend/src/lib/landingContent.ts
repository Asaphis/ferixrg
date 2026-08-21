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

export const landingVisuals = [
  { src: "/landing/portfolio/shopify-multi-device-beauty.jpg", alt: "Shopify storefront displayed across desktop, tablet, and phone" },
  { src: "/landing/portfolio/shopify-fashion-responsive.jpg", alt: "Responsive Shopify fashion storefront on desktop and mobile" },
  { src: "/landing/portfolio/fashion-responsive-storefront.jpg", alt: "Responsive fashion storefront experience" },
  { src: "/landing/portfolio/sneaker-store-responsive.jpg", alt: "Responsive sneaker storefront across phone and desktop" },
  { src: "/landing/portfolio/allbirds-mobile-storefront.png", alt: "Allbirds mobile storefront across three responsive views" },
] as const;

export const publicNavItems = [
  ["Product", "/features"],
  ["Solutions", "/solutions"],
  ["How It Works", "/how-it-works"],
  ["Platforms", "/platforms"],
  ["Resources", "/resources"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export const landingIssueList = [
  "Below-the-fold content not optimized",
  "Slow Largest Contentful Paint",
  "Weak product section hierarchy",
  "Low contrast on key CTAs",
] as const;

export const landingAiPrompts = [
  ["Improve product page conversion", "product-composer"],
  ["Speed up my store", "performance-evidence"],
  ["Redesign with a modern look", "responsive-redesign"],
  ["Improve mobile checkout", "checkout-friction"],
] as const;

export const publicPageCopy = {
  features: { eyebrow: "PRODUCT CAPABILITIES", title: "See the problems your storefront is hiding.", copy: "FerixRG turns storefront evidence into a clear, reviewable plan for improving design, mobile behavior, UX, performance, conversion, accessibility, and SEO." },
  solutions: { eyebrow: "SOLUTIONS", title: "One intelligence layer for every storefront team.", copy: "Owners, designers, agencies, and developers can work from the same evidence without losing the context behind a recommendation." },
  howItWorks: { eyebrow: "PROVEN PROCESS", title: "From insight to impact.", copy: "Move from a public URL or connected store to evidence, recommendations, reviewed changes, validation, and a responsible handoff." },
  platforms: { eyebrow: "SUPPORTED PLATFORMS", title: "Start with the storefront access you have.", copy: "Analyze a public URL instantly or connect a supported store when deeper context, monitoring, and publishing permissions are available." },
  resources: { eyebrow: "RESOURCES", title: "Make every improvement easier to explain.", copy: "Explore reports, evidence, product guidance, and practical resources for making storefront work understandable and actionable." },
  pricing: { eyebrow: "PRICING", title: "Choose the level of storefront intelligence you need.", copy: "Start with public analysis, then expand into connected-store workflows and team-ready review when your operation is ready." },
  about: { eyebrow: "ABOUT FERIXRG", title: "Storefront intelligence built around evidence.", copy: "FerixRG helps teams understand what is happening in a storefront, decide what matters, and improve it without hiding uncertainty." },
  contact: { eyebrow: "CONTACT", title: "Bring us the storefront problem you need to solve.", copy: "Tell us what you are analyzing, improving, validating, or preparing to ship, and we will help you choose the right path." },
} as const;
