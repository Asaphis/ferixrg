# FerixRG

FerixRG is organized as a web application workspace with clear customer, administration, API, database, and shared-code boundaries.

## Project structure

```text
ferixrg/
├── web/
│   ├── frontend/       Customer-facing FerixRG application
│   └── admin-panel/    Separate administration application
├── backend/
│   ├── api/            Express and tRPC API
│   ├── database/       Drizzle schema and database migrations
│   └── shared/         Shared types, constants, and error contracts
├── package.json        Workspace scripts and dependencies
├── vite.config.ts      Frontend build configuration
└── README.md           Project structure guide
```

All active customer experience work belongs in `web/frontend`. Administrative workflows belong in `web/admin-panel`. Backend behavior belongs in the corresponding `backend` directory.
