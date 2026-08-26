import { describe, expect, it } from "vitest";
import { resolveOAuthDashboardRedirect } from "./oauth";

describe("OAuth dashboard redirect", () => {
  it("uses the configured FerixRG application origin and a valid dashboard path", () => {
    expect(resolveOAuthDashboardRedirect("https://ferixrg.ferixas.com/", "https://ferixrgapi.ferixas.com", "/app/tools")).toBe("https://ferixrg.ferixas.com/app/tools");
  });

  it("fails closed to the dashboard root for invalid return destinations", () => {
    expect(resolveOAuthDashboardRedirect("https://ferixrg.ferixas.com", "https://ferixrgapi.ferixas.com", "https://unsafe.example")).toBe("https://ferixrg.ferixas.com/app");
  });
});
