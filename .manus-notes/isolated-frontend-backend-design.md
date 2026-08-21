# FerixRG isolated frontend/backend design

## Principle

Keep the existing source organization because it already reflects the product architecture: `web/frontend` is the React application and `backend/api` is the Express/tRPC application. Do not move the source tree merely to rename folders.

## Independent applications

### Frontend application

- Source: `web/frontend/`
- Build configuration: frontend-specific Vite configuration
- Environment: `web/frontend/.env.production` or an explicitly supplied frontend env file
- Allowed environment namespace: `VITE_*` only
- Output: `web/frontend/dist/`
- Deployment: independently served at `https://ferixrg.ferixas.com`
- Runtime behavior: dynamic React SPA; all workspace, account, analysis, AI, store, draft, report, and other live data comes from HTTP/tRPC requests to `https://ferixrgapi.ferixas.com`

### Backend application

- Source: `backend/api/`, `backend/database/`, and explicitly shared `backend/shared/`
- Build configuration: backend-specific TypeScript/esbuild configuration
- Environment: `backend/.env.production` or an explicitly supplied backend env file
- Output: `backend/dist/index.js`
- Deployment: PM2 process `ferixrg` on `127.0.0.1:5010`, publicly routed through `https://ferixrgapi.ferixas.com`
- Runtime behavior: dynamic Node/Express/tRPC API with Neon PostgreSQL and server-only integrations

## Explicit contract boundary

The frontend may import only an intentional shared contract package or generated declaration containing the tRPC router type and safe shared constants. It must not import implementation files from `backend/api`. The current direct import in `web/frontend/src/lib/trpc.ts` from `../../../../backend/api/routers` is an isolation gap and must be replaced with a deliberate contract boundary.

## Independent commands

- `pnpm frontend:build` builds only the frontend.
- `pnpm backend:build` builds only the backend.
- `pnpm frontend:dev` runs only the frontend development server.
- `pnpm backend:dev` runs only the backend development server.
- `pnpm db:migrate` runs only database migrations using the backend environment.
- `pnpm test` and `pnpm check` remain repository validation commands, but neither production deployment depends on the other application’s output.

## Dynamic deployment relationship

A frontend build being static files is only a delivery mechanism for the React program. The program remains dynamic because it calls the backend API at runtime. A frontend code change requires only a frontend build/redeploy; a backend code change requires only a backend build/restart. Neither change automatically rebuilds the other application.

## Environment separation

Use separate files and explicit loading:

- Frontend build reads `web/frontend/.env.production` and exposes only `VITE_*` variables.
- Backend migration and runtime read `backend/.env.production` through an explicit `FERIXRG_BACKEND_ENV_FILE` path or equivalent command wrapper.
- No backend secret is available in the frontend environment file.

The root package may remain as a workspace/orchestration manifest, but it must not be the runtime environment owner for either application.

## Deployment consequences

Nginx serves the frontend output from its own directory and proxies API traffic on `ferixrgapi.ferixas.com` to port `5010`. The frontend hostname may proxy only OAuth/Shopify callback paths to the backend when host-only callback cookies require that path; ordinary browser API requests use the separate API hostname.
