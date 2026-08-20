import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["active", "pending_verification", "suspended"]).default("pending_verification").notNull(),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const authIdentities = mysqlTable(
  "authIdentities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["email", "google", "manus"]).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 320 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    providerAccountUnique: uniqueIndex("auth_identities_provider_account_unique").on(table.provider, table.providerAccountId),
    userIndex: index("auth_identities_user_index").on(table.userId),
  }),
);

export const accountTokens = mysqlTable(
  "accountTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    purpose: mysqlEnum("purpose", ["email_verification", "password_reset", "session"]).notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userPurposeIndex: index("account_tokens_user_purpose_index").on(table.userId, table.purpose),
  }),
);

export const userPreferences = mysqlTable(
  "userPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    defaultPreview: mysqlEnum("defaultPreview", ["desktop", "tablet", "mobile"]).default("mobile").notNull(),
    analysisReadyNotifications: int("analysisReadyNotifications").default(1).notNull(),
    draftReviewNotifications: int("draftReviewNotifications").default(1).notNull(),
    publishingReadinessNotifications: int("publishingReadinessNotifications").default(1).notNull(),
    releaseNotes: int("releaseNotes").default(1).notNull(),
    productResearch: int("productResearch").default(0).notNull(),
    reduceMotion: int("reduceMotion").default(0).notNull(),
    increaseContrast: int("increaseContrast").default(0).notNull(),
    visibleKeyboardFocus: int("visibleKeyboardFocus").default(1).notNull(),
    twoStepVerification: int("twoStepVerification").default(0).notNull(),
    securityAlerts: int("securityAlerts").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userUnique: uniqueIndex("user_preferences_user_unique").on(table.userId),
  }),
);

export const accountEmailChanges = mysqlTable(
  "accountEmailChanges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
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

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    ownerUserId: int("ownerUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    plan: mysqlEnum("plan", ["free", "starter", "growth", "enterprise"]).default("free").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("workspaces_slug_unique").on(table.slug),
    ownerIndex: index("workspaces_owner_index").on(table.ownerUserId),
  }),
);

export const workspaceMembers = mysqlTable(
  "workspaceMembers",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "admin", "editor", "viewer", "billing"]).notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => ({
    workspaceUserUnique: uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    userIndex: index("workspace_members_user_index").on(table.userId),
  }),
);

export const workspaceInvitations = mysqlTable(
  "workspaceInvitations",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    invitedByUserId: int("invitedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: mysqlEnum("role", ["admin", "editor", "viewer", "billing"]).notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    status: mysqlEnum("status", ["pending", "accepted", "cancelled", "expired"]).default("pending").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
  },
  table => ({
    workspaceStatusIndex: index("workspace_invitations_workspace_status_index").on(table.workspaceId, table.status),
  }),
);

export const stores = mysqlTable(
  "stores",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    platform: mysqlEnum("platform", ["shopify", "woocommerce", "magento", "custom", "public_url"]).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    status: mysqlEnum("status", ["draft", "connected", "attention", "disconnected"]).default("draft").notNull(),
    healthScore: int("healthScore"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    workspaceIndex: index("stores_workspace_index").on(table.workspaceId),
  }),
);

export const storeConnections = mysqlTable(
  "storeConnections",
  {
    id: int("id").autoincrement().primaryKey(),
    storeId: int("storeId").notNull().references(() => stores.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["shopify", "woocommerce", "magento", "custom"]).notNull(),
    credentialReference: varchar("credentialReference", { length: 512 }),
    scopes: json("scopes"),
    status: mysqlEnum("status", ["pending", "connected", "expired", "revoked", "failed"]).default("pending").notNull(),
    lastCheckedAt: timestamp("lastCheckedAt"),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    storeProviderUnique: uniqueIndex("store_connections_store_provider_unique").on(table.storeId, table.provider),
  }),
);

export const storeSnapshots = mysqlTable(
  "storeSnapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    storeId: int("storeId").notNull().references(() => stores.id, { onDelete: "cascade" }),
    sourceType: mysqlEnum("sourceType", ["url_scan", "store_api", "screenshot", "theme_export", "manual_upload"]).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    storageKey: varchar("storageKey", { length: 512 }),
    summary: text("summary"),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  },
  table => ({
    storeCapturedIndex: index("store_snapshots_store_captured_index").on(table.storeId, table.capturedAt),
  }),
);

export const drafts = mysqlTable(
  "drafts",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: int("storeId").references(() => stores.id, { onDelete: "set null" }),
    title: varchar("title", { length: 160 }).notNull(),
    source: mysqlEnum("source", ["manual", "tool", "ai", "import"]).default("manual").notNull(),
    status: mysqlEnum("status", ["draft", "review", "validated", "published", "archived"]).default("draft").notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    currentVersionId: int("currentVersionId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    workspaceIndex: index("drafts_workspace_index").on(table.workspaceId),
    storeIndex: index("drafts_store_index").on(table.storeId),
  }),
);

export const draftVersions = mysqlTable(
  "draftVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    draftId: int("draftId").notNull().references(() => drafts.id, { onDelete: "cascade" }),
    versionNumber: int("versionNumber").notNull(),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    createdByType: mysqlEnum("createdByType", ["user", "ai", "system"]).default("user").notNull(),
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

export const draftAssets = mysqlTable(
  "draftAssets",
  {
    id: int("id").autoincrement().primaryKey(),
    draftId: int("draftId").notNull().references(() => drafts.id, { onDelete: "cascade" }),
    draftVersionId: int("draftVersionId").references(() => draftVersions.id, { onDelete: "set null" }),
    kind: mysqlEnum("kind", ["reference", "screenshot", "theme_export", "preview", "manual_upload"]).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    draftIndex: index("draft_assets_draft_index").on(table.draftId),
    versionIndex: index("draft_assets_version_index").on(table.draftVersionId),
  }),
);

export const toolRuns = mysqlTable(
  "toolRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: int("storeId").references(() => stores.id, { onDelete: "set null" }),
    draftId: int("draftId").references(() => drafts.id, { onDelete: "set null" }),
    toolId: varchar("toolId", { length: 160 }).notNull(),
    status: mysqlEnum("status", ["queued", "running", "completed", "failed", "cancelled"]).default("queued").notNull(),
    sourceType: mysqlEnum("sourceType", ["public_url", "connected_store", "saved_draft", "upload", "manual"]).notNull(),
    requestedByUserId: int("requestedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    inputSummary: json("inputSummary"),
    resultSummary: json("resultSummary"),
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

export const evidenceItems = mysqlTable(
  "evidenceItems",
  {
    id: int("id").autoincrement().primaryKey(),
    toolRunId: int("toolRunId").notNull().references(() => toolRuns.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["page_capture", "screenshot", "metric", "store_data", "validation", "provider_summary"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    storageKey: varchar("storageKey", { length: 512 }),
    details: json("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    toolRunIndex: index("evidence_items_tool_run_index").on(table.toolRunId),
  }),
);

export const issueRecords = mysqlTable(
  "issueRecords",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: int("storeId").references(() => stores.id, { onDelete: "set null" }),
    toolRunId: int("toolRunId").references(() => toolRuns.id, { onDelete: "set null" }),
    draftId: int("draftId").references(() => drafts.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "info"]).notNull(),
    status: mysqlEnum("status", ["open", "in_progress", "resolved", "ignored"]).default("open").notNull(),
    location: varchar("location", { length: 1024 }),
    details: json("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    workspaceStatusIndex: index("issue_records_workspace_status_index").on(table.workspaceId, table.status),
    toolRunIndex: index("issue_records_tool_run_index").on(table.toolRunId),
  }),
);

export const developerHandoffs = mysqlTable(
  "developerHandoffs",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    toolRunId: int("toolRunId").references(() => toolRuns.id, { onDelete: "set null" }),
    issueId: int("issueId").references(() => issueRecords.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    affectedLocation: varchar("affectedLocation", { length: 1024 }).notNull(),
    currentBehavior: text("currentBehavior").notNull(),
    expectedBehavior: text("expectedBehavior").notNull(),
    recommendedImplementation: text("recommendedImplementation").notNull(),
    priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).notNull(),
    acceptanceCriteria: json("acceptanceCriteria").notNull(),
    evidenceIds: json("evidenceIds"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceIndex: index("developer_handoffs_workspace_index").on(table.workspaceId),
    toolRunIndex: index("developer_handoffs_tool_run_index").on(table.toolRunId),
  }),
);

export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    toolRunId: int("toolRunId").references(() => toolRuns.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    format: mysqlEnum("format", ["web", "pdf", "csv", "json", "zip"]).notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    summary: text("summary"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceIndex: index("reports_workspace_index").on(table.workspaceId),
  }),
);

export const validationRuns = mysqlTable(
  "validationRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    draftVersionId: int("draftVersionId").notNull().references(() => draftVersions.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["queued", "running", "passed", "failed"]).default("queued").notNull(),
    summary: json("summary"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceIndex: index("validation_runs_workspace_index").on(table.workspaceId),
  }),
);

export const releaseActions = mysqlTable(
  "releaseActions",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    storeId: int("storeId").references(() => stores.id, { onDelete: "set null" }),
    draftVersionId: int("draftVersionId").references(() => draftVersions.id, { onDelete: "set null" }),
    requestedByUserId: int("requestedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    actionType: mysqlEnum("actionType", ["export", "publish", "rollback"]).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "processing", "published", "exported", "reverted", "failed", "cancelled"]).default("pending").notNull(),
    providerReference: varchar("providerReference", { length: 512 }),
    errorMessage: text("errorMessage"),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => ({
    workspaceIndex: index("release_actions_workspace_index").on(table.workspaceId),
  }),
);

export const activityEvents = mysqlTable(
  "activityEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("eventType", { length: 128 }).notNull(),
    entityType: varchar("entityType", { length: 128 }).notNull(),
    entityId: varchar("entityId", { length: 128 }),
    details: json("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    workspaceCreatedIndex: index("activity_events_workspace_created_index").on(table.workspaceId, table.createdAt),
  }),
);

export const usageLedger = mysqlTable(
  "usageLedger",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    category: mysqlEnum("category", ["tool_run", "ai", "storage", "export", "publish"]).notNull(),
    quantity: int("quantity").notNull(),
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

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 128 }),
    providerCustomerReference: varchar("providerCustomerReference", { length: 512 }),
    providerSubscriptionReference: varchar("providerSubscriptionReference", { length: 512 }),
    plan: mysqlEnum("plan", ["free", "starter", "growth", "enterprise"]).default("free").notNull(),
    status: mysqlEnum("status", ["trialing", "active", "past_due", "cancelled", "expired"]).default("active").notNull(),
    currentPeriodStart: timestamp("currentPeriodStart"),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    workspaceUnique: uniqueIndex("subscriptions_workspace_unique").on(table.workspaceId),
  }),
);

export const editorDrafts = mysqlTable("editorDrafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("storeId", { length: 128 }).notNull(),
  pageId: varchar("pageId", { length: 256 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  score: int("score").notNull(),
  scoreDelta: int("scoreDelta").notNull(),
  tone: varchar("tone", { length: 32 }).notNull(),
  note: text("note").notNull(),
  designState: text("designState").notNull(),
  isCurrent: int("isCurrent").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type EditorDraft = typeof editorDrafts.$inferSelect;
export type InsertEditorDraft = typeof editorDrafts.$inferInsert;
