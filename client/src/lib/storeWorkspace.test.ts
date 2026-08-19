import { describe, expect, it } from "vitest";
import { connectedStores, storeActivities, storeQuickActions } from "./storeWorkspace";

describe("simple store workspace", () => {
  it("gives users connected stores with understandable work context", () => {
    expect(connectedStores).toHaveLength(3);
    expect(connectedStores[0]).toMatchObject({ platform: "Shopify", connection: "Connected", drafts: 2, openIssues: 3 });
  });

  it("provides immediate ways to start, continue, and connect storefront work", () => {
    expect(storeQuickActions.map(action => action.id)).toEqual(["scan", "evidence", "draft", "connect"]);
    expect(storeActivities.every(activity => activity.route.length > 0)).toBe(true);
  });
});
