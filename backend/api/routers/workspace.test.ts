import { describe, expect, it, vi } from "vitest";

vi.mock("../storage", () => ({ storageGet: vi.fn(), storagePut: vi.fn() }));

vi.mock("../db", () => ({
  ensurePersonalWorkspace: vi.fn(),
  listUserWorkspaces: vi.fn(),
  listWorkspaceMembers: vi.fn(),
  createWorkspaceInvitation: vi.fn(),
  cancelWorkspaceInvitation: vi.fn(),
  updateWorkspaceInvitationRole: vi.fn(),
  updateWorkspaceMemberRole: vi.fn(),
  removeWorkspaceMember: vi.fn(),
  acceptWorkspaceInvitation: vi.fn(),
  acknowledgeResource: vi.fn(),
  listWorkspaceInvitations: vi.fn(),
  listWorkspaceStores: vi.fn(),
  createWorkspaceStore: vi.fn(),
  getWorkspaceStore: vi.fn(),
  createStoreSnapshot: vi.fn(),
  listStoreSnapshots: vi.fn(),
  listStoreConnections: vi.fn(),
  beginStoreConnection: vi.fn(),
  recordWorkspaceActivity: vi.fn(),
  listWorkspaceActivity: vi.fn(),
  listWorkspaceUsage: vi.fn(),
  listWorkspaceToolRuns: vi.fn(),
  listWorkspaceDrafts: vi.fn(),
  listWorkspaceDraftVersions: vi.fn(),
  createWorkspaceDraft: vi.fn(),
  saveWorkspaceDraftVersion: vi.fn(),
  restoreWorkspaceDraftVersion: vi.fn(),
  listWorkspaceDraftAssets: vi.fn(),
  createWorkspaceDraftAsset: vi.fn(),
  listWorkspaceReleases: vi.fn(),
  getWorkspaceSubscription: vi.fn(),
  queueWorkspaceToolRun: vi.fn(),
  getWorkspaceToolRun: vi.fn(),
  startWorkspaceToolRun: vi.fn(),
  completeWorkspaceToolRun: vi.fn(),
  failWorkspaceToolRun: vi.fn(),
  listWorkspaceToolEvidence: vi.fn(),
  createWorkspaceEvidence: vi.fn(),
  listWorkspaceIssues: vi.fn(),
  createWorkspaceIssue: vi.fn(),
  updateWorkspaceIssueStatus: vi.fn(),
  listWorkspaceReports: vi.fn(),
  createWorkspaceReport: vi.fn(),
  listWorkspaceDeveloperHandoffs: vi.fn(),
  createWorkspaceDeveloperHandoff: vi.fn(),
  createWorkspaceRequest: vi.fn(),
  listWorkspaceValidationRuns: vi.fn(),
  listWorkspaceRequests: vi.fn(),
  listLegalDocuments: vi.fn(),
  queueWorkspaceValidationRun: vi.fn(),
  startWorkspaceValidationRun: vi.fn(),
  completeWorkspaceValidationRun: vi.fn(),
  createWorkspaceReleaseAction: vi.fn(),
  approveWorkspaceReleaseAction: vi.fn(),
  cancelWorkspaceReleaseAction: vi.fn(),
  getWorkspaceAccess: vi.fn(),
  getWorkspaceReport: vi.fn(),
  getWorkspaceDashboardReadModel: vi.fn(),
  getWorkspaceDraftVersion: vi.fn(),
  getWorkspaceReleaseEligibility: vi.fn(),
  getWorkspaceUsageSummary: vi.fn(),
  getWorkspaceAiNeuronUsageSince: vi.fn(),
  recordWorkspaceUsage: vi.fn(),
}));

vi.mock("../cloudflareAi", () => ({ CloudflareAiError: class CloudflareAiError extends Error { constructor(message: string, public code: string) { super(message); } } }));
vi.mock("../aiGateway", () => ({ listCentralAiReadiness: vi.fn(), runDesignCopilotThroughGateway: vi.fn() }));

import { acceptWorkspaceInvitation, acknowledgeResource, approveWorkspaceReleaseAction, beginStoreConnection, cancelWorkspaceInvitation, cancelWorkspaceReleaseAction, completeWorkspaceToolRun, completeWorkspaceValidationRun, createStoreSnapshot, createWorkspaceDeveloperHandoff, createWorkspaceDraft, createWorkspaceDraftAsset, createWorkspaceEvidence, createWorkspaceIssue, createWorkspaceReleaseAction, createWorkspaceReport, createWorkspaceRequest, createWorkspaceStore, ensurePersonalWorkspace, getWorkspaceAccess, getWorkspaceAiNeuronUsageSince, getWorkspaceDashboardReadModel, getWorkspaceDraftVersion, getWorkspaceReleaseEligibility, getWorkspaceReport, getWorkspaceStore, getWorkspaceToolRun, getWorkspaceUsageSummary, listLegalDocuments, listStoreConnections, listStoreSnapshots, listWorkspaceDeveloperHandoffs, listWorkspaceDraftAssets, listWorkspaceDraftVersions, listWorkspaceIssues, listWorkspaceReports, listWorkspaceRequests, listWorkspaceStores, listWorkspaceValidationRuns, queueWorkspaceToolRun, queueWorkspaceValidationRun, recordWorkspaceActivity, recordWorkspaceUsage, removeWorkspaceMember, restoreWorkspaceDraftVersion, saveWorkspaceDraftVersion, startWorkspaceToolRun, startWorkspaceValidationRun, updateWorkspaceInvitationRole, updateWorkspaceIssueStatus, updateWorkspaceMemberRole } from "../db";
import { storageGet, storagePut } from "../storage";
import { listCentralAiReadiness, runDesignCopilotThroughGateway } from "../aiGateway";
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

  it("returns dashboard aggregates only within an accessible workspace", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "viewer" } } as never);
    vi.mocked(getWorkspaceDashboardReadModel).mockResolvedValue({ stores: { total: 1, connected: 1 }, issues: { open: 2 }, drafts: { active: 1 } } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.dashboard({ workspaceId: 9 })).resolves.toMatchObject({ stores: { connected: 1 }, issues: { open: 2 } });
    expect(getWorkspaceDashboardReadModel).toHaveBeenCalledWith(9);
  });

  it("returns the provider-agnostic plan and ledger usage summary only to billing access", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "billing" } } as never);
    vi.mocked(getWorkspaceUsageSummary).mockResolvedValue({ plan: { id: "free", monthlyToolRuns: 20 }, usage: { toolRuns: 2, aiCredits: 0 }, ledger: [] } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.usageSummary({ workspaceId: 9 })).resolves.toMatchObject({ plan: { id: "free" }, usage: { toolRuns: 2 } });
    expect(getWorkspaceUsageSummary).toHaveBeenCalledWith(9);
  });

  it("persists workspace context for platform and support requests while exposing legal and resource actions", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "viewer" } } as never);
    vi.mocked(createWorkspaceRequest).mockResolvedValue({ id: 141, workspaceId: 9, type: "support", status: "submitted" } as never);
    vi.mocked(listWorkspaceRequests).mockResolvedValue([{ id: 141, type: "support" }] as never);
    vi.mocked(listLegalDocuments).mockResolvedValue([] as never);
    vi.mocked(acknowledgeResource).mockResolvedValue({ id: 1, resourceKey: "whats-new" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.submitRequest({ workspaceId: 9, type: "support", subject: "Need help", message: "Please review this workspace." })).resolves.toMatchObject({ id: 141, type: "support" });
    await expect(caller.workspace.requests({ workspaceId: 9 })).resolves.toHaveLength(1);
    await expect(caller.workspace.legalDocuments({ documentKey: "terms" })).resolves.toEqual([]);
    await expect(caller.workspace.acknowledgeResource({ resourceKey: "whats-new" })).resolves.toMatchObject({ resourceKey: "whats-new" });
    expect(createWorkspaceRequest).toHaveBeenCalledWith(expect.objectContaining({ submittedByUserId: 42, workspaceId: 9 }));
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

  it("runs Design Copilot only within editor access, accounts for neurons, and retains a message-free audit record", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 22, workspaceId: 9, toolId: "ai-design-copilot" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runDesignCopilotThroughGateway).mockResolvedValue({ response: "Clarify the visual hierarchy, then review it before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2.3, promptTokens: 30, completionTokens: 20 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 1 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.designCopilot({ workspaceId: 9, toolRunId: 22, message: "Make the product call to action easier to notice.", context: { device: "Mobile", element: "Buy button" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 3 });
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 3, unit: "neurons", provider: "cloudflare_workers_ai" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.design_copilot.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
  });

  it("protects the daily free-neuron reserve before invoking Design Copilot", async () => {
    vi.mocked(runDesignCopilotThroughGateway).mockClear();
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(9_900 as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.designCopilot({ workspaceId: 9, message: "Improve the visual hierarchy." })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(runDesignCopilotThroughGateway).not.toHaveBeenCalled();
  });

  it("allows an admin to change member and pending invitation roles while retaining workspace scope", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "admin" } } as never);
    vi.mocked(updateWorkspaceMemberRole).mockResolvedValue(undefined);
    vi.mocked(updateWorkspaceInvitationRole).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.updateMemberRole({ workspaceId: 9, memberId: 14, role: "viewer" })).resolves.toEqual({ success: true });
    await expect(caller.workspace.updateInvitationRole({ workspaceId: 9, invitationId: 8, role: "editor" })).resolves.toEqual({ success: true });

    expect(updateWorkspaceMemberRole).toHaveBeenCalledWith({ workspaceId: 9, memberId: 14, role: "viewer", actorUserId: 42 });
    expect(updateWorkspaceInvitationRole).toHaveBeenCalledWith({ workspaceId: 9, invitationId: 8, role: "editor", actorUserId: 42 });
  });

  it("restricts member removal to workspace admins and accepts a valid invitation for the signed-in email", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "admin" } } as never);
    vi.mocked(removeWorkspaceMember).mockResolvedValue(undefined);
    vi.mocked(acceptWorkspaceInvitation).mockResolvedValue({ workspaceId: 9 } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.removeMember({ workspaceId: 9, memberId: 15 })).resolves.toEqual({ success: true });
    await expect(caller.workspace.acceptInvitation({ token: "accepted-token" })).resolves.toEqual({ success: true, workspaceId: 9 });
    expect(removeWorkspaceMember).toHaveBeenCalledWith({ workspaceId: 9, memberId: 15, actorUserId: 42 });
    expect(acceptWorkspaceInvitation).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, email: "user-42@example.com" }));
  });

  it("records a public URL source and starts a pending connection only after editor workspace access", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(createWorkspaceStore).mockResolvedValue({ id: 31, url: "https://source.example" } as never);
    vi.mocked(createStoreSnapshot).mockResolvedValue({ id: 32, storeId: 31, sourceType: "url_scan" } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    vi.mocked(getWorkspaceStore).mockResolvedValue({ id: 31, workspaceId: 9 } as never);
    vi.mocked(beginStoreConnection).mockResolvedValue({ id: 33, storeId: 31, provider: "shopify", status: "pending" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.stores.createPublicUrlSource({ workspaceId: 9, name: "Source store", url: "https://source.example" })).resolves.toMatchObject({ store: { id: 31 }, snapshot: { id: 32 } });
    await expect(caller.workspace.stores.beginConnection({ workspaceId: 9, storeId: 31, provider: "shopify", scopes: ["read_products"] })).resolves.toMatchObject({ id: 33, status: "pending" });

    expect(createWorkspaceStore).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, createdByUserId: 42, platform: "public_url" }));
    expect(createStoreSnapshot).toHaveBeenCalledWith(expect.objectContaining({ storeId: 31, sourceType: "url_scan" }));
    expect(beginStoreConnection).toHaveBeenCalledWith({ storeId: 31, provider: "shopify", scopes: ["read_products"] });
  });

  it("does not expose another workspace’s source snapshots", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "viewer" } } as never);
    vi.mocked(getWorkspaceStore).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.stores.snapshots({ workspaceId: 9, storeId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listStoreSnapshots).not.toHaveBeenCalled();
  });

  it("uploads an authorized source to storage and persists only its returned key", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceStore).mockResolvedValue({ id: 31, workspaceId: 9 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/store-31/sources/reference_123.png", url: "/manus-storage/workspace-9/store-31/sources/reference_123.png" });
    vi.mocked(createStoreSnapshot).mockResolvedValue({ id: 34, storeId: 31, sourceType: "screenshot" } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.stores.uploadSource({ workspaceId: 9, storeId: 31, fileName: "reference.png", mimeType: "image/png", contentBase64: Buffer.from("reference image").toString("base64"), sourceType: "screenshot" });

    expect(storagePut).toHaveBeenCalledWith(expect.stringContaining("workspace-9/store-31/sources/reference.png"), expect.any(Buffer), "image/png");
    expect(createStoreSnapshot).toHaveBeenCalledWith(expect.objectContaining({ storeId: 31, sourceType: "screenshot", storageKey: "workspace-9/store-31/sources/reference_123.png" }));
    expect(result.storage.url).toContain("/manus-storage/");
  });

  it("persists and restores editor versions only within an editor-accessible workspace", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(createWorkspaceDraft).mockResolvedValue({ draft: { id: 41, workspaceId: 9 }, version: { id: 51, draftId: 41, versionNumber: 1 } } as never);
    vi.mocked(saveWorkspaceDraftVersion).mockResolvedValue({ id: 52, draftId: 41, versionNumber: 2 } as never);
    vi.mocked(listWorkspaceDraftVersions).mockResolvedValue({ draft: { id: 41 }, versions: [{ id: 52, versionNumber: 2 }] } as never);
    vi.mocked(restoreWorkspaceDraftVersion).mockResolvedValue({ id: 51, draftId: 41, versionNumber: 1, designState: "{}" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.createDraft({ workspaceId: 9, title: "Product page", label: "Initial editor state", designState: "{}" })).resolves.toMatchObject({ draft: { id: 41 }, version: { id: 51 } });
    await expect(caller.workspace.saveDraftVersion({ workspaceId: 9, draftId: 41, label: "Purchase spacing", designState: "{\"device\":\"Mobile\"}" })).resolves.toMatchObject({ id: 52, versionNumber: 2 });
    await expect(caller.workspace.draftVersions({ workspaceId: 9, draftId: 41 })).resolves.toMatchObject({ versions: [{ id: 52 }] });
    await expect(caller.workspace.restoreDraftVersion({ workspaceId: 9, draftId: 41, versionId: 51 })).resolves.toMatchObject({ id: 51, draftId: 41 });
    expect(createWorkspaceDraft).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, createdByUserId: 42, source: "manual" }));
    expect(saveWorkspaceDraftVersion).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, draftId: 41, createdByUserId: 42 }));
  });

  it("stores a draft asset only for an editor-authorized workspace draft", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/draft-41/assets/reference_123.png", url: "/manus-storage/workspace-9/draft-41/assets/reference_123.png" });
    vi.mocked(createWorkspaceDraftAsset).mockResolvedValue({ id: 61, draftId: 41, kind: "reference" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.uploadDraftAsset({ workspaceId: 9, draftId: 41, kind: "reference", fileName: "reference.png", mimeType: "image/png", contentBase64: Buffer.from("asset").toString("base64") });

    expect(storagePut).toHaveBeenCalledWith(expect.stringContaining("workspace-9/draft-41/assets/reference.png"), expect.any(Buffer), "image/png");
    expect(createWorkspaceDraftAsset).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, draftId: 41, createdByUserId: 42, kind: "reference" }));
    expect(result.asset).toMatchObject({ id: 61, draftId: 41 });
  });

  it("accepts only canonical tool IDs and persists lifecycle, evidence, issues, reports, and handoffs in the workspace", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(queueWorkspaceToolRun).mockResolvedValue({ id: 71, workspaceId: 9, toolId: "storefront-analyzer", status: "queued" } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 71, workspaceId: 9, status: "queued" } as never);
    vi.mocked(startWorkspaceToolRun).mockResolvedValue({ id: 71, status: "running" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 71, status: "completed" } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 81, toolRunId: 71, kind: "metric" } as never);
    vi.mocked(createWorkspaceIssue).mockResolvedValue({ id: 91, workspaceId: 9, severity: "high" } as never);
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 101, workspaceId: 9, format: "json" } as never);
    vi.mocked(createWorkspaceDeveloperHandoff).mockResolvedValue({ id: 111, workspaceId: 9, priority: "high" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.queueToolRun({ workspaceId: 9, toolId: "legacy-tool", sourceType: "public_url" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.workspace.queueToolRun({ workspaceId: 9, toolId: "storefront-analyzer", sourceType: "public_url" })).resolves.toMatchObject({ id: 71 });
    await expect(caller.workspace.startToolRun({ workspaceId: 9, toolRunId: 71 })).resolves.toMatchObject({ status: "running" });
    await expect(caller.workspace.completeToolRun({ workspaceId: 9, toolRunId: 71, resultSummary: { state: "completed" } })).resolves.toMatchObject({ status: "completed" });
    await expect(caller.workspace.addToolEvidence({ workspaceId: 9, toolRunId: 71, kind: "metric", title: "Measured result", details: { value: 1 } })).resolves.toMatchObject({ id: 81 });
    await expect(caller.workspace.createIssue({ workspaceId: 9, toolRunId: 71, title: "Needs review", severity: "high" })).resolves.toMatchObject({ id: 91 });
    await expect(caller.workspace.createReport({ workspaceId: 9, toolRunId: 71, title: "Tool report", format: "json" })).resolves.toMatchObject({ id: 101 });
    await expect(caller.workspace.createDeveloperHandoff({ workspaceId: 9, toolRunId: 71, title: "Fix handoff", affectedLocation: "Product page", currentBehavior: "Current", expectedBehavior: "Expected", recommendedImplementation: "Implement", priority: "high", acceptanceCriteria: ["Pass review"] })).resolves.toMatchObject({ id: 111 });
    expect(queueWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ toolId: "storefront-analyzer", requestedByUserId: 42 }));
    expect(createWorkspaceEvidence).toHaveBeenCalledWith(expect.objectContaining({ toolRunId: 71, actorUserId: 42 }));
  });

  it("executes the exact Heading Structure Analyzer from public URL evidence and records a missing-H1 observation only when observed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop collections"><link rel="canonical" href="https://shop.example/"></head><body><h2>Collections</h2><h3>Featured</h3></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 72, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "heading-structure-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 82, toolRunId: 72 } as never);
    vi.mocked(createWorkspaceIssue).mockResolvedValue({ id: 92, title: "No H1 heading was observed", severity: "medium" } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/72/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/72/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 102, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 72, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 72 });

    expect(result.inspection.headings).toEqual([{ level: 2, text: "Collections" }, { level: 3, text: "Featured" }]);
    expect(result.issues).toEqual([{ id: 92, title: "No H1 heading was observed", severity: "medium" }]);
    expect(createWorkspaceIssue).toHaveBeenCalledWith(expect.objectContaining({ title: "No H1 heading was observed", details: expect.objectContaining({ observed: "no h1 element" }) }));
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_heading_structure_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("tracks validation and controlled release plans with editor/admin and connection boundaries", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "admin" } } as never);
    vi.mocked(queueWorkspaceValidationRun).mockResolvedValue({ id: 121, draftVersionId: 51, status: "queued" } as never);
    vi.mocked(startWorkspaceValidationRun).mockResolvedValue({ id: 121, status: "running" } as never);
    vi.mocked(completeWorkspaceValidationRun).mockResolvedValue({ id: 121, status: "passed" } as never);
    vi.mocked(getWorkspaceDraftVersion).mockResolvedValue({ version: { id: 51, label: "Saved version", designState: "{}" }, draft: { id: 14 } } as never);
    vi.mocked(createWorkspaceReleaseAction).mockResolvedValue({ id: 131, actionType: "publish", status: "pending" } as never);
    vi.mocked(getWorkspaceReleaseEligibility).mockResolvedValue({ eligible: false, reasons: ["The selected draft version needs a passed validation run before publish planning."], hasSupportedConnection: true, passedValidationId: null, priorPublishedReleaseId: null } as never);
    vi.mocked(approveWorkspaceReleaseAction).mockResolvedValue({ id: 131, status: "approved" } as never);
    vi.mocked(cancelWorkspaceReleaseAction).mockResolvedValue({ id: 131, status: "cancelled" } as never);
    vi.mocked(getWorkspaceStore).mockResolvedValue({ id: 10, workspaceId: 9 } as never);
    vi.mocked(listStoreConnections).mockResolvedValue([{ id: 1, status: "connected" }] as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.queueValidationRun({ workspaceId: 9, draftVersionId: 51 })).resolves.toMatchObject({ id: 121, status: "queued" });
    await expect(caller.workspace.startValidationRun({ workspaceId: 9, validationRunId: 121 })).resolves.toMatchObject({ status: "running" });
    await expect(caller.workspace.completeValidationRun({ workspaceId: 9, validationRunId: 121, passed: true, summary: { checks: "passed" } })).resolves.toMatchObject({ status: "passed" });
    vi.mocked(listWorkspaceValidationRuns).mockResolvedValue([{ id: 121, draftVersionId: 51, status: "running" }] as never);
    await expect(caller.workspace.executeDraftIntegrityValidation({ workspaceId: 9, validationRunId: 121 })).resolves.toMatchObject({ status: "passed" });
    expect(completeWorkspaceValidationRun).toHaveBeenLastCalledWith(expect.objectContaining({ validationRunId: 121, passed: true, summary: expect.objectContaining({ validator: "deterministic_draft_integrity" }) }));
    await expect(caller.workspace.createReleaseAction({ workspaceId: 9, storeId: 10, draftVersionId: 51, actionType: "publish" })).resolves.toMatchObject({ id: 131, status: "pending" });
    await expect(caller.workspace.releaseEligibility({ workspaceId: 9, storeId: 10, draftVersionId: 51, actionType: "publish" })).resolves.toMatchObject({ eligible: false, reasons: [expect.stringMatching(/passed validation/i)] });
    await expect(caller.workspace.approveReleaseAction({ workspaceId: 9, releaseActionId: 131 })).resolves.toMatchObject({ status: "approved" });
    await expect(caller.workspace.cancelReleaseAction({ workspaceId: 9, releaseActionId: 131 })).resolves.toMatchObject({ status: "cancelled" });
    expect(createWorkspaceReleaseAction).toHaveBeenCalledWith(expect.objectContaining({ requestedByUserId: 42, actionType: "publish" }));
  });

  it("returns a stored report artifact only to an authorized workspace member", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "viewer" } } as never);
    vi.mocked(getWorkspaceReport).mockResolvedValue({ id: 101, workspaceId: 9, format: "json", storageKey: "workspace-9/reports/inspection.json" } as never);
    vi.mocked(storageGet).mockResolvedValue({ key: "workspace-9/reports/inspection.json", url: "/manus-storage/workspace-9/reports/inspection.json" });
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.reportDownload({ workspaceId: 9, reportId: 101 })).resolves.toEqual({ reportId: 101, format: "json", url: "/manus-storage/workspace-9/reports/inspection.json" });
    expect(storageGet).toHaveBeenCalledWith("workspace-9/reports/inspection.json");
  });
});
