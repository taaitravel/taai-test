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
}));
