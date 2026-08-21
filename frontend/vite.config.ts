import path from "node:path";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.base";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

export default defineConfig(() =>
  mergeConfig(baseConfig, {
    root: path.resolve(repositoryRoot, "web", "frontend"),
    envDir: path.resolve(import.meta.dirname),
    publicDir: path.resolve(repositoryRoot, "web", "frontend", "public"),
    resolve: {
      alias: {
        "@": path.resolve(repositoryRoot, "web", "frontend", "src"),
        "@shared": path.resolve(repositoryRoot, "backend", "shared"),
        "@assets": path.resolve(repositoryRoot, "attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
    },
  })
);
