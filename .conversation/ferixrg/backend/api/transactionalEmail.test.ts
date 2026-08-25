import { describe, expect, it, vi } from "vitest";
import { accountEmailOrigin, sendSecurityAlertEmail, sendTransactionalEmail, transactionalEmailConfigured } from "./transactionalEmail";

describe("transactional email adapter", () => {
  it("reports unavailable delivery honestly when deployment variables are absent", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    expect(transactionalEmailConfigured()).toBe(false);
    await expect(sendTransactionalEmail({ to: "owner@example.com", subject: "Test", html: "<p>Test</p>", text: "Test", idempotencyKey: "test/1" })).resolves.toEqual({ status: "not_configured" });
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
    if (originalFrom) process.env.RESEND_FROM_EMAIL = originalFrom;
  });

  it("uses the same configuration-gated delivery boundary for sign-in security alerts", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;

    await expect(sendSecurityAlertEmail({ to: "owner@example.com", name: "Owner", event: "two_step_login_completed", eventId: 17 })).resolves.toEqual({ status: "not_configured" });

    if (originalKey) process.env.RESEND_API_KEY = originalKey;
    if (originalFrom) process.env.RESEND_FROM_EMAIL = originalFrom;
  });

  it("uses the request origin unless deployment provides an explicit application origin", () => {
    const originalOrigin = process.env.FERIXRG_APP_ORIGIN;
    delete process.env.FERIXRG_APP_ORIGIN;
    expect(accountEmailOrigin("https://preview.example", "unused.example")).toBe("https://preview.example");
    process.env.FERIXRG_APP_ORIGIN = "https://app.ferixrg.example/";
    expect(accountEmailOrigin("https://preview.example", "unused.example")).toBe("https://app.ferixrg.example");
    if (originalOrigin) process.env.FERIXRG_APP_ORIGIN = originalOrigin;
    else delete process.env.FERIXRG_APP_ORIGIN;
  });
});
