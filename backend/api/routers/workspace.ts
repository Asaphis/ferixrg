import { randomBytes, createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  acceptWorkspaceInvitation,
  cancelWorkspaceInvitation,
  beginStoreConnection,
  completeWorkspaceToolRun,
  createWorkspaceDeveloperHandoff,
  createWorkspaceEvidence,
  createWorkspaceIssue,
  createWorkspaceReport,
  createStoreSnapshot,
  createWorkspaceDraft,
  createWorkspaceDraftAsset,
  createWorkspaceInvitation,
  createWorkspaceStore,
  ensurePersonalWorkspace,
  getWorkspaceSubscription,
  getWorkspaceStore,
  getWorkspaceDashboardReadModel,
  getWorkspaceToolRun,
  listUserWorkspaces,
  listWorkspaceActivity,
  listWorkspaceDeveloperHandoffs,
  listWorkspaceDrafts,
  listWorkspaceDraftAssets,
  listWorkspaceDraftVersions,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  listWorkspaceReleases,
  listWorkspaceReports,
  listWorkspaceStores,
  listStoreConnections,
  listStoreSnapshots,
  listWorkspaceToolRuns,
  listWorkspaceToolEvidence,
  listWorkspaceUsage,
  listWorkspaceIssues,
  failWorkspaceToolRun,
  queueWorkspaceToolRun,
  recordWorkspaceActivity,
  removeWorkspaceMember,
  restoreWorkspaceDraftVersion,
  saveWorkspaceDraftVersion,
  startWorkspaceToolRun,
  updateWorkspaceIssueStatus,
  updateWorkspaceInvitationRole,
  updateWorkspaceMemberRole,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { requireWorkspaceAccess } from "../workspaceAccess";
import { connectionRequiredToolIds, isCanonicalToolId } from "../../shared/toolRegistry";

const workspaceInput = z.object({ workspaceId: z.number().int().positive() });
const invitationRole = z.enum(["admin", "editor", "viewer", "billing"]);
const platform = z.enum(["shopify", "woocommerce", "magento", "custom", "public_url"]);

function toForbidden(error: unknown): never {
  if (error instanceof Error && error.message.includes("permission")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this workspace." });
  }
  throw error;
}

export const workspaceRouter = router({
  bootstrap: protectedProcedure.query(async ({ ctx }) => ensurePersonalWorkspace(ctx.user)),
  list: protectedProcedure.query(({ ctx }) => listUserWorkspaces(ctx.user.id)),
  dashboard: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return getWorkspaceDashboardReadModel(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  members: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceMembers(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  invite: protectedProcedure
    .input(workspaceInput.extend({ email: z.string().email().max(320), role: invitationRole }))
    .mutation(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
        const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
        return createWorkspaceInvitation({
          workspaceId: input.workspaceId,
          invitedByUserId: ctx.user.id,
          email: input.email.toLowerCase(),
          role: input.role,
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });
      } catch (error) {
        return toForbidden(error);
      }
    }),
  invitations: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      return listWorkspaceInvitations(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  cancelInvitation: protectedProcedure.input(workspaceInput.extend({ invitationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      await cancelWorkspaceInvitation(input.workspaceId, input.invitationId, ctx.user.id);
      return { success: true } as const;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  updateInvitationRole: protectedProcedure.input(workspaceInput.extend({ invitationId: z.number().int().positive(), role: invitationRole })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      await updateWorkspaceInvitationRole({ ...input, actorUserId: ctx.user.id });
      return { success: true } as const;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  updateMemberRole: protectedProcedure.input(workspaceInput.extend({ memberId: z.number().int().positive(), role: invitationRole })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      await updateWorkspaceMemberRole({ ...input, actorUserId: ctx.user.id });
      return { success: true } as const;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  removeMember: protectedProcedure.input(workspaceInput.extend({ memberId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      await removeWorkspaceMember({ ...input, actorUserId: ctx.user.id });
      return { success: true } as const;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  acceptInvitation: protectedProcedure.input(z.object({ token: z.string().min(1).max(512) })).mutation(async ({ ctx, input }) => {
    const email = ctx.user.email;
    if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Add a verified email address before accepting a workspace invitation." });
    const invitation = await acceptWorkspaceInvitation({ tokenHash: createHash("sha256").update(input.token).digest("hex"), userId: ctx.user.id, email });
    if (!invitation) throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation is invalid, expired, or no longer available." });
    return { success: true, workspaceId: invitation.workspaceId } as const;
  }),
  stores: router({
    list: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
        return listWorkspaceStores(input.workspaceId);
      } catch (error) {
        return toForbidden(error);
      }
    }),
    create: protectedProcedure
      .input(workspaceInput.extend({ name: z.string().min(1).max(160), platform, url: z.string().url().max(2048) }))
      .mutation(async ({ ctx, input }) => {
        try {
          await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
          return createWorkspaceStore({ ...input, createdByUserId: ctx.user.id });
        } catch (error) {
          return toForbidden(error);
        }
      }),
    get: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
        return getWorkspaceStore(input.workspaceId, input.storeId);
      } catch (error) {
        return toForbidden(error);
      }
    }),
    snapshots: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
        if (!(await getWorkspaceStore(input.workspaceId, input.storeId))) throw new Error("workspace permission denied");
        return listStoreSnapshots(input.storeId);
      } catch (error) {
        return toForbidden(error);
      }
    }),
    connections: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
        if (!(await getWorkspaceStore(input.workspaceId, input.storeId))) throw new Error("workspace permission denied");
        return listStoreConnections(input.storeId);
      } catch (error) {
        return toForbidden(error);
      }
    }),
    createPublicUrlSource: protectedProcedure.input(workspaceInput.extend({ name: z.string().trim().min(1).max(160), url: z.string().url().max(2048) })).mutation(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
        const store = await createWorkspaceStore({ workspaceId: input.workspaceId, name: input.name, platform: "public_url", url: input.url, createdByUserId: ctx.user.id });
        if (!store) throw new Error("Unable to create the public URL source");
        const snapshot = await createStoreSnapshot({ storeId: store.id, sourceType: "url_scan", sourceUrl: input.url, summary: "Public URL source recorded; analysis is queued separately." });
        await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "store.public_url_source_created", entityType: "store_snapshot", entityId: String(snapshot?.id ?? store.id), details: { storeId: store.id, url: input.url } });
        return { store, snapshot };
      } catch (error) {
        return toForbidden(error);
      }
    }),
    uploadSource: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive(), fileName: z.string().trim().min(1).max(180), mimeType: z.string().trim().min(3).max(120), contentBase64: z.string().min(4).max(11_000_000), sourceType: z.enum(["screenshot", "theme_export", "manual_upload"]) })).mutation(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
        if (!(await getWorkspaceStore(input.workspaceId, input.storeId))) throw new Error("workspace permission denied");
        const bytes = Buffer.from(input.contentBase64, "base64");
        if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid file up to 8 MB." });
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const upload = await storagePut(`workspace-${input.workspaceId}/store-${input.storeId}/sources/${safeName}`, bytes, input.mimeType);
        const snapshot = await createStoreSnapshot({ storeId: input.storeId, sourceType: input.sourceType, storageKey: upload.key, summary: `Uploaded source: ${safeName}` });
        await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "store.source_uploaded", entityType: "store_snapshot", entityId: String(snapshot?.id ?? input.storeId), details: { storeId: input.storeId, sourceType: input.sourceType, fileName: safeName } });
        return { snapshot, storage: { key: upload.key, url: upload.url } };
      } catch (error) {
        return toForbidden(error);
      }
    }),
    beginConnection: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive(), provider: z.enum(["shopify", "woocommerce", "magento", "custom"]), scopes: z.array(z.string().min(1).max(160)).max(32).optional() })).mutation(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
        if (!(await getWorkspaceStore(input.workspaceId, input.storeId))) throw new Error("workspace permission denied");
        const connection = await beginStoreConnection({ storeId: input.storeId, provider: input.provider, scopes: input.scopes });
        await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "store.connection_requested", entityType: "store_connection", entityId: String(connection?.id ?? input.storeId), details: { storeId: input.storeId, provider: input.provider } });
        return connection;
      } catch (error) {
        return toForbidden(error);
      }
    }),
  }),
  activity: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceActivity(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  usage: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(100) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "billing");
      return listWorkspaceUsage(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  subscription: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "billing");
      return getWorkspaceSubscription(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  toolRuns: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceToolRuns(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  queueToolRun: protectedProcedure
    .input(
      workspaceInput.extend({
        storeId: z.number().int().positive().optional(),
        draftId: z.number().int().positive().optional(),
        toolId: z.string().min(1).max(160).refine(isCanonicalToolId, "Use an approved FerixRG tool."),
        sourceType: z.enum(["public_url", "connected_store", "saved_draft", "upload", "manual"]),
        inputSummary: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
        if (connectionRequiredToolIds.has(input.toolId) && !input.storeId) throw new TRPCError({ code: "BAD_REQUEST", message: "This tool requires a supported connected store context." });
        if (input.storeId && !(await getWorkspaceStore(input.workspaceId, input.storeId))) throw new Error("workspace permission denied");
        if (connectionRequiredToolIds.has(input.toolId) && input.storeId) {
          const hasConnection = (await listStoreConnections(input.storeId)).some(connection => connection.status === "connected");
          if (!hasConnection) throw new TRPCError({ code: "BAD_REQUEST", message: "This tool becomes available after a supported store connection is active." });
        }
        return queueWorkspaceToolRun({ ...input, requestedByUserId: ctx.user.id });
      } catch (error) {
        return toForbidden(error);
      }
    }),
  toolRun: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
      if (!run) throw new Error("workspace permission denied");
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  startToolRun: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const run = await startWorkspaceToolRun({ ...input, actorUserId: ctx.user.id });
      if (!run) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a queued tool run can be started." });
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  completeToolRun: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive(), resultSummary: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const run = await completeWorkspaceToolRun({ ...input, actorUserId: ctx.user.id });
      if (!run) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a queued or running tool run can be completed." });
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  failToolRun: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive(), errorMessage: z.string().trim().min(1).max(20_000) })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const run = await failWorkspaceToolRun({ ...input, actorUserId: ctx.user.id });
      if (!run) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a queued or running tool run can fail." });
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  toolEvidence: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      const evidence = await listWorkspaceToolEvidence(input.workspaceId, input.toolRunId);
      if (!evidence) throw new Error("workspace permission denied");
      return evidence;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  addToolEvidence: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive(), kind: z.enum(["page_capture", "screenshot", "metric", "store_data", "validation", "provider_summary"]), title: z.string().trim().min(1).max(255), sourceUrl: z.string().url().max(2048).optional(), storageKey: z.string().max(512).optional(), details: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const evidence = await createWorkspaceEvidence({ ...input, actorUserId: ctx.user.id });
      if (!evidence) throw new Error("workspace permission denied");
      return evidence;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  issues: protectedProcedure.input(workspaceInput.extend({ status: z.enum(["open", "in_progress", "resolved", "ignored"]).optional() })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceIssues(input.workspaceId, input.status);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  createIssue: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive().optional(), toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), title: z.string().trim().min(1).max(255), severity: z.enum(["critical", "high", "medium", "low", "info"]), location: z.string().trim().max(1024).optional(), details: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const issue = await createWorkspaceIssue({ ...input, actorUserId: ctx.user.id });
      if (!issue) throw new Error("workspace permission denied");
      return issue;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  updateIssueStatus: protectedProcedure.input(workspaceInput.extend({ issueId: z.number().int().positive(), status: z.enum(["open", "in_progress", "resolved", "ignored"]) })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      await updateWorkspaceIssueStatus({ ...input, actorUserId: ctx.user.id });
      return { success: true } as const;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  reports: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceReports(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  createReport: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), title: z.string().trim().min(1).max(255), format: z.enum(["web", "pdf", "csv", "json", "zip"]), storageKey: z.string().max(512).optional(), summary: z.string().max(50_000).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const report = await createWorkspaceReport({ ...input, createdByUserId: ctx.user.id });
      if (!report) throw new Error("workspace permission denied");
      return report;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  developerHandoffs: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceDeveloperHandoffs(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  createDeveloperHandoff: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), issueId: z.number().int().positive().optional(), title: z.string().trim().min(1).max(255), affectedLocation: z.string().trim().min(1).max(1024), currentBehavior: z.string().trim().min(1).max(50_000), expectedBehavior: z.string().trim().min(1).max(50_000), recommendedImplementation: z.string().trim().min(1).max(50_000), priority: z.enum(["critical", "high", "medium", "low"]), acceptanceCriteria: z.array(z.string().trim().min(1).max(2_000)).min(1).max(50), evidenceIds: z.array(z.number().int().positive()).max(100).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const handoff = await createWorkspaceDeveloperHandoff({ ...input, createdByUserId: ctx.user.id });
      if (!handoff) throw new Error("workspace permission denied");
      return handoff;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  drafts: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceDrafts(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  draftVersions: protectedProcedure.input(workspaceInput.extend({ draftId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      const result = await listWorkspaceDraftVersions(input.workspaceId, input.draftId);
      if (!result) throw new Error("workspace permission denied");
      return result;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  createDraft: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive().optional(), title: z.string().trim().min(1).max(160), source: z.enum(["manual", "tool", "ai", "import"]).default("manual"), label: z.string().trim().min(1).max(160), note: z.string().max(20_000).optional(), designState: z.string().min(2).max(100_000), createdByType: z.enum(["user", "ai", "system"]).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.storeId && !(await getWorkspaceStore(input.workspaceId, input.storeId))) throw new Error("workspace permission denied");
      return createWorkspaceDraft({ ...input, createdByUserId: ctx.user.id });
    } catch (error) {
      return toForbidden(error);
    }
  }),
  saveDraftVersion: protectedProcedure.input(workspaceInput.extend({ draftId: z.number().int().positive(), label: z.string().trim().min(1).max(160), note: z.string().max(20_000).optional(), designState: z.string().min(2).max(100_000), createdByType: z.enum(["user", "ai", "system"]).optional(), previewStorageKey: z.string().max(512).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const version = await saveWorkspaceDraftVersion({ ...input, createdByUserId: ctx.user.id });
      if (!version) throw new Error("workspace permission denied");
      return version;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  restoreDraftVersion: protectedProcedure.input(workspaceInput.extend({ draftId: z.number().int().positive(), versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const version = await restoreWorkspaceDraftVersion({ ...input, actorUserId: ctx.user.id });
      if (!version) throw new Error("workspace permission denied");
      return version;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  draftAssets: protectedProcedure.input(workspaceInput.extend({ draftId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      const assets = await listWorkspaceDraftAssets(input.workspaceId, input.draftId);
      if (!assets) throw new Error("workspace permission denied");
      return assets;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  uploadDraftAsset: protectedProcedure.input(workspaceInput.extend({ draftId: z.number().int().positive(), draftVersionId: z.number().int().positive().optional(), kind: z.enum(["reference", "screenshot", "theme_export", "preview", "manual_upload"]), fileName: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(3).max(120), contentBase64: z.string().min(4).max(11_000_000) })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const bytes = Buffer.from(input.contentBase64, "base64");
      if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid file up to 8 MB." });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const upload = await storagePut(`workspace-${input.workspaceId}/draft-${input.draftId}/assets/${safeName}`, bytes, input.mimeType);
      const asset = await createWorkspaceDraftAsset({ workspaceId: input.workspaceId, draftId: input.draftId, draftVersionId: input.draftVersionId, kind: input.kind, storageKey: upload.key, fileName: safeName, mimeType: input.mimeType, createdByUserId: ctx.user.id });
      if (!asset) throw new Error("workspace permission denied");
      return { asset, storage: { key: upload.key, url: upload.url } };
    } catch (error) {
      return toForbidden(error);
    }
  }),
  releases: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceReleases(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
});
