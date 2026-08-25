# FerixRG verified work summary

**Date:** 22 August 2026  
**Repository:** [Asaphis/ferixrg](https://github.com/Asaphis/ferixrg)  
**Verified commit:** [`4161ba7`](https://github.com/Asaphis/ferixrg/commit/4161ba77c382a86a0bedf5b6047fe72c100609c1) — *Harden URL inspection and remove dashboard simulators*

## Executive conclusion

The supplied reports describe an older repository revision and should not be treated as the current truth without reconciliation. The checkout initially resolved to `8826ae9`, not the audit’s inspected `dd763d6`. On that current checkout, the older report’s five frontend failures were not reproducible: the frontend suite passed 80 tests and the backend suite passed 144 tests before this work.

I made and pushed a new commit that addresses the most concrete remaining defects that could be safely verified locally. The repository now has stronger public-URL validation, explicit non-2xx failure semantics, a JWT application-ID boundary, server-side screenshot signature checks, stable dashboard page identities for mobile input focus, a visible completed URL-analysis result, honest source availability labels, and removal of the remaining dead simulator modules. The pushed commit is on `main`; the production server was not changed.

> This work is verified against repository tests and builds. It is **not** a claim that the app has been verified on the user’s physical phone or deployed to production.

## What was actually changed

| Area | Change | Verification boundary |
|---|---|---|
| Public URL security | Redirects are fetched manually, capped at five hops, and each redirect target is revalidated. DNS addresses are checked for private IPv4, IPv6, IPv4-mapped IPv6, loopback, link-local, and unique-local destinations. Non-2xx responses now fail instead of becoming successful inspection results. | Added redirect-to-private and HTTP 503 regression tests. |
| Session security | `verifySession` now rejects a correctly signed token whose `appId` does not equal `ENV.appId`. | Added two SDK regression tests covering rejection and acceptance. |
| Screenshot uploads | Screenshot uploads now require a matching PNG, JPEG, or WEBP magic signature at the backend boundary, in addition to the existing size limit. | Added an invalid-image-bytes regression test and updated the valid fixture to contain a PNG signature. |
| Mobile lifecycle | Stateful dashboard page flows now render through stable component identities instead of recreating their React component type on every `Workspace` render. Team management is included. | Frontend TypeScript check and mobile behavior tests pass. The existing source-switching and focus test remains green. |
| URL analysis | The synchronous executor response is retained and shown in a dedicated completed-result screen with run ID, observed HTTP status, issue count, and report ID. | Extended the URL-analysis frontend test to assert the result screen and persisted report reference. |
| Tool honesty | Unsupported source/tool combinations are labeled with their availability state in the setup source picker before a run is attempted. | Existing unsupported-source behavior test remains green. |
| Simulator cleanup | Deleted the unused production-source modules `approvedDashboard.ts`, `dashboardRecords.ts`, `authSimulation.ts`, and `storeWorkspace.ts`, together with their obsolete tests. The active dashboard path already uses live scoped queries; these files were dead residue, not a replacement for missing provider functionality. | Repository search shows no non-test imports of those modules. |

## Verification results

The final repository was checked with the package-specific commands below because the root aggregate `pnpm test` script is not reliable in this checkout: it reports `packages field missing or empty` when it invokes the nested package command. The same nested commands run successfully when invoked explicitly.

| Check | Result |
|---|---:|
| Frontend tests | **70 passed** across 10 files |
| Backend tests | **149 passed** across 15 files |
| Frontend TypeScript | **Passed** |
| Backend TypeScript | **Passed** |
| Frontend production build | **Passed**; local JS asset `index-CnW3aMpb.js` |
| Backend production build | **Passed**; `dist/index.js` generated |
| `git diff --check` | **Passed** before commit |
| GitHub `main` | Resolves to `4161ba77c382a86a0bedf5b6047fe72c100609c1` |
| Local worktree | Clean after push |

The frontend count is lower than the initial 80 because seven deleted simulator modules were accompanied by three obsolete test files containing ten tests. Those tests asserted canned demo data rather than customer behavior. The backend count increased from 144 to 149 because the new regression coverage includes the SDK file and additional security/upload cases.

## Production status

No production deployment was performed. The earlier supplied deployment evidence records SSH authentication failure with `Permission denied (publickey)`, and I did not claim access that was not available. The GitHub commit is pushed, but pushing source is not the same as deploying the server.

At the time of final verification, the public endpoints were reachable:

| Endpoint | Observed result |
|---|---|
| `https://ferixrg.ferixas.com` | HTTP 200 |
| `https://ferixrgapi.ferixas.com/api/health` | HTTP 200 |
| Live frontend assets | `/assets/index-CkLjatac.js` and `/assets/index-BaJb_N4W.css` |
| Local post-change frontend build | `/assets/index-CnW3aMpb.js` and `/assets/index-BaJb_N4W.css` |

The differing JavaScript asset hash proves that the public frontend is not serving the exact post-change local build. The live health endpoint reported Cloudflare Workers AI configured and a server-side store-provider readiness matrix, but it does not prove that the new commit is running.

## Remaining limitations and risks

The public-URL hardening is materially stronger than the original `redirect: "follow"` implementation, but it is not a complete connection-pinning solution. The code validates DNS results and then relies on the runtime `fetch` implementation to establish the connection. A determined DNS-rebinding attack could still exploit a resolver change between validation and connection. Full P0-grade hardening would require a custom HTTP(S) client or dispatcher that pins the validated public address for the actual socket connection, while preserving correct TLS hostname verification.

The catalog still contains 57 tool definitions. The current capability boundary is narrower than the marketing catalog: public-URL execution is deterministic HTML/metadata inspection, screenshot execution is limited to Screenshot Analyzer, and saved-draft execution is limited to Before/After Comparator. Named AI proposal operations exist, but they remain reviewable proposals rather than automatic store changes. Connected-store publishing and rollback remain provider-gated. Reference-design and theme-file controls still require future real upload/select flows.

The editor still contains deliberately honest placeholder surfaces for work that is not backed by a live storefront renderer. The completed URL result is now shown locally in the Stores flow, but a production user will not see it until the server serves the pushed frontend bundle and the matching backend build.

The mobile lifecycle fix is covered by jsdom behavior tests, not by a real iOS or Android device session. Physical-device confirmation remains outstanding and should be performed after deployment with the exact target browser and network conditions.

## Recommended deployment verification

After authorized server access is available, deploy commit `4161ba77c382a86a0bedf5b6047fe72c100609c1` using the project’s documented deployment procedure. On the server, verify the repository `HEAD`, frontend asset hash, backend process revision, and environment variables before restarting services. Then test registration, email verification, two-step login, URL analysis through the completed-result screen, screenshot preview/upload/provider failure behavior, source switching, keyboard focus, store disconnect, and report download from a physical mobile device.

## References

[1]: https://github.com/Asaphis/ferixrg "FerixRG repository"
[2]: https://github.com/Asaphis/ferixrg/commit/4161ba77c382a86a0bedf5b6047fe72c100609c1 "Verified FerixRG fixes commit 4161ba7"
[3]: https://github.com/Asaphis/ferixrg/blob/8826ae98bb326b8776961b542b8b1bb4d2d87c50/web/frontend/src/pages/Workspace.tsx "Workspace source at the pre-change baseline"
