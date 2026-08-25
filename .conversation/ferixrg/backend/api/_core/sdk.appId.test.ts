import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("session application boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("JWT_SECRET", "sdk-app-id-test-secret");
    vi.stubEnv("FERIXRG_APP_ID", "ferixrg-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a validly signed session issued for another application", async () => {
    const { sdk } = await import("./sdk");
    const token = await new SignJWT({ openId: "user-1", appId: "different-app", name: "Other app user" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("sdk-app-id-test-secret"));

    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });

  it("accepts a session token issued for this application", async () => {
    const { sdk } = await import("./sdk");
    const token = await sdk.createSessionToken("user-1", { name: "FerixRG user" });

    await expect(sdk.verifySession(token)).resolves.toMatchObject({ openId: "user-1", appId: "ferixrg-test", name: "FerixRG user" });
  });
});
