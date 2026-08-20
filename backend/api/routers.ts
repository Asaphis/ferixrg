import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { listEditorDrafts, restoreEditorDraft, saveEditorDraft } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const editorTarget = z.object({
  storeId: z.string().min(1).max(128),
  pageId: z.string().min(1).max(256),
});

const draftInput = editorTarget.extend({
  title: z.string().min(1).max(160),
  label: z.string().min(1).max(160),
  score: z.number().int().min(0).max(100),
  scoreDelta: z.number().int().min(-100).max(100),
  tone: z.string().min(1).max(32),
  note: z.string().min(1).max(5000),
  designState: z.string().min(2).max(10000),
  isCurrent: z.boolean(),
});

export const appRouter = router({
  // If a real-time transport is needed, register it in backend/api/_core/index.ts. API routes must start with '/api/' so the gateway can route them correctly.
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  editorDrafts: router({
    list: protectedProcedure.input(editorTarget).query(({ ctx, input }) => listEditorDrafts(ctx.user.id, input.storeId, input.pageId)),
    save: protectedProcedure.input(draftInput).mutation(({ ctx, input }) => saveEditorDraft(ctx.user.id, { ...input, isCurrent: input.isCurrent ? 1 : 0 })),
    restore: protectedProcedure.input(editorTarget.extend({ draftId: z.number().int().positive() })).mutation(({ ctx, input }) => restoreEditorDraft(ctx.user.id, input.draftId, input.storeId, input.pageId)),
  }),
});

export type AppRouter = typeof appRouter;
