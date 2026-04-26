import { defineConfig, loadEnv } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), "");
  const port = env.PORT || env.BACKEND_PORT || "8080";

  return {
    plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
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
