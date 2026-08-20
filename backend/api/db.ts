import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityEvents,
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
