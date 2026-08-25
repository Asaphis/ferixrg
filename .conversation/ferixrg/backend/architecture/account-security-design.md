# FerixRG account security design

FerixRG currently supports durable sessions, session revocation, password recovery, email changes, and a persisted security-alert preference. The account-security interface intentionally **does not enable two-step verification** until the design below is implemented end to end.

> **Activation rule.** A two-step preference must never become an authentication requirement until FerixRG can enroll an authenticator, encrypt its secret at rest, verify a one-time code, issue recovery codes, and challenge login before a durable session is created.

## Required two-step record and encryption boundary

| Record field | Requirement |
|---|---|
| `userId` | One active two-step record per account. |
| `encryptedSecret` | Authenticator seed encrypted server-side with an environment-provided application encryption key. Never return this value to the browser after enrollment. |
| `keyVersion` | Identifies the active encryption-key version to support controlled rotation. |
| `enabledAt` | Set only after a valid code confirms enrollment. |
| `lastVerifiedAt` | Updated after successful two-step verification. |
| `recoveryCodes` | Store one-way hashes only; present plaintext codes once at enrollment. |
| `failedAttempts` and `lockedUntil` | Enforce a short, auditable rate-limit window for challenge verification. |

The system should use time-based one-time passwords (TOTP) in accordance with the TOTP algorithm specification, using a trusted server clock and a narrow verification window. [1] The application encryption key must be server-only and independent from the session-signing secret; it should be supplied through the deployment secret mechanism and rotated using `keyVersion` metadata.

## Enrollment and login sequence

| Stage | Server behavior | UI behavior |
|---|---|---|
| Start enrollment | Require an authenticated recent session; generate a candidate secret; encrypt and store it as pending. | Show setup URI/QR representation and a code field inside the approved security surface. |
| Confirm enrollment | Verify a TOTP code before setting `enabledAt`; generate hashed recovery codes. | Reveal recovery codes once and require acknowledgement. |
| Password sign-in | Validate password, then return a short-lived challenge identifier instead of a durable session when two-step is active. | Use the approved authentication screen to request the code without exposing a separate design system. |
| Challenge completion | Rate-limit code or recovery-code verification; create the durable session only after success. | Continue to the original authenticated destination. |
| Recovery/disable | Require recent two-step verification or a verified recovery code, record an audit event, and revoke other sessions on compromise. | Explain the security consequence clearly; never silently disable protection. |

## Security alerts

The stored `securityAlerts` preference is a **delivery preference**, not proof that delivery is configured. When a notification channel is configured, FerixRG should create a security event for a new session, revoked session, password reset, email-change confirmation, two-step enrollment, two-step disablement, recovery-code use, and repeated failed challenge. Each event should include minimal account/session metadata, not raw credentials or OTP values. Delivery failures must remain visible to the user as unavailable or delayed rather than being represented as sent.

## Current live boundary

The existing account-security panel keeps the two-step control disabled and filters it out of preference writes. Security alerts may be saved as a preference, but the UI states that delivery begins only after a notification channel is configured. This preserves an honest path while the dedicated security record, encryption key, login challenge, recovery flow, migrations, and route tests are implemented in a future deployment-safe milestone.

## Reference

[1]: https://www.rfc-editor.org/rfc/rfc6238 "RFC 6238: TOTP: Time-Based One-Time Password Algorithm"
