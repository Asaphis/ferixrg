// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import Auth from "./Auth";

const fetchMock = vi.fn();

const renderAuth = (path: string) => {
  window.history.replaceState({}, "", path);
  return render(createElement(Auth));
};

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("local account authentication", () => {
  it("shows a login validation error without making an account request", () => {
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "not-an-email" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    expect(view.getByRole("alert").textContent).toMatch(/valid email address/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits sign-in to the real local-account route", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/account/login", expect.objectContaining({ method: "POST", credentials: "include" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "maya@example.com", password: "Password1!" });
  });

  it("returns to the requested safe tool after real sign-in", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/login?returnTo=%2Fapp%2Ftools%3Ftool%3Dresponsive-redesign");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(window.location.pathname).toBe("/app/tools");
    expect(new URLSearchParams(window.location.search).get("tool")).toBe("responsive-redesign");
  });

  it("requires terms before a local account can enter verification", () => {
    const view = renderAuth("/auth/register");
    fireEvent.change(view.getByRole("textbox", { name: "Full name" }), { target: { value: "Maya Turner" } });
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.change(view.getByLabelText("Confirm password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Create Account" }));
    expect(view.getByRole("alert").textContent).toMatch(/accept the Terms/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a valid registration to the real local-account route", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, verificationRequired: true }) });
    const view = renderAuth("/auth/register");
    fireEvent.change(view.getByRole("textbox", { name: "Full name" }), { target: { value: "Maya Turner" } });
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.change(view.getByLabelText("Confirm password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("checkbox"));
    fireEvent.click(view.getByRole("button", { name: "Create Account" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/account/register", expect.objectContaining({ method: "POST", credentials: "include" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: "Maya Turner", email: "maya@example.com", password: "Password1!" });
  });

  it("shows the backend credential error without creating a browser-local session", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ success: false, message: "Incorrect email or password." }) });
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(view.getByRole("alert").textContent).toMatch(/incorrect email or password/i));
  });

  it("automatically verifies an emailed token and shows success", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/verify-email?token=verified-token&email=maya%40example.com");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/account/verify", expect.objectContaining({ method: "POST", credentials: "include" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: "verified-token" });
    await waitFor(() => expect(view.getByRole("heading", { name: "Email verified" })).toBeTruthy());
    expect(view.getByText(/verified successfully/i)).toBeTruthy();
  });

  it("keeps manual verification available when no token is present", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/verify-email?email=maya%40example.com");
    fireEvent.click(view.getByRole("button", { name: /I’ve verified my email/i }));
    await waitFor(() => expect(view.getByRole("alert").textContent).toMatch(/Open the verification link/i));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the real email-change confirmation route when its token is present", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/confirm-email-change?token=email-change-token");
    fireEvent.click(view.getByRole("button", { name: "Confirm Email Address" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/account/confirm-email-change", expect.objectContaining({ method: "POST", credentials: "include" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: "email-change-token" });
  });

  it("requests another verification email through the real account route before showing the cooldown", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, delivery: "sent" }) });
    const view = renderAuth("/auth/verify-email?email=maya%40example.com");
    fireEvent.click(view.getByRole("button", { name: "Resend Verification Email" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/account/resend-verification", expect.objectContaining({ method: "POST", credentials: "include" })));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "maya@example.com" });
    expect(view.getByRole("button", { name: "Resend in 00:45" })).toBeTruthy();
  });

  it("presents the requested session-expiry recovery modal", () => {
    const view = renderAuth("/auth/login?reason=session");
    expect(view.getByRole("dialog").textContent).toMatch(/Your session has expired/i);
  });
});
