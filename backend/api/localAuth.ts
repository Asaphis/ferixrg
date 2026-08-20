import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";

export const LOCAL_AUTH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createLocalOpenId() {
  return `local_${randomUUID()}`;
}

export function createAccountToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + LOCAL_AUTH_TOKEN_TTL_MS),
  };
}

export function hashAccountToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}
