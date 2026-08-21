import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearStoreConnectionAuthorizationState, getStoreConnectionByAuthorizationState, recordWorkspaceActivity, setStoreConnectionCredential, setStoreConnectionStatus } from "../db";
import { registerStoreConnectionRoutes } from "./storeConnectionRoutes";

vi.mock("../db", () => ({
  clearStoreConnectionAuthorizationState: vi.fn(),
  getStoreConnectionByAuthorizationState: vi.fn(),
  recordWorkspaceActivity: vi.fn(),
  setStoreConnectionCredential: vi.fn(),
  setStoreConnectionStatus: vi.fn(),
}));

type Query = Record<string, string | string[] | undefined>;

type ResponseMock = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  redirect: ReturnType<typeof vi.fn>;
};

const row = {
  connection: { id: 10, storeId: 4, provider: "shopify" as const, scopes: ["read_products", "read_content"] },
  store: { workspaceId: 9 },
};

function signedQuery(overrides: Query = {}) {
  const query: Query = { code: "temporary-code", shop: "atelier.myshopify.com", state: "state-123", timestamp: "1710000000", ...overrides };
  const message = Object.entries(query)
    .filter(([key, value]) => key !== "hmac" && value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${encodeURIComponent(Array.isArray(value) ? value[0] : value ?? "")}`)
    .join("&");
  return "hmac" in overrides ? query : { ...query, hmac: createHmac("sha256", "shopify-secret").update(message).digest("hex") };
}

function routeHandler() {
  const routes: Record<string, (request: { query: Query }, response: ResponseMock) => Promise<void>> = {};
  registerStoreConnectionRoutes({ get: (path: string, handler: (request: { query: Query }, response: ResponseMock) => Promise<void>) => { routes[path] = handler; } } as never);
  return routes["/api/store-connections/shopify/callback"];
}

function responseMock(): ResponseMock {
  const response = {} as ResponseMock;
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  response.redirect = vi.fn().mockReturnValue(response);
  return response;
}

describe("Shopify store connection callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FERIXRG_APP_ORIGIN", "https://app.example.com");
    vi.stubEnv("SHOPIFY_CLIENT_ID", "shopify-client");
    vi.stubEnv("SHOPIFY_CLIENT_SECRET", "shopify-secret");
    vi.mocked(getStoreConnectionByAuthorizationState).mockResolvedValue(row as never);
    vi.mocked(setStoreConnectionStatus).mockResolvedValue(undefined as never);
    vi.mocked(clearStoreConnectionAuthorizationState).mockResolvedValue(undefined as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined as never);
    vi.mocked(setStoreConnectionCredential).mockResolvedValue(undefined as never);
  });

  it("rejects an unknown or expired one-time authorization state", async () => {
    vi.mocked(getStoreConnectionByAuthorizationState).mockResolvedValue(undefined);
    const response = responseMock();

    await routeHandler()({ query: signedQuery() }, response);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "The Shopify authorization state is invalid or expired." });
    expect(setStoreConnectionCredential).not.toHaveBeenCalled();
  });

  it("fails the connection and clears state when callback HMAC verification fails", async () => {
    const response = responseMock();

    await routeHandler()({ query: signedQuery({ hmac: "invalid" }) }, response);

    expect(setStoreConnectionStatus).toHaveBeenCalledWith({ storeId: 4, provider: "shopify", status: "failed", lastError: "Shopify callback HMAC verification failed." });
    expect(clearStoreConnectionAuthorizationState).toHaveBeenCalledWith(10);
    expect(response.redirect).toHaveBeenCalledWith(302, "https://app.example.com/app?store=4&connection=error");
    expect(setStoreConnectionCredential).not.toHaveBeenCalled();
  });

  it("fails closed when Shopify does not grant every requested scope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ access_token: "shpat-secret", scope: "read_products" }) }));
    const response = responseMock();

    await routeHandler()({ query: signedQuery() }, response);

    expect(setStoreConnectionStatus).toHaveBeenCalledWith(expect.objectContaining({ status: "failed", lastError: expect.stringContaining("read_content") }));
    expect(setStoreConnectionCredential).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(302, "https://app.example.com/app?store=4&connection=error");
    vi.unstubAllGlobals();
  });

  it("exchanges the code, stores only encrypted credential input, and marks the connection active", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ access_token: "shpat-secret", scope: "read_products,read_content", expires_in: 86400 }) }));
    const response = responseMock();

    await routeHandler()({ query: signedQuery() }, response);

    expect(fetch).toHaveBeenCalledWith("https://atelier.myshopify.com/admin/oauth/access_token", expect.objectContaining({ method: "POST" }));
    expect(setStoreConnectionCredential).toHaveBeenCalledWith(expect.objectContaining({ connectionId: 10, credential: JSON.stringify({ accessToken: "shpat-secret", refreshToken: null, expiresIn: 86400, shop: "atelier.myshopify.com", scopes: ["read_products", "read_content"] }) }));
    expect(setStoreConnectionStatus).toHaveBeenCalledWith({ storeId: 4, provider: "shopify", status: "connected", lastError: null });
    expect(clearStoreConnectionAuthorizationState).toHaveBeenCalledWith(10);
    expect(response.redirect).toHaveBeenCalledWith(302, "https://app.example.com/app?store=4&connection=connected");
    vi.unstubAllGlobals();
  });
});
