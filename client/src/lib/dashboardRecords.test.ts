import { describe, expect, it } from "vitest";
import { dashboardQuickActions, dashboardRecords } from "./dashboardRecords";

describe("project activity dashboard records", () => {
  it("surfaces the full work record rather than only aggregate scores", () => {
    expect(dashboardRecords.queue.map(record => record.state)).toEqual(["Found", "Drafting", "Implemented"]);
    expect(dashboardRecords.drafts).toHaveLength(3);
    expect(dashboardRecords.recentTools.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps direct entry points available for public, evidence, platform, theme, and release workflows", () => {
    expect(dashboardQuickActions.map(action => action.cue)).toEqual(expect.arrayContaining(["url", "evidence", "draft", "shopify", "theme", "publish"]));
    expect(dashboardQuickActions.every(action => action.route.length > 0)).toBe(true);
  });
});
