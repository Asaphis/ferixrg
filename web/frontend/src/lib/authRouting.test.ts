import { describe, expect, it } from "vitest";
import { authPath, isDashboardPath, safeDashboardReturnPath } from "./authRouting";

describe("dashboard authentication routing", () => {
  it("accepts only dashboard paths as protected return destinations", () => {
    expect(isDashboardPath("/app")).toBe(true);
    expect(isDashboardPath("/app/tools")).toBe(true);
    expect(isDashboardPath("/auth/login")).toBe(false);
  });

  it("rejects external, public, and malformed return paths", () => {
    expect(safeDashboardReturnPath("https://unsafe.example")).toBe("/app");
    expect(safeDashboardReturnPath("//unsafe.example")).toBe("/app");
    expect(safeDashboardReturnPath("/auth/login")).toBe("/app");
    expect(safeDashboardReturnPath("/app/projects")).toBe("/app/projects");
  });

  it("preserves a safe requested dashboard destination through the login route", () => {
    expect(authPath("login", "/app/tools")).toBe("/auth/login?returnTo=%2Fapp%2Ftools");
  });
});
