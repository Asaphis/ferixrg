# Security event persistence review

The account preference record already retains the user’s `securityAlerts` choice, while session and two-step records retain authentication state. There is no dedicated account-scoped security-event history; existing activity records belong to a workspace and are not suitable for private account security history.

The additive model should record only a user identifier, a bounded event type, an optional delivery state, and a timestamp. It must not retain TOTP codes, recovery codes, encrypted secrets, session tokens, raw IP addresses, or detailed device fingerprints. The account router can return only the authenticated user’s recent event records.

Successful password and two-step sign-ins now create account-scoped events. If the user has enabled security alerts and the deployment has a verified email delivery configuration, the system sends a short sign-in alert and records whether delivery was sent, unavailable, or failed. No security alert attempts are made when the preference is off or the account has no email address.
