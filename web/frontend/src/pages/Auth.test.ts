// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import Auth from "./Auth";

const fetchMock = vi.fn();
const emailChangeMutation = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { account: { requestEmailChange: { useMutation: () => emailChangeMutation } } } }));

const renderAuth = (path: string) => {
  window.history.replaceState({}, "", path);
  return render(createElement(Auth));
};

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset();
  emailChangeMutation.mutateAsync.mockReset();
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
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "maya@example.com", password: "Password1!", remember: true });
  });

  it("sends an unchecked remember-me choice to the backend", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("checkbox"));
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ email: "maya@example.com", password: "Password1!", remember: false });
  });

  it("shows and completes the backend two-step login challenge", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ success: false, code: "TWO_STEP_REQUIRED", challengeToken: "challenge-token" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true }) });
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(view.getByRole("heading", { name: "Verify your sign-in" })).toBeTruthy());
    fireEvent.change(view.getByRole("textbox", { name: "Authenticator code" }), { target: { value: "123456" } });
    fireEvent.click(view.getByRole("button", { name: "Verify and Sign In" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/account/verify-two-step");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ challengeToken: "challenge-token", code: "123456" });
  });

  it("submits standalone email changes through the protected account mutation", async () => {
    emailChangeMutation.mutateAsync.mockResolvedValue({ success: true, delivery: "not_configured" });
    const view = renderAuth("/auth/change-email");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "new@example.com" } });
    fireEvent.click(view.getByRole("button", { name: "Update Email" }));
    await waitFor(() => expect(emailChangeMutation.mutateAsync).toHaveBeenCalledWith({ email: "new@example.com" }));
    expect(view.getByText(/Email delivery is not configured/i)).toBeTruthy();
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

  it("explains that login is blocked until email verification is complete", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ success: false, code: "VERIFICATION_REQUIRED", message: "Your email address has not been verified." }) });
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(view.getByRole("alert").textContent).toMatch(/email address is not verified/i));
    expect(view.getByRole("button", { name: /Resend verification email/i })).toBeTruthy();
  });

  it("explains when an email verification link is invalid or expired", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ success: false, code: "VERIFICATION_LINK_INVALID", message: "This verification link is invalid, expired, or has already been used." }) });
    const view = renderAuth("/auth/verify-email?token=stale-token&email=maya%40example.com");
    await waitFor(() => expect(view.getByRole("alert").textContent).toMatch(/invalid, expired, or has already been used/i));
    expect(view.getByRole("button", { name: "Resend Verification Email" })).toBeTruthy();
  });

  it("shows a specific two-step error when the authenticator code is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 202, json: async () => ({ success: false, code: "TWO_STEP_REQUIRED", challengeToken: "challenge-token" }) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ success: false, message: "The verification code is invalid or expired." }) });
    const view = renderAuth("/auth/login");
    fireEvent.change(view.getByRole("textbox", { name: "Email address" }), { target: { value: "maya@example.com" } });
    fireEvent.change(view.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(view.getByRole("button", { name: "Sign In" }));
    await waitFor(() => expect(view.getByRole("heading", { name: "Verify your sign-in" })).toBeTruthy());
    fireEvent.change(view.getByRole("textbox", { name: "Authenticator code" }), { target: { value: "123456" } });
    fireEvent.click(view.getByRole("button", { name: "Verify and Sign In" }));
    await waitFor(() => expect(view.getByRole("alert").textContent).toMatch(/verification code is invalid or expired/i));
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
