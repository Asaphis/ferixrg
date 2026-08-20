import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getAccountProfile: vi.fn(),
  listAccountIdentities: vi.fn(),
  updateAccountProfile: vi.fn(),
}));

import { getAccountProfile, updateAccountProfile } from "../db";
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
});
