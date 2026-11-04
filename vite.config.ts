import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mcpPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("mapbox-gl")) return "mapbox";
          if (id.includes("@react-pdf") || id.includes("fontkit") || id.includes("yoga-layout")) return "pdf";
          if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vendor")) return "charts";
          if (id.includes("@stripe") || id.includes("/stripe/")) return "stripe";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/") || id.includes("scheduler")) return "react";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
        },
      },
    },
  },
}));
