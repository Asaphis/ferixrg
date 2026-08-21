# FerixRG deployment configuration

FerixRG can be built and deployed without committing or placing secrets in the repository. Configure the values below through the hosting environment, process manager, or secret store. The browser bundle must never receive the server-only values marked **secret**.

> **Deployment boundary.** Store connections, payment collection, and provider-side publishing remain intentionally unavailable until their respective server-side adapters are configured. The platform does not represent these actions as completed when an adapter is absent.

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

Run the server behind HTTPS, ensure `FERIXRG_APP_ORIGIN` exactly matches the public origin, and use a database with TLS enabled when the database provider requires it. After a deployment, verify account registration, email delivery, workspace bootstrap, a public-URL source, a non-publishing tool run, and one guarded Design Copilot request before enabling the deployment for external users.

## Configuration intentionally deferred

Shopify, WooCommerce, Magento, custom-store authorization, payment collection, provider-backed publishing, and provider-backed rollback each require their own server-side adapter and least-privilege credentials. These are **not** enabled by setting any of the variables above. Their release plans remain gated until an adapter is implemented, configured, and tested.

FerixRG now exposes a server-side **provider readiness interface** for Shopify, WooCommerce, Adobe Commerce/Magento, and custom integrations. It records a pending connection request and returns the exact configuration boundary instead of falsely presenting an active authorization URL or a successful connection. Shopify uses an authorization-code flow with verified HMAC/state and a registered callback URL; WooCommerce can use its HTTPS application-authentication endpoint; and Adobe Commerce third-party applications use merchant-approved integrations. [3] [4] [5]

## References

[1]: https://developers.cloudflare.com/api/resources/ai/methods/run/ "Cloudflare API — Execute AI model"
[2]: https://developers.cloudflare.com/workers-ai/platform/pricing/ "Cloudflare Workers AI pricing and daily free allocation"
[3]: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant "Shopify authorization code grant"
[4]: https://developer.woocommerce.com/docs/apis/rest-api/authentication/ "WooCommerce REST API authentication"
[5]: https://developer.adobe.com/commerce/webapi/get-started/authentication/ "Adobe Commerce authentication"
