import { randomBytes, createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  acceptWorkspaceInvitation,
  acknowledgeResource,
  approveWorkspaceReleaseAction,
  cancelWorkspaceInvitation,
  cancelWorkspaceReleaseAction,
  beginStoreConnection,
  completeWorkspaceToolRun,
  createWorkspaceDeveloperHandoff,
  createWorkspaceEvidence,
  createWorkspaceIssue,
  createWorkspaceReport,
  createWorkspaceReleaseAction,
  createStoreSnapshot,
  createWorkspaceDraft,
  createWorkspaceDraftAsset,
  createWorkspaceInvitation,
  createWorkspaceStore,
  createWorkspaceRequest,
  ensurePersonalWorkspace,
  getWorkspaceReport,
  getWorkspaceSubscription,
  getWorkspaceUsageSummary,
  getWorkspaceStore,
  getWorkspaceDashboardReadModel,
  getWorkspaceDraftVersion,
  getWorkspaceAiNeuronUsageSince,
  getWorkspaceReleaseEligibility,
  getWorkspaceToolRun,
  listUserWorkspaces,
  listLegalDocuments,
  listWorkspaceActivity,
  listWorkspaceDeveloperHandoffs,
  listWorkspaceDrafts,
  listWorkspaceDraftAssets,
  listWorkspaceDraftVersions,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  listWorkspaceReleases,
  listWorkspaceValidationRuns,
  listWorkspaceReports,
  listWorkspaceRequests,
  listWorkspaceStores,
  listStoreConnections,
  listStoreSnapshots,
  listWorkspaceToolRuns,
  listWorkspaceToolEvidence,
  listWorkspaceUsage,
  listWorkspaceIssues,
  failWorkspaceToolRun,
  queueWorkspaceToolRun,
  queueWorkspaceValidationRun,
  recordWorkspaceActivity,
  recordWorkspaceUsage,
  removeWorkspaceMember,
  restoreWorkspaceDraftVersion,
  saveWorkspaceDraftVersion,
  startWorkspaceToolRun,
  startWorkspaceValidationRun,
  completeWorkspaceValidationRun,
  updateWorkspaceIssueStatus,
  updateWorkspaceInvitationRole,
  updateWorkspaceMemberRole,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storageGet, storagePut } from "../storage";
import { requireWorkspaceAccess } from "../workspaceAccess";
import { connectionRequiredToolIds, isCanonicalToolId } from "../../shared/toolRegistry";

const dedicatedPublicUrlExecutorToolIds = new Set([
  "storefront-analyzer",
  "heading-structure-analyzer",
  "image-seo-analyzer",
  "seo-analyzer",
  "accessibility-analyzer",
  "site-structure-analyzer",
  "navigation-analyzer",
  "performance-analyzer",
  "cta-analyzer",
  "content-quality-analyzer",
  "product-page-analyzer",
  "image-optimization-analyzer",
  "asset-analyzer",
  "responsive-analyzer",
  "mobile-ux-analyzer",
  "trust-credibility-analyzer",
  "ux-analyzer",
  "color-contrast-analyzer",
  "typography-analyzer",
  "conversion-analyzer",
  "breakpoint-analyzer",
  "collection-analyzer",
  "product-presentation-analyzer",
  "product-content-analyzer",
  "cart-analyzer",
  "checkout-ux-analyzer",
  "customer-journey-analyzer",
  "layout-analyzer",
  "visual-design-analyzer",
  "visual-hierarchy-analyzer",
]);
import { CloudflareAiError } from "../cloudflareAi";
import { listCentralAiReadiness, runContentImproverThroughGateway, runDesignCopilotThroughGateway, runMarketingCopyThroughGateway, runProductDescriptionGeneratorThroughGateway } from "../aiGateway";
import { getStoreProviderAdapter, listStoreProviderReadiness } from "../storeProviders";
import { inspectPublicUrl } from "../publicUrlExecutor";

const workspaceInput = z.object({ workspaceId: z.number().int().positive() });
const invitationRole = z.enum(["admin", "editor", "viewer", "billing"]);
const platform = z.enum(["shopify", "woocommerce", "magento", "custom", "public_url"]);
const CLOUDFLARE_FREE_DAILY_NEURON_LIMIT = 10_000;
const CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE = 125;

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
    providerReadiness: protectedProcedure.query(() => listStoreProviderReadiness()),
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
        const store = await getWorkspaceStore(input.workspaceId, input.storeId);
        if (!store) throw new Error("workspace permission denied");
        const adapter = getStoreProviderAdapter(input.provider);
        const readiness = adapter.readiness();
        if (!readiness.configured) throw new TRPCError({ code: "PRECONDITION_FAILED", message: readiness.message });
        const connection = await beginStoreConnection({ storeId: input.storeId, provider: input.provider, scopes: input.scopes });
        const authorization = adapter.beginAuthorization({ storeUrl: store.url ?? "", requestedScopes: input.scopes ?? [] });
        await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "store.connection_requested", entityType: "store_connection", entityId: String(connection?.id ?? input.storeId), details: { storeId: input.storeId, provider: input.provider, configured: readiness.configured } });
        return { ...connection, readiness, authorization };
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
  usageSummary: protectedProcedure.input(workspaceInput).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "billing");
      return getWorkspaceUsageSummary(input.workspaceId);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  requests: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceRequests(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  submitRequest: protectedProcedure.input(workspaceInput.extend({ type: z.enum(["platform_request", "support", "problem", "feedback", "feature_request"]), subject: z.string().trim().min(3).max(255), message: z.string().trim().min(3).max(10_000), context: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return createWorkspaceRequest({ ...input, submittedByUserId: ctx.user.id });
    } catch (error) {
      return toForbidden(error);
    }
  }),
  legalDocuments: protectedProcedure.input(z.object({ documentKey: z.enum(["terms", "privacy"]) })).query(async ({ input }) => listLegalDocuments(input.documentKey)),
  acknowledgeResource: protectedProcedure.input(z.object({ resourceKey: z.string().trim().min(2).max(128) })).mutation(async ({ ctx, input }) => acknowledgeResource({ userId: ctx.user.id, resourceKey: input.resourceKey })),
  aiProviderReadiness: protectedProcedure.query(() => listCentralAiReadiness()),
  designCopilot: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), message: z.string().trim().min(1).max(12_000), context: z.record(z.string(), z.string().max(500)).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "ai-design-copilot") throw new TRPCError({ code: "BAD_REQUEST", message: "Design Copilot must run from an active AI Design Copilot tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Design Copilot has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runDesignCopilotThroughGateway({ message: input.message, ...(input.context ? { context: input.context } : {}) });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "design_copilot", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.design_copilot.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  aiStoreRedesign: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), message: z.string().trim().min(1).max(11_500), context: z.record(z.string(), z.string().max(500)).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "ai-store-redesign") throw new TRPCError({ code: "BAD_REQUEST", message: "AI Store Redesign must run from an active AI Store Redesign tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI Store Redesign has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runDesignCopilotThroughGateway({ message: `Create a reviewable storefront redesign proposal only. Do not claim that changes were applied, published, accessed, or inspected.\n\n${input.message}`, context: { ...(input.context ?? {}), operation: "AI Store Redesign" } });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "ai_store_redesign", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.store_redesign.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  visualStyleStudio: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), message: z.string().trim().min(1).max(11_500), context: z.record(z.string(), z.string().max(500)).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "visual-style-studio") throw new TRPCError({ code: "BAD_REQUEST", message: "Visual Style Studio must run from an active Visual Style Studio tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Visual Style Studio has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runDesignCopilotThroughGateway({ message: `Create a reviewable visual-style proposal only. Preserve the user’s manual control and do not claim that changes were applied, published, accessed, or inspected.\n\n${input.message}`, context: { ...(input.context ?? {}), operation: "Visual Style Studio" } });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "visual_style_studio", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.visual_style_studio.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  responsiveStudio: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), message: z.string().trim().min(1).max(11_500), context: z.record(z.string(), z.string().max(500)).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "responsive-studio") throw new TRPCError({ code: "BAD_REQUEST", message: "Responsive Studio must run from an active Responsive Studio tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Responsive Studio has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runDesignCopilotThroughGateway({ message: `Create a reviewable responsive-layout proposal only. Preserve the user’s manual device controls and do not claim that changes were applied, published, accessed, tested, or inspected.\n\n${input.message}`, context: { ...(input.context ?? {}), operation: "Responsive Studio" } });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "responsive_studio", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.responsive_studio.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  layoutComposer: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), message: z.string().trim().min(1).max(11_500), context: z.record(z.string(), z.string().max(500)).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "layout-composer") throw new TRPCError({ code: "BAD_REQUEST", message: "Layout Composer must run from an active Layout Composer tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Layout Composer has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runDesignCopilotThroughGateway({ message: `Create a reviewable layout proposal only. Preserve the user’s manual arrangement controls and do not claim that changes were applied, published, accessed, or inspected.\n\n${input.message}`, context: { ...(input.context ?? {}), operation: "Layout Composer" } });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "layout_composer", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.layout_composer.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  contentEditorProposal: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), sourceText: z.string().trim().min(1).max(12_000), instruction: z.string().trim().min(1).max(600).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "content-editor") throw new TRPCError({ code: "BAD_REQUEST", message: "Content Editor must run from an active Content Editor tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Content Editor has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runContentImproverThroughGateway({ sourceText: input.sourceText, instruction: input.instruction ?? "Return a reviewable revision that preserves factual meaning and keeps the user in control of the manual editor." });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "content_editor", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.content_editor.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null, sourceTextLength: input.sourceText.length } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  contentImprove: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), sourceText: z.string().trim().min(1).max(12_000), instruction: z.string().trim().min(1).max(600).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "ai-content-improver") throw new TRPCError({ code: "BAD_REQUEST", message: "Content Improver must run from an active AI Content Improver tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Content Improver has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runContentImproverThroughGateway({ sourceText: input.sourceText, ...(input.instruction ? { instruction: input.instruction } : {}) });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "content_improver", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.content_improver.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null, sourceTextLength: input.sourceText.length } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  generateProductDescription: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), productFacts: z.string().trim().min(1).max(12_000), instruction: z.string().trim().min(1).max(600).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== "product-description-generator") throw new TRPCError({ code: "BAD_REQUEST", message: "Product Description Generator must run from an active Product Description Generator tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Product Description Generator has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runProductDescriptionGeneratorThroughGateway({ productFacts: input.productFacts, ...(input.instruction ? { instruction: input.instruction } : {}) });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: "product_description_generator", ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.product_description_generator.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null, productFactsLength: input.productFacts.length } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
      return toForbidden(error);
    }
  }),
  generateMarketingCopy: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive().optional(), draftId: z.number().int().positive().optional(), mode: z.enum(["cta-generator", "seo-content-generator", "meta-generator"]), sourceFacts: z.string().trim().min(1).max(12_000), instruction: z.string().trim().min(1).max(600).optional() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      if (input.toolRunId) {
        const run = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
        if (!run || run.toolId !== input.mode) throw new TRPCError({ code: "BAD_REQUEST", message: "This copy generator must run from an active matching FerixRG tool run." });
      }
      if (input.draftId && !(await listWorkspaceDraftVersions(input.workspaceId, input.draftId))) throw new Error("workspace permission denied");
      const now = new Date();
      const utcDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const usedNeurons = await getWorkspaceAiNeuronUsageSince(input.workspaceId, utcDayStart);
      if (usedNeurons > CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - CLOUDFLARE_MAX_REQUEST_NEURON_RESERVE) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This copy generator has reached the protected free daily capacity for this workspace. It resets at 00:00 UTC." });
      const response = await runMarketingCopyThroughGateway({ mode: input.mode, sourceFacts: input.sourceFacts, ...(input.instruction ? { instruction: input.instruction } : {}) });
      const billedNeurons = Math.max(1, Math.ceil(response.neurons ?? 1));
      await recordWorkspaceUsage({ workspaceId: input.workspaceId, userId: ctx.user.id, category: "ai", quantity: billedNeurons, unit: "neurons", provider: response.provider, referenceType: `marketing_copy:${input.mode}`, ...(input.toolRunId ? { referenceId: String(input.toolRunId) } : {}) });
      await recordWorkspaceActivity({ workspaceId: input.workspaceId, actorUserId: ctx.user.id, eventType: "ai.marketing_copy.completed", entityType: "ai_request", entityId: input.toolRunId ? String(input.toolRunId) : "workspace", details: { provider: response.provider, model: response.model, neurons: billedNeurons, promptTokens: response.promptTokens, completionTokens: response.completionTokens, toolRunId: input.toolRunId ?? null, draftId: input.draftId ?? null, mode: input.mode, sourceFactsLength: input.sourceFacts.length } });
      return { response: response.response, model: response.model, neurons: billedNeurons, remainingEstimatedNeurons: Math.max(0, CLOUDFLARE_FREE_DAILY_NEURON_LIMIT - usedNeurons - billedNeurons) };
    } catch (error) {
      if (error instanceof CloudflareAiError) throw new TRPCError({ code: error.code === "invalid_input" ? "BAD_REQUEST" : "PRECONDITION_FAILED", message: error.message });
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
  executePublicUrlToolRun: protectedProcedure.input(workspaceInput.extend({ toolRunId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const existing = await getWorkspaceToolRun(input.workspaceId, input.toolRunId);
      if (!existing || existing.sourceType !== "public_url") throw new TRPCError({ code: "BAD_REQUEST", message: "This executor is available only for a queued or running public URL tool run." });
      const inputSummary = (existing.inputSummary ?? {}) as Record<string, unknown>;
      const sourceUrl = typeof inputSummary.url === "string" ? inputSummary.url : undefined;
      if (!sourceUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "This public URL tool run does not contain a valid source URL." });
      const running = existing.status === "queued" ? await startWorkspaceToolRun({ workspaceId: input.workspaceId, toolRunId: input.toolRunId, actorUserId: ctx.user.id }) : existing;
      if (!running || running.status !== "running") throw new TRPCError({ code: "BAD_REQUEST", message: "Only queued or running public URL tool runs can execute." });
      if (!dedicatedPublicUrlExecutorToolIds.has(running.toolId)) {
        const message = "This tool does not yet have a dedicated public-URL executor. Choose a supported source or wait for its specific executor to be released.";
        await failWorkspaceToolRun({ workspaceId: input.workspaceId, toolRunId: input.toolRunId, actorUserId: ctx.user.id, errorMessage: message });
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
      try {
        const inspection = await inspectPublicUrl(sourceUrl);
        const evidence = await createWorkspaceEvidence({ workspaceId: input.workspaceId, toolRunId: input.toolRunId, kind: "page_capture", title: "Observed public URL inspection", sourceUrl: inspection.url, details: inspection, actorUserId: ctx.user.id });
        const observedIssueInputs: Array<{ title: string; severity: "medium" | "low"; details: Record<string, unknown> }> = [];
        if (!inspection.hasViewport) observedIssueInputs.push({ title: "Viewport metadata is not declared", severity: "medium", details: { observed: "viewport meta tag absent" } });
        if (inspection.imagesWithoutAlt > 0) observedIssueInputs.push({ title: `${inspection.imagesWithoutAlt} observed image${inspection.imagesWithoutAlt === 1 ? "" : "s"} lack alternative text`, severity: "medium", details: { observed: "img tag without alt", count: inspection.imagesWithoutAlt } });
        if (running.toolId === "heading-structure-analyzer" && !inspection.headings.some(heading => heading.level === 1)) observedIssueInputs.push({ title: "No H1 heading was observed", severity: "medium", details: { observed: "no h1 element", headingCount: inspection.headingCount } });
        if (running.toolId === "navigation-analyzer" && inspection.navigationLandmarkCount === 0) observedIssueInputs.push({ title: "No navigation landmark was observed", severity: "low", details: { observed: "no nav element", linkCount: inspection.linkCount } });
        if (running.toolId === "navigation-analyzer" && inspection.linksWithoutText > 0) observedIssueInputs.push({ title: `${inspection.linksWithoutText} observed link${inspection.linksWithoutText === 1 ? " has" : "s have"} no text content`, severity: "low", details: { observed: "anchor element without text content", count: inspection.linksWithoutText } });
        if (running.toolId === "performance-analyzer" && inspection.fetchAndReadDurationMs >= 3_000) observedIssueInputs.push({ title: `Observed public URL fetch and read took ${inspection.fetchAndReadDurationMs} ms`, severity: "low", details: { observed: "server-side fetch and bounded document-read duration", durationMs: inspection.fetchAndReadDurationMs, bytesRead: inspection.bytesRead, thresholdMs: 3_000 } });
        if (running.toolId === "cta-analyzer" && inspection.ctaElementsWithText === 0) observedIssueInputs.push({ title: "No anchor or button element with text was observed", severity: "low", details: { observed: "no text-bearing anchor or button element", elementCount: inspection.ctaElementCount } });
        if (running.toolId === "cta-analyzer" && inspection.ctaElementsWithoutText > 0) observedIssueInputs.push({ title: `${inspection.ctaElementsWithoutText} observed anchor or button element${inspection.ctaElementsWithoutText === 1 ? " has" : "s have"} no text content`, severity: "low", details: { observed: "anchor or button element without text content", count: inspection.ctaElementsWithoutText } });
        if (running.toolId === "content-quality-analyzer" && inspection.bodyTextWordCount === 0) observedIssueInputs.push({ title: "No body text was observed", severity: "low", details: { observed: "no extracted body text", paragraphCount: inspection.paragraphCount } });
        if (running.toolId === "content-quality-analyzer" && inspection.emptyHeadingCount > 0) observedIssueInputs.push({ title: `${inspection.emptyHeadingCount} observed heading${inspection.emptyHeadingCount === 1 ? " has" : "s have"} no text content`, severity: "low", details: { observed: "heading element without text content", count: inspection.emptyHeadingCount } });
        if (running.toolId === "product-page-analyzer" && inspection.productStructuredDataCount === 0) observedIssueInputs.push({ title: "No Product JSON-LD declaration was observed", severity: "low", details: { observed: "no parsed Product structured-data node" } });
        if (running.toolId === "image-optimization-analyzer" && inspection.imagesWithoutDimensions > 0) observedIssueInputs.push({ title: `${inspection.imagesWithoutDimensions} observed image${inspection.imagesWithoutDimensions === 1 ? " lacks" : "s lack"} both width and height attributes`, severity: "low", details: { observed: "img element without both width and height attributes", count: inspection.imagesWithoutDimensions } });
        if (running.toolId === "asset-analyzer" && inspection.assetReferenceCount === 0) observedIssueInputs.push({ title: "No image, stylesheet, or script references were observed", severity: "low", details: { observed: "no src or stylesheet href reference" } });
        if (running.toolId === "responsive-analyzer" && !inspection.hasViewport) observedIssueInputs.push({ title: "No viewport metadata was observed", severity: "medium", details: { observed: "viewport meta tag absent" } });
        if (running.toolId === "mobile-ux-analyzer" && !inspection.hasViewport) observedIssueInputs.push({ title: "No viewport metadata was observed", severity: "medium", details: { observed: "viewport meta tag absent" } });
        if (running.toolId === "trust-credibility-analyzer" && inspection.organizationStructuredDataCount + inspection.reviewStructuredDataCount + inspection.aggregateRatingStructuredDataCount === 0) observedIssueInputs.push({ title: "No Organization, Review, or AggregateRating JSON-LD declaration was observed", severity: "low", details: { observed: "no parsed credibility-related JSON-LD declaration" } });
        if (running.toolId === "ux-analyzer" && inspection.skipLinkCount === 0) observedIssueInputs.push({ title: "No skip-link markup was observed", severity: "low", details: { observed: "no same-page link with visible text beginning with Skip" } });
        if (running.toolId === "color-contrast-analyzer" && inspection.inlineColorDeclarationCount + inspection.styleBlockColorDeclarationCount === 0) observedIssueInputs.push({ title: "No supported CSS color declaration was observed", severity: "low", details: { observed: "no inline-style or style-block color declaration" } });
        if (running.toolId === "typography-analyzer" && inspection.inlineFontFamilyDeclarationCount + inspection.styleBlockFontFamilyDeclarationCount === 0) observedIssueInputs.push({ title: "No font-family declaration was observed", severity: "low", details: { observed: "no inline-style or style-block font-family declaration" } });
        if (running.toolId === "conversion-analyzer" && inspection.cartLinkCount + inspection.checkoutLinkCount + inspection.cartOrCheckoutFormActionCount === 0) observedIssueInputs.push({ title: "No cart or checkout link or form action was observed", severity: "low", details: { observed: "no cart or checkout path in href or form action" } });
        if (running.toolId === "breakpoint-analyzer" && inspection.mediaQueryConditionCount === 0) observedIssueInputs.push({ title: "No media-query condition was observed", severity: "low", details: { observed: "no @media condition in style blocks" } });
        if (running.toolId === "collection-analyzer" && inspection.collectionLinkCount === 0) observedIssueInputs.push({ title: "No collection-path link was observed", severity: "low", details: { observed: "no collection or collections path in href" } });
        if (running.toolId === "product-presentation-analyzer" && inspection.productImageStructuredDataCount === 0) observedIssueInputs.push({ title: "No Product JSON-LD image declaration was observed", severity: "low", details: { observed: "no parsed Product image declaration" } });
        if (running.toolId === "product-content-analyzer" && inspection.productDescriptionStructuredDataCount === 0) observedIssueInputs.push({ title: "No Product JSON-LD description declaration was observed", severity: "low", details: { observed: "no parsed Product description declaration" } });
        if (running.toolId === "cart-analyzer" && inspection.cartLinkCount + inspection.cartFormActionCount === 0) observedIssueInputs.push({ title: "No cart-path link or cart form action was observed", severity: "low", details: { observed: "no cart path in href or form action" } });
        if (running.toolId === "checkout-ux-analyzer" && inspection.checkoutLinkCount + inspection.checkoutFormActionCount === 0) observedIssueInputs.push({ title: "No checkout-path link or checkout form action was observed", severity: "low", details: { observed: "no checkout path in href or form action" } });
        if (running.toolId === "customer-journey-analyzer" && inspection.productLinkCount + inspection.collectionLinkCount + inspection.cartLinkCount + inspection.checkoutLinkCount === 0) observedIssueInputs.push({ title: "No product, collection, cart, or checkout link path was observed", severity: "low", details: { observed: "no supported journey path in href" } });
        if (running.toolId === "layout-analyzer" && inspection.semanticLayoutElementCount === 0) observedIssueInputs.push({ title: "No semantic layout element was observed", severity: "low", details: { observed: "no header, main, footer, section, or article element" } });
        if (running.toolId === "visual-design-analyzer" && inspection.inlineStyleBlockCount + inspection.inlineColorDeclarationCount + inspection.styleBlockColorDeclarationCount + inspection.inlineFontFamilyDeclarationCount + inspection.styleBlockFontFamilyDeclarationCount === 0) observedIssueInputs.push({ title: "No inline style, color, or font declaration was observed", severity: "low", details: { observed: "no supported style declaration in fetched markup" } });
        if (running.toolId === "visual-hierarchy-analyzer" && inspection.headingCount + inspection.ctaElementsWithText === 0) observedIssueInputs.push({ title: "No heading or text-bearing interactive element was observed", severity: "low", details: { observed: "no heading and no text-bearing anchor or button element" } });
        if (!inspection.canonicalUrl) observedIssueInputs.push({ title: "Canonical URL is not declared", severity: "low", details: { observed: "canonical link absent" } });
        if (inspection.metaDescriptionLength === 0) observedIssueInputs.push({ title: "Meta description markup is not declared", severity: "low", details: { observed: "meta description tag absent" } });
        const issues = await Promise.all(observedIssueInputs.map(issue => createWorkspaceIssue({ workspaceId: input.workspaceId, storeId: running.storeId ?? undefined, toolRunId: input.toolRunId, title: issue.title, severity: issue.severity, location: inspection.url, details: { ...issue.details, evidenceId: evidence?.id ?? null, inspectionUrl: inspection.url }, actorUserId: ctx.user.id })));
        const issueRecords = issues.filter((issue): issue is NonNullable<typeof issue> => issue !== undefined).map(issue => ({ id: issue.id, title: issue.title, severity: issue.severity }));
        const execution = running.toolId === "heading-structure-analyzer" ? "deterministic_heading_structure_inspection" : running.toolId === "image-seo-analyzer" ? "deterministic_image_seo_inspection" : running.toolId === "seo-analyzer" ? "deterministic_seo_metadata_inspection" : running.toolId === "accessibility-analyzer" ? "deterministic_accessibility_indicator_inspection" : running.toolId === "site-structure-analyzer" ? "deterministic_site_structure_indicator_inspection" : running.toolId === "navigation-analyzer" ? "deterministic_navigation_indicator_inspection" : running.toolId === "performance-analyzer" ? "deterministic_fetch_and_document_size_inspection" : running.toolId === "cta-analyzer" ? "deterministic_interactive_text_inspection" : running.toolId === "content-quality-analyzer" ? "deterministic_extracted_text_inspection" : running.toolId === "product-page-analyzer" ? "deterministic_product_json_ld_inspection" : running.toolId === "image-optimization-analyzer" ? "deterministic_image_markup_inspection" : running.toolId === "asset-analyzer" ? "deterministic_asset_reference_inspection" : running.toolId === "responsive-analyzer" ? "deterministic_responsive_markup_inspection" : running.toolId === "mobile-ux-analyzer" ? "deterministic_mobile_markup_inspection" : running.toolId === "trust-credibility-analyzer" ? "deterministic_credibility_structured_data_inspection" : running.toolId === "ux-analyzer" ? "deterministic_ux_markup_inspection" : running.toolId === "color-contrast-analyzer" ? "deterministic_color_style_declaration_inspection" : running.toolId === "typography-analyzer" ? "deterministic_typography_font_family_inspection" : running.toolId === "conversion-analyzer" ? "deterministic_commerce_path_markup_inspection" : running.toolId === "breakpoint-analyzer" ? "deterministic_media_query_condition_inspection" : running.toolId === "collection-analyzer" ? "deterministic_collection_path_link_inspection" : running.toolId === "product-presentation-analyzer" ? "deterministic_product_image_markup_inspection" : running.toolId === "product-content-analyzer" ? "deterministic_product_content_declaration_inspection" : running.toolId === "cart-analyzer" ? "deterministic_cart_path_markup_inspection" : running.toolId === "checkout-ux-analyzer" ? "deterministic_checkout_path_markup_inspection" : running.toolId === "customer-journey-analyzer" ? "deterministic_journey_path_link_inspection" : running.toolId === "layout-analyzer" ? "deterministic_semantic_layout_markup_inspection" : running.toolId === "visual-design-analyzer" ? "deterministic_observed_style_declaration_inspection" : running.toolId === "visual-hierarchy-analyzer" ? "deterministic_heading_and_interactive_markup_inspection" : "deterministic_public_url_inspection";
        const resultSummary = { execution, toolId: running.toolId, inspection, observedIssueIds: issueRecords.map(issue => issue.id) };
        const reportJson = JSON.stringify({ generatedAt: new Date().toISOString(), toolRunId: input.toolRunId, toolId: running.toolId, source: { type: "public_url", url: inspection.url }, inspection, observedIssues: issueRecords }, null, 2);
        const upload = await storagePut(`workspace-${input.workspaceId}/tool-runs/${input.toolRunId}/public-url-inspection.json`, Buffer.from(reportJson), "application/json");
        const report = await createWorkspaceReport({ workspaceId: input.workspaceId, toolRunId: input.toolRunId, title: `${running.toolId} public URL inspection`, format: "json", storageKey: upload.key, summary: "Evidence-derived public URL inspection export.", createdByUserId: ctx.user.id });
        const run = await completeWorkspaceToolRun({ workspaceId: input.workspaceId, toolRunId: input.toolRunId, actorUserId: ctx.user.id, resultSummary: { ...resultSummary, reportId: report?.id ?? null, evidenceId: evidence?.id ?? null } });
        return { run, inspection, issues: issueRecords, report: report ? { id: report.id, storageKey: upload.key, url: upload.url } : null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Public URL inspection failed.";
        await failWorkspaceToolRun({ workspaceId: input.workspaceId, toolRunId: input.toolRunId, actorUserId: ctx.user.id, errorMessage: message });
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error;
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
  reportDownload: protectedProcedure.input(workspaceInput.extend({ reportId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      const report = await getWorkspaceReport(input.workspaceId, input.reportId);
      if (!report) throw new Error("workspace permission denied");
      if (!report.storageKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This report record does not have a generated artifact yet." });
      const artifact = await storageGet(report.storageKey);
      return { reportId: report.id, format: report.format, url: artifact.url };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
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
  validationRuns: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceValidationRuns(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  queueValidationRun: protectedProcedure.input(workspaceInput.extend({ draftVersionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const run = await queueWorkspaceValidationRun({ ...input, actorUserId: ctx.user.id });
      if (!run) throw new Error("workspace permission denied");
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  startValidationRun: protectedProcedure.input(workspaceInput.extend({ validationRunId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const run = await startWorkspaceValidationRun({ ...input, actorUserId: ctx.user.id });
      if (!run) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a queued validation can be started." });
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  completeValidationRun: protectedProcedure.input(workspaceInput.extend({ validationRunId: z.number().int().positive(), passed: z.boolean(), summary: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const run = await completeWorkspaceValidationRun({ ...input, actorUserId: ctx.user.id });
      if (!run) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a queued or running validation can be completed." });
      return run;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  executeDraftIntegrityValidation: protectedProcedure.input(workspaceInput.extend({ validationRunId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
      const validationRun = (await listWorkspaceValidationRuns(input.workspaceId, 100)).find(run => run.id === input.validationRunId);
      if (!validationRun || (validationRun.status !== "queued" && validationRun.status !== "running")) throw new TRPCError({ code: "BAD_REQUEST", message: "Only queued or running validation records can be executed." });
      const running = validationRun.status === "queued" ? await startWorkspaceValidationRun({ workspaceId: input.workspaceId, validationRunId: input.validationRunId, actorUserId: ctx.user.id }) : validationRun;
      if (!running) throw new TRPCError({ code: "BAD_REQUEST", message: "This validation record could not be started." });
      const source = await getWorkspaceDraftVersion(input.workspaceId, running.draftVersionId);
      if (!source) throw new TRPCError({ code: "BAD_REQUEST", message: "The saved draft version is not available in this workspace." });
      let parsedState: unknown = null;
      try { parsedState = JSON.parse(source.version.designState); } catch { parsedState = null; }
      const checks = [
        { key: "saved_version", label: "Saved draft version is available", passed: Boolean(source.version.id && source.draft.id) },
        { key: "valid_design_state", label: "Saved design state is valid JSON", passed: parsedState !== null && typeof parsedState === "object" },
        { key: "version_metadata", label: "Version has a non-empty label", passed: Boolean(source.version.label?.trim()) },
      ];
      const passed = checks.every(check => check.passed);
      const summary = { validator: "deterministic_draft_integrity", draftId: source.draft.id, draftVersionId: source.version.id, passedChecks: checks.filter(check => check.passed).length, totalChecks: checks.length, checks, note: "This validates persisted draft integrity only. It does not certify visual quality, accessibility, SEO, provider permissions, publishing, or rollback." };
      const completed = await completeWorkspaceValidationRun({ workspaceId: input.workspaceId, validationRunId: input.validationRunId, actorUserId: ctx.user.id, passed, summary });
      if (!completed) throw new TRPCError({ code: "BAD_REQUEST", message: "This validation record could not be completed." });
      return completed;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      return toForbidden(error);
    }
  }),
  createReleaseAction: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive().optional(), draftVersionId: z.number().int().positive().optional(), actionType: z.enum(["export", "publish", "rollback"]) })).mutation(async ({ ctx, input }) => {
    try {
      const requiredRole = input.actionType === "export" ? "editor" : "admin";
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, requiredRole);
      if ((input.actionType === "publish" || input.actionType === "rollback") && input.storeId) {
        const hasSupportedConnection = (await listStoreConnections(input.storeId)).some(connection => connection.status === "connected");
        if (!hasSupportedConnection) throw new TRPCError({ code: "BAD_REQUEST", message: "A supported active store connection is required before this release action can be planned." });
      }
      const action = await createWorkspaceReleaseAction({ ...input, requestedByUserId: ctx.user.id });
      if (!action) throw new TRPCError({ code: "BAD_REQUEST", message: "This release plan is not eligible yet. Check validation, unresolved critical issues, connection status, and release history." });
      return action;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  releaseEligibility: protectedProcedure.input(workspaceInput.extend({ storeId: z.number().int().positive().optional(), draftVersionId: z.number().int().positive().optional(), actionType: z.enum(["export", "publish", "rollback"]) })).query(async ({ ctx, input }) => {
    try {
      const requiredRole = input.actionType === "export" ? "editor" : "admin";
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, requiredRole);
      return getWorkspaceReleaseEligibility(input);
    } catch (error) {
      return toForbidden(error);
    }
  }),
  approveReleaseAction: protectedProcedure.input(workspaceInput.extend({ releaseActionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      const action = await approveWorkspaceReleaseAction({ ...input, actorUserId: ctx.user.id });
      if (!action) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a pending release plan can be approved." });
      return action;
    } catch (error) {
      return toForbidden(error);
    }
  }),
  cancelReleaseAction: protectedProcedure.input(workspaceInput.extend({ releaseActionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "admin");
      const action = await cancelWorkspaceReleaseAction({ ...input, actorUserId: ctx.user.id });
      if (!action) throw new TRPCError({ code: "BAD_REQUEST", message: "Only a pending or approved release plan can be cancelled." });
      return action;
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
