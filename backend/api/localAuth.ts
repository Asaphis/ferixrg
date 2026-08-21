import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";

export const LOCAL_AUTH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
export const TWO_STEP_CHALLENGE_TTL_MS = 1000 * 60 * 5;
const TOTP_PERIOD_SECONDS = 30;

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, "");
  if (!normalized) throw new Error("Invalid authenticator secret.");
  let bits = "";
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid authenticator secret.");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  return Buffer.from(bytes);
}

function totpCodeAt(secret: string, counter: number) {
  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counterBytes).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(value % 1_000_000).padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);
  return [-1, 0, 1].some(offset => {
    const expected = Buffer.from(totpCodeAt(secret, counter + offset));
    return timingSafeEqual(expected, Buffer.from(code));
  });
}

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

export function createTwoStepChallengeToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + TWO_STEP_CHALLENGE_TTL_MS),
  };
}

export function hashAccountToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createTwoStepRecoveryCodes() {
  return Array.from({ length: 8 }, () => {
    const rawCode = randomBytes(8).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");
    return { rawCode, codeHash: createHash("sha256").update(rawCode).digest("hex") };
  });
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
