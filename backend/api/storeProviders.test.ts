import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoreProviderAdapter, listStoreProviderReadiness } from "./storeProviders";

describe("store provider adapter boundary", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("reports an explicit configuration boundary for every supported provider without exposing credentials", () => {
    const readiness = listStoreProviderReadiness();
    expect(readiness.map(item => item.provider)).toEqual(["shopify", "woocommerce", "magento", "custom"]);
    expect(readiness.every(item => item.message.length > 0 && item.requiredEnvironment.length > 0)).toBe(true);
    expect(readiness.every(item => item.supportsPublish === false && item.supportsRollback === false)).toBe(true);
  });

  it("refuses to represent a disabled provider as an authorization or release execution", () => {
    const adapter = getStoreProviderAdapter("woocommerce");
    expect(adapter.beginAuthorization({ storeUrl: "https://example.test", requestedScopes: ["read"] })).toMatchObject({ status: "not_configured" });
    expect(() => adapter.executeRelease({ action: "publish", storeUrl: "https://example.test" })).toThrow(/not configured/i);
  });

  it("builds a Shopify authorization URL only when all server-side prerequisites are configured", () => {
    vi.stubEnv("SHOPIFY_CLIENT_ID", "client-id");
    vi.stubEnv("SHOPIFY_CLIENT_SECRET", "client-secret");
    vi.stubEnv("FERIXRG_APP_ORIGIN", "https://app.example.com");
    vi.stubEnv("STORE_CONNECTION_ENCRYPTION_KEY", Buffer.alloc(32, 3).toString("base64"));
    const authorization = getStoreProviderAdapter("shopify").beginAuthorization({ storeUrl: "https://atelier-forma.myshopify.com", requestedScopes: ["read_products"] });
    expect(authorization.status).toBe("authorization_required");
    if (authorization.status === "authorization_required") {
      expect(authorization.authorizationUrl).toContain("atelier-forma.myshopify.com/admin/oauth/authorize");
      expect(authorization.state).toHaveLength(64);
    }
  });
});
