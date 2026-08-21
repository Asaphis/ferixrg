# FerixRG deployment configuration

FerixRG can be built and deployed without committing or placing secrets in the repository. Configure the values below through the hosting environment, process manager, or secret store. The browser bundle must never receive the server-only values marked **secret**.

> **Deployment boundary.** Public-URL analysis, AI proposals, encrypted connection storage, and the Shopify authorization-code callback are implemented. Provider-side publishing, rollback, payment collection, and non-Shopify authorization remain unavailable until their respective server-side adapters are configured. The platform does not represent these actions as completed when an adapter is absent.

## Required launch configuration

| Variable | Classification | Purpose | Production requirement |
|---|---|---|---|
| `DATABASE_URL` | **Secret** | MySQL/TiDB connection string used by the persistence layer. | Required. Use a database user with only the permissions FerixRG needs. |
| `JWT_SECRET` | **Secret** | Signs FerixRG’s durable local-account session tokens. | Required. Generate a long, random value; do not reuse it across environments. |
| `FERIXRG_APP_ORIGIN` | Public configuration | Canonical HTTPS application origin used in verification, password-reset, and email-change links. | Required when transactional email is enabled, for example `https://app.example.com` with no trailing slash. |
| `RESEND_API_KEY` | **Secret** | Authenticates the transactional email adapter. | Required to deliver verification, password-reset, and email-change emails. |
| `RESEND_FROM_EMAIL` | Public configuration | Verified Resend sender address for transactional mail. | Required with `RESEND_API_KEY`, for example `FerixRG <noreply@example.com>`. |
| `CF_ACCOUNT_ID` | Server configuration | Identifies the Cloudflare account used for the Workers AI Design Copilot gateway. | Required to enable live Design Copilot replies. |
| `CF_API_TOKEN` | **Secret** | Authorizes the server-side Cloudflare Workers AI REST call. | Required to enable live Design Copilot replies. Grant Workers AI permissions only. |
| `CF_AI_MODEL` | Public configuration | Optional override for the server-selected Workers AI model. | Optional. Defaults to `@cf/meta/llama-3.2-3b-instruct`. |
| `STORE_CONNECTION_ENCRYPTION_KEY` | **Secret** | 32-byte AES-256-GCM key used to encrypt provider credentials at rest. | Required before any managed-store connection can be enabled. Supply 32 random bytes encoded as base64 or 64 hexadecimal characters. |
| `SHOPIFY_CLIENT_ID` | Server configuration | Shopify app client ID used to build the merchant authorization URL. | Required only when enabling Shopify authorization. |
| `SHOPIFY_CLIENT_SECRET` | **Secret** | Shopify app client secret used for callback HMAC verification and server-side token exchange. | Required only when enabling Shopify authorization. Never expose it to the browser. |
| `SHOPIFY_REDIRECT_URI` | Public configuration | Optional exact Shopify callback URL override. | Optional. Defaults to `${FERIXRG_APP_ORIGIN}/api/store-connections/shopify/callback`; register the exact HTTPS URL in Shopify. |
| `NODE_ENV` | Public configuration | Enables production behavior. | Set to `production`. |

The Cloudflare gateway uses the authenticated REST endpoint `POST /accounts/{account_id}/ai/run/{model_name}`. Cloudflare documents API tokens as the preferred authorization method and lists Workers AI permissions for this endpoint. [1] FerixRG keeps this token server-only, bounds editor context, rejects credential-like request content, records only provider/usage metadata in workspace activity, and measures returned neuron usage in the existing ledger.

## Cloudflare Workers AI guardrail

Cloudflare’s Workers Free allocation is **10,000 Neurons per day**, resetting at **00:00 UTC**. [2] FerixRG reserves a small amount of this allocation before sending a Design Copilot request, preventing a request when the workspace has already consumed the protected daily capacity. The gateway uses `@cf/meta/llama-3.2-3b-instruct` by default because it was confirmed on the selected free plan; changing `CF_AI_MODEL` should be preceded by a provider-plan and model-availability check.

| Operational condition | FerixRG behavior |
|---|---|
| Cloudflare settings absent | The Design Copilot returns an explicit “not configured” state; no fallback output is fabricated. |
| Request contains credentials or authorization text | The request is rejected before leaving the FerixRG server. |
| Daily guarded allocation exhausted | The request is blocked with a reset-at-UTC-midnight explanation. |
| Cloudflare cannot complete an inference | The request fails honestly and records no fabricated recommendation. |
| Cloudflare returns usage | Rounded-up Neurons are written to the workspace usage ledger and provider/model metadata is recorded in activity history. |

## Managed deployment and self-hosted Ubuntu release sequence

For the managed application, add the values in the project secret/configuration interface, create a verified project checkpoint, and use the Publish control. Do not place secret values in frontend `VITE_*` variables or commit an `.env` file.

For the Ubuntu application host, install the locked dependencies, apply the already-reviewed database migrations, build, and start the bundled server under a supervised process manager. A reverse proxy should terminate TLS and forward requests to the app process. The following sequence is intentionally generic and requires the variable values to be supplied by the host’s secure environment mechanism:

```bash
pnpm install --frozen-lockfile
pnpm drizzle-kit migrate
pnpm test
pnpm check
pnpm build
NODE_ENV=production node dist/index.js
```

Run the server behind HTTPS, ensure `FERIXRG_APP_ORIGIN` exactly matches the public origin, and use a database with TLS enabled when the database provider requires it. After a deployment, first verify `curl -f https://app.example.com/api/health`; it returns service status and secret-free AI/provider readiness without returning credentials. Then verify account registration, email delivery, workspace bootstrap, a public-URL source, a non-publishing tool run, one guarded Design Copilot request, and—only in a Shopify development store with the variables configured—the authorization redirect, callback HMAC/state rejection, successful token exchange, encrypted credential persistence, and connected-store readiness. Do not test publish or rollback until a reviewed provider executor exists.

## Configuration intentionally deferred

Two-step verification remains disabled until its dedicated enrollment and login-challenge implementation is deployed. That implementation will require `TOTP_ENCRYPTION_KEY` as a **server-only secret**, distinct from `JWT_SECRET`, to encrypt pending and active authenticator seeds at rest. It must be versioned for controlled rotation and must never be included in browser configuration. Recovery codes must be stored as one-way hashes rather than as plaintext.

WooCommerce, Magento, and custom-store authorization, payment collection, provider-backed publishing, and provider-backed rollback each require their own server-side adapter and least-privilege credentials. Shopify authorization is now implemented behind `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `FERIXRG_APP_ORIGIN`, and `STORE_CONNECTION_ENCRYPTION_KEY`; setting those variables enables only the verified authorization-code flow and read-scope connection status, not publishing. Release plans remain gated until a provider executor is implemented, configured, and tested.

FerixRG exposes a server-side **provider readiness interface** for Shopify, WooCommerce, Adobe Commerce/Magento, and custom integrations. Shopify now records a pending connection with a one-time expiring state, returns a verified authorization URL only when all server prerequisites are configured, validates callback HMAC and state, checks granted scopes, encrypts the returned credential, and marks the store connected only after the exchange succeeds. WooCommerce, Adobe Commerce/Magento, and custom integrations remain explicit not-configured states until their own reviewed adapters exist. [3] [4] [5]

## References

[1]: https://developers.cloudflare.com/api/resources/ai/methods/run/ "Cloudflare API — Execute AI model"
[2]: https://developers.cloudflare.com/workers-ai/platform/pricing/ "Cloudflare Workers AI pricing and daily free allocation"
[3]: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant "Shopify authorization code grant"
[4]: https://developer.woocommerce.com/docs/apis/rest-api/authentication/ "WooCommerce REST API authentication"
[5]: https://developer.adobe.com/commerce/webapi/get-started/authentication/ "Adobe Commerce authentication"
