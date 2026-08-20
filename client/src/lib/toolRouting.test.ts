import { describe, expect, it } from "vitest";
import { getToolRoute } from "./toolRouting";

describe("tool routing grammar", () => {
  it("routes visual and responsive tools to shared draft workspaces", () => {
    expect(getToolRoute("responsive-redesign")).toMatchObject({ workspace: "Responsive Studio", hasVisualEditor: true, allowsAi: true });
    expect(getToolRoute("product-composer")).toMatchObject({ workspace: "Layout Composer", hasVisualEditor: true });
    expect(getToolRoute("copy-clarity")).toMatchObject({ workspace: "Content Studio", hasVisualEditor: true });
  });

  it("does not route technical evidence tools into the generic visual editor", () => {
    expect(getToolRoute("performance-evidence")).toMatchObject({ workspace: "Optimization Workbench", hasVisualEditor: false });
    expect(getToolRoute("component-spec")).toMatchObject({ workspace: "Developer Handoff", hasVisualEditor: false, allowsAi: false });
    expect(getToolRoute("accessibility-surface")).toMatchObject({ workspace: "Developer Handoff", hasVisualEditor: false });
  });

  it("reserves release controls for release and validation workspaces", () => {
    expect(getToolRoute("publish-readiness")).toMatchObject({ workspace: "Release Review", supportsStoreRelease: true });
    expect(getToolRoute("store-publisher")).toMatchObject({ workspace: "Release Review", supportsStoreRelease: true });
    expect(getToolRoute("storefront-scan").supportsStoreRelease).toBe(false);
  });
});
