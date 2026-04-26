import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [viteReact(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["src/**/*.d.ts", "src/**/*.test.{ts,tsx}", "src/test/**"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    environment: "jsdom",
    exclude: ["node_modules", "dist", "**/*.d.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
