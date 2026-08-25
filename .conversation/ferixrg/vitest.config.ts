import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "web", "frontend", "src"),
      "@shared": path.resolve(templateRoot, "backend", "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["backend/api/**/*.test.ts", "backend/api/**/*.spec.ts", "web/frontend/**/*.test.ts", "web/frontend/**/*.spec.ts"],
  },
});
