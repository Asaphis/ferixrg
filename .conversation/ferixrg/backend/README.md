# FerixRG Backend

This is the independent FerixRG API service. It contains the Express/tRPC routes, authentication, Neon PostgreSQL database layer, AI/provider integrations, storage, and server-side secrets. It does not serve the customer frontend.

## Commands

```bash
pnpm install
pnpm check
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm build
pnpm start
```

Production runtime configuration belongs in `.env`. Production output is `dist/index.js`; PM2 should run this file as the isolated `ferixrg` process on port `5010`.
