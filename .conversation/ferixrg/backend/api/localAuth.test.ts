import { describe, expect, it } from "vitest";
import { createAccountToken, createTwoStepEnrollmentSecret, createTwoStepRecoveryCodes, encryptTwoStepSecret, hashAccountToken, hashPassword, isStrongPassword, normalizeEmail, twoStepEncryptionConfigured, verifyPassword, verifyTotpCode } from "./localAuth";

describe("local account authentication helpers", () => {
  it("normalizes account email and enforces the same strong password policy as the approved UI", () => {
    expect(normalizeEmail("  OWNER@Example.COM ")).toBe("owner@example.com");
    expect(isStrongPassword("SecurePass1!")).toBe(true);
    expect(isStrongPassword("password")).toBe(false);
  });

  it("hashes and verifies passwords without retaining plaintext", async () => {
    const passwordHash = await hashPassword("SecurePass1!");
    expect(passwordHash).not.toContain("SecurePass1!");
    await expect(verifyPassword("SecurePass1!", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass1!", passwordHash)).resolves.toBe(false);
  });

  it("creates a one-way verification token record", () => {
    const token = createAccountToken();
    expect(token.rawToken).not.toEqual(token.tokenHash);
    expect(hashAccountToken(token.rawToken)).toBe(token.tokenHash);
    expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("fails closed when the two-step deployment encryption key is absent", () => {
    expect(twoStepEncryptionConfigured()).toBe(false);
    expect(() => encryptTwoStepSecret("authenticator-seed")).toThrow("Two-step verification is not configured.");
  });

  it("verifies only valid six-digit TOTP codes inside the bounded clock-skew window", () => {
    const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(verifyTotpCode(rfcSecret, "287082", 59_000)).toBe(true);
    expect(verifyTotpCode(rfcSecret, "287082", 89_000)).toBe(true);
    expect(verifyTotpCode(rfcSecret, "287082", 119_000)).toBe(false);
    expect(verifyTotpCode(rfcSecret, "not-a-code", 59_000)).toBe(false);
  });

  it("creates eight one-time recovery values and retains only their hashes for persistence", () => {
    const codes = createTwoStepRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes.map(code => code.rawCode)).size).toBe(8);
    expect(codes.every(code => /^([A-F0-9]{4}-){3}[A-F0-9]{4}$/.test(code.rawCode) && code.codeHash !== code.rawCode)).toBe(true);
  });

  it("creates a Base32 authenticator seed without revealing an encryption key", () => {
    const secret = createTwoStepEnrollmentSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  });
});
