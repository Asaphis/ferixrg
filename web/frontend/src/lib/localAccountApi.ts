export type LocalAccountResult = {
  success: boolean;
  verificationRequired?: boolean;
  delivery?: "sent" | "not_configured" | "failed";
  configured?: boolean;
  code?: string;
  message?: string;
};

export class LocalAccountApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "LocalAccountApiError";
    this.code = code;
  }
}

async function requestLocalAccount(path: string, body: Record<string, string>): Promise<LocalAccountResult> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as LocalAccountResult;
  if (!response.ok || !result.success) {
    throw new LocalAccountApiError(result.message || "We could not complete that account request. Please try again.", result.code);
  }
  return result;
}

export function registerLocalAccount(input: { name: string; email: string; password: string }) {
  return requestLocalAccount("/api/account/register", input);
}

export function loginLocalAccount(input: { email: string; password: string }) {
  return requestLocalAccount("/api/account/login", input);
}

export function verifyLocalAccount(token: string) {
  return requestLocalAccount("/api/account/verify", { token });
}

export function resendVerificationEmail(email: string) {
  return requestLocalAccount("/api/account/resend-verification", { email });
}

export function requestPasswordReset(email: string) {
  return requestLocalAccount("/api/account/request-password-reset", { email });
}

export function resetLocalPassword(input: { token: string; password: string }) {
  return requestLocalAccount("/api/account/reset-password", input);
}

export function confirmAccountEmailChange(token: string) {
  return requestLocalAccount("/api/account/confirm-email-change", { token });
}
