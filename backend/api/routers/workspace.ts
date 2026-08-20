import { randomBytes, createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  cancelWorkspaceInvitation,
  createWorkspaceInvitation,
  createWorkspaceStore,
  ensurePersonalWorkspace,
  getWorkspaceSubscription,
  listUserWorkspaces,
  listWorkspaceActivity,
  listWorkspaceDrafts,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  listWorkspaceReleases,
  listWorkspaceStores,
  listWorkspaceToolRuns,
  listWorkspaceUsage,
  queueWorkspaceToolRun,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { requireWorkspaceAccess } from "../workspaceAccess";

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
        toolId: z.string().min(1).max(160),
        sourceType: z.enum(["public_url", "connected_store", "saved_draft", "upload", "manual"]),
        inputSummary: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await requireWorkspaceAccess(ctx.user.id, input.workspaceId, "editor");
        return queueWorkspaceToolRun({ ...input, requestedByUserId: ctx.user.id });
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
  releases: protectedProcedure.input(workspaceInput.extend({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    try {
      await requireWorkspaceAccess(ctx.user.id, input.workspaceId);
      return listWorkspaceReleases(input.workspaceId, input.limit);
    } catch (error) {
      return toForbidden(error);
    }
  }),
});
