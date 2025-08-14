import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import istanbul from "vite-plugin-istanbul";

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    istanbul({
      cypress: true,
      requireEnv: false,
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
