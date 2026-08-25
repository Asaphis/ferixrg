import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED (or DATABASE_URL) is required to run drizzle commands");
}

export default defineConfig({
  schema: "./database/schema.ts",
  out: "./database",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
});
