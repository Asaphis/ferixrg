import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  ensurePersonalWorkspace: vi.fn(),
  listUserWorkspaces: vi.fn(),
  listWorkspaceMembers: vi.fn(),
  createWorkspaceInvitation: vi.fn(),
  cancelWorkspaceInvitation: vi.fn(),
  listWorkspaceInvitations: vi.fn(),
  listWorkspaceStores: vi.fn(),
  createWorkspaceStore: vi.fn(),
  listWorkspaceActivity: vi.fn(),
  listWorkspaceUsage: vi.fn(),
  listWorkspaceToolRuns: vi.fn(),
  listWorkspaceDrafts: vi.fn(),
  listWorkspaceReleases: vi.fn(),
  getWorkspaceSubscription: vi.fn(),
  queueWorkspaceToolRun: vi.fn(),
  getWorkspaceAccess: vi.fn(),
}));

import { createWorkspaceStore, ensurePersonalWorkspace, getWorkspaceAccess, listWorkspaceStores, queueWorkspaceToolRun } from "../db";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function authenticatedContext(userId = 42): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user-${userId}@example.com`,
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

describe("workspace router", () => {
  it("bootstraps a personal workspace only for the authenticated user", async () => {
    vi.mocked(ensurePersonalWorkspace).mockResolvedValue({ workspace: { id: 9 }, membership: { userId: 42, role: "owner" } } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await caller.workspace.bootstrap();

    expect(ensurePersonalWorkspace).toHaveBeenCalledWith(expect.objectContaining({ id: 42, name: "Workspace Owner" }));
  });

  it("allows an editor to create a store in an accessible workspace", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(createWorkspaceStore).mockResolvedValue({ id: 3, name: "Atelier Forma" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.stores.create({ workspaceId: 9, name: "Atelier Forma", platform: "shopify", url: "https://atelier.example" });

    expect(createWorkspaceStore).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, createdByUserId: 42, platform: "shopify" }));
    expect(result).toMatchObject({ id: 3, name: "Atelier Forma" });
  });

  it("blocks a user from listing stores in a workspace they do not belong to", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.stores.list({ workspaceId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listWorkspaceStores).not.toHaveBeenCalled();
  });

  it("records a queued tool request only after editor workspace access is confirmed", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(queueWorkspaceToolRun).mockResolvedValue({ id: 22, status: "queued" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.queueToolRun({
      workspaceId: 9,
      toolId: "ai-design-copilot",
      sourceType: "saved_draft",
      inputSummary: { pageId: "home" },
    });

    expect(queueWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, requestedByUserId: 42, toolId: "ai-design-copilot" }));
    expect(result).toMatchObject({ id: 22, status: "queued" });
  });
});
