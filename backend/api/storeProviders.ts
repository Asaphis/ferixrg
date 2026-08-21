import { buildShopifyAuthorizationUrl, SHOPIFY_CALLBACK_PATH, SHOPIFY_DEFAULT_SCOPES, shopifyRedirectUri } from "./shopifyOAuth";

export type ManagedStoreProvider = "shopify" | "woocommerce" | "magento" | "custom";
export type ProviderReadiness = {
  provider: ManagedStoreProvider;
  configured: boolean;
  authorizationMode: "oauth_redirect" | "merchant_key" | "admin_integration" | "custom";
  requiredEnvironment: string[];
  requiredMerchantSetup: string[];
  supportsPublish: boolean;
  supportsRollback: boolean;
  message: string;
};
export type ProviderAuthorization = { status: "not_configured"; message: string } | { status: "authorization_required"; authorizationUrl: string; state: string; message: string };
export type StoreProviderAdapter = {
  provider: ManagedStoreProvider;
  readiness(): ProviderReadiness;
  beginAuthorization(input: { storeUrl: string; requestedScopes: string[] }): ProviderAuthorization;
  executeRelease(input: { action: "publish" | "rollback"; storeUrl: string }): { providerReference: string };
};

function unsupportedRelease(provider: ManagedStoreProvider): never {
  throw new Error(`${provider} publish and rollback execution is not configured. FerixRG can retain an approved release plan but cannot perform a provider-side change until its secure adapter is implemented and configured.`);
}

function adapter(provider: ManagedStoreProvider, readiness: () => ProviderReadiness): StoreProviderAdapter {
  return {
    provider,
    readiness,
    beginAuthorization: input => {
      const current = readiness();
      if (!current.configured) return { status: "not_configured", message: current.message };
      if (provider !== "shopify") return { status: "not_configured", message: current.message };
      const clientId = process.env.SHOPIFY_CLIENT_ID;
      const appOrigin = process.env.FERIXRG_APP_ORIGIN;
      if (!clientId || !appOrigin) return { status: "not_configured", message: current.message };
      const redirectUri = process.env.SHOPIFY_REDIRECT_URI || shopifyRedirectUri(appOrigin);
      const authorization = buildShopifyAuthorizationUrl({ storeUrl: input.storeUrl, clientId, redirectUri, scopes: input.requestedScopes.length ? input.requestedScopes : SHOPIFY_DEFAULT_SCOPES });
      return { status: "authorization_required", authorizationUrl: authorization.authorizationUrl, state: authorization.state, message: "Redirect the merchant to Shopify to approve the requested least-privilege scopes." };
    },
    executeRelease: () => unsupportedRelease(provider),
  };
}

const adapters: Record<ManagedStoreProvider, StoreProviderAdapter> = {
  shopify: adapter("shopify", () => ({
    provider: "shopify",
    configured: Boolean(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET && process.env.FERIXRG_APP_ORIGIN && process.env.STORE_CONNECTION_ENCRYPTION_KEY),
    authorizationMode: "oauth_redirect",
    requiredEnvironment: ["SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET", "FERIXRG_APP_ORIGIN", "STORE_CONNECTION_ENCRYPTION_KEY"],
    requiredMerchantSetup: ["Create or configure the Shopify app", `Register the exact HTTPS callback URL (${SHOPIFY_CALLBACK_PATH})`, "Approve least-privilege Admin API scopes"],
    supportsPublish: false,
    supportsRollback: false,
    message: "Shopify connection setup is not enabled until the server-side OAuth callback, encrypted token storage, and provider executor are configured.",
  })),
  woocommerce: adapter("woocommerce", () => ({
    provider: "woocommerce",
    configured: false,
    authorizationMode: "merchant_key",
    requiredEnvironment: ["FERIXRG_APP_ORIGIN", "STORE_CONNECTION_ENCRYPTION_KEY"],
    requiredMerchantSetup: ["Enable the WooCommerce REST API", "Use HTTPS", "Approve the WooCommerce application authorization flow or create a least-privilege key"],
    supportsPublish: false,
    supportsRollback: false,
    message: "WooCommerce connection setup requires a secure HTTPS callback and encrypted server-side credential storage before it can be enabled.",
  })),
  magento: adapter("magento", () => ({
    provider: "magento",
    configured: false,
    authorizationMode: "admin_integration",
    requiredEnvironment: ["FERIXRG_APP_ORIGIN", "STORE_CONNECTION_ENCRYPTION_KEY"],
    requiredMerchantSetup: ["Create an Adobe Commerce integration", "Limit integration ACL resources", "Activate OAuth credentials through the merchant Admin"],
    supportsPublish: false,
    supportsRollback: false,
    message: "Adobe Commerce/Magento connection setup requires an approved Admin integration and encrypted server-side credential storage before it can be enabled.",
  })),
  custom: adapter("custom", () => ({
    provider: "custom",
    configured: false,
    authorizationMode: "custom",
    requiredEnvironment: ["CUSTOM_STORE_ADAPTER_URL", "CUSTOM_STORE_ADAPTER_TOKEN"],
    requiredMerchantSetup: ["Provide a documented server-to-server adapter", "Define least-privilege scopes and rollback behavior"],
    supportsPublish: false,
    supportsRollback: false,
    message: "Custom store connections require a reviewed server-to-server adapter contract before they can be enabled.",
  })),
};

export function getStoreProviderAdapter(provider: ManagedStoreProvider) {
  return adapters[provider];
}

export function listStoreProviderReadiness() {
  return (Object.keys(adapters) as ManagedStoreProvider[]).map(provider => adapters[provider].readiness());
}
