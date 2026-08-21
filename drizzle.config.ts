import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: process.env.FERIXRG_BACKEND_ENV_FILE ?? path.resolve("backend", ".env"),
});

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is required to run drizzle commands");
}

export default defineConfig({
  schema: "./backend/database/schema.ts",
  out: "./backend/database",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
