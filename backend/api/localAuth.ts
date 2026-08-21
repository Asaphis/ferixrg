import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { ENV } from "./_core/env";

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

function twoStepEncryptionKey() {
  if (!ENV.totpEncryptionKey) throw new Error("Two-step verification is not configured.");
  return createHash("sha256").update(ENV.totpEncryptionKey).digest();
}

export function twoStepEncryptionConfigured() {
  return Boolean(ENV.totpEncryptionKey);
}

export function encryptTwoStepSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", twoStepEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptTwoStepSecret(payload: string) {
  const [version, ivValue, tagValue, ciphertextValue] = payload.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid encrypted two-step secret.");
  const decipher = createDecipheriv("aes-256-gcm", twoStepEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}
