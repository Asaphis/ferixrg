# FerixRG Frontend

This is the independent customer-facing React application for FerixRG. It contains the customer UI only and communicates with the separately deployed backend through the URL in `VITE_API_BASE_URL`.

## Commands

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm preview
```

Production build output is `dist/`. Frontend environment values belong in `.env.production`; never place backend secrets in this project.
