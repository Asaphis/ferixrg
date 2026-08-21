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

export type StoreProviderAdapter = {
  provider: ManagedStoreProvider;
  readiness(): ProviderReadiness;
  beginAuthorization(input: { storeUrl: string; requestedScopes: string[] }): { status: "not_configured"; message: string };
  executeRelease(input: { action: "publish" | "rollback"; storeUrl: string }): { providerReference: string };
};

function unsupportedRelease(provider: ManagedStoreProvider): never {
  throw new Error(`${provider} publish and rollback execution is not configured. FerixRG can retain an approved release plan but cannot perform a provider-side change until its secure adapter is implemented and configured.`);
}

function adapter(readiness: () => ProviderReadiness): StoreProviderAdapter {
  const current = readiness();
  return {
    provider: current.provider,
    readiness,
    beginAuthorization: () => ({ status: "not_configured", message: current.message }),
    executeRelease: ({ action }) => unsupportedRelease(current.provider),
  };
}

const adapters: Record<ManagedStoreProvider, StoreProviderAdapter> = {
  shopify: adapter(() => ({
    provider: "shopify",
    configured: Boolean(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET && process.env.FERIXRG_APP_ORIGIN),
    authorizationMode: "oauth_redirect",
    requiredEnvironment: ["SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET", "FERIXRG_APP_ORIGIN", "STORE_CONNECTION_ENCRYPTION_KEY"],
    requiredMerchantSetup: ["Create or configure the Shopify app", "Register the exact HTTPS OAuth callback URL", "Approve least-privilege Admin API scopes"],
    supportsPublish: false,
    supportsRollback: false,
    message: "Shopify connection setup is not enabled until the server-side OAuth callback, encrypted token storage, and provider executor are configured.",
  })),
  woocommerce: adapter(() => ({
    provider: "woocommerce",
    configured: false,
    authorizationMode: "merchant_key",
    requiredEnvironment: ["FERIXRG_APP_ORIGIN", "STORE_CONNECTION_ENCRYPTION_KEY"],
    requiredMerchantSetup: ["Enable the WooCommerce REST API", "Use HTTPS", "Approve the WooCommerce application authorization flow or create a least-privilege key"],
    supportsPublish: false,
    supportsRollback: false,
    message: "WooCommerce connection setup requires a secure HTTPS callback and encrypted server-side credential storage before it can be enabled.",
  })),
  magento: adapter(() => ({
    provider: "magento",
    configured: false,
    authorizationMode: "admin_integration",
    requiredEnvironment: ["FERIXRG_APP_ORIGIN", "STORE_CONNECTION_ENCRYPTION_KEY"],
    requiredMerchantSetup: ["Create an Adobe Commerce integration", "Limit integration ACL resources", "Activate OAuth credentials through the merchant Admin"],
    supportsPublish: false,
    supportsRollback: false,
    message: "Adobe Commerce/Magento connection setup requires an approved Admin integration and encrypted server-side credential storage before it can be enabled.",
  })),
  custom: adapter(() => ({
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
