import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const config = defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = env.PORT || env.BACKEND_PORT || "7000";
  const isCloudflare = env.CLOUDFLARE === "1";

  const plugins = [devtools(), tailwindcss(), tanstackStart(), viteReact()];

  if (isCloudflare) {
    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.unshift(cloudflare({ viteEnvironment: { name: "ssr" } }));
  } else {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro({ preset: "node-server" }));
  }

  return {
    plugins,
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
