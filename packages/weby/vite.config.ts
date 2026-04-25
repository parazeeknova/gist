import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  resolve: { tsconfigPaths: true },
  server: {
    proxy: {
      "/api": {
        changeOrigin: true,
        target: "http://localhost:8080",
      },
    },
  },
});

export default config;
