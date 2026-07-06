import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const ABOUT = {
  name: "TAAI Travel",
  tagline: "AI-powered travel planning and booking",
  description:
    "TAAI Travel is a premium travel-planning platform that combines an AI concierge with real-time hotel, flight, and activity search. Users create itineraries, collaborate with travel companions, capture and book options, and manage trips end-to-end.",
  website: "https://taai-test.lovable.app",
  capabilities: [
    "Search hotels, flights, and activities across multiple providers",
    "AI-generated itineraries with day-by-day planning",
    "Shared itineraries and collaborative trip planning",
    "Integrated checkout and booking",
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
