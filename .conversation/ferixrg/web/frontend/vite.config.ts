import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";

export default defineConfig({
  plugins: [react(), tailwindcss(), jsxLocPlugin()],
  root: path.resolve(import.meta.dirname),
  envDir: path.resolve(import.meta.dirname),
  publicDir: path.resolve(import.meta.dirname, "public"),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
