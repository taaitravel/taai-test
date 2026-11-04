import { readFileSync, writeFileSync } from "node:fs";

const MARKER = "taai-mcp-edge-guard";

const wrapperFor = (mcpBinding) => `import { buildCorsHeaders, guardOrigin } from "../_shared/edge-guard.ts";

// ${MARKER}: origin allow-list plus a bearer requirement on every route except
// OAuth protected-resource metadata. Tool calls are still verified by mcp-js.
if (!${mcpBinding}?.auth) {
  throw new Error("MCP auth is required");
}

const mcpHandler = createSupabaseHandler(${mcpBinding}, { functionName: "mcp" });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);
  const originGuard = guardOrigin(origin);
  if (!originGuard.ok) {
    return new Response(JSON.stringify({ error: originGuard.error }), {
      status: originGuard.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const metadata = new URL(req.url).pathname.endsWith("/.well-known/oauth-protected-resource");
  if (!metadata && !/^Bearer\\s+\\S+/i.test(req.headers.get("Authorization") ?? "")) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer",
      },
    });
  }
  const response = await mcpHandler(req);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (key.toLowerCase() === "access-control-allow-origin" || !headers.has(key)) {
      headers.set(key, value);
    }
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
`;

export function applyMcpEdgeGuard(file) {
  const text = readFileSync(file, "utf8");
  if (text.includes(MARKER)) return false;
  const serve = /Deno\.serve\(createSupabaseHandler\(([A-Za-z0-9_]+),\s*\{\s*functionName:\s*"mcp"\s*\}\)\);?/;
  const match = text.match(serve);
  if (!match) {
    throw new Error(`apply-mcp-edge-guard: expected generated Deno.serve line in ${file}`);
  }
  writeFileSync(file, text.replace(serve, wrapperFor(match[1])));
  return true;
}

if (process.argv[1] && process.argv[1].endsWith("apply-mcp-edge-guard.mjs")) {
  const file = process.argv[2] ?? "supabase/functions/mcp/index.ts";
  applyMcpEdgeGuard(file);
}
