import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildShopifyAuthorizationUrl, buildShopifyTokenExchangeRequest, isValidShopifyDomain, normalizeShopifyDomain, shopifyRedirectUri, verifyShopifyCallbackHmac } from "./shopifyOAuth";

describe("Shopify OAuth helper", () => {
  it("accepts only valid myshopify.com domains", () => {
    expect(isValidShopifyDomain("atelier-forma.myshopify.com")).toBe(true);
    expect(isValidShopifyDomain("https://atelier-forma.myshopify.com")).toBe(false);
    expect(isValidShopifyDomain("atelier-forma.example.com")).toBe(false);
    expect(() => normalizeShopifyDomain("https://atelier-forma.example.com")).toThrow(/myshopify/i);
  });

  it("builds a state-bearing least-privilege authorization URL", () => {
    const result = buildShopifyAuthorizationUrl({ storeUrl: "https://atelier-forma.myshopify.com/", clientId: "client-id", redirectUri: "https://app.example.com/api/store-connections/shopify/callback", state: "state-123", scopes: ["read_products", "read_themes"] });
    expect(result).toMatchObject({ shop: "atelier-forma.myshopify.com", state: "state-123" });
    expect(result.authorizationUrl).toContain("/admin/oauth/authorize?");
    expect(result.authorizationUrl).toContain("client_id=client-id");
    expect(result.authorizationUrl).toContain("scope=read_products%2Cread_themes");
    expect(result.authorizationUrl).toContain("state=state-123");
  });

  it("verifies the callback HMAC without accepting a modified query", () => {
    const query = { code: "code-123", shop: "atelier-forma.myshopify.com", state: "state-123", timestamp: "1700000000" };
    const message = Object.entries(query).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
    const hmac = createHmac("sha256", "secret").update(message).digest("hex");
    expect(verifyShopifyCallbackHmac({ query: { ...query, hmac }, clientSecret: "secret" })).toBe(true);
    expect(verifyShopifyCallbackHmac({ query: { ...query, shop: "other.myshopify.com", hmac }, clientSecret: "secret" })).toBe(false);
  });

  it("constructs a server-side token exchange request and callback URI", async () => {
    const exchange = buildShopifyTokenExchangeRequest({ shop: "atelier-forma.myshopify.com", code: "code-123", clientId: "client-id", clientSecret: "client-secret" });
    expect(exchange.url).toBe("https://atelier-forma.myshopify.com/admin/oauth/access_token");
    expect(exchange.init.method).toBe("POST");
    expect(await new Response(exchange.init.body).text()).toContain("client_id=client-id");
    expect(shopifyRedirectUri("https://app.example.com")).toBe("https://app.example.com/api/store-connections/shopify/callback");
  });
});
