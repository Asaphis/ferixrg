import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const KEY_BYTES = 32;

function encryptionKey() {
  const raw = process.env.STORE_CONNECTION_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("STORE_CONNECTION_ENCRYPTION_KEY is not configured.");
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) throw new Error("STORE_CONNECTION_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return key;
}

export function encryptConnectionCredential(value: string) {
  if (!value) throw new Error("Cannot encrypt an empty provider credential.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptConnectionCredential(payload: string) {
  const [version, ivValue, tagValue, ciphertextValue] = payload.split(":");
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue) throw new Error("Unsupported provider credential ciphertext.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}
