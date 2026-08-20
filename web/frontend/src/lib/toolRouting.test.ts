import { describe, expect, it } from "vitest";
import { getToolRoute } from "./toolRouting";

describe("tool routing grammar", () => {
  it("routes visual and responsive tools to shared draft workspaces", () => {
    expect(getToolRoute("responsive-analyzer")).toMatchObject({ workspace: "Responsive Studio", hasVisualEditor: true, allowsAi: true });
    expect(getToolRoute("product-page-analyzer")).toMatchObject({ workspace: "Layout Composer", hasVisualEditor: true });
    expect(getToolRoute("ai-content-improver")).toMatchObject({ workspace: "Content Studio", hasVisualEditor: true });
  });

  it("does not route technical evidence tools into the generic visual editor", () => {
    expect(getToolRoute("performance-analyzer")).toMatchObject({ workspace: "Optimization Workbench", hasVisualEditor: false });
    expect(getToolRoute("theme-code-analyzer")).toMatchObject({ workspace: "Developer Handoff", hasVisualEditor: false, allowsAi: false });
    expect(getToolRoute("accessibility-analyzer")).toMatchObject({ workspace: "Developer Handoff", hasVisualEditor: false });
  });

  it("reserves release controls for release and validation workspaces", () => {
    expect(getToolRoute("publish-readiness-checker")).toMatchObject({ workspace: "Release Review", supportsStoreRelease: true });
    expect(getToolRoute("publish-manager")).toMatchObject({ workspace: "Release Review", supportsStoreRelease: true });
    expect(getToolRoute("storefront-analyzer").supportsStoreRelease).toBe(false);
  });
});
