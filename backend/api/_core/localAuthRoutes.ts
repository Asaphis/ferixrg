import { createHash } from "node:crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { createLocalAccount, getLocalAccountByEmail, verifyLocalAccount } from "../db";
import { createAccountToken, createLocalOpenId, hashPassword, isStrongPassword, normalizeEmail, verifyPassword } from "../localAuth";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const registrationInput = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(320),
  password: z.string().min(8).max(256),
});
const loginInput = z.object({ email: z.string().email().max(320), password: z.string().min(1).max(256) });
const verificationInput = z.object({ token: z.string().min(1).max(512) });

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
    await createLocalAccount({
      openId: createLocalOpenId(),
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      verificationTokenHash: verification.tokenHash,
      verificationExpiresAt: verification.expiresAt,
    });

    // Email delivery is intentionally connected in a later backend milestone.
    // The raw token is never returned to the browser or logged.
    return res.status(201).json({ success: true, verificationRequired: true });
  });

  app.post("/api/account/login", async (req: Request, res: Response) => {
    const parsed = loginInput.safeParse(req.body);
    if (!parsed.success) return res.status(401).json({ success: false, message: "Incorrect email or password." });

    const account = await getLocalAccountByEmail(normalizeEmail(parsed.data.email));
    const passwordMatches = Boolean(account?.identity.passwordHash) && (await verifyPassword(parsed.data.password, account!.identity.passwordHash!));
    if (!account || !passwordMatches) return res.status(401).json({ success: false, message: "Incorrect email or password." });
    if (account.user.accountStatus !== "active") return res.status(403).json({ success: false, code: "VERIFICATION_REQUIRED", message: "Your email address has not been verified." });

    const sessionToken = await sdk.createSessionToken(account.user.openId, { name: account.user.name ?? "" });
    res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
    return res.json({ success: true });
  });

  app.post("/api/account/verify", async (req: Request, res: Response) => {
    const parsed = verificationInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid verification link." });
    const account = await verifyLocalAccount(createHash("sha256").update(parsed.data.token).digest("hex"));
    if (!account) return res.status(400).json({ success: false, message: "Invalid or expired verification link." });
    return res.json({ success: true });
  });
}
