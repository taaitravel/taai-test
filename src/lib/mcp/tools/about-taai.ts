import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const ABOUT = {
  name: "TAAI Travel",
  tagline: "AI trip-planning software",
  description:
    "TAAI Travel is AI trip-planning software from Lighthouse Commerce Group LLC. It helps people research and organize itineraries. It does not sell travel or take payment for travel. Purchases are made directly with third-party providers.",
  website: "https://taai-test.lovable.app",
  capabilities: [
    "Search hotels, flights, and activities across multiple providers",
    "AI-generated itineraries with day-by-day planning",
    "Shared itineraries and collaborative trip planning",
    "Software subscription for planning tools. Travel checkout is not offered.",
  ],
};

export default defineTool({
  name: "about_taai",
  title: "About TAAI Travel",
  description:
    "Return a short description of TAAI Travel, its capabilities, and website. Useful when an assistant is first connected and wants to know what this MCP server can do.",
  inputSchema: {} as Record<string, z.ZodType>,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(ABOUT, null, 2) }],
    structuredContent: ABOUT,
  }),
});
