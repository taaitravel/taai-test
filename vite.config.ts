import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { applyMcpEdgeGuard } from "./scripts/apply-mcp-edge-guard.mjs";

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
    {
      name: "taai-mcp-edge-guard",
      // mcpPlugin regenerates the function in parallel with buildStart, so the
      // guard is reapplied after that write (and again if dev regeneration lands).
      configResolved() {
        applyMcpEdgeGuard(path.resolve(__dirname, "supabase/functions/mcp/index.ts"));
      },
      buildEnd() {
        applyMcpEdgeGuard(path.resolve(__dirname, "supabase/functions/mcp/index.ts"));
      },
      configureServer(server: ViteDevServer) {
        const file = path.resolve(__dirname, "supabase/functions/mcp/index.ts");
        const apply = (changed: string) => {
          if (!changed.replaceAll("\\", "/").endsWith("supabase/functions/mcp/index.ts")) return;
          applyMcpEdgeGuard(file);
        };
        server.watcher.on("add", apply);
        server.watcher.on("change", apply);
      },
    },
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
