import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ManagedStoreProvider } from "./storeProviders";

export const SHOPIFY_DEFAULT_SCOPES = ["read_products", "read_content", "read_themes"] as const;
export const SHOPIFY_CALLBACK_PATH = "/api/store-connections/shopify/callback";

export function isValidShopifyDomain(value: string) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(value.trim());
}

export function normalizeShopifyDomain(value: string) {
  const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!isValidShopifyDomain(trimmed)) throw new Error("Use the store's *.myshopify.com domain for Shopify authorization.");
  return trimmed;
}

export function createShopifyOAuthState() {
  return randomBytes(32).toString("hex");
}

export function buildShopifyAuthorizationUrl(input: { storeUrl: string; clientId: string; redirectUri: string; scopes?: readonly string[]; state?: string }) {
  const shop = normalizeShopifyDomain(new URL(input.storeUrl).hostname);
  const state = input.state ?? createShopifyOAuthState();
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.search = new URLSearchParams({ client_id: input.clientId, scope: (input.scopes ?? SHOPIFY_DEFAULT_SCOPES).join(","), redirect_uri: input.redirectUri, state }).toString();
  return { shop, state, authorizationUrl: url.toString() };
}

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function verifyShopifyCallbackHmac(input: { query: Record<string, string | string[] | undefined>; clientSecret: string }) {
  const hmac = queryValue(input.query.hmac);
  if (!hmac) return false;
  const message = Object.entries(input.query)
    .filter(([key, value]) => key !== "hmac" && value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${encodeURIComponent(queryValue(value) ?? "")}`)
    .join("&");
  const expected = createHmac("sha256", input.clientSecret).update(message).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(hmac, "utf8");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function buildShopifyTokenExchangeRequest(input: { shop: string; code: string; clientId: string; clientSecret: string }) {
  const shop = normalizeShopifyDomain(input.shop);
  return {
    url: `https://${shop}/admin/oauth/access_token`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ client_id: input.clientId, client_secret: input.clientSecret, code: input.code }),
    } satisfies RequestInit,
  };
}

export function shopifyRedirectUri(appOrigin: string) {
  return new URL(SHOPIFY_CALLBACK_PATH, appOrigin).toString();
}

export function isManagedStoreProvider(value: string): value is ManagedStoreProvider {
  return value === "shopify" || value === "woocommerce" || value === "magento" || value === "custom";
}
