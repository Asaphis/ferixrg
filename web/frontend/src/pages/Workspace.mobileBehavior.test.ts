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
  sessions: [{ id: 1, createdAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000), active: true, current: true }],
  members: [
    { member: { id: 1, workspaceId: 1, userId: 1, role: "owner" }, user: { id: 1, name: "Maya Turner", email: "maya@example.com" } },
    { member: { id: 2, workspaceId: 1, userId: 2, role: "editor" }, user: { id: 2, name: "Alex Knight", email: "alex@example.com" } },
  ],
  invitations: [{ id: 3, workspaceId: 1, email: "jules@example.com", role: "viewer", status: "pending" }],
  activity: [{ id: 8, eventType: "workspace.created" }],
  updateProfile: vi.fn().mockResolvedValue({ id: 1, name: "Maya Turner" }),
  updatePreferences: vi.fn().mockResolvedValue({ id: 1, userId: 1, defaultPreview: "mobile" }),
  requestEmailChange: vi.fn().mockResolvedValue({ success: true, delivery: "not_configured" }),
  requestPasswordReset: vi.fn().mockResolvedValue({ success: true, delivery: "not_configured" }),
  revokeOtherSessions: vi.fn().mockResolvedValue({ success: true, revoked: 0 }),
  revokeSession: vi.fn().mockResolvedValue({ success: true }),
  inviteMember: vi.fn().mockResolvedValue({ id: 4, email: "taylor@atelierforma.com", role: "viewer" }),
  updateMemberRole: vi.fn().mockResolvedValue({ success: true }),
  updateInvitationRole: vi.fn().mockResolvedValue({ success: true }),
  removeMember: vi.fn().mockResolvedValue({ success: true }),
  cancelInvitation: vi.fn().mockResolvedValue({ success: true }),
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
    },
    account: {
      profile: { useQuery: () => ({ data: sessionMocks.profile, isLoading: false }) },
      preferences: { useQuery: () => ({ data: sessionMocks.preferences, isLoading: false }) },
      sessions: { useQuery: () => ({ data: sessionMocks.sessions, isLoading: false }) },
      updateProfile: { useMutation: () => ({ mutateAsync: sessionMocks.updateProfile }) },
      updatePreferences: { useMutation: () => ({ mutateAsync: sessionMocks.updatePreferences }) },
      requestEmailChange: { useMutation: () => ({ mutateAsync: sessionMocks.requestEmailChange }) },
      requestPasswordReset: { useMutation: () => ({ mutateAsync: sessionMocks.requestPasswordReset }) },
      revokeOtherSessions: { useMutation: () => ({ mutateAsync: sessionMocks.revokeOtherSessions }) },
      revokeSession: { useMutation: () => ({ mutateAsync: sessionMocks.revokeSession }) },
    },
    useUtils: () => ({ auth: { me: { invalidate: sessionMocks.invalidate } }, account: { profile: { invalidate: sessionMocks.invalidate }, preferences: { invalidate: sessionMocks.invalidate }, sessions: { invalidate: sessionMocks.invalidate } }, workspace: { members: { invalidate: sessionMocks.invalidate }, invitations: { invalidate: sessionMocks.invalidate } } }),
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

  it("keeps a selected real tool connected through source setup, evidence results, and the shared editor AI tab", () => {
    window.history.replaceState({}, "", "/app/tools?tool=responsive-analyzer");
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Tools" }));
    const toolDetailPanel = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    if (!toolDetailPanel) throw new Error("Expected selected tool detail panel");
    fireEvent.click(within(toolDetailPanel).getByRole("button", { name: "Public URL" }));
    fireEvent.click(view.getByRole("button", { name: "Start Responsive Analyzer" }));
    expect(view.getByRole("heading", { name: /Set up Responsive Analyzer/i })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: /Run Responsive Analyzer/i }));
    fireEvent.click(view.getByRole("button", { name: "See result" }));
    expect(view.getByRole("heading", { name: /Responsive Analyzer found a clear next step/i })).toBeTruthy();
    expect(view.getAllByRole("button", { name: /Download report/i }).length).toBeGreaterThan(0);
    fireEvent.click(view.getByRole("button", { name: /Open Responsive Studio/i }));
    expect(view.getByText("Responsive Analyzer · Draft 4")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Ask AI" }));
    expect(view.getByText(/Context attached/i)).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Make this less crowded" }));
    fireEvent.click(view.getByRole("button", { name: /Preview AI suggestion/i }));
    expect(view.getByText("AI suggestion")).toBeTruthy();
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

  it("opens specific nested Billing and Support actions instead of generic notices", () => {
    const billingView = renderWorkspace();
    fireEvent.click(within(billingView.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(billingView.getByRole("button", { name: "Usage" }));
    fireEvent.click(billingView.getByRole("button", { name: /Usage limits/i }));
    expect(billingView.getByRole("heading", { name: "Usage limits" })).toBeTruthy();
    expect(billingView.getByRole("combobox", { name: "Usage alert threshold" })).toBeTruthy();
    expect(billingView.getByRole("button", { name: "Save usage alert" })).toBeTruthy();
    billingView.unmount();

    const supportView = renderWorkspace();
    fireEvent.click(within(supportView.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(supportView.getByRole("button", { name: /Support/i }));
    fireEvent.click(supportView.getAllByRole("button", { name: /Contact support/i })[1]);
    expect(supportView.getByRole("heading", { name: "Contact support" })).toBeTruthy();
    expect(supportView.getByRole("textbox", { name: "Subject" })).toBeTruthy();
    expect(supportView.getByRole("button", { name: "Send support request" })).toBeTruthy();
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

  it("requires a simulated unsaved-work decision before signing out", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: /Support/i }));
    fireEvent.click(view.getByRole("button", { name: /Sign out/i }));
    expect(view.getByRole("dialog").textContent).toMatch(/You have unsaved changes/i);
    expect(view.getByRole("button", { name: "Save & Sign Out" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Sign Out Without Saving" })).toBeTruthy();
  });

  it("uses the authenticated logout mutation after a sign-out decision", async () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: /Support/i }));
    fireEvent.click(view.getByRole("button", { name: /Sign out/i }));
    fireEvent.click(view.getByRole("button", { name: "Sign Out Without Saving" }));
    await act(async () => { await Promise.resolve(); });
    expect(sessionMocks.logout).toHaveBeenCalledTimes(1);
    expect(sessionMocks.invalidate).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/auth/login");
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

  it("gives URL-analysis validation errors, then shows active progress and a success notification", async () => {
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
    expect(view.getByRole("heading", { name: "Analyzing store…" })).toBeTruthy();
    expect(view.getByText(/Results will open automatically/i)).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(1100); });
    expect(view.getByRole("heading", { name: /Storefront Analyzer found a clear next step/i })).toBeTruthy();
    expect(toastMocks.success).toHaveBeenCalledWith("URL analysis is ready", expect.any(Object));
  });
});
