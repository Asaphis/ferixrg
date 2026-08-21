// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const sessionMocks = vi.hoisted(() => ({
  logout: vi.fn().mockResolvedValue({ success: true }),
  invalidate: vi.fn().mockResolvedValue(undefined),
  user: { id: 1, openId: "local_test", name: "Maya Turner", email: "maya@example.com", loginMethod: "email", role: "user", accountStatus: "active", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  bootstrap: { workspace: { id: 1, name: "Maya Turner workspace" }, membership: { workspaceId: 1, userId: 1, role: "owner" } },
  profile: { id: 1, name: "Maya Turner", email: "maya@example.com" },
  preferences: { id: 1, userId: 1, defaultPreview: "mobile", analysisReadyNotifications: 1, draftReviewNotifications: 1, publishingReadinessNotifications: 1, releaseNotes: 1, productResearch: 0, reduceMotion: 0, increaseContrast: 0, visibleKeyboardFocus: 1, twoStepVerification: 0, securityAlerts: 1 },
  twoStepStatus: { encryptionConfigured: false, enrollmentState: "not_enrolled" as const },
  securityEvents: [],
  sessions: [{ id: 1, createdAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000), active: true, current: true }],
  members: [
    { member: { id: 1, workspaceId: 1, userId: 1, role: "owner" }, user: { id: 1, name: "Maya Turner", email: "maya@example.com" } },
    { member: { id: 2, workspaceId: 1, userId: 2, role: "editor" }, user: { id: 2, name: "Alex Knight", email: "alex@example.com" } },
  ],
  invitations: [{ id: 3, workspaceId: 1, email: "jules@example.com", role: "viewer", status: "pending" }],
  activity: [{ id: 8, eventType: "workspace.created" }],
  stores: [{ id: 10, name: "Atelier Forma", platform: "shopify", status: "connected", healthScore: 91, url: "https://atelier.example", updatedAt: new Date() }],
  dashboard: { stores: { total: 1, connected: 1, attention: 0, records: [{ id: 10, name: "Atelier Forma", platform: "shopify", status: "connected", healthScore: 91 }] }, health: { average: 91, measuredStoreCount: 1 }, issues: { total: 0, open: 0, inProgress: 0, resolved: 0, records: [] }, drafts: { total: 0, active: 0, records: [] }, runs: { total: 0, queued: 0, running: 0, completed: 0, records: [] }, reports: { total: 0, records: [] }, activity: [] },
  validationRuns: [],
  releases: [],
  usageSummary: { subscription: { plan: "free", status: "active", currentPeriodEnd: null }, plan: { label: "Free", monthlyToolRuns: 20, monthlyAiCredits: 0, storageBytes: 1_000_000_000, seats: 3 }, usage: { toolRuns: 0, aiCredits: 0, storageBytes: 0, exports: 0, publishActions: 0 }, ledger: [] },
  requests: [],
  drafts: [],
  draftVersions: { draft: null, versions: [] },
  updateProfile: vi.fn().mockResolvedValue({ id: 1, name: "Maya Turner" }),
  updatePreferences: vi.fn().mockResolvedValue({ id: 1, userId: 1, defaultPreview: "mobile" }),
  requestEmailChange: vi.fn().mockResolvedValue({ success: true, delivery: "not_configured" }),
  requestPasswordReset: vi.fn().mockResolvedValue({ success: true, delivery: "not_configured" }),
  startTwoStepEnrollment: vi.fn().mockResolvedValue({ secret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", otpauthUri: "otpauth://totp/FerixRG:test" }),
  confirmTwoStepEnrollment: vi.fn().mockResolvedValue({ success: true, recoveryCodes: ["ABCD-EFGH-IJKL-MNOP"] }),
  revokeOtherSessions: vi.fn().mockResolvedValue({ success: true, revoked: 0 }),
  revokeSession: vi.fn().mockResolvedValue({ success: true }),
  inviteMember: vi.fn().mockResolvedValue({ id: 4, email: "taylor@atelierforma.com", role: "viewer" }),
  updateMemberRole: vi.fn().mockResolvedValue({ success: true }),
  updateInvitationRole: vi.fn().mockResolvedValue({ success: true }),
  removeMember: vi.fn().mockResolvedValue({ success: true }),
  cancelInvitation: vi.fn().mockResolvedValue({ success: true }),
  createPublicUrlSource: vi.fn().mockResolvedValue({ store: { id: 11, name: "yourstore.com" }, snapshot: { id: 12, sourceType: "url_scan" } }),
  createDraft: vi.fn().mockResolvedValue({ draft: { id: 21 }, version: { id: 31 } }),
  saveDraftVersion: vi.fn().mockResolvedValue({ id: 32, designState: "{}" }),
  restoreDraftVersion: vi.fn().mockResolvedValue({ id: 31, designState: "{}" }),
  queueToolRun: vi.fn().mockResolvedValue({ id: 71, status: "queued" }),
  startToolRun: vi.fn().mockResolvedValue({ id: 71, status: "running" }),
  queueValidationRun: vi.fn().mockResolvedValue({ id: 81, status: "queued" }),
  startValidationRun: vi.fn().mockResolvedValue({ id: 81, status: "running" }),
  executeDraftIntegrityValidation: vi.fn().mockResolvedValue({ id: 81, status: "passed" }),
  createReleaseAction: vi.fn().mockResolvedValue({ id: 91, status: "approved", actionType: "export" }),
  approveReleaseAction: vi.fn().mockResolvedValue({ id: 91, status: "approved" }),
  cancelReleaseAction: vi.fn().mockResolvedValue({ id: 91, status: "cancelled" }),
  submitRequest: vi.fn().mockResolvedValue({ id: 101, status: "submitted" }),
  acknowledgeResource: vi.fn().mockResolvedValue({ id: 1, resourceKey: "whats-new" }),
  contentImprove: vi.fn().mockResolvedValue({ response: "Proposed revision: Clearer product copy.\n\nReview before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  designCopilot: vi.fn().mockResolvedValue({ response: "Review the hierarchy and keep the primary action visible.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  aiStoreRedesign: vi.fn().mockResolvedValue({ response: "Proposal: Use a stronger product promise and comparison section. Review before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  visualStyleStudio: vi.fn().mockResolvedValue({ response: "Proposal: Use a restrained contrast palette and a clear type scale. Review before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  responsiveStudio: vi.fn().mockResolvedValue({ response: "Proposal: Stack the feature cards below 768px and retain manual device review. Review before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  contentEditorProposal: vi.fn().mockResolvedValue({ response: "Proposed revision: Clearer product copy. Review before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  generateProductDescription: vi.fn().mockResolvedValue({ response: "A versatile canvas tote for everyday essentials. Verify factual accuracy before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  generateMarketingCopy: vi.fn().mockResolvedValue({ response: "CTA options: Shop the tote. Explore the collection. Review factual accuracy before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1 }),
  executePublicUrlToolRun: vi.fn().mockResolvedValue({ run: { id: 71, status: "completed" }, inspection: { statusCode: 200 }, report: { id: 90 } }),
  reportDownload: vi.fn().mockResolvedValue({ reportId: 90, format: "json", url: "/manus-storage/reports/inspection.json" }),
}));
vi.mock("sonner", () => ({ toast: toastMocks }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      me: { useQuery: () => ({ data: sessionMocks.user, isLoading: false }) },
      logout: { useMutation: () => ({ mutateAsync: sessionMocks.logout, isPending: false }) },
    },
    workspace: {
      bootstrap: { useQuery: () => ({ data: sessionMocks.bootstrap, isLoading: false }) },
      members: { useQuery: () => ({ data: sessionMocks.members, isLoading: false }) },
      invitations: { useQuery: () => ({ data: sessionMocks.invitations, isLoading: false }) },
      activity: { useQuery: () => ({ data: sessionMocks.activity, isLoading: false }) },
      invite: { useMutation: () => ({ mutateAsync: sessionMocks.inviteMember }) },
      updateMemberRole: { useMutation: () => ({ mutateAsync: sessionMocks.updateMemberRole }) },
      updateInvitationRole: { useMutation: () => ({ mutateAsync: sessionMocks.updateInvitationRole }) },
      removeMember: { useMutation: () => ({ mutateAsync: sessionMocks.removeMember }) },
      cancelInvitation: { useMutation: () => ({ mutateAsync: sessionMocks.cancelInvitation }) },
      stores: {
        providerReadiness: { useQuery: () => ({ data: [{ provider: "shopify", configured: false, authorizationMode: "oauth_redirect", supportsPublish: false, supportsRollback: false, message: "Setup required" }], isLoading: false }) },
        list: { useQuery: () => ({ data: sessionMocks.stores, isLoading: false }) },
        createPublicUrlSource: { useMutation: () => ({ mutateAsync: sessionMocks.createPublicUrlSource }) },
      },
      aiProviderReadiness: { useQuery: () => ({ data: [{ provider: "cloudflare_workers_ai", configured: false, model: "@cf/meta/llama-3.2-3b-instruct", message: "Setup required" }], isLoading: false }) },
      dashboard: { useQuery: () => ({ data: sessionMocks.dashboard, isLoading: false }) },
      validationRuns: { useQuery: () => ({ data: sessionMocks.validationRuns, isLoading: false }) },
      releases: { useQuery: () => ({ data: sessionMocks.releases, isLoading: false }) },
      usageSummary: { useQuery: () => ({ data: sessionMocks.usageSummary, isLoading: false }) },
      requests: { useQuery: () => ({ data: sessionMocks.requests, isLoading: false }) },
      legalDocuments: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn().mockResolvedValue({ data: [] }) }) },
      drafts: { useQuery: () => ({ data: sessionMocks.drafts, isLoading: false }) },
      draftVersions: { useQuery: () => ({ data: sessionMocks.draftVersions, isLoading: false }) },
      createDraft: { useMutation: () => ({ mutateAsync: sessionMocks.createDraft }) },
      saveDraftVersion: { useMutation: () => ({ mutateAsync: sessionMocks.saveDraftVersion }) },
      restoreDraftVersion: { useMutation: () => ({ mutateAsync: sessionMocks.restoreDraftVersion }) },
      queueToolRun: { useMutation: () => ({ mutateAsync: sessionMocks.queueToolRun, isPending: false }) },
      startToolRun: { useMutation: () => ({ mutateAsync: sessionMocks.startToolRun, isPending: false }) },
      queueValidationRun: { useMutation: () => ({ mutateAsync: sessionMocks.queueValidationRun }) },
      startValidationRun: { useMutation: () => ({ mutateAsync: sessionMocks.startValidationRun }) },
      executeDraftIntegrityValidation: { useMutation: () => ({ mutateAsync: sessionMocks.executeDraftIntegrityValidation }) },
      createReleaseAction: { useMutation: () => ({ mutateAsync: sessionMocks.createReleaseAction }) },
      approveReleaseAction: { useMutation: () => ({ mutateAsync: sessionMocks.approveReleaseAction }) },
      cancelReleaseAction: { useMutation: () => ({ mutateAsync: sessionMocks.cancelReleaseAction }) },
      submitRequest: { useMutation: () => ({ mutateAsync: sessionMocks.submitRequest }) },
      acknowledgeResource: { useMutation: () => ({ mutateAsync: sessionMocks.acknowledgeResource }) },
      contentImprove: { useMutation: () => ({ mutateAsync: sessionMocks.contentImprove }) },
      designCopilot: { useMutation: () => ({ mutateAsync: sessionMocks.designCopilot }) },
      aiStoreRedesign: { useMutation: () => ({ mutateAsync: sessionMocks.aiStoreRedesign }) },
      visualStyleStudio: { useMutation: () => ({ mutateAsync: sessionMocks.visualStyleStudio }) },
      responsiveStudio: { useMutation: () => ({ mutateAsync: sessionMocks.responsiveStudio }) },
      contentEditorProposal: { useMutation: () => ({ mutateAsync: sessionMocks.contentEditorProposal }) },
      generateProductDescription: { useMutation: () => ({ mutateAsync: sessionMocks.generateProductDescription }) },
      generateMarketingCopy: { useMutation: () => ({ mutateAsync: sessionMocks.generateMarketingCopy }) },
      executePublicUrlToolRun: { useMutation: () => ({ mutateAsync: sessionMocks.executePublicUrlToolRun, isPending: false }) },
      reportDownload: { useMutation: () => ({ mutateAsync: sessionMocks.reportDownload }) },
    },
    account: {
      profile: { useQuery: () => ({ data: sessionMocks.profile, isLoading: false }) },
      preferences: { useQuery: () => ({ data: sessionMocks.preferences, isLoading: false }) },
      sessions: { useQuery: () => ({ data: sessionMocks.sessions, isLoading: false }) },
      twoStepStatus: { useQuery: () => ({ data: sessionMocks.twoStepStatus, isLoading: false, refetch: sessionMocks.invalidate }) },
      securityEvents: { useQuery: () => ({ data: sessionMocks.securityEvents, isLoading: false }) },
      updateProfile: { useMutation: () => ({ mutateAsync: sessionMocks.updateProfile }) },
      updatePreferences: { useMutation: () => ({ mutateAsync: sessionMocks.updatePreferences }) },
      requestEmailChange: { useMutation: () => ({ mutateAsync: sessionMocks.requestEmailChange }) },
      requestPasswordReset: { useMutation: () => ({ mutateAsync: sessionMocks.requestPasswordReset }) },
      startTwoStepEnrollment: { useMutation: () => ({ mutateAsync: sessionMocks.startTwoStepEnrollment }) },
      confirmTwoStepEnrollment: { useMutation: () => ({ mutateAsync: sessionMocks.confirmTwoStepEnrollment }) },
      revokeOtherSessions: { useMutation: () => ({ mutateAsync: sessionMocks.revokeOtherSessions }) },
      revokeSession: { useMutation: () => ({ mutateAsync: sessionMocks.revokeSession }) },
    },
    useUtils: () => ({ auth: { me: { invalidate: sessionMocks.invalidate } }, account: { profile: { invalidate: sessionMocks.invalidate }, preferences: { invalidate: sessionMocks.invalidate }, sessions: { invalidate: sessionMocks.invalidate } }, workspace: { members: { invalidate: sessionMocks.invalidate }, invitations: { invalidate: sessionMocks.invalidate }, activity: { invalidate: sessionMocks.invalidate }, stores: { list: { invalidate: sessionMocks.invalidate } }, drafts: { invalidate: sessionMocks.invalidate }, draftVersions: { invalidate: sessionMocks.invalidate }, validationRuns: { invalidate: sessionMocks.invalidate }, releases: { invalidate: sessionMocks.invalidate }, requests: { invalidate: sessionMocks.invalidate } } }),
  },
}));

import Workspace from "./Workspace";

const renderWorkspace = () => render(createElement(Workspace));

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
  window.history.replaceState({}, "", "/app");
});

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers(); });

describe("Workspace mobile behaviour", () => {
  it("keeps the approved Home, Stores, Tools, and More bottom navigation", () => {
    const view = renderWorkspace();
    const mobileNav = view.getByRole("navigation", { name: "Mobile workspace navigation" });
    expect(within(mobileNav).getByRole("button", { name: "Home" })).toBeTruthy();
    expect(within(mobileNav).getByRole("button", { name: "Stores" })).toBeTruthy();
    expect(within(mobileNav).getByRole("button", { name: "Tools" })).toBeTruthy();
    expect(within(mobileNav).getByRole("button", { name: "More" })).toBeTruthy();
    expect(within(mobileNav).queryByRole("button", { name: "Analyze" })).toBeNull();
  });

  it("gives desktop the complete grouped workspace navigation without expanding mobile", () => {
    const view = renderWorkspace();
    const desktopNav = view.getByRole("navigation", { name: "Desktop workspace navigation" });
    expect(within(desktopNav).getByText("Workspace")).toBeTruthy();
    expect(within(desktopNav).getByText("Intelligence")).toBeTruthy();
    expect(within(desktopNav).getByText("Create & ship")).toBeTruthy();
    expect(within(desktopNav).getByRole("button", { name: "Issues" })).toBeTruthy();
    expect(within(desktopNav).getByRole("button", { name: "Versions" })).toBeTruthy();
    fireEvent.click(within(desktopNav).getByRole("button", { name: "Tools" }));
    expect(view.getByRole("heading", { name: "Choose a FerixRG tool." })).toBeTruthy();
    const mobileNav = view.getByRole("navigation", { name: "Mobile workspace navigation" });
    expect(within(mobileNav).queryByRole("button", { name: "Versions" })).toBeNull();
  });

  it("opens the Stores flow and exposes the Add Store platform decision", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Stores" }));
    expect(view.getByRole("heading", { name: "Your Stores" })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: /Add Store/i }));
    expect(view.getByRole("heading", { name: "Add a Store" })).toBeTruthy();
    expect(view.getByRole("button", { name: /Shopify/i })).toBeTruthy();
    expect(view.getByRole("button", { name: /analyze by URL/i })).toBeTruthy();
  });

  it("renders the direct Stores route in the approved shared dashboard shell", () => {
    window.history.replaceState({}, "", "/app/stores");
    const view = renderWorkspace();
    expect(view.getByRole("heading", { name: "Your Stores" })).toBeTruthy();
    expect(view.getByText("Connected storefronts")).toBeTruthy();
    expect(view.container.querySelector(".dashboard-system-main .approved-topbar")).toBeTruthy();
    expect(view.container.querySelector(".dashboard-system-main .concise-board")).toBeTruthy();
  });

  it("restores the requested tool from a safe authentication return link", () => {
    window.history.replaceState({}, "", "/app/tools?tool=responsive-analyzer");
    const view = renderWorkspace();
    expect(view.getByRole("heading", { name: "Choose a FerixRG tool." })).toBeTruthy();
    const selectedTool = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    expect(selectedTool?.textContent).toMatch(/Responsive Analyzer/i);
  });

  it("requires source selection before entering the tool setup journey", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Tools" }));
    expect(view.getByRole("heading", { name: "Choose a FerixRG tool." })).toBeTruthy();
    expect((view.getByRole("button", { name: "Start Storefront Analyzer" }) as HTMLButtonElement).disabled).toBe(true);
    const toolDetailPanel = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    if (!toolDetailPanel) throw new Error("Expected selected tool detail panel");
    fireEvent.click(within(toolDetailPanel).getByRole("button", { name: "Connected store" }));
    fireEvent.click(view.getByRole("button", { name: "Start Storefront Analyzer" }));
    expect(view.getByRole("heading", { name: /Set up/i })).toBeTruthy();
    expect(view.getByText("Choose a source for this tool.")).toBeTruthy();
  });

  it("keeps a selected real tool connected through source setup, evidence results, and an honest unavailable shared-editor AI tab", async () => {
    window.history.replaceState({}, "", "/app/tools?tool=responsive-analyzer");
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Tools" }));
    const toolDetailPanel = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    if (!toolDetailPanel) throw new Error("Expected selected tool detail panel");
    fireEvent.click(within(toolDetailPanel).getByRole("button", { name: "Public URL" }));
    fireEvent.click(view.getByRole("button", { name: "Start Responsive Analyzer" }));
    expect(view.getByRole("heading", { name: /Set up Responsive Analyzer/i })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: /Run Responsive Analyzer/i }));
    await waitFor(() => expect(sessionMocks.queueToolRun).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1, toolId: "responsive-analyzer", sourceType: "public_url" })));
    await waitFor(() => expect(view.getByRole("heading", { name: /Responsive Analyzer is checking your input/i })).toBeTruthy());
    fireEvent.click(view.getByRole("button", { name: /See (run record|result)/i }));
    expect(view.getByRole("heading", { name: /Responsive Analyzer found a clear next step/i })).toBeTruthy();
    expect(view.getAllByRole("button", { name: /Download report/i }).length).toBeGreaterThan(0);
    fireEvent.click(view.getByRole("button", { name: /Open Responsive Studio/i }));
    expect(view.getByText("Responsive Analyzer · Unsaved workspace draft")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Ask AI" }));
    expect(view.getByText(/Context attached/i)).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Make this less crowded" }));
    expect(view.getByText(/does not yet have a dedicated server-side AI operation/i)).toBeTruthy();
    expect(view.getByText(/No simulated result was created/i)).toBeTruthy();
    expect(view.queryByText("AI suggestion")).toBeNull();
  });

  it("routes technical tools into a delivery-focused workbench rather than the visual editor", () => {
    window.history.replaceState({}, "", "/app/tools?tool=performance-analyzer&stage=editor");
    const view = renderWorkspace();
    expect(view.getByRole("heading", { name: "Open Optimization Workbench" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Create AI plan" })).toBeTruthy();
    expect(view.queryByAltText("Editable storefront preview")).toBeNull();
  });

  it("opens an interactive Account management destination from More", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Profile" }));
    expect(view.getByRole("heading", { name: "Profile" })).toBeTruthy();
    expect(view.getByRole("button", { name: /Edit profile/i })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Back to More" }));
    fireEvent.click(view.getByRole("button", { name: "Preferences" }));
    expect(view.getByRole("heading", { name: "Preferences" })).toBeTruthy();
    expect(view.getByRole("button", { name: /Save preferences/i })).toBeTruthy();
  });

  it("persists account profile and preferences from their approved More panels", async () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Profile" }));
    fireEvent.click(view.getByRole("button", { name: /Edit profile/i }));
    fireEvent.change(view.getByRole("textbox", { name: "Full name" }), { target: { value: "Maya Updated" } });
    fireEvent.click(view.getByRole("button", { name: "Save personal details" }));
    await act(async () => { await Promise.resolve(); });
    expect(sessionMocks.updateProfile).toHaveBeenCalledWith({ name: "Maya Updated" });
    fireEvent.click(view.getByRole("button", { name: /Back to Profile/i }));
    fireEvent.click(view.getByRole("button", { name: "Back to More" }));
    fireEvent.click(view.getByRole("button", { name: "Preferences" }));
    fireEvent.click(view.getByRole("button", { name: /Save preferences/i }));
    fireEvent.click(view.getByRole("button", { name: "Save defaults" }));
    await act(async () => { await Promise.resolve(); });
    expect(sessionMocks.updatePreferences).toHaveBeenCalledWith({ defaultPreview: "mobile" });
  });

  it("keeps authenticator enrollment unavailable until encrypted-secret storage is configured", () => {
    sessionMocks.twoStepStatus = { encryptionConfigured: false, enrollmentState: "not_enrolled" };
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Profile" }));
    fireEvent.click(view.getByRole("button", { name: /Password & security/i }));

    expect(view.getByText(/Authenticator enrollment is unavailable until this deployment has encrypted secret storage configured/i)).toBeTruthy();
    expect(view.queryByRole("button", { name: "Set up authenticator app" })).toBeNull();
  });

  it("renders private security activity with honest alert-delivery state", () => {
    sessionMocks.securityEvents = [{ id: 41, eventType: "two_step_enabled", deliveryState: "not_configured", createdAt: new Date("2026-08-21T00:00:00.000Z") }];
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Profile" }));
    fireEvent.click(view.getByRole("button", { name: /Password & security/i }));

    expect(view.getByText("Two-step verification enabled")).toBeTruthy();
    expect(view.getByText(/Alert delivery is not configured/i)).toBeTruthy();
    sessionMocks.securityEvents = [];
  });

  it("opens specific nested Billing and Support actions instead of generic notices", () => {
    const billingView = renderWorkspace();
    fireEvent.click(within(billingView.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(billingView.getByRole("button", { name: "Usage" }));
    fireEvent.click(billingView.getByRole("button", { name: /Usage limits/i }));
    expect(billingView.getByRole("heading", { name: "Usage limits" })).toBeTruthy();
    expect(billingView.getByRole("button", { name: "Review usage record" })).toBeTruthy();
    billingView.unmount();

    const supportView = renderWorkspace();
    fireEvent.click(within(supportView.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(supportView.getByRole("button", { name: /Support/i }));
    fireEvent.click(supportView.getAllByRole("button", { name: /Contact support/i })[1]);
    expect(supportView.getByRole("heading", { name: "Contact support" })).toBeTruthy();
    expect(supportView.getByRole("textbox", { name: "Subject" })).toBeTruthy();
    expect(supportView.getByRole("button", { name: "Send support request" })).toBeTruthy();
  });

  it("renders More workspace and billing summaries from live scoped records rather than preview values", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    const summaryStrip = view.container.querySelector(".concise-summary-strip");
    expect(summaryStrip?.textContent).toContain("2 active team members");
    expect(summaryStrip?.textContent).toContain("0% monthly usage");
    expect(summaryStrip?.textContent).toContain("1 connected store");
    expect(summaryStrip?.textContent).not.toContain("64%");
    fireEvent.click(view.getByRole("button", { name: "Usage" }));
    expect(view.getByRole("heading", { name: "Billing & Usage" })).toBeTruthy();
    expect(view.getByText("Free plan is active")).toBeTruthy();
    expect(view.getByText(/0 of 20 tool runs are recorded this period/i)).toBeTruthy();
    expect(view.getByText("20 monthly tool runs remaining")).toBeTruthy();
    expect(view.queryByText(/12 of 20 monthly analyses/i)).toBeNull();
  });

  it("invites teammates, manages pending roles, and safely cancels an invitation through live workspace contracts", async () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Team" }));
    fireEvent.click(view.getAllByRole("button", { name: "Invite member" })[0]);
    expect(view.getByRole("dialog", { name: /Invite a workspace member/i })).toBeTruthy();
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "taylor@atelierforma.com" } });
    fireEvent.change(view.getByRole("combobox", { name: "Role" }), { target: { value: "Viewer" } });
    fireEvent.click(view.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(sessionMocks.inviteMember).toHaveBeenCalledWith({ workspaceId: 1, email: "taylor@atelierforma.com", role: "viewer" }));
    const pendingRole = view.getByRole("combobox", { name: "Role for invitation to jules@example.com" });
    fireEvent.change(pendingRole, { target: { value: "Editor" } });
    await waitFor(() => expect(sessionMocks.updateInvitationRole).toHaveBeenCalledWith({ workspaceId: 1, invitationId: 3, role: "editor" }));
    const julesInvitation = view.getByText("jules@example.com").closest("article");
    expect(julesInvitation).toBeTruthy();
    fireEvent.click(within(julesInvitation!).getByRole("button", { name: "Cancel invite" }));
    expect(view.getByRole("dialog", { name: /Cancel this invitation/i })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Cancel invitation" }));
    await waitFor(() => expect(sessionMocks.cancelInvitation).toHaveBeenCalledWith({ workspaceId: 1, invitationId: 3 }));
  });

  it("uses a normal confirmation before signing out when no editor changes are pending", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: /Support/i }));
    fireEvent.click(view.getByRole("button", { name: /Sign out/i }));
    expect(view.getByRole("dialog").textContent).toMatch(/Sign out of your account/i);
    expect(view.getByRole("button", { name: "Sign Out" })).toBeTruthy();
    expect(view.queryByRole("button", { name: "Save & Sign Out" })).toBeNull();
  });

  it("uses the authenticated logout mutation after a sign-out decision", async () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: /Support/i }));
    fireEvent.click(view.getByRole("button", { name: /Sign out/i }));
    fireEvent.click(view.getByRole("button", { name: "Sign Out" }));
    await act(async () => { await Promise.resolve(); });
    expect(sessionMocks.logout).toHaveBeenCalledTimes(1);
    expect(sessionMocks.invalidate).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/auth/login");
  });

  it("saves a real draft version before continuing away from a dirty editor", async () => {
    window.history.replaceState({}, "", "/app/editor");
    const view = renderWorkspace();
    fireEvent.click(view.getByRole("button", { name: "Desktop" }));
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    expect(view.getByRole("dialog").textContent).toMatch(/unsaved editor changes/i);
    expect(view.getByRole("button", { name: "Save & Continue" })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Save & Continue" }));
    await waitFor(() => expect(sessionMocks.createDraft).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1, source: "manual" })));
    await waitFor(() => expect(view.getByRole("heading", { name: "More" })).toBeTruthy());
    expect(view.queryByRole("dialog")).toBeNull();
  });

  it("shows Store connection loading feedback before confirming a successful connection", async () => {
    vi.useFakeTimers();
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Stores" }));
    fireEvent.click(view.getByRole("button", { name: /Add Store/i }));
    fireEvent.click(view.getByRole("button", { name: /Shopify/i }));
    fireEvent.click(view.getByRole("button", { name: "Connect Store" }));
    expect(view.getByRole("button", { name: /Connecting securely/i })).toBeTruthy();
    expect(view.getByText(/Verifying store access/i)).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(900); });
    expect(view.getByRole("heading", { name: "Atelier Forma" })).toBeTruthy();
    expect(toastMocks.success).toHaveBeenCalledWith("Store connected", expect.any(Object));
  });

  it("gives URL-analysis validation errors, then runs a real public URL inspection and opens its result", async () => {
    vi.useFakeTimers();
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Stores" }));
    fireEvent.click(view.getByRole("button", { name: /Add Store/i }));
    fireEvent.click(view.getByRole("button", { name: /analyze by URL/i }));
    const urlField = view.getByRole("textbox", { name: "Storefront URL" });
    fireEvent.change(urlField, { target: { value: "not-a-url" } });
    fireEvent.click(view.getByRole("button", { name: "Analyze URL" }));
    expect(view.getByRole("alert").textContent).toMatch(/can’t be analyzed yet/i);
    expect(toastMocks.error).toHaveBeenCalledWith("Enter a valid storefront URL", expect.any(Object));
    fireEvent.change(view.getByRole("textbox", { name: "Storefront URL" }), { target: { value: "https://atelier-forma.example" } });
    fireEvent.click(view.getByRole("button", { name: "Analyze URL" }));
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    expect(sessionMocks.createPublicUrlSource).toHaveBeenCalledWith({ workspaceId: 1, name: "atelier-forma.example", url: "https://atelier-forma.example/" });
    expect(sessionMocks.queueToolRun).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1, toolId: "storefront-analyzer", sourceType: "public_url" }));
    expect(sessionMocks.startToolRun).toHaveBeenCalledWith({ workspaceId: 1, toolRunId: 71 });
    expect(sessionMocks.executePublicUrlToolRun).toHaveBeenCalledWith({ workspaceId: 1, toolRunId: 71 });
  });
});
