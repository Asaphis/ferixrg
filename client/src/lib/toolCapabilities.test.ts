import { describe, expect, it } from "vitest";
import { getRunCapability } from "./toolCapabilities";
import { getToolRoute } from "./toolRouting";

describe("tool run capabilities", () => {
  it("keeps public URL analysis within explorer capabilities", () => {
    const capability = getRunCapability("Public URL", getToolRoute("responsive-redesign"));
    expect(capability).toMatchObject({ mode: "Explorer" });
    expect(capability.actions).toEqual(expect.arrayContaining(["ask_ai", "create_proposal", "save_project", "export_report"]));
    expect(capability.actions).not.toContain("publish");
  });

  it("adds release capabilities only for connected eligible tools", () => {
    const capability = getRunCapability("Connected store", getToolRoute("store-publisher"));
    expect(capability).toMatchObject({ mode: "Connected-store user" });
    expect(capability.actions).toEqual(expect.arrayContaining(["create_store_draft", "validate", "publish"]));
    expect(getRunCapability("Connected store", getToolRoute("checkout-friction")).actions).not.toContain("publish");
  });

  it("uses project and developer boundaries for drafts and theme files", () => {
    expect(getRunCapability("Saved draft", getToolRoute("variant-compare")).mode).toBe("Project user");
    const developer = getRunCapability("Theme files", getToolRoute("theme-patch"));
    expect(developer).toMatchObject({ mode: "Developer / agency" });
    expect(developer.actions).toContain("developer_handoff");
    expect(developer.actions).not.toContain("publish");
  });
});
