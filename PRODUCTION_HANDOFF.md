# FerixRG production handoff

## Current checkpoint

The implementation is synchronized to `origin/main` at commit `e168ed9` (`Isolate frontend and backend deployments`). The working tree was clean after the independent frontend/backend deployment checkpoint.

The current application is ready for server setup and production-style smoke testing. The frontend and backend now have independent build commands, environment templates, and production outputs. The frontend remains a dynamic React SPA whose live data comes from the separate API hostname. It is not safe to claim that provider-side publishing, rollback, payment collection, WooCommerce authorization, Magento authorization, or custom-provider authorization are active until their reviewed adapters and production credentials are configured.

## Validation completed before server setup

| Validation | Result |
|---|---:|
| Full Vitest suite | 27 files, 205 tests passed |
| TypeScript check | Passed |
| Vite client build | Passed |
| Bundled server build | Passed |
| GitHub checkpoint | `8102735` pushed to `main` |
| Working tree | Clean |

The build emits two existing non-fatal advisories: optional analytics placeholders are not configured, and the client bundle is larger than the default size warning threshold. Neither blocks the server build or test suite.

## Required server configuration

Set frontend build values in `frontend/.env.production` and backend runtime/migration values in `backend/.env`. Never put server secrets in `VITE_*` variables or commit populated environment files.

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | All production operation | Use the pooled Neon PostgreSQL connection string for runtime requests. |
| `DATABASE_URL_UNPOOLED` | Drizzle migrations | Use the direct Neon PostgreSQL connection string; keep it server-only. |
| `JWT_SECRET` | Local account sessions | Use a long random value unique to the environment. |
| `FERIXRG_APP_ORIGIN` | Production links and Shopify callback | Set exactly to `https://ferixrg.ferixas.com`. |
| `RESEND_API_KEY` and `RESEND_FROM_EMAIL` | Transactional email | Required if email verification, password reset, and email-change delivery are enabled. |
| `CF_ACCOUNT_ID` and `CF_API_TOKEN` | Cloudflare Workers AI | Keep the token server-only and grant only the needed Workers AI permission. |
| `CF_AI_MODEL` | Optional AI model override | Defaults to `@cf/meta/llama-3.2-3b-instruct`. |
| `STORE_CONNECTION_ENCRYPTION_KEY` | Managed-store credential encryption | A random 32-byte AES-256-GCM key encoded as base64 or 64 hexadecimal characters. |
| `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` | Shopify authorization | Register the FerixRG Shopify app and keep the secret server-only. |
| `SHOPIFY_REDIRECT_URI` | Optional Shopify callback override | Defaults to `${FERIXRG_APP_ORIGIN}/api/store-connections/shopify/callback`; register the exact HTTPS URL. |
| `VITE_API_BASE_URL` | Frontend API transport | Set to `https://ferixrgapi.ferixas.com` before the client build. |
| `PORT` | Internal Node listener | Set to `5010`; do not alter other PM2 processes. |
| `NODE_ENV` | Production behavior | Required for the startup configuration guard. |

The application fails fast in production when `DATABASE_URL` or `JWT_SECRET` is missing. Optional AI, email, and provider adapters remain visible as explicit readiness states instead of producing fabricated success.

## Server setup sequence

Clone the public repository on the target Ubuntu host at `/home/ubuntu/ferixrg`, install the locked dependencies, create `frontend/.env.production` and `backend/.env` separately, apply the reviewed Neon PostgreSQL migration, run the complete validation suite, build the frontend and backend independently, and start only the backend API under PM2 using the isolated process name `ferixrg` and port `5010`.

```bash
git clone https://github.com/Asaphis/ferixrg.git /home/ubuntu/ferixrg
cd /home/ubuntu/ferixrg
git checkout main
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm test
pnpm check
pnpm frontend:build
pnpm backend:build
pm2 start backend/dist/index.js --name ferixrg --cwd /home/ubuntu/ferixrg
pm2 save
```

The existing Cloudflare-proxied DNS records are `ferixrg.ferixas.com` for the frontend and `ferixrgapi.ferixas.com` for the API; leave `ferixrgadmin.ferixas.com` untouched. Add separate Nginx server blocks. Serve the independent `frontend/dist` directory at the frontend hostname, proxy `/api/oauth/callback` and `/api/store-connections/shopify/callback` there to `127.0.0.1:5010` for host-only OAuth state handling, and proxy all requests on the API hostname to `127.0.0.1:5010`. Terminate TLS at Nginx, configure automatic restart with PM2, and do not expose port 5010 directly.

## Smoke-test order

Begin with the public readiness endpoint:

```bash
curl -f https://ferixrgapi.ferixas.com/api/health
```

The response should show `ok: true`, the production environment, Cloudflare readiness, and each managed-store provider’s readiness and capability flags. It must not contain access tokens, API keys, client secrets, or encrypted credential material.

Then verify account registration and login, email delivery if configured, workspace bootstrap, Store registry loading, public URL source creation, one bounded public-URL analysis, report artifact creation and download, one saved draft version, draft integrity validation, and the release-review boundary. Confirm that release execution fails closed when no provider adapter advertises publish or rollback support.

If Shopify variables are configured, test with a development store only. Verify the authorization URL, invalid state rejection, invalid callback HMAC rejection, missing-scope rejection, successful server-side token exchange, encrypted credential persistence, connected-store readiness, and safe redirect. Confirm that no token appears in browser storage, response bodies, activity metadata, logs, or downloaded report artifacts.

Do not test live publishing or rollback until the provider executor has been reviewed, configured, and explicitly enabled. Do not enable payment collection until a payment provider is selected, its webhook and signature-verification adapter is implemented, and its subscription state transitions are tested.

## Current fail-closed boundaries

Public URL inspection, deterministic evidence, AI proposal workflows, encrypted Shopify connection state, validation records, export/report records, release-plan approval, and release readiness are implemented. The following remain intentionally gated: Shopify provider-side publish and rollback, WooCommerce authorization, Adobe Commerce/Magento authorization, custom-provider authorization, payment collection, two-step-authenticator enrollment, and image-aware screenshot/reference analysis until an approved vision-capable evidence path is configured.

The correct production behavior for an unavailable adapter is to preserve the user’s draft or export path, show the exact configuration requirement, record the attempted action, and avoid claiming that a store changed.

## Rollback and recovery

Keep the previous GitHub commit available for application rollback and take a database backup before applying migrations. The application’s release records and audit activity are workspace-scoped; they are not a substitute for database backups. If a deployment fails its health check, stop traffic at the reverse proxy, restore the prior application build, and investigate the migration or environment diff before retrying.
