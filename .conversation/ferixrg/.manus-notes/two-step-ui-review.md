# Two-step UI review

- `account.twoStepStatus` now returns only `encryptionConfigured` and a non-sensitive enrollment state for the authenticated account.
- The approved Password & security panel currently hard-disables its two-step checkbox and persists it through the generic preferences mutation.
- The workspace page already owns authenticated account queries and passes account data plus callbacks into `MoreActionPanel`.
- The next change must retain the approved visual layout, avoid using the preference mutation to enable two-step verification, and invoke the dedicated protected enrollment-start operation only when deployment encryption is configured.
