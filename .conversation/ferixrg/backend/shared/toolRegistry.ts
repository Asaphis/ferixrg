export const canonicalToolIds = [
  "storefront-analyzer", "page-analyzer", "site-structure-analyzer", "visual-design-analyzer", "layout-analyzer", "visual-hierarchy-analyzer", "typography-analyzer", "color-contrast-analyzer", "ux-analyzer", "conversion-analyzer", "cta-analyzer", "trust-credibility-analyzer", "customer-journey-analyzer", "responsive-analyzer", "mobile-ux-analyzer", "breakpoint-analyzer", "product-page-analyzer", "product-presentation-analyzer", "product-content-analyzer", "navigation-analyzer", "collection-analyzer", "cart-analyzer", "checkout-ux-analyzer", "content-quality-analyzer", "ai-content-improver", "product-description-generator", "cta-generator", "seo-content-generator", "ai-design-copilot", "seo-analyzer", "meta-generator", "heading-structure-analyzer", "image-seo-analyzer", "performance-analyzer", "image-optimization-analyzer", "asset-analyzer", "accessibility-analyzer", "accessibility-fix-assistant", "screenshot-analyzer", "design-reference-analyzer", "ai-store-redesign", "layout-composer", "visual-style-studio", "responsive-studio", "content-editor", "component-builder", "developer-handoff", "technical-analyzer", "theme-code-analyzer", "before-after-comparator", "visual-regression-analyzer", "responsive-regression-tester", "accessibility-regression-tester", "seo-regression-tester", "publish-readiness-checker", "publish-manager", "rollback",
] as const;

export type CanonicalToolId = (typeof canonicalToolIds)[number];

export const connectionRequiredToolIds: ReadonlySet<string> = new Set<CanonicalToolId>([
  "technical-analyzer", "theme-code-analyzer", "publish-readiness-checker", "publish-manager", "rollback",
]);

export function isCanonicalToolId(value: string): value is CanonicalToolId {
  return (canonicalToolIds as readonly string[]).includes(value);
}
