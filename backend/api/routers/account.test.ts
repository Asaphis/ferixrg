import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  beginAccountEmailChange: vi.fn(),
  getAccountProfile: vi.fn(),
  getTwoStepAuthenticator: vi.fn(),
  savePendingTwoStepAuthenticator: vi.fn(),
  getUserPreferences: vi.fn(),
  issueAccountToken: vi.fn(),
  listAccountSessions: vi.fn(),
  listAccountIdentities: vi.fn(),
  revokeAccountSession: vi.fn(),
  revokeOtherAccountSessions: vi.fn(),
  updateAccountProfile: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

vi.mock("../localAuth", async importOriginal => {
  const actual = await importOriginal<typeof import("../localAuth")>();
  return {
    ...actual,
    createTwoStepEnrollmentSecret: vi.fn(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"),
    encryptTwoStepSecret: vi.fn(() => "v1.encrypted-secret"),
    twoStepEncryptionConfigured: vi.fn(() => true),
  };
});

import { beginAccountEmailChange, getAccountProfile, getTwoStepAuthenticator, getUserPreferences, issueAccountToken, listAccountSessions, revokeAccountSession, revokeOtherAccountSessions, savePendingTwoStepAuthenticator, updateAccountProfile, updateUserPreferences } from "../db";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "user-42",
      email: "owner@example.com",
      name: "Workspace Owner",
      loginMethod: "manus",
      role: "user",
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("account router", () => {
  it("returns a profile scoped to the authenticated user", async () => {
    vi.mocked(getAccountProfile).mockResolvedValue({ id: 42, name: "Workspace Owner" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.profile()).resolves.toMatchObject({ id: 42 });
    expect(getAccountProfile).toHaveBeenCalledWith(42);
  });

  it("updates only the authenticated user's account profile", async () => {
    vi.mocked(updateAccountProfile).mockResolvedValue({ id: 42, name: "New Name" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await caller.account.updateProfile({ name: "New Name" });

    expect(updateAccountProfile).toHaveBeenCalledWith(42, { name: "New Name" });
  });

  it("reads and updates preferences only for the authenticated account", async () => {
    vi.mocked(getUserPreferences).mockResolvedValue({ id: 7, userId: 42, defaultPreview: "mobile" } as never);
    vi.mocked(updateUserPreferences).mockResolvedValue({ id: 7, userId: 42, defaultPreview: "desktop" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.preferences()).resolves.toMatchObject({ userId: 42, defaultPreview: "mobile" });
    await expect(caller.account.updatePreferences({ defaultPreview: "desktop" })).resolves.toMatchObject({ userId: 42, defaultPreview: "desktop" });

    expect(getUserPreferences).toHaveBeenCalledWith(42);
    expect(updateUserPreferences).toHaveBeenCalledWith(42, { defaultPreview: "desktop" });
  });

  it("rejects direct two-step activation before encrypted enrollment exists", async () => {
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.updatePreferences({ twoStepVerification: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateUserPreferences).not.toHaveBeenCalledWith(42, expect.objectContaining({ twoStepVerification: true }));
  });

  it("returns only configuration and enrollment state for the authenticated account", async () => {
    vi.mocked(getTwoStepAuthenticator).mockResolvedValue({ id: 3, userId: 42, enabledAt: null, encryptedSecret: "not-returned" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.twoStepStatus()).resolves.toEqual({ encryptionConfigured: true, enrollmentState: "pending" });
    expect(getTwoStepAuthenticator).toHaveBeenCalledWith(42);
  });

  it("starts encrypted two-step enrollment only for the authenticated account", async () => {
    vi.mocked(getAccountProfile).mockResolvedValue({ id: 42, email: "owner@example.com" } as never);
    vi.mocked(savePendingTwoStepAuthenticator).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.startTwoStepEnrollment()).resolves.toMatchObject({
      secret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      otpauthUri: expect.stringContaining("owner%40example.com"),
    });

    expect(savePendingTwoStepAuthenticator).toHaveBeenCalledWith({ userId: 42, encryptedSecret: "v1.encrypted-secret", keyVersion: "v1" });
  });

  it("lists and revokes sessions within the authenticated account boundary", async () => {
    vi.mocked(listAccountSessions).mockResolvedValue([{ id: 19, tokenHash: "other-session", createdAt: new Date(), expiresAt: new Date(Date.now() + 60_000), usedAt: null }] as never);
    vi.mocked(revokeAccountSession).mockResolvedValue(undefined);
    vi.mocked(revokeOtherAccountSessions).mockResolvedValue(2);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.sessions()).resolves.toMatchObject([{ id: 19, active: true, current: false }]);
    await expect(caller.account.revokeSession({ sessionId: 19 })).resolves.toEqual({ success: true });
    await expect(caller.account.revokeOtherSessions()).resolves.toEqual({ success: true, revoked: 2 });

    expect(revokeAccountSession).toHaveBeenCalledWith(42, 19);
    expect(revokeOtherAccountSessions).toHaveBeenCalledWith(42, undefined);
  });

  it("creates a pending email-change record only for the authenticated account", async () => {
    vi.mocked(getAccountProfile).mockResolvedValue({ id: 42, name: "Workspace Owner", email: "owner@example.com" } as never);
    vi.mocked(beginAccountEmailChange).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.requestEmailChange({ email: "new@example.com" })).resolves.toMatchObject({ success: true });
    expect(beginAccountEmailChange).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, newEmail: "new@example.com" }));
  });

  it("issues a reset token only for the authenticated account", async () => {
    vi.mocked(getAccountProfile).mockResolvedValue({ id: 42, name: "Workspace Owner", email: "owner@example.com" } as never);
    vi.mocked(issueAccountToken).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.account.requestPasswordReset()).resolves.toMatchObject({ success: true });
    expect(issueAccountToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, purpose: "password_reset" }));
  });
});
