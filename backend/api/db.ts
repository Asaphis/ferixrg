import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityEvents,
  accountEmailChanges,
  accountTokens,
  authIdentities,
  drafts,
  editorDrafts,
  InsertEditorDraft,
  InsertUser,
  releaseActions,
  stores,
  subscriptions,
  toolRuns,
  usageLedger,
  users,
  userPreferences,
  workspaces,
  workspaceInvitations,
  workspaceMembers,
} from "../database/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listEditorDrafts(userId: number, storeId: string, pageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db
    .select()
    .from(editorDrafts)
    .where(and(eq(editorDrafts.userId, userId), eq(editorDrafts.storeId, storeId), eq(editorDrafts.pageId, pageId)))
    .orderBy(desc(editorDrafts.updatedAt));
}

type DraftPayload = Omit<InsertEditorDraft, "id" | "userId" | "createdAt" | "updatedAt">;

export async function saveEditorDraft(userId: number, draft: DraftPayload) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const created = await db.transaction(async tx => {
    if (draft.isCurrent) {
      await tx
        .update(editorDrafts)
        .set({ isCurrent: 0 })
        .where(and(eq(editorDrafts.userId, userId), eq(editorDrafts.storeId, draft.storeId), eq(editorDrafts.pageId, draft.pageId)));
    }

    const result = await tx.insert(editorDrafts).values({ ...draft, userId });
    const rows = await tx.select().from(editorDrafts).where(eq(editorDrafts.id, Number(result[0].insertId))).limit(1);
    return rows[0];
  });

  return created;
}

export async function restoreEditorDraft(userId: number, draftId: number, storeId: string, pageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db.transaction(async tx => {
    await tx
      .update(editorDrafts)
      .set({ isCurrent: 0 })
      .where(and(eq(editorDrafts.userId, userId), eq(editorDrafts.storeId, storeId), eq(editorDrafts.pageId, pageId)));
    await tx
      .update(editorDrafts)
      .set({ isCurrent: 1 })
      .where(and(eq(editorDrafts.id, draftId), eq(editorDrafts.userId, userId), eq(editorDrafts.storeId, storeId), eq(editorDrafts.pageId, pageId)));
    const rows = await tx.select().from(editorDrafts).where(and(eq(editorDrafts.id, draftId), eq(editorDrafts.userId, userId))).limit(1);
    return rows[0];
  });
}

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer" | "billing";

export type WorkspaceAccess = {
  workspace: typeof workspaces.$inferSelect;
  membership: typeof workspaceMembers.$inferSelect;
};

function personalWorkspaceSlug(userId: number) {
  return `workspace-${userId}`;
}

export async function ensurePersonalWorkspace(user: { id: number; name?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existing = await db
    .select({ workspace: workspaces, membership: workspaceMembers })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id))
    .orderBy(workspaces.createdAt)
    .limit(1);

  if (existing[0]) return existing[0];

  return db.transaction(async tx => {
    const duplicate = await tx
      .select({ workspace: workspaces, membership: workspaceMembers })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1);
    if (duplicate[0]) return duplicate[0];

    const workspaceName = user.name?.trim() ? `${user.name.trim()}'s workspace` : "My FerixRG workspace";
    const inserted = await tx.insert(workspaces).values({
      name: workspaceName,
      slug: personalWorkspaceSlug(user.id),
      ownerUserId: user.id,
    });
    const workspaceId = Number(inserted[0].insertId);
    const memberInserted = await tx.insert(workspaceMembers).values({ workspaceId, userId: user.id, role: "owner" });
    await tx.insert(activityEvents).values({
      workspaceId,
      actorUserId: user.id,
      eventType: "workspace.created",
      entityType: "workspace",
      entityId: String(workspaceId),
      details: { source: "first_authenticated_session" },
    });

    const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    const [membership] = await tx.select().from(workspaceMembers).where(eq(workspaceMembers.id, Number(memberInserted[0].insertId))).limit(1);
    if (!workspace || !membership) throw new Error("Failed to create workspace");
    return { workspace, membership };
  });
}

export async function listUserWorkspaces(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ workspace: workspaces, membership: workspaceMembers })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(workspaces.createdAt);
}

export async function getWorkspaceAccess(userId: number, workspaceId: number): Promise<WorkspaceAccess | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ workspace: workspaces, membership: workspaceMembers })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  return rows[0];
}

export async function listWorkspaceMembers(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ member: workspaceMembers, user: users })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(workspaceMembers.joinedAt);
}

export async function createWorkspaceInvitation(input: {
  workspaceId: number;
  invitedByUserId: number;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  tokenHash: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db.insert(workspaceInvitations).values(input);
  await db.insert(activityEvents).values({
    workspaceId: input.workspaceId,
    actorUserId: input.invitedByUserId,
    eventType: "team.invitation_created",
    entityType: "workspace_invitation",
    entityId: String(created[0].insertId),
    details: { email: input.email, role: input.role },
  });
  const rows = await db.select().from(workspaceInvitations).where(eq(workspaceInvitations.id, Number(created[0].insertId))).limit(1);
  return rows[0];
}

export async function listWorkspaceInvitations(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvitations.createdAt));
}

export async function cancelWorkspaceInvitation(workspaceId: number, invitationId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(workspaceInvitations)
    .set({ status: "cancelled" })
    .where(and(eq(workspaceInvitations.id, invitationId), eq(workspaceInvitations.workspaceId, workspaceId), eq(workspaceInvitations.status, "pending")));
  await db.insert(activityEvents).values({
    workspaceId,
    actorUserId,
    eventType: "team.invitation_cancelled",
    entityType: "workspace_invitation",
    entityId: String(invitationId),
    details: {},
  });
}

export async function listWorkspaceStores(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(stores).where(eq(stores.workspaceId, workspaceId)).orderBy(desc(stores.updatedAt));
}

export async function createWorkspaceStore(input: {
  workspaceId: number;
  name: string;
  platform: "shopify" | "woocommerce" | "magento" | "custom" | "public_url";
  url: string;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db.insert(stores).values(input);
  const storeId = Number(created[0].insertId);
  await db.insert(activityEvents).values({
    workspaceId: input.workspaceId,
    actorUserId: input.createdByUserId,
    eventType: "store.created",
    entityType: "store",
    entityId: String(storeId),
    details: { platform: input.platform, url: input.url },
  });
  const rows = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return rows[0];
}

export async function listWorkspaceActivity(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(activityEvents).where(eq(activityEvents.workspaceId, workspaceId)).orderBy(desc(activityEvents.createdAt)).limit(limit);
}

export async function listWorkspaceUsage(workspaceId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(usageLedger).where(eq(usageLedger.workspaceId, workspaceId)).orderBy(desc(usageLedger.createdAt)).limit(limit);
}

export async function listWorkspaceToolRuns(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(toolRuns).where(eq(toolRuns.workspaceId, workspaceId)).orderBy(desc(toolRuns.createdAt)).limit(limit);
}

export async function listWorkspaceDrafts(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(drafts).where(eq(drafts.workspaceId, workspaceId)).orderBy(desc(drafts.updatedAt));
}

export async function getAccountProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0];
}

export async function updateAccountProfile(userId: number, input: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const changes: Record<string, unknown> = {};
  if (input.name !== undefined) changes.name = input.name;
  if (input.email !== undefined) {
    changes.email = input.email.toLowerCase();
    changes.emailVerifiedAt = null;
    changes.accountStatus = "pending_verification";
  }
  if (Object.keys(changes).length) await db.update(users).set(changes).where(eq(users.id, userId));
  return getAccountProfile(userId);
}

export async function beginAccountEmailChange(input: { userId: number; newEmail: string; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(accountEmailChanges).values(input).onDuplicateKeyUpdate({
    set: { newEmail: input.newEmail, tokenHash: input.tokenHash, expiresAt: input.expiresAt, completedAt: null },
  });
}

export async function confirmAccountEmailChange(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const rows = await tx.select().from(accountEmailChanges).where(eq(accountEmailChanges.tokenHash, tokenHash)).limit(1);
    const change = rows[0];
    if (!change || change.completedAt || change.expiresAt.getTime() < Date.now()) return undefined;
    const existing = await tx.select({ userId: authIdentities.userId }).from(authIdentities).where(and(eq(authIdentities.provider, "email"), eq(authIdentities.providerAccountId, change.newEmail))).limit(1);
    if (existing[0] && existing[0].userId !== change.userId) return undefined;
    await tx.update(accountEmailChanges).set({ completedAt: new Date() }).where(eq(accountEmailChanges.id, change.id));
    await tx.update(users).set({ email: change.newEmail, emailVerifiedAt: new Date(), accountStatus: "active" }).where(eq(users.id, change.userId));
    await tx.update(authIdentities).set({ providerAccountId: change.newEmail }).where(and(eq(authIdentities.userId, change.userId), eq(authIdentities.provider, "email")));
    const account = await tx.select().from(users).where(eq(users.id, change.userId)).limit(1);
    return account[0];
  });
}

export async function listAccountIdentities(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ provider: authIdentities.provider, createdAt: authIdentities.createdAt, updatedAt: authIdentities.updatedAt })
    .from(authIdentities)
    .where(eq(authIdentities.userId, userId))
    .orderBy(authIdentities.createdAt);
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(userPreferences).values({ userId });
  const created = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return created[0];
}

export type UserPreferenceUpdate = Partial<{
  defaultPreview: "desktop" | "tablet" | "mobile";
  analysisReadyNotifications: boolean;
  draftReviewNotifications: boolean;
  publishingReadinessNotifications: boolean;
  releaseNotes: boolean;
  productResearch: boolean;
  reduceMotion: boolean;
  increaseContrast: boolean;
  visibleKeyboardFocus: boolean;
}>;

export async function updateUserPreferences(userId: number, input: UserPreferenceUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await getUserPreferences(userId);
  const changes = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === "boolean" ? Number(value) : value]));
  if (Object.keys(changes).length) await db.update(userPreferences).set(changes).where(eq(userPreferences.userId, userId));
  return getUserPreferences(userId);
}

export async function getLocalAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ user: users, identity: authIdentities })
    .from(authIdentities)
    .innerJoin(users, eq(authIdentities.userId, users.id))
    .where(and(eq(authIdentities.provider, "email"), eq(authIdentities.providerAccountId, email)))
    .limit(1);
  return rows[0];
}

export async function createLocalAccount(input: { openId: string; name: string; email: string; passwordHash: string; verificationTokenHash: string; verificationExpiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const created = await tx.insert(users).values({
      openId: input.openId,
      name: input.name,
      email: input.email,
      loginMethod: "email",
      accountStatus: "pending_verification",
      lastSignedIn: new Date(),
    });
    const userId = Number(created[0].insertId);
    await tx.insert(authIdentities).values({
      userId,
      provider: "email",
      providerAccountId: input.email,
      passwordHash: input.passwordHash,
    });
    await tx.insert(accountTokens).values({
      userId,
      purpose: "email_verification",
      tokenHash: input.verificationTokenHash,
      expiresAt: input.verificationExpiresAt,
    });
    const rows = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0];
  });
}

export async function verifyLocalAccount(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const tokens = await tx
      .select()
      .from(accountTokens)
      .where(and(eq(accountTokens.tokenHash, tokenHash), eq(accountTokens.purpose, "email_verification")))
      .limit(1);
    const token = tokens[0];
    if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) return undefined;
    await tx.update(accountTokens).set({ usedAt: new Date() }).where(eq(accountTokens.id, token.id));
    await tx.update(users).set({ accountStatus: "active", emailVerifiedAt: new Date() }).where(eq(users.id, token.userId));
    const rows = await tx.select().from(users).where(eq(users.id, token.userId)).limit(1);
    return rows[0];
  });
}

export async function issueAccountToken(input: { userId: number; purpose: "email_verification" | "password_reset"; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.transaction(async tx => {
    await tx.update(accountTokens).set({ usedAt: new Date() }).where(and(eq(accountTokens.userId, input.userId), eq(accountTokens.purpose, input.purpose)));
    await tx.insert(accountTokens).values(input);
  });
}

export async function resetLocalPassword(input: { tokenHash: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const tokens = await tx.select().from(accountTokens).where(and(eq(accountTokens.tokenHash, input.tokenHash), eq(accountTokens.purpose, "password_reset"))).limit(1);
    const token = tokens[0];
    if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) return undefined;
    await tx.update(accountTokens).set({ usedAt: new Date() }).where(eq(accountTokens.id, token.id));
    await tx.update(authIdentities).set({ passwordHash: input.passwordHash }).where(and(eq(authIdentities.userId, token.userId), eq(authIdentities.provider, "email")));
    const rows = await tx.select().from(users).where(eq(users.id, token.userId)).limit(1);
    return rows[0];
  });
}

export async function createAccountSession(input: { userId: number; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(accountTokens).values({ ...input, purpose: "session" });
}

export async function isAccountSessionActive(userId: number, tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(accountTokens).where(and(eq(accountTokens.userId, userId), eq(accountTokens.purpose, "session"), eq(accountTokens.tokenHash, tokenHash))).limit(1);
  const session = rows[0];
  return Boolean(session && !session.usedAt && session.expiresAt.getTime() > Date.now());
}

export async function listAccountSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({ id: accountTokens.id, tokenHash: accountTokens.tokenHash, expiresAt: accountTokens.expiresAt, usedAt: accountTokens.usedAt, createdAt: accountTokens.createdAt }).from(accountTokens).where(and(eq(accountTokens.userId, userId), eq(accountTokens.purpose, "session"))).orderBy(desc(accountTokens.createdAt));
}

export async function revokeAccountSession(userId: number, sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(accountTokens).set({ usedAt: new Date() }).where(and(eq(accountTokens.id, sessionId), eq(accountTokens.userId, userId), eq(accountTokens.purpose, "session")));
}

export async function revokeAccountSessionByTokenHash(userId: number, tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(accountTokens).set({ usedAt: new Date() }).where(and(eq(accountTokens.userId, userId), eq(accountTokens.purpose, "session"), eq(accountTokens.tokenHash, tokenHash)));
}

export async function revokeOtherAccountSessions(userId: number, currentTokenHash?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const sessions = await listAccountSessions(userId);
  const others = sessions.filter(session => !session.usedAt && session.tokenHash !== currentTokenHash);
  await Promise.all(others.map(session => db.update(accountTokens).set({ usedAt: new Date() }).where(eq(accountTokens.id, session.id))));
  return others.length;
}

export async function listWorkspaceReleases(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(releaseActions).where(eq(releaseActions.workspaceId, workspaceId)).orderBy(desc(releaseActions.requestedAt)).limit(limit);
}

export async function getWorkspaceSubscription(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId)).limit(1);
  return rows[0];
}

export async function queueWorkspaceToolRun(input: {
  workspaceId: number;
  storeId?: number;
  draftId?: number;
  toolId: string;
  sourceType: "public_url" | "connected_store" | "saved_draft" | "upload" | "manual";
  requestedByUserId: number;
  inputSummary?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const created = await db.insert(toolRuns).values(input);
  const toolRunId = Number(created[0].insertId);
  await db.insert(activityEvents).values({
    workspaceId: input.workspaceId,
    actorUserId: input.requestedByUserId,
    eventType: "tool_run.queued",
    entityType: "tool_run",
    entityId: String(toolRunId),
    details: { toolId: input.toolId, sourceType: input.sourceType },
  });
  const rows = await db.select().from(toolRuns).where(eq(toolRuns.id, toolRunId)).limit(1);
  return rows[0];
}
