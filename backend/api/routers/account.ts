import { z } from "zod";
import { getAccountProfile, listAccountIdentities, updateAccountProfile } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const accountRouter = router({
  profile: protectedProcedure.query(({ ctx }) => getAccountProfile(ctx.user.id)),
  identities: protectedProcedure.query(({ ctx }) => listAccountIdentities(ctx.user.id)),
  updateProfile: protectedProcedure
    .input(
      z
        .object({
          name: z.string().trim().min(1).max(160).optional(),
          email: z.string().email().max(320).optional(),
        })
        .refine(input => input.name !== undefined || input.email !== undefined, "Provide at least one account field to update."),
    )
    .mutation(({ ctx, input }) => updateAccountProfile(ctx.user.id, input)),
});
