import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Default environment is node; component tests use // @vitest-environment jsdom docblock
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/**", "components/**", "proxy.ts"],
      exclude: [
        "app/layout.tsx",
        "app/globals.css",
        "**/*.d.ts",
        "**/node_modules/**",
        "docs/scratch/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
