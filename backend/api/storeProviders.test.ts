import { describe, expect, it } from "vitest";
import { getStoreProviderAdapter, listStoreProviderReadiness } from "./storeProviders";

describe("store provider adapter boundary", () => {
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
});
