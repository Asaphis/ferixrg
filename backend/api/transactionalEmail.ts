export type EmailDeliveryStatus = "sent" | "not_configured" | "failed";

type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function transactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<{ status: EmailDeliveryStatus; providerMessageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { status: "not_configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    });
    const result = (await response.json().catch(() => ({}))) as { id?: string };
    if (!response.ok || !result.id) return { status: "failed" };
    return { status: "sent", providerMessageId: result.id };
  } catch {
    return { status: "failed" };
  }
}

export function accountEmailOrigin(requestOrigin: string | undefined, requestHost: string | undefined) {
  const configuredOrigin = process.env.FERIXRG_APP_ORIGIN?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return `https://${requestHost || "localhost:3000"}`;
}

export async function sendVerificationEmail(input: { to: string; name: string; token: string; origin: string }) {
  const url = `${input.origin}/auth/verify-email?token=${encodeURIComponent(input.token)}&email=${encodeURIComponent(input.to)}`;
  const safeName = escapeHtml(input.name || "there");
  return sendTransactionalEmail({
    to: input.to,
    subject: "Verify your FerixRG email address",
    html: `<p>Hi ${safeName},</p><p>Verify your email address to activate your FerixRG account.</p><p><a href="${url}">Verify email address</a></p><p>If you did not create this account, you can ignore this email.</p>`,
    text: `Hi ${input.name || "there"},\n\nVerify your FerixRG email address: ${url}\n\nIf you did not create this account, you can ignore this email.`,
    idempotencyKey: `verify/${input.token.slice(0, 24)}`,
  });
}

export async function sendPasswordResetEmail(input: { to: string; name: string; token: string; origin: string }) {
  const url = `${input.origin}/auth/reset-password?token=${encodeURIComponent(input.token)}`;
  const safeName = escapeHtml(input.name || "there");
  return sendTransactionalEmail({
    to: input.to,
    subject: "Reset your FerixRG password",
    html: `<p>Hi ${safeName},</p><p>Use the secure link below to reset your FerixRG password.</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    text: `Hi ${input.name || "there"},\n\nReset your FerixRG password: ${url}\n\nIf you did not request this, you can ignore this email.`,
    idempotencyKey: `reset/${input.token.slice(0, 24)}`,
  });
}

export async function sendEmailChangeVerification(input: { to: string; name: string; token: string; origin: string }) {
  const url = `${input.origin}/auth/confirm-email-change?token=${encodeURIComponent(input.token)}`;
  const safeName = escapeHtml(input.name || "there");
  return sendTransactionalEmail({
    to: input.to,
    subject: "Confirm your new FerixRG email address",
    html: `<p>Hi ${safeName},</p><p>Confirm this new email address for your FerixRG account.</p><p><a href="${url}">Confirm new email address</a></p><p>If you did not request this change, you can ignore this email.</p>`,
    text: `Hi ${input.name || "there"},\n\nConfirm your new FerixRG email address: ${url}\n\nIf you did not request this change, you can ignore this email.`,
    idempotencyKey: `email-change/${input.token.slice(0, 24)}`,
  });
}
