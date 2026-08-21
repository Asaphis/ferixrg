import { z } from "zod";
import { beginAccountEmailChange, confirmTwoStepAuthenticator, getAccountProfile, getTwoStepAuthenticator, getUserPreferences, issueAccountToken, listAccountIdentities, listAccountSecurityEvents, listAccountSessions, recordAccountSecurityEvent, revokeAccountSession, revokeOtherAccountSessions, savePendingTwoStepAuthenticator, updateAccountProfile, updateUserPreferences } from "../db";
import { createAccountToken, createTwoStepEnrollmentSecret, createTwoStepRecoveryCodes, encryptTwoStepSecret, decryptTwoStepSecret, hashAccountToken, normalizeEmail, twoStepEncryptionConfigured, verifyTotpCode } from "../localAuth";
import { TRPCError } from "@trpc/server";
import { sdk } from "../_core/sdk";
import { accountEmailOrigin, sendEmailChangeVerification, sendPasswordResetEmail } from "../transactionalEmail";
import { protectedProcedure, router } from "../_core/trpc";

export const accountRouter = router({
  profile: protectedProcedure.query(({ ctx }) => getAccountProfile(ctx.user.id)),
  identities: protectedProcedure.query(({ ctx }) => listAccountIdentities(ctx.user.id)),
  preferences: protectedProcedure.query(({ ctx }) => getUserPreferences(ctx.user.id)),
  twoStepStatus: protectedProcedure.query(async ({ ctx }) => {
    const authenticator = await getTwoStepAuthenticator(ctx.user.id);
    return {
      encryptionConfigured: twoStepEncryptionConfigured(),
      enrollmentState: authenticator?.enabledAt ? "enabled" as const : authenticator ? "pending" as const : "not_enrolled" as const,
    };
  }),
  securityEvents: protectedProcedure.query(({ ctx }) => listAccountSecurityEvents(ctx.user.id)),
  sessions: protectedProcedure.query(async ({ ctx }) => {
    const session = await sdk.getSessionFromRequest(ctx.req);
    const currentTokenHash = session?.sessionId ? hashAccountToken(session.sessionId) : undefined;
    const sessions = await listAccountSessions(ctx.user.id);
    return sessions.map(item => ({ id: item.id, createdAt: item.createdAt, expiresAt: item.expiresAt, active: !item.usedAt && item.expiresAt.getTime() > Date.now(), current: item.tokenHash === currentTokenHash }));
  }),
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
  revokeSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await revokeAccountSession(ctx.user.id, input.sessionId);
    await recordAccountSecurityEvent({ userId: ctx.user.id, eventType: "session_revoked" });
    return { success: true } as const;
  }),
  revokeOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const session = await sdk.getSessionFromRequest(ctx.req);
    const currentTokenHash = session?.sessionId ? hashAccountToken(session.sessionId) : undefined;
    const revoked = await revokeOtherAccountSessions(ctx.user.id, currentTokenHash);
    if (revoked) await recordAccountSecurityEvent({ userId: ctx.user.id, eventType: "other_sessions_revoked" });
    return { success: true, revoked } as const;
  }),
  requestEmailChange: protectedProcedure.input(z.object({ email: z.string().email().max(320) })).mutation(async ({ ctx, input }) => {
    const profile = await getAccountProfile(ctx.user.id);
    const newEmail = normalizeEmail(input.email);
    if (!profile || newEmail === profile.email) return { success: true, delivery: "not_needed" as const };
    const token = createAccountToken();
    await beginAccountEmailChange({ userId: ctx.user.id, newEmail, tokenHash: token.tokenHash, expiresAt: token.expiresAt });
    const requestGet = typeof ctx.req.get === "function" ? ctx.req.get.bind(ctx.req) : undefined;
    const delivery = await sendEmailChangeVerification({ to: newEmail, name: profile.name ?? "", token: token.rawToken, origin: accountEmailOrigin(requestGet?.("origin"), requestGet?.("host")) });
    return { success: true, delivery: delivery.status };
  }),
  requestPasswordReset: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await getAccountProfile(ctx.user.id);
    if (!profile?.email) return { success: true, delivery: "not_configured" as const };
    const token = createAccountToken();
    await issueAccountToken({ userId: ctx.user.id, purpose: "password_reset", tokenHash: token.tokenHash, expiresAt: token.expiresAt });
    const requestGet = typeof ctx.req.get === "function" ? ctx.req.get.bind(ctx.req) : undefined;
    const delivery = await sendPasswordResetEmail({ to: profile.email, name: profile.name ?? "", token: token.rawToken, origin: accountEmailOrigin(requestGet?.("origin"), requestGet?.("host")) });
    return { success: true, delivery: delivery.status };
  }),
  startTwoStepEnrollment: protectedProcedure.mutation(async ({ ctx }) => {
    if (!twoStepEncryptionConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Two-step verification is not configured for this deployment." });
    const profile = await getAccountProfile(ctx.user.id);
    const secret = createTwoStepEnrollmentSecret();
    await savePendingTwoStepAuthenticator({ userId: ctx.user.id, encryptedSecret: encryptTwoStepSecret(secret), keyVersion: "v1" });
    await recordAccountSecurityEvent({ userId: ctx.user.id, eventType: "two_step_enrollment_started" });
    const accountLabel = encodeURIComponent(profile?.email ?? `account-${ctx.user.id}`);
    return { secret, otpauthUri: `otpauth://totp/FerixRG:${accountLabel}?secret=${secret}&issuer=FerixRG&algorithm=SHA1&digits=6&period=30` };
  }),
  confirmTwoStepEnrollment: protectedProcedure.input(z.object({ code: z.string().trim().regex(/^\d{6}$/) })).mutation(async ({ ctx, input }) => {
    const authenticator = await getTwoStepAuthenticator(ctx.user.id);
    if (!authenticator || authenticator.enabledAt) throw new TRPCError({ code: "BAD_REQUEST", message: "No pending two-step enrollment is available." });
    if (!verifyTotpCode(decryptTwoStepSecret(authenticator.encryptedSecret), input.code)) throw new TRPCError({ code: "BAD_REQUEST", message: "The verification code is invalid or expired." });
    const recoveryCodes = createTwoStepRecoveryCodes();
    const confirmed = await confirmTwoStepAuthenticator({ userId: ctx.user.id, recoveryCodeHashes: recoveryCodes.map(item => item.codeHash) });
    if (!confirmed) throw new TRPCError({ code: "BAD_REQUEST", message: "No pending two-step enrollment is available." });
    await recordAccountSecurityEvent({ userId: ctx.user.id, eventType: "two_step_enabled" });
    return { success: true, recoveryCodes: recoveryCodes.map(item => item.rawCode) };
  }),
  updatePreferences: protectedProcedure
    .input(
      z
        .object({
          defaultPreview: z.enum(["desktop", "tablet", "mobile"]).optional(),
          analysisReadyNotifications: z.boolean().optional(),
          draftReviewNotifications: z.boolean().optional(),
          publishingReadinessNotifications: z.boolean().optional(),
          releaseNotes: z.boolean().optional(),
          productResearch: z.boolean().optional(),
          reduceMotion: z.boolean().optional(),
          increaseContrast: z.boolean().optional(),
          visibleKeyboardFocus: z.boolean().optional(),
          twoStepVerification: z.boolean().optional(),
          securityAlerts: z.boolean().optional(),
        })
        .refine(input => Object.values(input).some(value => value !== undefined), "Provide at least one preference to update.")
        .refine(input => input.twoStepVerification !== true, "Two-step verification cannot be enabled until encrypted enrollment is completed."),
    )
    .mutation(({ ctx, input }) => updateUserPreferences(ctx.user.id, input)),
});
