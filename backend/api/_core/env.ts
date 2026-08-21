export const ENV = {
  // Local-account sessions still carry an app identifier for compatibility
  // with the shared session verifier. The previous VITE_APP_ID-only lookup
  // was empty in production, making every newly issued session invalid.
  appId: process.env.FERIXRG_APP_ID ?? process.env.VITE_APP_ID ?? "ferixrg",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  cloudflareAccountId: process.env.CF_ACCOUNT_ID ?? "",
  cloudflareApiToken: process.env.CF_API_TOKEN ?? "",
  cloudflareAiModel: process.env.CF_AI_MODEL ?? "",
  totpEncryptionKey: process.env.TOTP_ENCRYPTION_KEY ?? "",
  storeConnectionEncryptionKey: process.env.STORE_CONNECTION_ENCRYPTION_KEY ?? "",
  shopifyClientId: process.env.SHOPIFY_CLIENT_ID ?? "",
  shopifyClientSecret: process.env.SHOPIFY_CLIENT_SECRET ?? "",
  shopifyRedirectUri: process.env.SHOPIFY_REDIRECT_URI ?? "",
};

export function assertProductionConfiguration() {
  if (!ENV.isProduction) return;
  const missing = [
    ["DATABASE_URL", ENV.databaseUrl],
    ["JWT_SECRET", ENV.cookieSecret],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
}

