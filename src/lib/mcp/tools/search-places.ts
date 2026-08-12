import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseProjectUrl } from "../env";

export default defineTool({
  name: "search_places",
  title: "Search places",
  description:
    "Search for cities, regions, and countries by name using TAAI Travel's place search. Returns up to 8 matches with place name, region/country context, and coordinates.",
  inputSchema: {
    query: z
      .string()
      .min(2)
      .describe("Place name to search (city, region, or country). Minimum 2 characters."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query }) => {
    let supabaseUrl: string;
    try {
      supabaseUrl = supabaseProjectUrl();
    } catch {
      return {
        content: [{ type: "text", text: "Server not configured (SUPABASE_URL missing)." }],
        isError: true,
      };
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/search-cities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        content: [{ type: "text", text: `Place search failed (${res.status}): ${text}` }],
        isError: true,
      };
    }

    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    const results = features.slice(0, 8).map((f: any) => ({
      name: f?.place_name ?? f?.text ?? "",
      short_name: f?.text ?? "",
      place_type: Array.isArray(f?.place_type) ? f.place_type[0] : undefined,
      longitude: Array.isArray(f?.center) ? f.center[0] : undefined,
      latitude: Array.isArray(f?.center) ? f.center[1] : undefined,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
