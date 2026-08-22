import { describe, expect, it } from "vitest";
import { connectedStores, storeActivities, storePanelTools, storeQuickActions } from "./storeWorkspace";

describe("simple store workspace", () => {
  it("gives users connected stores with understandable work context", () => {
    expect(connectedStores).toHaveLength(3);
    expect(connectedStores[0]).toMatchObject({ platform: "Shopify", connection: "Connected", drafts: 2, openIssues: 3 });
  });

  it("provides immediate ways to start, continue, and connect storefront work", () => {
    expect(storeQuickActions.map(action => action.id)).toEqual(["scan", "evidence", "draft", "connect"]);
    expect(storeActivities.every(activity => activity.route.length > 0)).toBe(true);
  });

  it("offers evidence-first and connection-required tools inside each store workspace", () => {
    expect(storePanelTools.map(tool => tool.label)).toEqual(["Inspect", "Analyse", "Editor", "Issues", "Validate", "Publish"]);
    expect(storePanelTools.find(tool => tool.id === "inspect")?.sources).toContain("Existing evidence");
    expect(storePanelTools.find(tool => tool.id === "publish")).toMatchObject({ requiresConnection: true, sources: ["Connected store"] });
  });
});
