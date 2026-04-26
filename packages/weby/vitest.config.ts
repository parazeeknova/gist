import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
    globalSetup: "./src/test/global-setup.ts",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
