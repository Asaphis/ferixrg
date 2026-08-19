import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  listEditorDrafts: vi.fn(),
  saveEditorDraft: vi.fn(),
  restoreEditorDraft: vi.fn(),
}));

import { listEditorDrafts, restoreEditorDraft, saveEditorDraft } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "draft-owner",
      email: "owner@example.com",
      name: "Draft Owner",
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

describe("editorDrafts router", () => {
  it("lists saved drafts only for the authenticated user and requested editor target", async () => {
    vi.mocked(listEditorDrafts).mockResolvedValue([]);
    const caller = appRouter.createCaller(authenticatedContext());

    await caller.editorDrafts.list({ storeId: "atelier-forma", pageId: "product-page" });

    expect(listEditorDrafts).toHaveBeenCalledWith(42, "atelier-forma", "product-page");
  });

  it("saves and restores drafts with the authenticated user identifier", async () => {
    const savedDraft = { id: 8, userId: 42, storeId: "atelier-forma", pageId: "product-page", title: "Draft 1", label: "Responsive", score: 82, scoreDelta: 4, tone: "current", note: "Retains a clear mobile purchase path.", designState: "{}", isCurrent: 1, createdAt: new Date(), updatedAt: new Date() };
    vi.mocked(saveEditorDraft).mockResolvedValue(savedDraft);
    vi.mocked(restoreEditorDraft).mockResolvedValue(savedDraft);
    const caller = appRouter.createCaller(authenticatedContext());

    const saved = await caller.editorDrafts.save({ storeId: "atelier-forma", pageId: "product-page", title: "Draft 1", label: "Responsive", score: 82, scoreDelta: 4, tone: "current", note: "Retains a clear mobile purchase path.", designState: "{}", isCurrent: true });
    const restored = await caller.editorDrafts.restore({ storeId: "atelier-forma", pageId: "product-page", draftId: 8 });

    expect(saveEditorDraft).toHaveBeenCalledWith(42, expect.objectContaining({ title: "Draft 1", isCurrent: 1 }));
    expect(restoreEditorDraft).toHaveBeenCalledWith(42, 8, "atelier-forma", "product-page");
    expect(saved).toMatchObject({ id: 8, userId: 42, title: "Draft 1" });
    expect(restored).toMatchObject({ id: 8, userId: 42, isCurrent: 1 });
  });

  it("keeps editor targets scoped when listing separate users' saved histories", async () => {
    vi.mocked(listEditorDrafts).mockResolvedValue([]);
    const firstCaller = appRouter.createCaller(authenticatedContext());
    const secondContext = authenticatedContext();
    secondContext.user = { ...secondContext.user!, id: 77, openId: "another-owner" };
    const secondCaller = appRouter.createCaller(secondContext);

    await firstCaller.editorDrafts.list({ storeId: "atelier-forma", pageId: "product-page" });
    await secondCaller.editorDrafts.list({ storeId: "atelier-forma", pageId: "product-page" });

    expect(listEditorDrafts).toHaveBeenLastCalledWith(77, "atelier-forma", "product-page");
    expect(listEditorDrafts).toHaveBeenCalledWith(42, "atelier-forma", "product-page");
  });
});
