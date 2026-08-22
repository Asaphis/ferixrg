import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import {
  activityEvents,
  accountSecurityEvents,
  accountEmailChanges,
  accountTokens,
  connectionSecrets,
  authIdentities,
  drafts,
  draftAssets,
  draftVersions,
  editorDrafts,
  evidenceItems,
  developerHandoffs,
  InsertEditorDraft,
  InsertUser,
  releaseActions,
  reports,
  storeConnections,
  storeSnapshots,
  stores,
  issueRecords,
  legalDocuments,
  resourceAcknowledgements,
  subscriptions,
  toolRuns,
  twoStepAuthenticators,
  twoStepLoginChallenges,
  twoStepRecoveryCodes,
  usageLedger,
  validationRuns,
  users,
  userPreferences,
  workspaces,
  workspaceInvitations,
  workspaceMembers,
  workspaceRequests,
} from "../database/schema";
import { ENV } from './_core/env';
import { entitlementForPlan, type FerixPlan } from "../shared/billingPlans";
import { decryptConnectionCredential, encryptConnectionCredential } from "./connectionSecrets";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// The HTTP Neon driver is intentionally not used here: FerixRG relies on
// interactive transactions for account, workspace, draft, and release flows.
// Node does not provide a WebSocket global, so configure Neon's documented
// WebSocket Pool driver explicitly.
neonConfig.webSocketConstructor = ws;

// Lazily create the Drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
      _pool = new Pool({ connectionString });
      _db = drizzle({ client: _pool });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _pool = null;
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

    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
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

    const [result] = await tx.insert(editorDrafts).values({ ...draft, userId }).returning({ id: editorDrafts.id });
    const rows = await tx.select().from(editorDrafts).where(eq(editorDrafts.id, result.id)).limit(1);
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
    const [inserted] = await tx.insert(workspaces).values({
      name: workspaceName,
      slug: personalWorkspaceSlug(user.id),
      ownerUserId: user.id,
    }).returning({ id: workspaces.id });
    const workspaceId = inserted.id;
    const [memberInserted] = await tx.insert(workspaceMembers).values({ workspaceId, userId: user.id, role: "owner" }).returning({ id: workspaceMembers.id });
    await tx.insert(subscriptions).values({ workspaceId, plan: "free", status: "active" });
    await tx.insert(activityEvents).values({
      workspaceId,
      actorUserId: user.id,
      eventType: "workspace.created",
      entityType: "workspace",
      entityId: String(workspaceId),
      details: { source: "first_authenticated_session" },
    });

    const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    const [membership] = await tx.select().from(workspaceMembers).where(eq(workspaceMembers.id, memberInserted.id)).limit(1);
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
  const [created] = await db.insert(workspaceInvitations).values(input).returning({ id: workspaceInvitations.id });
  await db.insert(activityEvents).values({
    workspaceId: input.workspaceId,
    actorUserId: input.invitedByUserId,
    eventType: "team.invitation_created",
    entityType: "workspace_invitation",
    entityId: String(created.id),
    details: { email: input.email, role: input.role },
  });
  const rows = await db.select().from(workspaceInvitations).where(eq(workspaceInvitations.id, created.id)).limit(1);
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

export async function updateWorkspaceInvitationRole(input: { workspaceId: number; invitationId: number; actorUserId: number; role: "admin" | "editor" | "viewer" | "billing" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(workspaceInvitations).set({ role: input.role }).where(and(eq(workspaceInvitations.id, input.invitationId), eq(workspaceInvitations.workspaceId, input.workspaceId), eq(workspaceInvitations.status, "pending")));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "team.invitation_role_updated", entityType: "workspace_invitation", entityId: String(input.invitationId), details: { role: input.role } });
}

export async function updateWorkspaceMemberRole(input: { workspaceId: number; memberId: number; actorUserId: number; role: "admin" | "editor" | "viewer" | "billing" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const members = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.id, input.memberId), eq(workspaceMembers.workspaceId, input.workspaceId))).limit(1);
  const member = members[0];
  if (!member || member.role === "owner") throw new Error("Cannot change the workspace owner role");
  await db.update(workspaceMembers).set({ role: input.role }).where(eq(workspaceMembers.id, input.memberId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "team.member_role_updated", entityType: "workspace_member", entityId: String(input.memberId), details: { role: input.role } });
}

export async function removeWorkspaceMember(input: { workspaceId: number; memberId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const members = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.id, input.memberId), eq(workspaceMembers.workspaceId, input.workspaceId))).limit(1);
  const member = members[0];
  if (!member || member.role === "owner") throw new Error("Cannot remove the workspace owner");
  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, input.memberId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "team.member_removed", entityType: "workspace_member", entityId: String(input.memberId), details: { userId: member.userId } });
}

export async function acceptWorkspaceInvitation(input: { tokenHash: string; userId: number; email: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const invitations = await tx.select().from(workspaceInvitations).where(eq(workspaceInvitations.tokenHash, input.tokenHash)).limit(1);
    const invitation = invitations[0];
    if (!invitation || invitation.status !== "pending" || invitation.expiresAt.getTime() < Date.now() || invitation.email.toLowerCase() !== input.email.toLowerCase()) return undefined;
    await tx.insert(workspaceMembers).values({ workspaceId: invitation.workspaceId, userId: input.userId, role: invitation.role }).onConflictDoUpdate({ target: [workspaceMembers.workspaceId, workspaceMembers.userId], set: { role: invitation.role } });
    await tx.update(workspaceInvitations).set({ status: "accepted", acceptedAt: new Date() }).where(eq(workspaceInvitations.id, invitation.id));
    await tx.insert(activityEvents).values({ workspaceId: invitation.workspaceId, actorUserId: input.userId, eventType: "team.invitation_accepted", entityType: "workspace_invitation", entityId: String(invitation.id), details: { role: invitation.role } });
    return invitation;
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
  const [created] = await db.insert(stores).values(input).returning({ id: stores.id });
  const storeId = created.id;
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

export async function getWorkspaceStore(workspaceId: number, storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(stores).where(and(eq(stores.id, storeId), eq(stores.workspaceId, workspaceId))).limit(1);
  return rows[0];
}

export async function createStoreSnapshot(input: { storeId: number; sourceType: "url_scan" | "store_api" | "screenshot" | "theme_export" | "manual_upload"; sourceUrl?: string; storageKey?: string; summary?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [created] = await db.insert(storeSnapshots).values(input).returning({ id: storeSnapshots.id });
  const rows = await db.select().from(storeSnapshots).where(eq(storeSnapshots.id, created.id)).limit(1);
  return rows[0];
}

export async function listStoreSnapshots(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(storeSnapshots).where(eq(storeSnapshots.storeId, storeId)).orderBy(desc(storeSnapshots.capturedAt));
}

export async function beginStoreConnection(input: { storeId: number; provider: "shopify" | "woocommerce" | "magento" | "custom"; scopes?: string[]; authorizationState?: string; authorizationStateExpiresAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(storeConnections).values({ storeId: input.storeId, provider: input.provider, scopes: input.scopes ?? [], authorizationState: input.authorizationState, authorizationStateExpiresAt: input.authorizationStateExpiresAt, status: "pending" }).onConflictDoUpdate({ target: [storeConnections.storeId, storeConnections.provider], set: { scopes: input.scopes ?? [], authorizationState: input.authorizationState, authorizationStateExpiresAt: input.authorizationStateExpiresAt, status: "pending", lastError: null, lastCheckedAt: new Date() } });
  const rows = await db.select().from(storeConnections).where(and(eq(storeConnections.storeId, input.storeId), eq(storeConnections.provider, input.provider))).limit(1);
  return rows[0];
}

export async function listStoreConnections(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(storeConnections).where(eq(storeConnections.storeId, storeId)).orderBy(desc(storeConnections.updatedAt));
}

export async function disconnectWorkspaceStore(input: { workspaceId: number; storeId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const storesForWorkspace = await tx.select().from(stores).where(and(eq(stores.id, input.storeId), eq(stores.workspaceId, input.workspaceId))).limit(1);
    const store = storesForWorkspace[0];
    if (!store) return undefined;
    await tx.update(storeConnections).set({ status: "revoked", authorizationState: null, authorizationStateExpiresAt: null, lastError: "Disconnected by workspace user", lastCheckedAt: new Date() }).where(eq(storeConnections.storeId, input.storeId));
    await tx.update(stores).set({ status: "disconnected" }).where(and(eq(stores.id, input.storeId), eq(stores.workspaceId, input.workspaceId)));
    await tx.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "store.disconnected", entityType: "store", entityId: String(input.storeId), details: { storeId: input.storeId } });
    const updated = await tx.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    return updated[0];
  });
}

export async function getStoreConnectionByAuthorizationState(provider: "shopify" | "woocommerce" | "magento" | "custom", authorizationState: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ connection: storeConnections, store: stores }).from(storeConnections).innerJoin(stores, eq(storeConnections.storeId, stores.id)).where(and(eq(storeConnections.provider, provider), eq(storeConnections.authorizationState, authorizationState))).limit(1);
  const row = rows[0];
  if (!row || !row.connection.authorizationStateExpiresAt || row.connection.authorizationStateExpiresAt.getTime() < Date.now()) return undefined;
  return row;
}

export async function setStoreConnectionCredential(input: { connectionId: number; credential: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const encryptedCredential = encryptConnectionCredential(input.credential);
  await db.insert(connectionSecrets).values({ connectionId: input.connectionId, encryptedCredential }).onConflictDoUpdate({ target: connectionSecrets.connectionId, set: { encryptedCredential, updatedAt: new Date() } });
}

export async function getStoreConnectionCredential(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = (await db.select().from(connectionSecrets).where(eq(connectionSecrets.connectionId, connectionId)).limit(1))[0];
  return row ? decryptConnectionCredential(row.encryptedCredential) : undefined;
}

export async function clearStoreConnectionAuthorizationState(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(storeConnections).set({ authorizationState: null, authorizationStateExpiresAt: null }).where(eq(storeConnections.id, connectionId));
}

export async function setStoreConnectionStatus(input: { storeId: number; provider: "shopify" | "woocommerce" | "magento" | "custom"; status: "pending" | "connected" | "expired" | "revoked" | "failed"; lastError?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(storeConnections).set({ status: input.status, lastError: input.lastError ?? null, lastCheckedAt: new Date() }).where(and(eq(storeConnections.storeId, input.storeId), eq(storeConnections.provider, input.provider)));
  await db.update(stores).set({ status: input.status === "connected" ? "connected" : input.status === "failed" || input.status === "expired" ? "attention" : "draft" }).where(eq(stores.id, input.storeId));
}

export async function recordWorkspaceActivity(input: { workspaceId: number; actorUserId?: number; eventType: string; entityType: string; entityId: string; details?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(activityEvents).values(input);
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

export async function recordWorkspaceUsage(input: { workspaceId: number; userId?: number; category: "tool_run" | "ai" | "storage" | "export" | "publish"; quantity: number; unit: string; provider?: string; referenceType?: string; referenceId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [inserted] = await db.insert(usageLedger).values(input).returning({ id: usageLedger.id });
  return (await db.select().from(usageLedger).where(eq(usageLedger.id, inserted.id)).limit(1))[0];
}

export async function getWorkspaceAiNeuronUsageSince(workspaceId: number, since: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ total: sql<number>`coalesce(sum(${usageLedger.quantity}), 0)` }).from(usageLedger).where(and(eq(usageLedger.workspaceId, workspaceId), eq(usageLedger.category, "ai"), eq(usageLedger.unit, "neurons"), gte(usageLedger.createdAt, since)));
  return Number(rows[0]?.total ?? 0);
}

export async function getWorkspaceUsageSummary(workspaceId: number) {
  const [subscription, ledger] = await Promise.all([getWorkspaceSubscription(workspaceId), listWorkspaceUsage(workspaceId, 1_000)]);
  const plan = (subscription?.plan ?? "free") as FerixPlan;
  const entitlements = entitlementForPlan(plan);
  const totals = ledger.reduce<Record<string, number>>((summary, entry) => { summary[entry.category] = (summary[entry.category] ?? 0) + entry.quantity; return summary; }, {});
  return {
    subscription: subscription ?? null,
    plan: { id: plan, ...entitlements },
    usage: { toolRuns: totals.tool_run ?? 0, aiCredits: totals.ai ?? 0, storageBytes: totals.storage ?? 0, exports: totals.export ?? 0, publishActions: totals.publish ?? 0 },
    ledger,
  };
}

export async function createWorkspaceRequest(input: { workspaceId?: number; submittedByUserId: number; type: "platform_request" | "support" | "problem" | "feedback" | "feature_request"; subject: string; message: string; context?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [created] = await db.insert(workspaceRequests).values(input).returning({ id: workspaceRequests.id });
  const request = (await db.select().from(workspaceRequests).where(eq(workspaceRequests.id, created.id)).limit(1))[0];
  if (request?.workspaceId) await db.insert(activityEvents).values({ workspaceId: request.workspaceId, actorUserId: input.submittedByUserId, eventType: `request.${input.type}.submitted`, entityType: "workspace_request", entityId: String(request.id), details: { subject: input.subject } });
  return request;
}

export async function listWorkspaceRequests(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(workspaceRequests).where(eq(workspaceRequests.workspaceId, workspaceId)).orderBy(desc(workspaceRequests.createdAt)).limit(limit);
}

export async function listLegalDocuments(documentKey: "terms" | "privacy") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(legalDocuments).where(eq(legalDocuments.documentKey, documentKey)).orderBy(desc(legalDocuments.publishedAt));
}

export async function acknowledgeResource(input: { userId: number; resourceKey: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(resourceAcknowledgements).values(input).onConflictDoUpdate({ target: [resourceAcknowledgements.userId, resourceAcknowledgements.resourceKey], set: { acknowledgedAt: new Date() } });
  return (await db.select().from(resourceAcknowledgements).where(and(eq(resourceAcknowledgements.userId, input.userId), eq(resourceAcknowledgements.resourceKey, input.resourceKey))).limit(1))[0];
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

export async function createWorkspaceDraft(input: { workspaceId: number; storeId?: number; title: string; source: "manual" | "tool" | "ai" | "import"; createdByUserId: number; label: string; note?: string; designState: string; createdByType?: "user" | "ai" | "system" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const [created] = await tx.insert(drafts).values({ workspaceId: input.workspaceId, storeId: input.storeId, title: input.title, source: input.source, createdByUserId: input.createdByUserId }).returning({ id: drafts.id });
    const draftId = created.id;
    const [version] = await tx.insert(draftVersions).values({ draftId, versionNumber: 1, createdByUserId: input.createdByUserId, createdByType: input.createdByType ?? "user", label: input.label, note: input.note, designState: input.designState }).returning({ id: draftVersions.id });
    const versionId = version.id;
    await tx.update(drafts).set({ currentVersionId: versionId }).where(eq(drafts.id, draftId));
    await tx.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, eventType: "draft.created", entityType: "draft", entityId: String(draftId), details: { source: input.source, versionId } });
    const draftRows = await tx.select().from(drafts).where(eq(drafts.id, draftId)).limit(1);
    const versionRows = await tx.select().from(draftVersions).where(eq(draftVersions.id, versionId)).limit(1);
    return { draft: draftRows[0], version: versionRows[0] };
  });
}

export async function listWorkspaceDraftVersions(workspaceId: number, draftId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const draftRows = await db.select().from(drafts).where(and(eq(drafts.id, draftId), eq(drafts.workspaceId, workspaceId))).limit(1);
  if (!draftRows[0]) return undefined;
  const versions = await db.select().from(draftVersions).where(eq(draftVersions.draftId, draftId)).orderBy(desc(draftVersions.versionNumber));
  return { draft: draftRows[0], versions };
}

export async function saveWorkspaceDraftVersion(input: { workspaceId: number; draftId: number; createdByUserId: number; label: string; note?: string; designState: string; createdByType?: "user" | "ai" | "system"; previewStorageKey?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const draftRows = await tx.select().from(drafts).where(and(eq(drafts.id, input.draftId), eq(drafts.workspaceId, input.workspaceId))).limit(1);
    if (!draftRows[0]) return undefined;
    const prior = await tx.select().from(draftVersions).where(eq(draftVersions.draftId, input.draftId)).orderBy(desc(draftVersions.versionNumber)).limit(1);
    const versionNumber = (prior[0]?.versionNumber ?? 0) + 1;
    const [created] = await tx.insert(draftVersions).values({ draftId: input.draftId, versionNumber, createdByUserId: input.createdByUserId, createdByType: input.createdByType ?? "user", label: input.label, note: input.note, designState: input.designState, previewStorageKey: input.previewStorageKey }).returning({ id: draftVersions.id });
    const versionId = created.id;
    await tx.update(drafts).set({ currentVersionId: versionId, updatedAt: new Date() }).where(eq(drafts.id, input.draftId));
    await tx.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, eventType: "draft.version_saved", entityType: "draft_version", entityId: String(versionId), details: { draftId: input.draftId, versionNumber } });
    const rows = await tx.select().from(draftVersions).where(eq(draftVersions.id, versionId)).limit(1);
    return rows[0];
  });
}

export async function restoreWorkspaceDraftVersion(input: { workspaceId: number; draftId: number; versionId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const versions = await tx.select().from(draftVersions).where(and(eq(draftVersions.id, input.versionId), eq(draftVersions.draftId, input.draftId))).limit(1);
    const version = versions[0];
    const draftRows = await tx.select().from(drafts).where(and(eq(drafts.id, input.draftId), eq(drafts.workspaceId, input.workspaceId))).limit(1);
    if (!version || !draftRows[0]) return undefined;
    await tx.update(drafts).set({ currentVersionId: input.versionId, updatedAt: new Date() }).where(eq(drafts.id, input.draftId));
    await tx.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "draft.version_restored", entityType: "draft_version", entityId: String(input.versionId), details: { draftId: input.draftId } });
    return version;
  });
}

export async function listWorkspaceDraftAssets(workspaceId: number, draftId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owned = await db.select().from(drafts).where(and(eq(drafts.id, draftId), eq(drafts.workspaceId, workspaceId))).limit(1);
  if (!owned[0]) return undefined;
  return db.select().from(draftAssets).where(eq(draftAssets.draftId, draftId)).orderBy(desc(draftAssets.createdAt));
}

export async function createWorkspaceDraftAsset(input: { workspaceId: number; draftId: number; draftVersionId?: number; kind: "reference" | "screenshot" | "theme_export" | "preview" | "manual_upload"; storageKey: string; fileName: string; mimeType: string; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owned = await db.select().from(drafts).where(and(eq(drafts.id, input.draftId), eq(drafts.workspaceId, input.workspaceId))).limit(1);
  if (!owned[0]) return undefined;
  if (input.draftVersionId) {
    const version = await db.select().from(draftVersions).where(and(eq(draftVersions.id, input.draftVersionId), eq(draftVersions.draftId, input.draftId))).limit(1);
    if (!version[0]) return undefined;
  }
  const [created] = await db.insert(draftAssets).values({ draftId: input.draftId, draftVersionId: input.draftVersionId, kind: input.kind, storageKey: input.storageKey, fileName: input.fileName, mimeType: input.mimeType, createdByUserId: input.createdByUserId }).returning({ id: draftAssets.id });
  const rows = await db.select().from(draftAssets).where(eq(draftAssets.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, eventType: "draft.asset_uploaded", entityType: "draft_asset", entityId: String(rows[0]?.id ?? input.draftId), details: { draftId: input.draftId, kind: input.kind, fileName: input.fileName } });
  return rows[0];
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
  await db.insert(accountEmailChanges).values(input).onConflictDoUpdate({ target: accountEmailChanges.userId, set: { newEmail: input.newEmail, tokenHash: input.tokenHash, expiresAt: input.expiresAt, completedAt: null } });
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
  twoStepVerification: boolean;
  securityAlerts: boolean;
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

export async function getLocalAccountById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0];
}

export async function hasEnabledTwoStepAuthenticator(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ id: twoStepAuthenticators.id }).from(twoStepAuthenticators).where(and(eq(twoStepAuthenticators.userId, userId), sql`${twoStepAuthenticators.enabledAt} IS NOT NULL`)).limit(1);
  return Boolean(rows[0]);
}

export async function savePendingTwoStepAuthenticator(input: { userId: number; encryptedSecret: string; keyVersion: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(twoStepAuthenticators).values({ ...input, enabledAt: null, lastVerifiedAt: null }).onConflictDoUpdate({ target: twoStepAuthenticators.userId, set: { encryptedSecret: input.encryptedSecret, keyVersion: input.keyVersion, enabledAt: null, lastVerifiedAt: null } });
  const rows = await db.select({ id: twoStepAuthenticators.id, enabledAt: twoStepAuthenticators.enabledAt }).from(twoStepAuthenticators).where(eq(twoStepAuthenticators.userId, input.userId)).limit(1);
  return rows[0];
}

export async function getTwoStepAuthenticator(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(twoStepAuthenticators).where(eq(twoStepAuthenticators.userId, userId)).limit(1);
  return rows[0];
}

export type AccountSecurityEventType = "two_step_enrollment_started" | "two_step_enabled" | "session_revoked" | "other_sessions_revoked" | "two_step_login_completed" | "local_sign_in_completed";
export type AccountSecurityDeliveryState = "not_requested" | "not_configured" | "sent" | "failed";

export async function recordAccountSecurityEvent(input: { userId: number; eventType: AccountSecurityEventType; deliveryState?: AccountSecurityDeliveryState }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [inserted] = await db.insert(accountSecurityEvents).values({ userId: input.userId, eventType: input.eventType, deliveryState: input.deliveryState ?? "not_requested" }).returning({ id: accountSecurityEvents.id });
  return inserted.id;
}

export async function updateAccountSecurityEventDelivery(input: { userId: number; eventId: number; deliveryState: AccountSecurityDeliveryState }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(accountSecurityEvents).set({ deliveryState: input.deliveryState }).where(and(eq(accountSecurityEvents.id, input.eventId), eq(accountSecurityEvents.userId, input.userId)));
}

export async function listAccountSecurityEvents(userId: number, limit = 12) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(accountSecurityEvents).where(eq(accountSecurityEvents.userId, userId)).orderBy(desc(accountSecurityEvents.createdAt)).limit(Math.min(Math.max(limit, 1), 50));
}

export async function confirmTwoStepAuthenticator(input: { userId: number; recoveryCodeHashes: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const rows = await tx.select().from(twoStepAuthenticators).where(eq(twoStepAuthenticators.userId, input.userId)).limit(1);
    const authenticator = rows[0];
    if (!authenticator) return undefined;
    const now = new Date();
    await tx.update(twoStepAuthenticators).set({ enabledAt: now, lastVerifiedAt: now }).where(eq(twoStepAuthenticators.id, authenticator.id));
    await tx.delete(twoStepRecoveryCodes).where(eq(twoStepRecoveryCodes.authenticatorId, authenticator.id));
    if (input.recoveryCodeHashes.length) await tx.insert(twoStepRecoveryCodes).values(input.recoveryCodeHashes.map(codeHash => ({ authenticatorId: authenticator.id, codeHash })));
    return { id: authenticator.id, enabledAt: now };
  });
}

export async function consumeTwoStepRecoveryCode(input: { userId: number; codeHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const rows = await tx
      .select({ id: twoStepRecoveryCodes.id })
      .from(twoStepRecoveryCodes)
      .innerJoin(twoStepAuthenticators, eq(twoStepRecoveryCodes.authenticatorId, twoStepAuthenticators.id))
      .where(and(eq(twoStepAuthenticators.userId, input.userId), eq(twoStepRecoveryCodes.codeHash, input.codeHash), sql`${twoStepRecoveryCodes.usedAt} IS NULL`))
      .limit(1);
    const recoveryCode = rows[0];
    if (!recoveryCode) return undefined;
    await tx.update(twoStepRecoveryCodes).set({ usedAt: new Date() }).where(eq(twoStepRecoveryCodes.id, recoveryCode.id));
    return recoveryCode;
  });
}

export async function createLocalAccount(input: { openId: string; name: string; email: string; passwordHash: string; verificationTokenHash: string; verificationExpiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const [created] = await tx.insert(users).values({
      openId: input.openId,
      name: input.name,
      email: input.email,
      loginMethod: "email",
      accountStatus: "pending_verification",
      lastSignedIn: new Date(),
    }).returning({ id: users.id });
    const userId = created.id;
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

export async function createTwoStepLoginChallenge(input: { userId: number; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.transaction(async tx => {
    await tx.update(twoStepLoginChallenges).set({ consumedAt: new Date() }).where(and(eq(twoStepLoginChallenges.userId, input.userId), sql`${twoStepLoginChallenges.consumedAt} IS NULL`));
    await tx.insert(twoStepLoginChallenges).values(input);
  });
}

export async function consumeTwoStepLoginChallenge(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const rows = await tx.select().from(twoStepLoginChallenges).where(eq(twoStepLoginChallenges.tokenHash, tokenHash)).limit(1);
    const challenge = rows[0];
    if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now()) return undefined;
    await tx.update(twoStepLoginChallenges).set({ consumedAt: new Date() }).where(eq(twoStepLoginChallenges.id, challenge.id));
    return challenge;
  });
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

export async function getWorkspaceDraftVersion(workspaceId: number, draftVersionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ version: draftVersions, draft: drafts }).from(draftVersions).innerJoin(drafts, eq(draftVersions.draftId, drafts.id)).where(and(eq(draftVersions.id, draftVersionId), eq(drafts.workspaceId, workspaceId))).limit(1);
  return rows[0];
}

export async function listWorkspaceValidationRuns(workspaceId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(validationRuns).where(eq(validationRuns.workspaceId, workspaceId)).orderBy(desc(validationRuns.createdAt)).limit(limit);
}

export async function queueWorkspaceValidationRun(input: { workspaceId: number; draftVersionId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!(await getWorkspaceDraftVersion(input.workspaceId, input.draftVersionId))) return undefined;
  const [created] = await db.insert(validationRuns).values({ workspaceId: input.workspaceId, draftVersionId: input.draftVersionId, status: "queued" }).returning({ id: validationRuns.id });
  const rows = await db.select().from(validationRuns).where(eq(validationRuns.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "validation.queued", entityType: "validation_run", entityId: String(rows[0]?.id ?? 0), details: { draftVersionId: input.draftVersionId } });
  return rows[0];
}

export async function startWorkspaceValidationRun(input: { workspaceId: number; validationRunId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(validationRuns).where(and(eq(validationRuns.id, input.validationRunId), eq(validationRuns.workspaceId, input.workspaceId))).limit(1);
  if (!rows[0] || rows[0].status !== "queued") return undefined;
  await db.update(validationRuns).set({ status: "running", startedAt: new Date() }).where(eq(validationRuns.id, input.validationRunId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "validation.started", entityType: "validation_run", entityId: String(input.validationRunId), details: { draftVersionId: rows[0].draftVersionId } });
  return (await db.select().from(validationRuns).where(eq(validationRuns.id, input.validationRunId)).limit(1))[0];
}

export async function completeWorkspaceValidationRun(input: { workspaceId: number; validationRunId: number; actorUserId: number; passed: boolean; summary: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(validationRuns).where(and(eq(validationRuns.id, input.validationRunId), eq(validationRuns.workspaceId, input.workspaceId))).limit(1);
  if (!rows[0] || (rows[0].status !== "queued" && rows[0].status !== "running")) return undefined;
  await db.update(validationRuns).set({ status: input.passed ? "passed" : "failed", summary: input.summary, startedAt: rows[0].startedAt ?? new Date(), completedAt: new Date() }).where(eq(validationRuns.id, input.validationRunId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: input.passed ? "validation.passed" : "validation.failed", entityType: "validation_run", entityId: String(input.validationRunId), details: { draftVersionId: rows[0].draftVersionId } });
  return (await db.select().from(validationRuns).where(eq(validationRuns.id, input.validationRunId)).limit(1))[0];
}

export async function getWorkspaceReleaseAction(workspaceId: number, releaseActionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return (await db.select().from(releaseActions).where(and(eq(releaseActions.id, releaseActionId), eq(releaseActions.workspaceId, workspaceId))).limit(1))[0];
}

export async function getWorkspaceReleaseEligibility(input: { workspaceId: number; storeId?: number; draftVersionId?: number; actionType: "export" | "publish" | "rollback" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const reasons: string[] = [];
  const version = input.draftVersionId ? await getWorkspaceDraftVersion(input.workspaceId, input.draftVersionId) : undefined;
  if (input.draftVersionId && !version) reasons.push("The selected draft version is not available in this workspace.");
  const store = input.storeId ? await getWorkspaceStore(input.workspaceId, input.storeId) : undefined;
  if ((input.actionType === "publish" || input.actionType === "rollback") && !store) reasons.push("A workspace store is required for this action.");
  const connections = input.storeId ? await listStoreConnections(input.storeId) : [];
  const hasSupportedConnection = connections.some(connection => connection.status === "connected");
  if ((input.actionType === "publish" || input.actionType === "rollback") && !hasSupportedConnection) reasons.push("A supported active store connection is required.");
  const passedValidation = input.draftVersionId ? (await db.select().from(validationRuns).where(and(eq(validationRuns.workspaceId, input.workspaceId), eq(validationRuns.draftVersionId, input.draftVersionId), eq(validationRuns.status, "passed"))).limit(1))[0] : undefined;
  if (input.actionType === "publish" && !passedValidation) reasons.push("The selected draft version needs a passed validation run before publish planning.");
  const unresolvedCriticalIssues = await db.select().from(issueRecords).where(and(eq(issueRecords.workspaceId, input.workspaceId), eq(issueRecords.severity, "critical"), eq(issueRecords.status, "open")));
  if (input.actionType === "publish" && unresolvedCriticalIssues.length) reasons.push("Resolve or explicitly ignore all critical workspace issues before publish planning.");
  const priorPublished = input.storeId ? (await db.select().from(releaseActions).where(and(eq(releaseActions.workspaceId, input.workspaceId), eq(releaseActions.storeId, input.storeId), eq(releaseActions.status, "published"))).limit(1))[0] : undefined;
  if (input.actionType === "rollback" && !priorPublished) reasons.push("No published release record is available to roll back for this store.");
  return { eligible: reasons.length === 0, reasons, hasSupportedConnection, passedValidationId: passedValidation?.id ?? null, priorPublishedReleaseId: priorPublished?.id ?? null };
}

export async function createWorkspaceReleaseAction(input: { workspaceId: number; storeId?: number; draftVersionId?: number; requestedByUserId: number; actionType: "export" | "publish" | "rollback" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.draftVersionId && !(await getWorkspaceDraftVersion(input.workspaceId, input.draftVersionId))) return undefined;
  if (input.storeId && !(await getWorkspaceStore(input.workspaceId, input.storeId))) return undefined;
  if ((input.actionType === "publish" || input.actionType === "rollback") && !input.storeId) return undefined;
  const eligibility = await getWorkspaceReleaseEligibility(input);
  if (!eligibility.eligible) return undefined;
  const status = input.actionType === "export" ? "approved" : "pending";
  const [created] = await db.insert(releaseActions).values({ ...input, status }).returning({ id: releaseActions.id });
  const rows = await db.select().from(releaseActions).where(eq(releaseActions.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.requestedByUserId, eventType: "release.requested", entityType: "release_action", entityId: String(rows[0]?.id ?? 0), details: { actionType: input.actionType, storeId: input.storeId, draftVersionId: input.draftVersionId } });
  return rows[0];
}

export async function updateWorkspaceReleaseActionExecution(input: { workspaceId: number; releaseActionId: number; actorUserId: number; status: "processing" | "published" | "reverted" | "failed"; providerReference?: string; errorMessage?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const action = await getWorkspaceReleaseAction(input.workspaceId, input.releaseActionId);
  if (!action || (input.status === "processing" ? action.status !== "approved" : action.status !== "processing")) return undefined;
  await db.update(releaseActions).set({ status: input.status, providerReference: input.providerReference, errorMessage: input.errorMessage, completedAt: input.status === "processing" ? null : new Date() }).where(eq(releaseActions.id, input.releaseActionId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: `release.${input.status}`, entityType: "release_action", entityId: String(input.releaseActionId), details: { actionType: action.actionType, providerReference: input.providerReference ?? null, hasError: Boolean(input.errorMessage) } });
  return getWorkspaceReleaseAction(input.workspaceId, input.releaseActionId);
}

export async function approveWorkspaceReleaseAction(input: { workspaceId: number; releaseActionId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const action = await getWorkspaceReleaseAction(input.workspaceId, input.releaseActionId);
  if (!action || action.status !== "pending") return undefined;
  await db.update(releaseActions).set({ status: "approved" }).where(eq(releaseActions.id, input.releaseActionId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "release.approved", entityType: "release_action", entityId: String(input.releaseActionId), details: { actionType: action.actionType } });
  return getWorkspaceReleaseAction(input.workspaceId, input.releaseActionId);
}

export async function cancelWorkspaceReleaseAction(input: { workspaceId: number; releaseActionId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const action = await getWorkspaceReleaseAction(input.workspaceId, input.releaseActionId);
  if (!action || (action.status !== "pending" && action.status !== "approved")) return undefined;
  await db.update(releaseActions).set({ status: "cancelled", completedAt: new Date() }).where(eq(releaseActions.id, input.releaseActionId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "release.cancelled", entityType: "release_action", entityId: String(input.releaseActionId), details: { actionType: action.actionType } });
  return getWorkspaceReleaseAction(input.workspaceId, input.releaseActionId);
}

export async function getWorkspaceSubscription(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(subscriptions).values({ workspaceId, plan: "free", status: "active" }).onConflictDoUpdate({ target: subscriptions.workspaceId, set: { updatedAt: new Date() } });
  return (await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId)).limit(1))[0];
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
  const [created] = await db.insert(toolRuns).values(input).returning({ id: toolRuns.id });
  const toolRunId = created.id;
  await db.insert(usageLedger).values({ workspaceId: input.workspaceId, userId: input.requestedByUserId, category: "tool_run", quantity: 1, unit: "run", referenceType: "tool_run", referenceId: String(toolRunId) });
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

export async function getWorkspaceToolRun(workspaceId: number, toolRunId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(toolRuns).where(and(eq(toolRuns.id, toolRunId), eq(toolRuns.workspaceId, workspaceId))).limit(1);
  return rows[0];
}

export async function startWorkspaceToolRun(input: { workspaceId: number; toolRunId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
  if (!run || run.status !== "queued") return undefined;
  await db.update(toolRuns).set({ status: "running", startedAt: new Date(), errorMessage: null }).where(eq(toolRuns.id, input.toolRunId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "tool_run.started", entityType: "tool_run", entityId: String(input.toolRunId), details: { toolId: run.toolId } });
  return getWorkspaceToolRun(input.workspaceId, input.toolRunId);
}

export async function completeWorkspaceToolRun(input: { workspaceId: number; toolRunId: number; actorUserId: number; resultSummary?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
  if (!run || (run.status !== "queued" && run.status !== "running")) return undefined;
  await db.update(toolRuns).set({ status: "completed", resultSummary: input.resultSummary ?? {}, completedAt: new Date(), startedAt: run.startedAt ?? new Date(), errorMessage: null }).where(eq(toolRuns.id, input.toolRunId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "tool_run.completed", entityType: "tool_run", entityId: String(input.toolRunId), details: { toolId: run.toolId } });
  return getWorkspaceToolRun(input.workspaceId, input.toolRunId);
}

export async function failWorkspaceToolRun(input: { workspaceId: number; toolRunId: number; actorUserId: number; errorMessage: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
  if (!run || (run.status !== "queued" && run.status !== "running")) return undefined;
  await db.update(toolRuns).set({ status: "failed", errorMessage: input.errorMessage, completedAt: new Date(), startedAt: run.startedAt ?? new Date() }).where(eq(toolRuns.id, input.toolRunId));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "tool_run.failed", entityType: "tool_run", entityId: String(input.toolRunId), details: { toolId: run.toolId } });
  return getWorkspaceToolRun(input.workspaceId, input.toolRunId);
}

export async function listWorkspaceToolEvidence(workspaceId: number, toolRunId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!(await getWorkspaceToolRun(workspaceId, toolRunId))) return undefined;
  return db.select().from(evidenceItems).where(eq(evidenceItems.toolRunId, toolRunId)).orderBy(desc(evidenceItems.createdAt));
}

export async function createWorkspaceEvidence(input: { workspaceId: number; toolRunId: number; kind: "page_capture" | "screenshot" | "metric" | "store_data" | "validation" | "provider_summary"; title: string; sourceUrl?: string; storageKey?: string; details?: Record<string, unknown>; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!(await getWorkspaceToolRun(input.workspaceId, input.toolRunId))) return undefined;
  const [created] = await db.insert(evidenceItems).values({ toolRunId: input.toolRunId, kind: input.kind, title: input.title, sourceUrl: input.sourceUrl, storageKey: input.storageKey, details: input.details }).returning({ id: evidenceItems.id });
  const rows = await db.select().from(evidenceItems).where(eq(evidenceItems.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "tool_run.evidence_added", entityType: "evidence_item", entityId: String(rows[0]?.id ?? input.toolRunId), details: { toolRunId: input.toolRunId, kind: input.kind } });
  return rows[0];
}

export async function listWorkspaceIssues(workspaceId: number, status?: "open" | "in_progress" | "resolved" | "ignored") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(issueRecords).where(status ? and(eq(issueRecords.workspaceId, workspaceId), eq(issueRecords.status, status)) : eq(issueRecords.workspaceId, workspaceId)).orderBy(desc(issueRecords.updatedAt));
}

export async function createWorkspaceIssue(input: { workspaceId: number; storeId?: number; toolRunId?: number; draftId?: number; title: string; severity: "critical" | "high" | "medium" | "low" | "info"; location?: string; details?: Record<string, unknown>; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.toolRunId && !(await getWorkspaceToolRun(input.workspaceId, input.toolRunId))) return undefined;
  const [created] = await db.insert(issueRecords).values({ workspaceId: input.workspaceId, storeId: input.storeId, toolRunId: input.toolRunId, draftId: input.draftId, title: input.title, severity: input.severity, location: input.location, details: input.details }).returning({ id: issueRecords.id });
  const rows = await db.select().from(issueRecords).where(eq(issueRecords.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "issue.created", entityType: "issue", entityId: String(rows[0]?.id ?? 0), details: { severity: input.severity, toolRunId: input.toolRunId } });
  return rows[0];
}

export async function updateWorkspaceIssueStatus(input: { workspaceId: number; issueId: number; status: "open" | "in_progress" | "resolved" | "ignored"; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(issueRecords).set({ status: input.status, updatedAt: new Date() }).where(and(eq(issueRecords.id, input.issueId), eq(issueRecords.workspaceId, input.workspaceId)));
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.actorUserId, eventType: "issue.status_updated", entityType: "issue", entityId: String(input.issueId), details: { status: input.status } });
}

export async function listWorkspaceReports(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(reports).where(eq(reports.workspaceId, workspaceId)).orderBy(desc(reports.createdAt));
}

export async function getWorkspaceReport(workspaceId: number, reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return (await db.select().from(reports).where(and(eq(reports.workspaceId, workspaceId), eq(reports.id, reportId))).limit(1))[0];
}

export async function createWorkspaceReport(input: { workspaceId: number; toolRunId?: number; title: string; format: "web" | "pdf" | "csv" | "json" | "zip"; storageKey?: string; summary?: string; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.toolRunId && !(await getWorkspaceToolRun(input.workspaceId, input.toolRunId))) return undefined;
  const [created] = await db.insert(reports).values(input).returning({ id: reports.id });
  const rows = await db.select().from(reports).where(eq(reports.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, eventType: "report.created", entityType: "report", entityId: String(rows[0]?.id ?? 0), details: { toolRunId: input.toolRunId, format: input.format } });
  return rows[0];
}

export async function listWorkspaceDeveloperHandoffs(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(developerHandoffs).where(eq(developerHandoffs.workspaceId, workspaceId)).orderBy(desc(developerHandoffs.createdAt));
}

export async function createWorkspaceDeveloperHandoff(input: { workspaceId: number; toolRunId?: number; issueId?: number; title: string; affectedLocation: string; currentBehavior: string; expectedBehavior: string; recommendedImplementation: string; priority: "critical" | "high" | "medium" | "low"; acceptanceCriteria: string[]; evidenceIds?: number[]; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.toolRunId && !(await getWorkspaceToolRun(input.workspaceId, input.toolRunId))) return undefined;
  const [created] = await db.insert(developerHandoffs).values(input).returning({ id: developerHandoffs.id });
  const rows = await db.select().from(developerHandoffs).where(eq(developerHandoffs.id, created.id)).limit(1);
  await db.insert(activityEvents).values({ workspaceId: input.workspaceId, actorUserId: input.createdByUserId, eventType: "developer_handoff.created", entityType: "developer_handoff", entityId: String(rows[0]?.id ?? 0), details: { toolRunId: input.toolRunId, issueId: input.issueId } });
  return rows[0];
}

export async function getWorkspaceDashboardReadModel(workspaceId: number) {
  const [workspaceStores, workspaceIssues, workspaceDrafts, workspaceRuns, workspaceReports, workspaceActivity] = await Promise.all([
    listWorkspaceStores(workspaceId),
    listWorkspaceIssues(workspaceId),
    listWorkspaceDrafts(workspaceId),
    listWorkspaceToolRuns(workspaceId, 8),
    listWorkspaceReports(workspaceId),
    listWorkspaceActivity(workspaceId, 12),
  ]);
  const measuredHealth = workspaceStores.map(store => store.healthScore).filter((score): score is number => typeof score === "number");
  const statusCounts = workspaceIssues.reduce<Record<string, number>>((counts, issue) => { counts[issue.status] = (counts[issue.status] ?? 0) + 1; return counts; }, {});
  return {
    stores: { total: workspaceStores.length, connected: workspaceStores.filter(store => store.status === "connected").length, attention: workspaceStores.filter(store => store.status === "attention").length, records: workspaceStores },
    health: { average: measuredHealth.length ? Math.round(measuredHealth.reduce((total, score) => total + score, 0) / measuredHealth.length) : null, measuredStoreCount: measuredHealth.length },
    issues: { total: workspaceIssues.length, open: statusCounts.open ?? 0, inProgress: statusCounts.in_progress ?? 0, resolved: statusCounts.resolved ?? 0, records: workspaceIssues.slice(0, 8) },
    drafts: { total: workspaceDrafts.length, active: workspaceDrafts.filter(draft => draft.status === "draft" || draft.status === "review").length, records: workspaceDrafts.slice(0, 8) },
    runs: { total: workspaceRuns.length, queued: workspaceRuns.filter(run => run.status === "queued").length, running: workspaceRuns.filter(run => run.status === "running").length, completed: workspaceRuns.filter(run => run.status === "completed").length, records: workspaceRuns },
    reports: { total: workspaceReports.length, records: workspaceReports.slice(0, 8) },
    activity: workspaceActivity,
  };
}
