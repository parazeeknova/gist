import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const config = defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), "");
  const port = env.PORT || env.BACKEND_PORT || "7000";

  return {
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      devtools(),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
    resolve: { tsconfigPaths: true },
    server: {
      proxy: {
        "/api": {
          changeOrigin: true,
          target: `http://localhost:${port}`,
        },
      },
    },
  };
});

export default config;
