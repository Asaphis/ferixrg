export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
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
};
