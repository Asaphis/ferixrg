# Current FerixRG architecture audit

## Verified existing structure

- Frontend source is under `web/frontend/`.
- Backend source is under `backend/api/`.
- Database schema and migrations are under `backend/database/`.
- Shared contracts/constants are under `backend/shared/`.
- `web/admin-panel/` currently contains only a README and is not an implemented application.

## Current build behavior

The root `package.json` currently defines one combined build command:

`vite build && esbuild backend/api/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

Vite uses `web/frontend` as its root and writes the frontend bundle to `dist/public`. The backend is bundled separately to `dist/index.js`. The production backend process serves `dist/public` through `serveStatic` and also handles API routes.

## Current dependency coupling

The frontend imports `@shared` constants and imports the backend `AppRouter` type directly from `../../../../backend/api/routers` through `web/frontend/src/lib/trpc.ts`. The backend does not import frontend source code. Root `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `drizzle.config.ts`, and the root package scripts all coordinate both applications.

## Current environment behavior

The root `.env` is loaded by backend `dotenv/config` at runtime and is also the Vite `envDir`. Vite exposes only `VITE_*` values to the browser. Backend secrets are not exposed by the Vite prefix mechanism. The current implementation therefore has one root environment file but separate public `VITE_*` and private backend namespaces.

## Isolation gaps to address

1. Frontend and backend currently share the root package scripts and root build invocation.
2. The backend production process serves the frontend bundle, so frontend hosting is not independently deployable.
3. The frontend directly imports the backend router type by relative filesystem path, creating a compile-time coupling.
4. The frontend and backend do not currently have independent package manifests or independent environment-file conventions.
5. The frontend remains dynamic at runtime through API calls; changing its delivery from backend-served static assets to an independently hosted SPA must preserve that API behavior.

## Design constraint

Do not blindly move the existing source tree. First introduce explicit frontend and backend build/deployment boundaries, move only the shared API contract into an intentional shared location or generated contract boundary, and preserve the existing dynamic runtime behavior and product features.
