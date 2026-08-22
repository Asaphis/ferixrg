import { describe, expect, it } from "vitest";
import { approvedDashboard, approvedDashboardParity } from "./approvedDashboard";

describe("approved dashboard feature parity", () => {
  it("keeps all five Store Health category scores available to every layout", () => {
    expect(approvedDashboard.health.scores.map(score => score.label)).toEqual(approvedDashboardParity.requiredHealthLabels);
    expect(approvedDashboard.health.scores.map(score => score.value)).toEqual([94, 91, 88, 86, 92]);
  });

  it("provides the same task actions, store workflows, and release workflow to desktop and mobile", () => {
    expect(approvedDashboard.quickActions.map(action => action.label)).toEqual([
      "Analyze Store", "Connect Store", "AI Redesign", "Design Studio", "Responsive Test", "Create Report",
    ]);
    expect(approvedDashboard.primaryAction.actions.map(action => action.label)).toEqual(["Analyze store URL", "Connect Shopify"]);
    expect(approvedDashboard.publish).toMatchObject({ title: "Modern storefront redesign", status: "Approved design ready" });
    expect(approvedDashboard.publish.actions.map(action => action.label)).toEqual(["Preview", "Validate", "Publish"]);
    expect(approvedDashboard.publish.actions.find(action => action.label === "Validate")?.toolId).toBe("publish-readiness");
  });

  it("keeps every approved content module in the shared dashboard data source", () => {
    expect(approvedDashboardParity.requiredModules.every(module => module in approvedDashboard)).toBe(true);
    expect(approvedDashboardParity.mobileNavigation).toEqual(["Home", "Stores", "Analyze", "More"]);
  });
});
