import { beforeEach, describe, expect, it, vi } from "vitest";
import { decryptConnectionCredential, encryptConnectionCredential } from "./connectionSecrets";

describe("connection secret encryption", () => {
  beforeEach(() => {
    vi.stubEnv("STORE_CONNECTION_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  });

  it("encrypts and decrypts a provider credential without returning plaintext", () => {
    const encrypted = encryptConnectionCredential("shopify-access-token");
    expect(encrypted).toMatch(/^v1:/);
    expect(encrypted).not.toContain("shopify-access-token");
    expect(decryptConnectionCredential(encrypted)).toBe("shopify-access-token");
  });

  it("rejects missing or incorrectly sized encryption keys", () => {
    vi.stubEnv("STORE_CONNECTION_ENCRYPTION_KEY", "too-short");
    expect(() => encryptConnectionCredential("credential")).toThrow(/32 bytes/i);
    vi.stubEnv("STORE_CONNECTION_ENCRYPTION_KEY", "");
    expect(() => encryptConnectionCredential("credential")).toThrow(/not configured/i);
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptConnectionCredential("credential");
    const parts = encrypted.split(":");
    parts[3] = `${parts[3].startsWith("A") ? "B" : "A"}${parts[3].slice(1)}`;
    expect(() => decryptConnectionCredential(parts.join(":"))).toThrow();
  });
});
