// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import Auth from "./Auth";
import { AUTH_DEMO_SESSION_KEY } from "@/lib/authSimulation";

const renderAuth = (path: string) => {
  window.history.replaceState({}, "", path);
  return render(createElement(Auth));
};

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("simulated authentication", () => {
  it("shows a generic login validation error without creating a session", () => {
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "not-an-email" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    expect(view.getByRole("alert").textContent).toMatch(/valid email address/i);
    expect(window.localStorage.getItem(AUTH_DEMO_SESSION_KEY)).toBeNull();
  });

  it("shows login loading feedback then starts the local preview session", async () => {
    vi.useFakeTimers();
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    expect(view.getByRole("button", { name: /Signing in/i })).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(700); });
    expect(window.localStorage.getItem(AUTH_DEMO_SESSION_KEY)).toBe("active");
  });

  it("requires terms before a simulated account can enter verification", () => {
    const view = renderAuth("/auth/register");
    fireEvent.change(view.getByRole("textbox", { name: "Full name" }), { target: { value: "Maya Turner" } });
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.change(view.getByLabelText("Confirm password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Create Account" }));
    expect(view.getByRole("alert").textContent).toMatch(/accept the Terms/i);
  });

  it("shows the resend verification cooldown", () => {
    vi.useFakeTimers();
    const view = renderAuth("/auth/verify-email");
    fireEvent.click(view.getByRole("button", { name: "Resend Verification Email" }));
    expect(view.getByRole("button", { name: "Resend in 00:45" })).toBeTruthy();
  });

  it("presents the requested session-expiry recovery modal", () => {
    const view = renderAuth("/auth/login?reason=session");
    expect(view.getByRole("dialog").textContent).toMatch(/Your session has expired/i);
  });
});
