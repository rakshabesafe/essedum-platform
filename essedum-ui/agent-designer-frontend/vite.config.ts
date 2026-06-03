import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const port = parseInt(env.VITE_PORT, 10) || 3000;
  const backendUrl = env.VITE_API_BASE_URL;

  return {
    plugins: [react(), viteSingleFile()],
    server: {
      port,
      ...(backendUrl ? {
        proxy: {
          '/api': { target: backendUrl, changeOrigin: true },
          '/health': { target: backendUrl, changeOrigin: true },
        },
      } : {}),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      assetsInlineLimit: 10000000000, // Inline all assets
      cssCodeSplit: false,
      minify: 'esbuild',              // Faster than terser
      reportCompressedSize: false,    // Skip gzip calc (saves time)
      chunkSizeWarningLimit: 1000,    // Suppress warnings
      rollupOptions: {
        output: {
          manualChunks: undefined,    // Single chunk = faster for small apps
        },
      },
    },
  };
});
