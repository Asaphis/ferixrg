import { describe, expect, it } from "vitest";
import { BROWSER_SESSION_TTL_MS, REMEMBER_BRIDGE_TTL_MS, REMEMBERED_SESSION_TTL_MS, getLocalSessionTtl } from "./sessionPolicy";

describe("local session policy", () => {
  it("uses a short browser session when remember-me is unchecked", () => {
    expect(getLocalSessionTtl(false)).toBe(BROWSER_SESSION_TTL_MS);
    expect(BROWSER_SESSION_TTL_MS).toBe(1000 * 60 * 60 * 8);
  });

  it("uses the long-lived session only when remember-me is checked", () => {
    expect(getLocalSessionTtl(true)).toBe(REMEMBERED_SESSION_TTL_MS);
    expect(REMEMBERED_SESSION_TTL_MS).toBeGreaterThan(BROWSER_SESSION_TTL_MS);
  });

  it("keeps the two-step remember preference bridge short-lived", () => {
    expect(REMEMBER_BRIDGE_TTL_MS).toBe(1000 * 60 * 5);
  });
});
