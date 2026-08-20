import type { Express, Request, Response } from "express";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { confirmAccountEmailChange, createAccountSession, createLocalAccount, getLocalAccountByEmail, issueAccountToken, resetLocalPassword, verifyLocalAccount } from "../db";
import { createAccountToken, createLocalOpenId, hashAccountToken, hashPassword, isStrongPassword, normalizeEmail, verifyPassword } from "../localAuth";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { accountEmailOrigin, sendPasswordResetEmail, sendVerificationEmail, transactionalEmailConfigured } from "../transactionalEmail";

const registrationInput = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(320),
  password: z.string().min(8).max(256),
});
const loginInput = z.object({ email: z.string().email().max(320), password: z.string().min(1).max(256) });
const verificationInput = z.object({ token: z.string().min(1).max(512) });
const emailInput = z.object({ email: z.string().email().max(320) });
const passwordResetInput = z.object({ token: z.string().min(1).max(512), password: z.string().min(8).max(256) });

function respondInvalidInput(res: Response, message = "Invalid account details.") {
  return res.status(400).json({ success: false, message });
}

export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/account/register", async (req: Request, res: Response) => {
    const parsed = registrationInput.safeParse(req.body);
    if (!parsed.success || !isStrongPassword(parsed.data?.password ?? "")) return respondInvalidInput(res, "Use a stronger password.");

    const email = normalizeEmail(parsed.data.email);
    const existing = await getLocalAccountByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: "This email cannot be used to create a new account." });

    const verification = createAccountToken();
    const account = await createLocalAccount({
      openId: createLocalOpenId(),
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      verificationTokenHash: verification.tokenHash,
      verificationExpiresAt: verification.expiresAt,
    });
    const delivery = account ? await sendVerificationEmail({ to: email, name: account.name ?? "", token: verification.rawToken, origin: accountEmailOrigin(req.get("origin"), req.get("host")) }) : { status: "failed" as const };
    return res.status(201).json({ success: true, verificationRequired: true, delivery: delivery.status });
  });

  app.post("/api/account/login", async (req: Request, res: Response) => {
    const parsed = loginInput.safeParse(req.body);
    if (!parsed.success) return res.status(401).json({ success: false, message: "Incorrect email or password." });

    const account = await getLocalAccountByEmail(normalizeEmail(parsed.data.email));
    const passwordMatches = Boolean(account?.identity.passwordHash) && (await verifyPassword(parsed.data.password, account!.identity.passwordHash!));
    if (!account || !passwordMatches) return res.status(401).json({ success: false, message: "Incorrect email or password." });
    if (account.user.accountStatus !== "active") return res.status(403).json({ success: false, code: "VERIFICATION_REQUIRED", message: "Your email address has not been verified." });

    const sessionReference = createAccountToken();
    await createAccountSession({ userId: account.user.id, tokenHash: sessionReference.tokenHash, expiresAt: new Date(Date.now() + ONE_YEAR_MS) });
    const sessionToken = await sdk.createSessionToken(account.user.openId, { name: account.user.name ?? "", sessionId: sessionReference.rawToken, expiresInMs: ONE_YEAR_MS });
    res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
    return res.json({ success: true });
  });

  app.post("/api/account/verify", async (req: Request, res: Response) => {
    const parsed = verificationInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid verification link." });
    const account = await verifyLocalAccount(hashAccountToken(parsed.data.token));
    if (!account) return res.status(400).json({ success: false, message: "Invalid or expired verification link." });
    return res.json({ success: true });
  });

  app.post("/api/account/resend-verification", async (req: Request, res: Response) => {
    const parsed = emailInput.safeParse(req.body);
    if (!parsed.success) return respondInvalidInput(res, "Enter a valid email address.");
    const account = await getLocalAccountByEmail(normalizeEmail(parsed.data.email));
    let delivery = "not_configured";
    if (account && account.user.accountStatus === "pending_verification") {
      const verification = createAccountToken();
      await issueAccountToken({ userId: account.user.id, purpose: "email_verification", tokenHash: verification.tokenHash, expiresAt: verification.expiresAt });
      delivery = (await sendVerificationEmail({ to: account.user.email ?? normalizeEmail(parsed.data.email), name: account.user.name ?? "", token: verification.rawToken, origin: accountEmailOrigin(req.get("origin"), req.get("host")) })).status;
    }
    return res.json({ success: true, delivery, configured: transactionalEmailConfigured() });
  });

  app.post("/api/account/request-password-reset", async (req: Request, res: Response) => {
    const parsed = emailInput.safeParse(req.body);
    if (!parsed.success) return respondInvalidInput(res, "Enter a valid email address.");
    const account = await getLocalAccountByEmail(normalizeEmail(parsed.data.email));
    let delivery = "not_configured";
    if (account) {
      const reset = createAccountToken();
      await issueAccountToken({ userId: account.user.id, purpose: "password_reset", tokenHash: reset.tokenHash, expiresAt: reset.expiresAt });
      delivery = (await sendPasswordResetEmail({ to: account.user.email ?? normalizeEmail(parsed.data.email), name: account.user.name ?? "", token: reset.rawToken, origin: accountEmailOrigin(req.get("origin"), req.get("host")) })).status;
    }
    return res.json({ success: true, delivery, configured: transactionalEmailConfigured() });
  });

  app.post("/api/account/reset-password", async (req: Request, res: Response) => {
    const parsed = passwordResetInput.safeParse(req.body);
    if (!parsed.success || !isStrongPassword(parsed.data?.password ?? "")) return respondInvalidInput(res, "Use a stronger password.");
    const account = await resetLocalPassword({ tokenHash: hashAccountToken(parsed.data.token), passwordHash: await hashPassword(parsed.data.password) });
    if (!account) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    return res.json({ success: true });
  });

  app.post("/api/account/confirm-email-change", async (req: Request, res: Response) => {
    const parsed = verificationInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid email confirmation link." });
    const account = await confirmAccountEmailChange(hashAccountToken(parsed.data.token));
    if (!account) return res.status(400).json({ success: false, message: "Invalid or expired email confirmation link." });
    return res.json({ success: true });
  });
}
