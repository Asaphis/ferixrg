# FerixRG production deployment runbook

**Target commit:** [`4161ba77c382a86a0bedf5b6047fe72c100609c1`](https://github.com/Asaphis/ferixrg/commit/4161ba77c382a86a0bedf5b6047fe72c100609c1)  
**Server checkout:** `/home/ubuntu/ferixrg`  
**Backend process:** `ferixrg-backend`  
**Backend port:** `5010`

This runbook applies the verified GitHub commit. It does not print secrets, reset the database, alter unrelated PM2 applications, or overwrite Nginx configuration blindly.

## 1. Preconditions

Run the commands below as the `ubuntu` user on the production server. Before starting, make sure the backend environment is supplied by the server’s secure environment mechanism. With the current `dotenv/config` setup, a common arrangement is `/home/ubuntu/ferixrg/backend/.env`; keep that file outside Git and set permissions such as `chmod 600`.

The backend must have at least `DATABASE_URL` and `JWT_SECRET` to start. For the documented production behavior, also configure `DATABASE_URL_UNPOOLED` for migrations, `FERIXRG_APP_ORIGIN=https://ferixrg.ferixas.com`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STORE_CONNECTION_ENCRYPTION_KEY`, and the Cloudflare or Shopify variables required for the capabilities you intend to enable. Set `VITE_API_BASE_URL=https://ferixrgapi.ferixas.com` only during the frontend build. Do not put server secrets in any `VITE_*` variable.

Check presence without printing values:

```bash
cd /home/ubuntu/ferixrg/backend
for name in DATABASE_URL JWT_SECRET FERIXRG_APP_ORIGIN RESEND_API_KEY RESEND_FROM_EMAIL STORE_CONNECTION_ENCRYPTION_KEY; do
  if [ -z "${!name:-}" ]; then
    echo "MISSING: $name"
    exit 1
  fi
done
printf '%s\n' 'Required environment variables are present.'
```

If the variables are loaded from `backend/.env`, load them in the current shell before this check or let the backend load them through its normal startup path. The migration command must see `DATABASE_URL_UNPOOLED`; do not substitute a fabricated value.

## 2. Fetch the exact source revision safely

The previously supplied `ferixrg-server-deploy-8826ae9.sh` script is obsolete for this release. It selectively checks out commit `8826ae9`, which is not the final repaired commit, and it refers to an older source-selection procedure. Do not run that script.

Use this update sequence. It intentionally stops if the server checkout has uncommitted work instead of destroying it:

```bash
set -euo pipefail
cd /home/ubuntu/ferixrg

git fetch origin main
if [ -n "$(git status --porcelain)" ]; then
  echo 'STOP: /home/ubuntu/ferixrg has uncommitted changes. Back them up or resolve them before deployment.'
  git status --short
  exit 1
fi

git switch main
git pull --ff-only origin main
EXPECTED='4161ba77c382a86a0bedf5b6047fe72c100609c1'
ACTUAL="$(git rev-parse HEAD)"
[ "$ACTUAL" = "$EXPECTED" ] || { echo "STOP: expected $EXPECTED but found $ACTUAL"; exit 1; }
printf 'DEPLOYING_COMMIT=%s\n' "$ACTUAL"
```

## 3. Install, migrate, test, and build

Run the frontend and backend as separate package boundaries. Do not use the old root aggregate `pnpm test` command on this checkout; when it invokes nested commands, pnpm can report `packages field missing or empty`. The explicit commands below are the validated path.

```bash
cd /home/ubuntu/ferixrg
pnpm --dir backend install --frozen-lockfile
pnpm --dir web/frontend install --frozen-lockfile

# Apply only migrations present in the repository. This is not destructive.
pnpm --dir backend db:migrate

pnpm --dir backend check
pnpm --dir web/frontend check
pnpm --dir backend test -- --reporter=dot
pnpm --dir web/frontend test -- --reporter=dot

pnpm --dir backend build
VITE_API_BASE_URL=https://ferixrgapi.ferixas.com pnpm --dir web/frontend build
```

Expected results for this commit are 149 backend tests and 70 frontend tests, both type checks passing, and successful backend/frontend production builds. Warnings about the frontend JavaScript chunk being larger than 500 kB are build warnings, not deployment failures.

## 4. Restart only FerixRG backend

The frontend is static and should be served by Nginx; do not put the frontend bundle in PM2. First inspect the process list:

```bash
pm2 list
```

If the existing FerixRG process is already named `ferixrg-backend`, restart it with the new bundle:

```bash
pm2 restart ferixrg-backend --update-env
pm2 save
```

If the server instead has an old FerixRG process named `ferixrg`, confirm it is the FerixRG process before replacing it. Then run:

```bash
pm2 delete ferixrg
pm2 start /home/ubuntu/ferixrg/backend/dist/index.js \
  --name ferixrg-backend \
  --cwd /home/ubuntu/ferixrg/backend \
  --time
pm2 save
```

If no FerixRG process exists, start it directly:

```bash
pm2 start /home/ubuntu/ferixrg/backend/dist/index.js \
  --name ferixrg-backend \
  --cwd /home/ubuntu/ferixrg/backend \
  --time
pm2 save
```

Confirm that the process is online and that its script path is the backend bundle:

```bash
pm2 describe ferixrg-backend
pm2 logs ferixrg-backend --lines 80 --nostream
```

The backend must listen on port `5010` in production. It deliberately refuses to silently move to another port if `5010` is occupied.

## 5. Verify Nginx without replacing unrelated configuration

The dedicated frontend server block must serve:

```text
root /home/ubuntu/ferixrg/web/frontend/dist;
```

The API hostname `ferixrgapi.ferixas.com` must proxy to `http://127.0.0.1:5010`. The frontend hostname must proxy `/api/oauth/callback` and `/api/store-connections/shopify/callback` to the same backend port so host-only OAuth state cookies remain valid. Do not expose port `5010` directly to the Internet.

Inspect the active configuration, then reload only after the configuration test succeeds:

```bash
sudo nginx -T | grep -n -A35 -B5 -E 'ferixrg\.ferixas\.com|ferixrgapi\.ferixas\.com'
sudo nginx -t
sudo systemctl reload nginx
```

If the root or callback proxy paths are wrong, stop and correct the dedicated FerixRG server blocks. Do not overwrite the complete Nginx configuration with an example containing guessed certificate paths.

## 6. Post-deployment smoke tests

Run these after PM2 and Nginx are healthy:

```bash
set -euo pipefail
curl -fsS https://ferixrgapi.ferixas.com/api/health
printf '\n--- frontend assets ---\n'
curl -fsS https://ferixrg.ferixas.com/ | grep -oE 'src="[^"]+\.js"|href="[^"]+\.css"'
printf '\n--- status codes ---\n'
curl -sS -o /dev/null -w 'frontend=%{http_code}\n' https://ferixrg.ferixas.com/
curl -sS -o /dev/null -w 'api_health=%{http_code}\n' https://ferixrgapi.ferixas.com/api/health
printf '\n--- protected endpoint without login ---\n'
curl -sS -i -X POST 'https://ferixrgapi.ferixas.com/api/trpc/workspace.stores.disconnect' \
  -H 'content-type: application/json' --data '{}' | sed -n '1,12p'
```

The health endpoint should return JSON with `"ok":true` and `"environment":"production"`, without access tokens, API keys, client secrets, or encrypted credential material. The protected endpoint should not succeed without an authenticated session.

Then perform browser-level checks in this order: register through `POST /api/account/register`, verify the email link, log in, bootstrap the workspace, analyze one public URL and confirm the completed-result screen, upload a real PNG/JPEG/WEBP screenshot and verify the provider/error state honestly, run one non-publishing tool, download a saved report, and confirm that an unsupported source remains blocked before queueing. Test Shopify OAuth only with a development store and the required Shopify secrets. Do not test publishing or rollback; those provider executors intentionally remain gated.

## 7. Rollback

If the new backend fails health checks, stop the new process and restore the previous Git commit only after recording the failure. Do not run `git reset --hard` while uncommitted server work exists. The frontend and backend should be rolled back as one source revision so their tRPC contracts remain aligned. Database migrations are forward-only unless a reviewed down-migration exists; do not manually delete migration records.
