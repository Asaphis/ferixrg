import type { Express, Request, Response } from "express";
import { buildShopifyTokenExchangeRequest, verifyShopifyCallbackHmac } from "../shopifyOAuth";
import { clearStoreConnectionAuthorizationState, getStoreConnectionByAuthorizationState, recordWorkspaceActivity, setStoreConnectionCredential, setStoreConnectionStatus } from "../db";

function queryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : typeof value === "string" ? value : undefined;
}

function redirectTarget(storeId: number, status: "connected" | "error") {
  const origin = process.env.FERIXRG_APP_ORIGIN;
  if (!origin) return undefined;
  const url = new URL("/app", origin);
  url.searchParams.set("store", String(storeId));
  url.searchParams.set("connection", status);
  return url.toString();
}

function scopeSatisfied(requested: string, granted: string[]) {
  return granted.includes(requested) || (requested.startsWith("read_") && granted.includes(`write_${requested.slice(5)}`));
}

async function failConnection(row: { connection: { id: number; storeId: number; provider: "shopify" | "woocommerce" | "magento" | "custom" }; store: { workspaceId: number } }, message: string, response: Response) {
  await setStoreConnectionStatus({ storeId: row.connection.storeId, provider: row.connection.provider, status: "failed", lastError: message });
  await clearStoreConnectionAuthorizationState(row.connection.id);
  await recordWorkspaceActivity({ workspaceId: row.store.workspaceId, eventType: "store.connection_failed", entityType: "store_connection", entityId: String(row.connection.id), details: { provider: row.connection.provider, reason: message } });
  const target = redirectTarget(row.connection.storeId, "error");
  if (target) response.redirect(302, target);
  else response.status(502).json({ error: "Store connection failed." });
}

export function registerStoreConnectionRoutes(app: Express) {
  app.get("/api/store-connections/shopify/callback", async (req: Request, res: Response) => {
    const state = queryValue(req.query.state);
    const code = queryValue(req.query.code);
    if (!state || !code) {
      res.status(400).json({ error: "Shopify callback code and state are required." });
      return;
    }
    try {
      const row = await getStoreConnectionByAuthorizationState("shopify", state);
      if (!row) {
        res.status(403).json({ error: "The Shopify authorization state is invalid or expired." });
        return;
      }
      const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
      const clientId = process.env.SHOPIFY_CLIENT_ID;
      if (!clientSecret || !clientId) {
        await failConnection(row, "Shopify OAuth credentials are not configured.", res);
        return;
      }
      const query = Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : typeof value === "string" ? value : undefined]));
      if (!verifyShopifyCallbackHmac({ query, clientSecret })) {
        await failConnection(row, "Shopify callback HMAC verification failed.", res);
        return;
      }
      const shop = queryValue(req.query.shop);
      if (!shop) {
        await failConnection(row, "Shopify callback did not include a shop domain.", res);
        return;
      }
      const exchange = buildShopifyTokenExchangeRequest({ shop, code, clientId, clientSecret });
      const tokenResponse = await fetch(exchange.url, { ...exchange.init, signal: AbortSignal.timeout(30_000) });
      if (!tokenResponse.ok) {
        await failConnection(row, `Shopify token exchange returned HTTP ${tokenResponse.status}.`, res);
        return;
      }
      const payload = await tokenResponse.json() as { access_token?: unknown; scope?: unknown; refresh_token?: unknown; expires_in?: unknown };
      if (typeof payload.access_token !== "string" || !payload.access_token) {
        await failConnection(row, "Shopify token exchange did not return an access token.", res);
        return;
      }
      const grantedScopes = typeof payload.scope === "string" ? payload.scope.split(",").map(scope => scope.trim()).filter(Boolean) : [];
      const requestedScopes = Array.isArray(row.connection.scopes) ? row.connection.scopes.filter((scope): scope is string => typeof scope === "string") : [];
      const missingScopes = requestedScopes.filter(scope => !scopeSatisfied(scope, grantedScopes));
      if (missingScopes.length) {
        await failConnection(row, `Shopify did not grant the requested scopes: ${missingScopes.join(", ")}.`, res);
        return;
      }
      await setStoreConnectionCredential({ connectionId: row.connection.id, credential: JSON.stringify({ accessToken: payload.access_token, refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : null, expiresIn: typeof payload.expires_in === "number" ? payload.expires_in : null, shop, scopes: grantedScopes }) });
      await setStoreConnectionStatus({ storeId: row.connection.storeId, provider: "shopify", status: "connected", lastError: null });
      await clearStoreConnectionAuthorizationState(row.connection.id);
      await recordWorkspaceActivity({ workspaceId: row.store.workspaceId, eventType: "store.connection_completed", entityType: "store_connection", entityId: String(row.connection.id), details: { provider: "shopify", storeId: row.connection.storeId, scopes: grantedScopes } });
      const target = redirectTarget(row.connection.storeId, "connected");
      if (target) res.redirect(302, target);
      else res.status(200).json({ connected: true, storeId: row.connection.storeId });
    } catch (error) {
      console.error("[StoreConnection] Shopify callback failed", error);
      res.status(502).json({ error: "The Shopify authorization callback could not be completed." });
    }
  });
}
