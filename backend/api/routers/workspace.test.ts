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
vi.mock("../aiGateway", () => ({ listCentralAiReadiness: vi.fn(), runContentImproverThroughGateway: vi.fn(), runDesignCopilotThroughGateway: vi.fn(), runMarketingCopyThroughGateway: vi.fn(), runProductDescriptionGeneratorThroughGateway: vi.fn() }));

import { acceptWorkspaceInvitation, acknowledgeResource, approveWorkspaceReleaseAction, beginStoreConnection, cancelWorkspaceInvitation, cancelWorkspaceReleaseAction, completeWorkspaceToolRun, completeWorkspaceValidationRun, createStoreSnapshot, createWorkspaceDeveloperHandoff, createWorkspaceDraft, createWorkspaceDraftAsset, createWorkspaceEvidence, createWorkspaceIssue, createWorkspaceReleaseAction, createWorkspaceReport, createWorkspaceRequest, createWorkspaceStore, ensurePersonalWorkspace, getWorkspaceAccess, getWorkspaceAiNeuronUsageSince, getWorkspaceDashboardReadModel, getWorkspaceDraftVersion, getWorkspaceReleaseEligibility, getWorkspaceReport, getWorkspaceStore, getWorkspaceToolRun, getWorkspaceUsageSummary, listLegalDocuments, listStoreConnections, listStoreSnapshots, listWorkspaceDeveloperHandoffs, listWorkspaceDraftAssets, listWorkspaceDraftVersions, listWorkspaceIssues, listWorkspaceReports, listWorkspaceRequests, listWorkspaceStores, listWorkspaceValidationRuns, queueWorkspaceToolRun, queueWorkspaceValidationRun, recordWorkspaceActivity, recordWorkspaceUsage, removeWorkspaceMember, restoreWorkspaceDraftVersion, saveWorkspaceDraftVersion, startWorkspaceToolRun, startWorkspaceValidationRun, updateWorkspaceInvitationRole, updateWorkspaceIssueStatus, updateWorkspaceMemberRole } from "../db";
import { failWorkspaceToolRun } from "../db";
import { storageGet, storagePut } from "../storage";
import { listCentralAiReadiness, runContentImproverThroughGateway, runDesignCopilotThroughGateway, runMarketingCopyThroughGateway, runProductDescriptionGeneratorThroughGateway } from "../aiGateway";
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

vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/1/ai-proposal.json", url: "https://storage.example/ai-proposal.json" } as never);
vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 601 } as never);
vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 701 } as never);

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

    await expect(caller.workspace.designCopilot({ workspaceId: 9, toolRunId: 22, message: "Make the product call to action easier to notice.", context: { device: "Mobile", element: "Buy button" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 3, proposalArtifact: { evidenceId: 601, reportId: 701, storageKey: expect.any(String) } });
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 3, unit: "neurons", provider: "cloudflare_workers_ai" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.design_copilot.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
    expect(storagePut).toHaveBeenCalledWith(expect.stringContaining("workspace-9/tool-runs/22/ai-proposal-ai-design-copilot.json"), expect.any(Buffer), "application/json");
    expect(createWorkspaceEvidence).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, toolRunId: 22, kind: "provider_summary", title: "Design Copilot proposal artifact", details: expect.not.objectContaining({ proposal: expect.anything() }) }));
    expect(createWorkspaceReport).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, toolRunId: 22, title: "Design Copilot proposal", format: "json" }));
  });

  it("runs Content Improver only within editor access, accounts for neurons, and retains source text outside audit metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 23, workspaceId: 9, toolId: "ai-content-improver" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runContentImproverThroughGateway).mockResolvedValue({ response: "Proposed revision: Clearer product copy.\n\nReview before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.2, promptTokens: 22, completionTokens: 14 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 2 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.contentImprove({ workspaceId: 9, toolRunId: 23, sourceText: "This carefully designed tote keeps daily essentials organized.", instruction: "Make the copy clearer and more concise." })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runContentImproverThroughGateway).toHaveBeenCalledWith({ sourceText: "This carefully designed tote keeps daily essentials organized.", instruction: "Make the copy clearer and more concise." });
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "content_improver", referenceId: "23" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.content_improver.completed", details: expect.objectContaining({ toolRunId: 23, sourceTextLength: 62 }) }));
  });

  it("runs AI Store Redesign only from its exact tool run, returns a reviewable proposal, and records bounded usage metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 27, workspaceId: 9, toolId: "ai-store-redesign" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runDesignCopilotThroughGateway).mockResolvedValue({ response: "Proposal: Clarify the product promise and use a stronger comparison block. Review before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.4, promptTokens: 28, completionTokens: 18 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 5 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.aiStoreRedesign({ workspaceId: 9, toolRunId: 27, message: "Create a more focused storefront direction for a canvas tote.", context: { device: "Mobile", selectedElement: "Hero" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runDesignCopilotThroughGateway).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Create a reviewable storefront redesign proposal only."), context: expect.objectContaining({ operation: "AI Store Redesign", device: "Mobile", selectedElement: "Hero" }) }));
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "ai_store_redesign", referenceId: "27" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.store_redesign.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
  });

  it("rejects AI Store Redesign when the supplied tool run belongs to another operation", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 28, workspaceId: 9, toolId: "ai-design-copilot" } as never);
    vi.mocked(runDesignCopilotThroughGateway).mockClear();
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.aiStoreRedesign({ workspaceId: 9, toolRunId: 28, message: "Create a new direction." })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("AI Store Redesign") });
    expect(runDesignCopilotThroughGateway).not.toHaveBeenCalled();
  });

  it("runs Visual Style Studio only from its exact tool run, returns a reviewable proposal, and records bounded usage metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 29, workspaceId: 9, toolId: "visual-style-studio" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runDesignCopilotThroughGateway).mockResolvedValue({ response: "Proposal: Use a restrained contrast palette and clear type scale. Review before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.3, promptTokens: 26, completionTokens: 17 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 6 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.visualStyleStudio({ workspaceId: 9, toolRunId: 29, message: "Create a more refined neutral color direction for the hero.", context: { device: "Desktop", selectedElement: "Hero" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runDesignCopilotThroughGateway).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Create a reviewable visual-style proposal only."), context: expect.objectContaining({ operation: "Visual Style Studio", device: "Desktop", selectedElement: "Hero" }) }));
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "visual_style_studio", referenceId: "29" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.visual_style_studio.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
  });

  it("rejects Visual Style Studio when the supplied tool run belongs to another operation", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 30, workspaceId: 9, toolId: "ai-design-copilot" } as never);
    vi.mocked(runDesignCopilotThroughGateway).mockClear();
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.visualStyleStudio({ workspaceId: 9, toolRunId: 30, message: "Create a style direction." })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Visual Style Studio") });
    expect(runDesignCopilotThroughGateway).not.toHaveBeenCalled();
  });

  it("runs Content Editor only from its exact tool run, returns a reviewable revision, and records bounded usage metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 31, workspaceId: 9, toolId: "content-editor" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runContentImproverThroughGateway).mockResolvedValue({ response: "Proposed revision: Clearer product copy. Review before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.1, promptTokens: 24, completionTokens: 16 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 7 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.contentEditorProposal({ workspaceId: 9, toolRunId: 31, sourceText: "This tote keeps your daily essentials together.", instruction: "Make this product copy clearer while preserving facts." })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runContentImproverThroughGateway).toHaveBeenCalledWith({ sourceText: "This tote keeps your daily essentials together.", instruction: "Make this product copy clearer while preserving facts." });
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "content_editor", referenceId: "31" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.content_editor.completed", details: expect.objectContaining({ toolRunId: 31, sourceTextLength: 47 }) }));
  });

  it("rejects Content Editor proposals when the supplied tool run belongs to another operation", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 32, workspaceId: 9, toolId: "ai-content-improver" } as never);
    vi.mocked(runContentImproverThroughGateway).mockClear();
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.contentEditorProposal({ workspaceId: 9, toolRunId: 32, sourceText: "Revise this copy." })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Content Editor") });
    expect(runContentImproverThroughGateway).not.toHaveBeenCalled();
  });

  it("runs Responsive Studio only from its exact tool run, returns a reviewable proposal, and records bounded usage metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 33, workspaceId: 9, toolId: "responsive-studio" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runDesignCopilotThroughGateway).mockResolvedValue({ response: "Proposal: Stack the feature cards below 768px. Review before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.2, promptTokens: 25, completionTokens: 17 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 8 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.responsiveStudio({ workspaceId: 9, toolRunId: 33, message: "Create a mobile-first layout direction for the feature cards.", context: { device: "Mobile", selectedElement: "Feature cards" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runDesignCopilotThroughGateway).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Create a reviewable responsive-layout proposal only."), context: expect.objectContaining({ operation: "Responsive Studio", device: "Mobile", selectedElement: "Feature cards" }) }));
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "responsive_studio", referenceId: "33" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.responsive_studio.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
  });

  it("rejects Responsive Studio when the supplied tool run belongs to another operation", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 34, workspaceId: 9, toolId: "ai-design-copilot" } as never);
    vi.mocked(runDesignCopilotThroughGateway).mockClear();
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.responsiveStudio({ workspaceId: 9, toolRunId: 34, message: "Create a mobile direction." })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Responsive Studio") });
    expect(runDesignCopilotThroughGateway).not.toHaveBeenCalled();
  });

  it("runs Layout Composer only from its exact tool run, returns a reviewable proposal, and records bounded usage metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 35, workspaceId: 9, toolId: "layout-composer" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runDesignCopilotThroughGateway).mockResolvedValue({ response: "Proposal: Place product proof beside the primary action. Review before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.2, promptTokens: 25, completionTokens: 17 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 9 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.layoutComposer({ workspaceId: 9, toolRunId: 35, message: "Create a clearer product-page layout direction.", context: { device: "Desktop", selectedElement: "Product proof" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runDesignCopilotThroughGateway).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Create a reviewable layout proposal only."), context: expect.objectContaining({ operation: "Layout Composer", device: "Desktop", selectedElement: "Product proof" }) }));
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "layout_composer", referenceId: "35" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.layout_composer.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
  });

  it("rejects Layout Composer when the supplied tool run belongs to another operation", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 36, workspaceId: 9, toolId: "ai-design-copilot" } as never);
    vi.mocked(runDesignCopilotThroughGateway).mockClear();
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.layoutComposer({ workspaceId: 9, toolRunId: 36, message: "Create a layout direction." })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Layout Composer") });
    expect(runDesignCopilotThroughGateway).not.toHaveBeenCalled();
  });

  it("runs Component Builder only from its exact tool run, returns a reviewable proposal, and records bounded usage metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 37, workspaceId: 9, toolId: "component-builder" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runDesignCopilotThroughGateway).mockResolvedValue({ response: "Proposal: Use a reusable product-benefit card. Review before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.2, promptTokens: 25, completionTokens: 17 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 10 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.componentBuilder({ workspaceId: 9, toolRunId: 37, message: "Create a reusable product-benefit card direction.", context: { device: "Desktop", selectedElement: "Benefit card" } })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runDesignCopilotThroughGateway).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Create a reviewable component proposal only."), context: expect.objectContaining({ operation: "Component Builder", device: "Desktop", selectedElement: "Benefit card" }) }));
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "component_builder", referenceId: "37" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.component_builder.completed", details: expect.not.objectContaining({ message: expect.anything() }) }));
  });

  it("rejects Component Builder when the supplied tool run belongs to another operation", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 38, workspaceId: 9, toolId: "ai-design-copilot" } as never);
    vi.mocked(runDesignCopilotThroughGateway).mockClear();
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.componentBuilder({ workspaceId: 9, toolRunId: 38, message: "Create a card direction." })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Component Builder") });
    expect(runDesignCopilotThroughGateway).not.toHaveBeenCalled();
  });

  it("runs Product Description Generator only within editor access, accounts for neurons, and retains facts outside audit metadata", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 24, workspaceId: 9, toolId: "product-description-generator" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runProductDescriptionGeneratorThroughGateway).mockResolvedValue({ response: "A versatile canvas tote for everyday essentials. Verify factual accuracy before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.4, promptTokens: 20, completionTokens: 16 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 3 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.generateProductDescription({ workspaceId: 9, toolRunId: 24, productFacts: "Canvas tote. Internal pocket. Adjustable strap." })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runProductDescriptionGeneratorThroughGateway).toHaveBeenCalledWith({ productFacts: "Canvas tote. Internal pocket. Adjustable strap." });
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "product_description_generator", referenceId: "24" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.product_description_generator.completed", details: expect.objectContaining({ toolRunId: 24, productFactsLength: 47 }) }));
  });

  it("runs the exact CTA Generator mode only within editor access and accounts for audited marketing-copy usage", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 25, workspaceId: 9, toolId: "cta-generator" } as never);
    vi.mocked(getWorkspaceAiNeuronUsageSince).mockResolvedValue(18 as never);
    vi.mocked(runMarketingCopyThroughGateway).mockResolvedValue({ response: "CTA options: Shop the tote. Explore the collection. Review factual accuracy before applying.", provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1.1, promptTokens: 18, completionTokens: 14 });
    vi.mocked(recordWorkspaceUsage).mockResolvedValue({ id: 4 } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.generateMarketingCopy({ workspaceId: 9, toolRunId: 25, mode: "cta-generator", sourceFacts: "Canvas tote. Internal pocket." })).resolves.toMatchObject({ model: "@cf/meta/llama-3.2-3b-instruct", neurons: 2 });
    expect(runMarketingCopyThroughGateway).toHaveBeenCalledWith({ mode: "cta-generator", sourceFacts: "Canvas tote. Internal pocket." });
    expect(recordWorkspaceUsage).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, userId: 42, quantity: 2, unit: "neurons", provider: "cloudflare_workers_ai", referenceType: "marketing_copy:cta-generator", referenceId: "25" }));
    expect(recordWorkspaceActivity).toHaveBeenCalledWith(expect.objectContaining({ eventType: "ai.marketing_copy.completed", details: expect.objectContaining({ toolRunId: 25, mode: "cta-generator", sourceFactsLength: 29 }) }));
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

  it("records a public URL source but blocks an unconfigured provider before creating a pending connection", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(createWorkspaceStore).mockResolvedValue({ id: 31, url: "https://source.example" } as never);
    vi.mocked(createStoreSnapshot).mockResolvedValue({ id: 32, storeId: 31, sourceType: "url_scan" } as never);
    vi.mocked(recordWorkspaceActivity).mockResolvedValue(undefined);
    vi.mocked(getWorkspaceStore).mockResolvedValue({ id: 31, workspaceId: 9 } as never);
    vi.mocked(beginStoreConnection).mockResolvedValue({ id: 33, storeId: 31, provider: "shopify", status: "pending" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.stores.createPublicUrlSource({ workspaceId: 9, name: "Source store", url: "https://source.example" })).resolves.toMatchObject({ store: { id: 31 }, snapshot: { id: 32 } });
    vi.mocked(beginStoreConnection).mockClear();
    await expect(caller.workspace.stores.beginConnection({ workspaceId: 9, storeId: 31, provider: "shopify", scopes: ["read_products"] })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

    expect(createWorkspaceStore).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, createdByUserId: 42, platform: "public_url" }));
    expect(createStoreSnapshot).toHaveBeenCalledWith(expect.objectContaining({ storeId: 31, sourceType: "url_scan" }));
    expect(beginStoreConnection).not.toHaveBeenCalled();
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

  it("fails unsupported public-URL tools without creating generic inspection output", async () => {
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 79, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "ai-store-redesign", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(failWorkspaceToolRun).mockResolvedValue({ id: 79, status: "failed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    await expect(caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 79 })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("does not yet have a dedicated public-URL executor") });

    expect(failWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 9, toolRunId: 79, actorUserId: 42, errorMessage: expect.stringContaining("dedicated public-URL executor") }));
    expect(createWorkspaceEvidence).not.toHaveBeenCalledWith(expect.objectContaining({ toolRunId: 79 }));
    expect(storagePut).not.toHaveBeenCalledWith(expect.stringContaining("tool-runs/79"), expect.anything(), expect.anything());
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

  it("executes the exact Navigation Analyzer from public URL evidence without implying a crawl", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><main><a href="/cart"><svg></svg></a></main></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 73, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "navigation-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 83, toolRunId: 73 } as never);
    vi.mocked(createWorkspaceIssue).mockImplementation(async input => ({ id: input.title.startsWith("No navigation") ? 93 : 94, title: input.title, severity: input.severity }) as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/73/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/73/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 103, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 73, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 73 });

    expect(result.inspection).toMatchObject({ navigationLandmarkCount: 0, mainLandmarkCount: 1, linksWithText: 0, linksWithoutText: 1 });
    expect(result.issues.map(issue => issue.title)).toEqual(["No navigation landmark was observed", "1 observed link has no text content"]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_navigation_indicator_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Performance Analyzer with a bounded server-side timing observation only", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValueOnce(2_000).mockReturnValueOnce(5_250);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body>Store</body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 74, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "performance-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 84, toolRunId: 74 } as never);
    vi.mocked(createWorkspaceIssue).mockResolvedValue({ id: 95, title: "Observed public URL fetch and read took 3250 ms", severity: "low" } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/74/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/74/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 104, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 74, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 74 });

    expect(result.inspection).toMatchObject({ fetchAndReadDurationMs: 3_250 });
    expect(result.issues).toEqual([{ id: 95, title: "Observed public URL fetch and read took 3250 ms", severity: "low" }]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_fetch_and_document_size_inspection" }) }));
    clock.mockRestore();
    vi.unstubAllGlobals();
  });

  it("executes the exact CTA Analyzer with observed interactive text only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="/collection">Shop collection</a><button><svg></svg></button></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 75, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "cta-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 85, toolRunId: 75 } as never);
    vi.mocked(createWorkspaceIssue).mockResolvedValue({ id: 96, title: "1 observed anchor or button element has no text content", severity: "low" } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/75/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/75/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 105, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 75, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 75 });

    expect(result.inspection).toMatchObject({ ctaElementCount: 2, ctaElementsWithText: 1, ctaElementsWithoutText: 1, ctaTexts: ["Shop collection"] });
    expect(result.issues).toEqual([{ id: 96, title: "1 observed anchor or button element has no text content", severity: "low" }]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_interactive_text_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Content Quality Analyzer with extracted text indicators only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><h1></h1><p>Store copy.</p></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 76, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "content-quality-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 86, toolRunId: 76 } as never);
    vi.mocked(createWorkspaceIssue).mockResolvedValue({ id: 97, title: "1 observed heading has no text content", severity: "low" } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/76/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/76/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 106, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 76, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 76 });

    expect(result.inspection).toMatchObject({ bodyTextWordCount: 2, paragraphCount: 1, paragraphsWithText: 1, emptyHeadingCount: 1 });
    expect(result.issues).toEqual([{ id: 97, title: "1 observed heading has no text content", severity: "low" }]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_extracted_text_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Product Page Analyzer with parsed JSON-LD declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><script type="application/ld+json">{"@type":"Product","name":"Canvas Tote","offers":{"@type":"Offer"}}</script></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 77, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "product-page-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 87, toolRunId: 77 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/77/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/77/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 107, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 77, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 77 });

    expect(result.inspection).toMatchObject({ productStructuredDataCount: 1, productNames: ["Canvas Tote"], productOfferCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_product_json_ld_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Image Optimization Analyzer with image markup attributes only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><img src="hero.jpg" width="1200" height="900" loading="lazy"><img src="product.jpg"></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 78, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "image-optimization-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 88, toolRunId: 78 } as never);
    vi.mocked(createWorkspaceIssue).mockImplementation(async input => ({ id: input.title.includes("width and height") ? 98 : 99, title: input.title, severity: input.severity }) as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/78/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/78/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 108, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 78, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 78 });

    expect(result.inspection).toMatchObject({ imageCount: 2, imagesLazyLoaded: 1, imagesWithDimensions: 1, imagesWithoutDimensions: 1 });
    expect(result.issues).toEqual([{ id: 99, title: "2 observed images lack alternative text", severity: "medium" }, { id: 98, title: "1 observed image lacks both width and height attributes", severity: "low" }]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_image_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Asset Analyzer with observed reference hosts only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><link rel="stylesheet" href="/theme.css"><script src="https://cdn.example/app.js"></script></head><body><img src="/hero.jpg" alt="Hero"></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 80, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "asset-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 89, toolRunId: 80 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/80/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/80/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 109, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 80, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 80 });

    expect(result.inspection).toMatchObject({ assetReferenceCount: 3, imageAssetReferenceCount: 1, stylesheetAssetReferenceCount: 1, scriptAssetReferenceCount: 1, assetHosts: ["shop.example", "cdn.example"] });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_asset_reference_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Responsive Analyzer with observed markup indicators only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><style>@media (max-width: 700px) { .hero { display: block; } }</style></head><body><img src="/hero.jpg" alt="Hero" srcset="/hero-640.jpg 640w, /hero-1280.jpg 1280w"></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 81, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "responsive-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 90, toolRunId: 81 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/81/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/81/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 110, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 81, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 81 });

    expect(result.inspection).toMatchObject({ hasViewport: true, inlineStyleBlockCount: 1, inlineMediaQueryCount: 1, responsiveImageSrcsetCount: 1 });
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_responsive_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Mobile UX Analyzer with observed mobile-oriented markup only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="tel:+15551234567">Call</a><input type="tel"><input inputmode="numeric"></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 82, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "mobile-ux-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 91, toolRunId: 82 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/82/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/82/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 111, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 82, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 82 });

    expect(result.inspection).toMatchObject({ hasViewport: true, telephoneLinkCount: 1, telephoneInputCount: 1, mobileInputModeCount: 1 });
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_mobile_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Trust & Credibility Analyzer with observed structured-data declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"Review"},{"@type":"AggregateRating"}]}</script></head><body></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 83, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "trust-credibility-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 92, toolRunId: 83 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/83/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/83/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 112, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 83, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 83 });

    expect(result.inspection).toMatchObject({ organizationStructuredDataCount: 1, reviewStructuredDataCount: 1, aggregateRatingStructuredDataCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_credibility_structured_data_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact UX Analyzer with observed form, role, and skip-link markup only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="#content">Skip to content</a><nav role="navigation"></nav><main id="content" role="main"><form action="/search"><input type="search"></form></main></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 84, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "ux-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 93, toolRunId: 84 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/84/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/84/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 113, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 84, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 84 });

    expect(result.inspection).toMatchObject({ formElementCount: 1, ariaRoleAttributeCount: 2, skipLinkCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_ux_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Color & Contrast Analyzer with observed CSS declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><style>.cta { color: #fff; background-color: #123456; }</style></head><body><p style="color: rgb(1, 2, 3); border-color: var(--line)">Text</p></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 85, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "color-contrast-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 94, toolRunId: 85 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/85/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/85/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 114, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 85, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 85 });

    expect(result.inspection).toMatchObject({ inlineColorDeclarationCount: 2, styleBlockColorDeclarationCount: 2, observedColorValues: ["rgb(1, 2, 3)", "var(--line)", "#fff", "#123456"] });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_color_style_declaration_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Typography Analyzer with observed font-family declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><style>h1 { font-family: "Fraunces", serif; } .body { font-family: Inter, sans-serif; }</style></head><body><p style="font-family: Arial, sans-serif">Text</p></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 86, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "typography-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 95, toolRunId: 86 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/86/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/86/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 115, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 86, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 86 });

    expect(result.inspection).toMatchObject({ inlineFontFamilyDeclarationCount: 1, styleBlockFontFamilyDeclarationCount: 2, observedFontFamilies: ["Arial, sans-serif", '"Fraunces", serif', "Inter, sans-serif"] });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_typography_font_family_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Conversion Analyzer with observed cart and checkout paths only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="/cart">Cart</a><a href="/checkout">Checkout</a><form action="/cart/add"><button>Add</button></form><form action="/checkout"><button>Pay</button></form></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 87, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "conversion-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 96, toolRunId: 87 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/87/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/87/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 116, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 87, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 87 });

    expect(result.inspection).toMatchObject({ cartLinkCount: 1, checkoutLinkCount: 1, cartOrCheckoutFormActionCount: 2 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_commerce_path_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Breakpoint Analyzer with observed media-query conditions only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><style>@media (max-width: 700px) { .hero { display: block; } } @media screen and (min-width: 960px) { .hero { display: grid; } }</style></head><body></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 88, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "breakpoint-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 97, toolRunId: 88 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/88/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/88/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 117, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 88, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 88 });

    expect(result.inspection).toMatchObject({ mediaQueryConditionCount: 2, observedMediaQueryConditions: ["(max-width: 700px)", "screen and (min-width: 960px)"] });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_media_query_condition_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Collection Analyzer with observed collection-path links only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="/collections/summer">Summer</a><a href="/collection/new">New</a><a href="/products/tote">Tote</a></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 89, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "collection-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 98, toolRunId: 89 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/89/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/89/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 118, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 89, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 89 });

    expect(result.inspection).toMatchObject({ collectionLinkCount: 2, observedCollectionPaths: ["/collections/summer", "/collection/new"] });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_collection_path_link_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Product Presentation Analyzer with observed image declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><script type="application/ld+json">{"@type":"Product","name":"Canvas Tote","image":["https://shop.example/tote-1.jpg","https://shop.example/tote-2.jpg"]}</script></head><body><img src="tote-1.jpg" alt="Tote"><img src="tote-2.jpg" alt="Tote detail"></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 90, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "product-presentation-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 99, toolRunId: 90 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/90/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/90/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 119, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 90, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 90 });

    expect(result.inspection).toMatchObject({ imageCount: 2, productStructuredDataCount: 1, productImageStructuredDataCount: 2 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_product_image_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Product Content Analyzer with observed structured declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><script type="application/ld+json">{"@type":"Product","name":"Canvas Tote","description":"A durable tote with an inside pocket."}</script></head><body></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 91, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "product-content-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 100, toolRunId: 91 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/91/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/91/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 120, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 91, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 91 });

    expect(result.inspection).toMatchObject({ productStructuredDataCount: 1, productNames: ["Canvas Tote"], productDescriptionStructuredDataCount: 1, productDescriptionCharacterCount: 37 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_product_content_declaration_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Cart Analyzer with observed cart-path markup only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="/cart">Cart</a><a href="/checkout">Checkout</a><form action="/cart/add"><button>Add</button></form><form action="/checkout"><button>Pay</button></form></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 92, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "cart-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 101, toolRunId: 92 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/92/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/92/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 121, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 92, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 92 });

    expect(result.inspection).toMatchObject({ cartLinkCount: 1, cartFormActionCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_cart_path_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Checkout UX Analyzer with observed checkout-path markup only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="/cart">Cart</a><a href="/checkout">Checkout</a><form action="/cart/add"><button>Add</button></form><form action="/checkout"><button>Pay</button></form></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 93, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "checkout-ux-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 102, toolRunId: 93 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/93/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/93/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 122, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 93, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 93 });

    expect(result.inspection).toMatchObject({ checkoutLinkCount: 1, checkoutFormActionCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_checkout_path_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Customer Journey Analyzer with observed journey-path links only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><a href="/products/tote">Tote</a><a href="/collections/new">New</a><a href="/cart">Cart</a><a href="/checkout">Checkout</a></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 94, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "customer-journey-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 103, toolRunId: 94 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/94/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/94/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 123, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 94, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 94 });

    expect(result.inspection).toMatchObject({ productLinkCount: 1, collectionLinkCount: 1, cartLinkCount: 1, checkoutLinkCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_journey_path_link_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Layout Analyzer with observed semantic layout markup only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><header>Header</header><main><section>Feature</section><section><article>Story</article></section></main><footer>Footer</footer></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 95, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "layout-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 104, toolRunId: 95 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/95/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/95/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 124, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 95, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 95 });

    expect(result.inspection).toMatchObject({ headerElementCount: 1, mainLandmarkCount: 1, sectionElementCount: 2, articleElementCount: 1, footerElementCount: 1, semanticLayoutElementCount: 6 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_semantic_layout_markup_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Visual Design Analyzer with observed style declarations only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"><style>.hero { color: #112233; font-family: Inter, sans-serif; }</style></head><body><div style="background-color: #ffffff; font-family: Georgia, serif">Welcome</div></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 96, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "visual-design-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 105, toolRunId: 96 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/96/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/96/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 125, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 96, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 96 });

    expect(result.inspection).toMatchObject({ inlineStyleBlockCount: 1, inlineColorDeclarationCount: 1, styleBlockColorDeclarationCount: 1, inlineFontFamilyDeclarationCount: 1, styleBlockFontFamilyDeclarationCount: 1 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_observed_style_declaration_inspection" }) }));
    vi.unstubAllGlobals();
  });

  it("executes the exact Visual Hierarchy Analyzer with observed headings and interactive markup only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Shop"><link rel="canonical" href="https://shop.example/"></head><body><h1>Welcome</h1><h2>Featured</h2><h2>Details</h2><a href="/products/tote">Shop tote</a><button>View collection</button></body></html>')); controller.close(); } }) }));
    vi.mocked(getWorkspaceAccess).mockResolvedValue({ workspace: { id: 9 }, membership: { role: "editor" } } as never);
    vi.mocked(getWorkspaceToolRun).mockResolvedValue({ id: 97, workspaceId: 9, status: "running", sourceType: "public_url", toolId: "visual-hierarchy-analyzer", inputSummary: { url: "https://shop.example" } } as never);
    vi.mocked(createWorkspaceEvidence).mockResolvedValue({ id: 106, toolRunId: 97 } as never);
    vi.mocked(storagePut).mockResolvedValue({ key: "workspace-9/tool-runs/97/public-url-inspection.json", url: "/manus-storage/workspace-9/tool-runs/97/public-url-inspection.json" });
    vi.mocked(createWorkspaceReport).mockResolvedValue({ id: 126, workspaceId: 9, format: "json" } as never);
    vi.mocked(completeWorkspaceToolRun).mockResolvedValue({ id: 97, status: "completed" } as never);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.workspace.executePublicUrlToolRun({ workspaceId: 9, toolRunId: 97 });

    expect(result.inspection).toMatchObject({ headingCount: 3, ctaElementsWithText: 2 });
    expect(result.issues).toEqual([]);
    expect(completeWorkspaceToolRun).toHaveBeenCalledWith(expect.objectContaining({ resultSummary: expect.objectContaining({ execution: "deterministic_heading_and_interactive_markup_inspection" }) }));
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
