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
    expect(view.getByText("Select input")).toBeTruthy();
  });

  it("opens an interactive Account management destination from More", () => {
    const view = renderWorkspace();
    fireEvent.click(within(view.getByRole("navigation", { name: "Mobile workspace navigation" })).getByRole("button", { name: "More" }));
    fireEvent.click(view.getByRole("button", { name: "Profile" }));
    expect(view.getByRole("heading", { name: "Account" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Save preferences" })).toBeTruthy();
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
    expect(view.getByRole("heading", { name: "Results workspace" })).toBeTruthy();
    expect(toastMocks.success).toHaveBeenCalledWith("URL analysis is ready", expect.any(Object));
  });
});
