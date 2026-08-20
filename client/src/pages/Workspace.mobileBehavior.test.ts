// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMocks }));

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
    expect(view.getByRole("heading", { name: "Choose the next tool." })).toBeTruthy();
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
    window.history.replaceState({}, "", "/app/tools?tool=responsive-redesign");
    const view = renderWorkspace();
    expect(view.getByRole("heading", { name: "Choose the next tool." })).toBeTruthy();
    const selectedTool = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    expect(selectedTool?.textContent).toMatch(/Responsive redesign/i);
  });

  it("requires source selection before entering the tool setup journey", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Tools" }));
    expect(view.getByRole("heading", { name: "Choose the next tool." })).toBeTruthy();
    expect((view.getByRole("button", { name: "Start tool" }) as HTMLButtonElement).disabled).toBe(true);
    const toolDetailPanel = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    if (!toolDetailPanel) throw new Error("Expected selected tool detail panel");
    fireEvent.click(within(toolDetailPanel).getByRole("button", { name: "Connected store" }));
    fireEvent.click(view.getByRole("button", { name: "Start tool" }));
    expect(view.getByRole("heading", { name: /Set up/i })).toBeTruthy();
    expect(view.getByText("Choose a source for this tool.")).toBeTruthy();
  });

  it("keeps a selected real tool connected through source setup, evidence results, and the shared editor AI tab", () => {
    window.history.replaceState({}, "", "/app/tools?tool=responsive-redesign");
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "Tools" }));
    const toolDetailPanel = view.container.querySelector<HTMLElement>(".tool-detail-panel");
    if (!toolDetailPanel) throw new Error("Expected selected tool detail panel");
    fireEvent.click(within(toolDetailPanel).getByRole("button", { name: "Public URL" }));
    fireEvent.click(view.getByRole("button", { name: "Start tool" }));
    expect(view.getByRole("heading", { name: /Set up Responsive redesign/i })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: /Run Responsive redesign/i }));
    fireEvent.click(view.getByRole("button", { name: "See result" }));
    expect(view.getByRole("heading", { name: /Responsive redesign found a clear next step/i })).toBeTruthy();
    expect(view.getAllByRole("button", { name: /Download report/i }).length).toBeGreaterThan(0);
    fireEvent.click(view.getByRole("button", { name: /Improve in Responsive Studio/i }));
    expect(view.getByText("Responsive redesign · Draft 4")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Ask AI" }));
    expect(view.getByText(/Context attached/i)).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Make this less crowded" }));
    fireEvent.click(view.getByRole("button", { name: /Preview AI suggestion/i }));
    expect(view.getByText("AI suggestion")).toBeTruthy();
  });

  it("routes technical tools into a delivery-focused workbench rather than the visual editor", () => {
    window.history.replaceState({}, "", "/app/tools?tool=performance-evidence&stage=editor");
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

  it("invites teammates, manages pending roles, and safely cancels an invitation", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Team" }));
    fireEvent.click(view.getAllByRole("button", { name: "Invite member" })[0]);
    expect(view.getByRole("dialog", { name: /Invite a workspace member/i })).toBeTruthy();
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "taylor@atelierforma.com" } });
    fireEvent.change(view.getByRole("combobox", { name: "Role" }), { target: { value: "Viewer" } });
    fireEvent.click(view.getByRole("button", { name: "Send invitation" }));
    expect(view.getByText("taylor@atelierforma.com")).toBeTruthy();
    const pendingRole = view.getByRole("combobox", { name: "Role for invitation to taylor@atelierforma.com" });
    fireEvent.change(pendingRole, { target: { value: "Editor" } });
    expect(view.getByText(/Taylor is now an Editor/i)).toBeTruthy();
    const taylorInvitation = view.getByText("taylor@atelierforma.com").closest("article");
    expect(taylorInvitation).toBeTruthy();
    fireEvent.click(within(taylorInvitation!).getByRole("button", { name: "Cancel invite" }));
    expect(view.getByRole("dialog", { name: /Cancel this invitation/i })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Cancel invitation" }));
    expect(view.queryByText("taylor@atelierforma.com")).toBeNull();
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
    expect(view.getByRole("heading", { name: /Storefront scan found a clear next step/i })).toBeTruthy();
    expect(toastMocks.success).toHaveBeenCalledWith("URL analysis is ready", expect.any(Object));
  });
});
