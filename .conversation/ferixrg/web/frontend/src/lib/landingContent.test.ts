import { describe, expect, it } from "vitest";
import { desktopParallaxConfig, heroMotionLayers, landingHealthMetrics, landingOutcomes, landingWorkflow, sharedLandingModules, supportedPlatforms } from "./landingContent";
import { applyLandingParallaxToMontage, getLandingParallaxOffsets, shouldApplyLandingParallax } from "./landingMotion";

describe("approved landing content", () => {
  it("keeps every supported platform in the animated logo marquee", () => {
    expect(supportedPlatforms.map((platform) => platform.name)).toEqual([
      "Shopify", "WooCommerce", "BigCommerce", "Shopware", "Custom / Headless", "URL Analysis",
    ]);
  });

  it("keeps the mobile and desktop health-report data aligned", () => {
    expect(landingHealthMetrics.map((metric) => metric.value)).toEqual([94, 91, 88, 86, 92]);
    expect(landingOutcomes).toHaveLength(4);
    expect(landingWorkflow).toHaveLength(4);
  });

  it("defines the shared motion layers and desktop-only parallax constraints", () => {
    expect(heroMotionLayers).toEqual(["workspace", "browser", "phone", "insight", "impact", "badge", "connector"]);
    expect(desktopParallaxConfig).toEqual({ enabledAbovePx: 600, maxOffsetPx: 4, disabledWhenReducedMotion: true });
  });

  it("applies layered parallax only to desktop motion-enabled environments", () => {
    expect(shouldApplyLandingParallax({ viewportWidth: 1440, prefersReducedMotion: false })).toBe(true);
    expect(shouldApplyLandingParallax({ viewportWidth: 430, prefersReducedMotion: false })).toBe(false);
    expect(shouldApplyLandingParallax({ viewportWidth: 1440, prefersReducedMotion: true })).toBe(false);
    expect(getLandingParallaxOffsets(1, 0).phone).toEqual([4, -4]);
    expect(getLandingParallaxOffsets(1, 0).workspace).toEqual([1.6, -1.6]);
  });

  it("keeps a single full module contract for desktop and mobile reflow", () => {
    expect(sharedLandingModules).toEqual([
      "navigation", "hero-copy", "url-analyzer", "hero-montage", "platform-marquee", "outcomes",
      "issue-cards", "change-story", "ai-prompts", "evidence-cards", "redesign-comparison",
      "workflow", "health-report", "final-cta", "footer",
    ]);
  });

  it("applies the actual montage CSS variables only in the desktop component path", () => {
    const values = new Map<string, string>();
    const root = {
      querySelector: (selector: string) => ({ style: { setProperty: (name: string, value: string) => values.set(`${selector}:${name}`, value) } }),
    };
    expect(applyLandingParallaxToMontage(root, { viewportWidth: 1440, prefersReducedMotion: false }, 1, 0)).toBe(true);
    expect(values.get(".montage-phone:--parallax-x")).toBe("4px");
    expect(values.get(".montage-workspace:--parallax-y")).toBe("-1.6px");
    values.clear();
    expect(applyLandingParallaxToMontage(root, { viewportWidth: 430, prefersReducedMotion: false }, 1, 0)).toBe(false);
    expect(values.size).toBe(0);
    expect(applyLandingParallaxToMontage(root, { viewportWidth: 1440, prefersReducedMotion: true }, 1, 0)).toBe(false);
    expect(values.size).toBe(0);
  });
});
