import { describe, expect, it } from "vitest";
import { getSafeReturnPath, withAuthReturn } from "./authReturn";

describe("authentication return links", () => {
  it("accepts local supported workspace targets and preserves the selected tool", () => {
    const path = getSafeReturnPath("?returnTo=%2Fapp%2Ftools%3Ftool%3Dresponsive-redesign", "https://ferixrg.example");
    expect(path).toBe("/app/tools?tool=responsive-redesign");
    expect(withAuthReturn("login", path)).toBe("/auth/login?returnTo=%2Fapp%2Ftools%3Ftool%3Dresponsive-redesign");
  });

  it("rejects external and unsupported return paths", () => {
    expect(getSafeReturnPath("?returnTo=https%3A%2F%2Fevil.example%2Fapp", "https://ferixrg.example")).toBe("/app");
    expect(getSafeReturnPath("?returnTo=%2Fapp%2Fpublish", "https://ferixrg.example")).toBe("/app");
  });
});
