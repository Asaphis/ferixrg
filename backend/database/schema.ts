import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role", { enum: ["user", "admin"] as const }).default("user").notNull(),
  accountStatus: text("accountStatus", { enum: ["active", "pending_verification", "suspended"] as const }).default("pending_verification").notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const authIdentities = pgTable(
  "authIdentities",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["email", "google", "manus"] as const }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 320 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    providerAccountUnique: uniqueIndex("auth_identities_provider_account_unique").on(table.provider, table.providerAccountId),
    userIndex: index("auth_identities_user_index").on(table.userId),
  }),
);

export const accountTokens = pgTable(
  "accountTokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose", { enum: ["email_verification", "password_reset", "session"] as const }).notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userPurposeIndex: index("account_tokens_user_purpose_index").on(table.userId, table.purpose),
  }),
);

export const userPreferences = pgTable(
  "userPreferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    defaultPreview: text("defaultPreview", { enum: ["desktop", "tablet", "mobile"] as const }).default("mobile").notNull(),
    analysisReadyNotifications: integer("analysisReadyNotifications").default(1).notNull(),
    draftReviewNotifications: integer("draftReviewNotifications").default(1).notNull(),
    publishingReadinessNotifications: integer("publishingReadinessNotifications").default(1).notNull(),
    releaseNotes: integer("releaseNotes").default(1).notNull(),
    productResearch: integer("productResearch").default(0).notNull(),
    reduceMotion: integer("reduceMotion").default(0).notNull(),
    increaseContrast: integer("increaseContrast").default(0).notNull(),
    visibleKeyboardFocus: integer("visibleKeyboardFocus").default(1).notNull(),
    twoStepVerification: integer("twoStepVerification").default(0).notNull(),
    securityAlerts: integer("securityAlerts").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    userUnique: uniqueIndex("user_preferences_user_unique").on(table.userId),
  }),
);

export const accountEmailChanges = pgTable(
  "accountEmailChanges",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    newEmail: varchar("newEmail", { length: 320 }).notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userUnique: uniqueIndex("account_email_changes_user_unique").on(table.userId),
  }),
);

export const twoStepAuthenticators = pgTable(
  "twoStepAuthenticators",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    encryptedSecret: text("encryptedSecret").notNull(),
    keyVersion: varchar("keyVersion", { length: 64 }).notNull(),
    enabledAt: timestamp("enabledAt"),
    lastVerifiedAt: timestamp("lastVerifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({ userUnique: uniqueIndex("two_step_authenticators_user_unique").on(table.userId) }),
);

export const twoStepRecoveryCodes = pgTable(
  "twoStepRecoveryCodes",
  {
    id: serial("id").primaryKey(),
    authenticatorId: integer("authenticatorId").notNull().references(() => twoStepAuthenticators.id, { onDelete: "cascade" }),
    codeHash: varchar("codeHash", { length: 128 }).notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ authenticatorIndex: index("two_step_recovery_codes_authenticator_index").on(table.authenticatorId), codeUnique: uniqueIndex("two_step_recovery_codes_hash_unique").on(table.codeHash) }),
);

export const twoStepLoginChallenges = pgTable(
  "twoStepLoginChallenges",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ userExpiryIndex: index("two_step_login_challenges_user_expiry_index").on(table.userId, table.expiresAt) }),
);

export const accountSecurityEvents = pgTable(
  "accountSecurityEvents",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventType: varchar("eventType", { length: 96 }).notNull(),
    deliveryState: text("deliveryState", { enum: ["not_requested", "not_configured", "sent", "failed"] as const }).default("not_requested").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ userCreatedIndex: index("account_security_events_user_created_index").on(table.userId, table.createdAt) }),
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    ownerUserId: integer("ownerUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    plan: text("plan", { enum: ["free", "starter", "growth", "enterprise"] as const }).default("free").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("workspaces_slug_unique").on(table.slug),
    ownerIndex: index("workspaces_owner_index").on(table.ownerUserId),
  }),
);

export const workspaceMembers = pgTable(
  "workspaceMembers",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "editor", "viewer", "billing"] as const }).notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => ({
    workspaceUserUnique: uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    userIndex: index("workspace_members_user_index").on(table.userId),
  }),
);

export const workspaceInvitations = pgTable(
  "workspaceInvitations",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    invitedByUserId: integer("invitedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: text("role", { enum: ["admin", "editor", "viewer", "billing"] as const }).notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    status: text("status", { enum: ["pending", "accepted", "cancelled", "expired"] as const }).default("pending").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
  },
  table => ({
    workspaceStatusIndex: index("workspace_invitations_workspace_status_index").on(table.workspaceId, table.status),
  }),
);

export const stores = pgTable(
  "stores",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    platform: text("platform", { enum: ["shopify", "woocommerce", "magento", "custom", "public_url"] as const }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    status: text("status", { enum: ["draft", "connected", "attention", "disconnected"] as const }).default("draft").notNull(),
    healthScore: integer("healthScore"),
    createdByUserId: integer("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    workspaceIndex: index("stores_workspace_index").on(table.workspaceId),
  }),
);

export const storeConnections = pgTable(
  "storeConnections",
  {
    id: serial("id").primaryKey(),
    storeId: integer("storeId").notNull().references(() => stores.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["shopify", "woocommerce", "magento", "custom"] as const }).notNull(),
    credentialReference: varchar("credentialReference", { length: 512 }),
    authorizationState: varchar("authorizationState", { length: 128 }),
    authorizationStateExpiresAt: timestamp("authorizationStateExpiresAt"),
    scopes: jsonb("scopes"),
    status: text("status", { enum: ["pending", "connected", "expired", "revoked", "failed"] as const }).default("pending").notNull(),
    lastCheckedAt: timestamp("lastCheckedAt"),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    storeProviderUnique: uniqueIndex("store_connections_store_provider_unique").on(table.storeId, table.provider),
  }),
);

export const connectionSecrets = pgTable(
  "connectionSecrets",
  {
    id: serial("id").primaryKey(),
    connectionId: integer("connectionId").notNull().references(() => storeConnections.id, { onDelete: "cascade" }),
    encryptedCredential: text("encryptedCredential").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    connectionUnique: uniqueIndex("connection_secrets_connection_unique").on(table.connectionId),
  }),
);

export const storeSnapshots = pgTable(
  "storeSnapshots",
  {
    id: serial("id").primaryKey(),
    storeId: integer("storeId").notNull().references(() => stores.id, { onDelete: "cascade" }),
    sourceType: text("sourceType", { enum: ["url_scan", "store_api", "screenshot", "theme_export", "manual_upload"] as const }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    storageKey: varchar("storageKey", { length: 512 }),
    summary: text("summary"),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  },
  table => ({
    storeCapturedIndex: index("store_snapshots_store_captured_index").on(table.storeId, table.capturedAt),
  }),
);

export const drafts = pgTable(
  "drafts",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: integer("storeId").references(() => stores.id, { onDelete: "set null" }),
    title: varchar("title", { length: 160 }).notNull(),
    source: text("source", { enum: ["manual", "tool", "ai", "import"] as const }).default("manual").notNull(),
    status: text("status", { enum: ["draft", "review", "validated", "published", "archived"] as const }).default("draft").notNull(),
    createdByUserId: integer("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    currentVersionId: integer("currentVersionId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    workspaceIndex: index("drafts_workspace_index").on(table.workspaceId),
    storeIndex: index("drafts_store_index").on(table.storeId),
  }),
);

export const draftVersions = pgTable(
  "draftVersions",
  {
    id: serial("id").primaryKey(),
    draftId: integer("draftId").notNull().references(() => drafts.id, { onDelete: "cascade" }),
    versionNumber: integer("versionNumber").notNull(),
    createdByUserId: integer("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdByType: text("createdByType", { enum: ["user", "ai", "system"] as const }).default("user").notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    note: text("note"),
    designState: text("designState").notNull(),
    previewStorageKey: varchar("previewStorageKey", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    draftVersionUnique: uniqueIndex("draft_versions_draft_number_unique").on(table.draftId, table.versionNumber),
  }),
);

export const draftAssets = pgTable(
  "draftAssets",
  {
    id: serial("id").primaryKey(),
    draftId: integer("draftId").notNull().references(() => drafts.id, { onDelete: "cascade" }),
    draftVersionId: integer("draftVersionId").references(() => draftVersions.id, { onDelete: "set null" }),
    kind: text("kind", { enum: ["reference", "screenshot", "theme_export", "preview", "manual_upload"] as const }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    createdByUserId: integer("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    draftIndex: index("draft_assets_draft_index").on(table.draftId),
    versionIndex: index("draft_assets_version_index").on(table.draftVersionId),
  }),
);

export const toolRuns = pgTable(
  "toolRuns",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: integer("storeId").references(() => stores.id, { onDelete: "set null" }),
    draftId: integer("draftId").references(() => drafts.id, { onDelete: "set null" }),
    toolId: varchar("toolId", { length: 160 }).notNull(),
    status: text("status", { enum: ["queued", "running", "completed", "failed", "cancelled"] as const }).default("queued").notNull(),
    sourceType: text("sourceType", { enum: ["public_url", "connected_store", "saved_draft", "upload", "manual"] as const }).notNull(),
    requestedByUserId: integer("requestedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    inputSummary: jsonb("inputSummary"),
    resultSummary: jsonb("resultSummary"),
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceCreatedIndex: index("tool_runs_workspace_created_index").on(table.workspaceId, table.createdAt),
    statusIndex: index("tool_runs_status_index").on(table.status),
  }),
);

export const evidenceItems = pgTable(
  "evidenceItems",
  {
    id: serial("id").primaryKey(),
    toolRunId: integer("toolRunId").notNull().references(() => toolRuns.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["page_capture", "screenshot", "metric", "store_data", "validation", "provider_summary"] as const }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    storageKey: varchar("storageKey", { length: 512 }),
    details: jsonb("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    toolRunIndex: index("evidence_items_tool_run_index").on(table.toolRunId),
  }),
);

export const issueRecords = pgTable(
  "issueRecords",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: integer("storeId").references(() => stores.id, { onDelete: "set null" }),
    toolRunId: integer("toolRunId").references(() => toolRuns.id, { onDelete: "set null" }),
    draftId: integer("draftId").references(() => drafts.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] as const }).notNull(),
    status: text("status", { enum: ["open", "in_progress", "resolved", "ignored"] as const }).default("open").notNull(),
    location: varchar("location", { length: 1024 }),
    details: jsonb("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    workspaceStatusIndex: index("issue_records_workspace_status_index").on(table.workspaceId, table.status),
    toolRunIndex: index("issue_records_tool_run_index").on(table.toolRunId),
  }),
);

export const developerHandoffs = pgTable(
  "developerHandoffs",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    toolRunId: integer("toolRunId").references(() => toolRuns.id, { onDelete: "set null" }),
    issueId: integer("issueId").references(() => issueRecords.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    affectedLocation: varchar("affectedLocation", { length: 1024 }).notNull(),
    currentBehavior: text("currentBehavior").notNull(),
    expectedBehavior: text("expectedBehavior").notNull(),
    recommendedImplementation: text("recommendedImplementation").notNull(),
    priority: text("priority", { enum: ["critical", "high", "medium", "low"] as const }).notNull(),
    acceptanceCriteria: jsonb("acceptanceCriteria").notNull(),
    evidenceIds: jsonb("evidenceIds"),
    createdByUserId: integer("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceIndex: index("developer_handoffs_workspace_index").on(table.workspaceId),
    toolRunIndex: index("developer_handoffs_tool_run_index").on(table.toolRunId),
  }),
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    toolRunId: integer("toolRunId").references(() => toolRuns.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    format: text("format", { enum: ["web", "pdf", "csv", "json", "zip"] as const }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    summary: text("summary"),
    createdByUserId: integer("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceIndex: index("reports_workspace_index").on(table.workspaceId),
  }),
);

export const validationRuns = pgTable(
  "validationRuns",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    draftVersionId: integer("draftVersionId").notNull().references(() => draftVersions.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["queued", "running", "passed", "failed"] as const }).default("queued").notNull(),
    summary: jsonb("summary"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceIndex: index("validation_runs_workspace_index").on(table.workspaceId),
  }),
);

export const releaseActions = pgTable(
  "releaseActions",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: integer("storeId").references(() => stores.id, { onDelete: "set null" }),
    draftVersionId: integer("draftVersionId").references(() => draftVersions.id, { onDelete: "set null" }),
    requestedByUserId: integer("requestedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    actionType: text("actionType", { enum: ["export", "publish", "rollback"] as const }).notNull(),
    status: text("status", { enum: ["pending", "approved", "processing", "published", "exported", "reverted", "failed", "cancelled"] as const }).default("pending").notNull(),
    providerReference: varchar("providerReference", { length: 512 }),
    errorMessage: text("errorMessage"),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => ({
    workspaceIndex: index("release_actions_workspace_index").on(table.workspaceId),
  }),
);

export const activityEvents = pgTable(
  "activityEvents",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    actorUserId: integer("actorUserId").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("eventType", { length: 128 }).notNull(),
    entityType: varchar("entityType", { length: 128 }).notNull(),
    entityId: varchar("entityId", { length: 128 }),
    details: jsonb("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceCreatedIndex: index("activity_events_workspace_created_index").on(table.workspaceId, table.createdAt),
  }),
);

export const usageLedger = pgTable(
  "usageLedger",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
    category: text("category", { enum: ["tool_run", "ai", "storage", "export", "publish"] as const }).notNull(),
    quantity: integer("quantity").notNull(),
    unit: varchar("unit", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 128 }),
    referenceType: varchar("referenceType", { length: 128 }),
    referenceId: varchar("referenceId", { length: 128 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceCreatedIndex: index("usage_ledger_workspace_created_index").on(table.workspaceId, table.createdAt),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 128 }),
    providerCustomerReference: varchar("providerCustomerReference", { length: 512 }),
    providerSubscriptionReference: varchar("providerSubscriptionReference", { length: 512 }),
    plan: text("plan", { enum: ["free", "starter", "growth", "enterprise"] as const }).default("free").notNull(),
    status: text("status", { enum: ["trialing", "active", "past_due", "cancelled", "expired"] as const }).default("active").notNull(),
    currentPeriodStart: timestamp("currentPeriodStart"),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    workspaceUnique: uniqueIndex("subscriptions_workspace_unique").on(table.workspaceId),
  }),
);

export const workspaceRequests = pgTable(
  "workspaceRequests",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspaceId").references(() => workspaces.id, { onDelete: "set null" }),
    submittedByUserId: integer("submittedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    type: text("type", { enum: ["platform_request", "support", "problem", "feedback", "feature_request"] as const }).notNull(),
    status: text("status", { enum: ["submitted", "triaged", "in_progress", "resolved", "closed"] as const }).default("submitted").notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    context: jsonb("context"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  table => ({
    workspaceTypeIndex: index("workspace_requests_workspace_type_index").on(table.workspaceId, table.type),
    submitterIndex: index("workspace_requests_submitter_index").on(table.submittedByUserId),
  }),
);

export const legalDocuments = pgTable(
  "legalDocuments",
  {
    id: serial("id").primaryKey(),
    documentKey: text("documentKey", { enum: ["terms", "privacy"] as const }).notNull(),
    version: varchar("version", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    effectiveAt: timestamp("effectiveAt").notNull(),
    publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  },
  table => ({
    documentVersionUnique: uniqueIndex("legal_documents_key_version_unique").on(table.documentKey, table.version),
    documentPublishedIndex: index("legal_documents_key_published_index").on(table.documentKey, table.publishedAt),
  }),
);

export const resourceAcknowledgements = pgTable(
  "resourceAcknowledgements",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    resourceKey: varchar("resourceKey", { length: 128 }).notNull(),
    acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  },
  table => ({
    userResourceUnique: uniqueIndex("resource_acknowledgements_user_resource_unique").on(table.userId, table.resourceKey),
  }),
);

export const editorDrafts = pgTable("editorDrafts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("storeId", { length: 128 }).notNull(),
  pageId: varchar("pageId", { length: 256 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  score: integer("score").notNull(),
  scoreDelta: integer("scoreDelta").notNull(),
  tone: varchar("tone", { length: 32 }).notNull(),
  note: text("note").notNull(),
  designState: text("designState").notNull(),
  isCurrent: integer("isCurrent").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type EditorDraft = typeof editorDrafts.$inferSelect;
export type InsertEditorDraft = typeof editorDrafts.$inferInsert;
