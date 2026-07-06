import { defineMcp } from "@lovable.dev/mcp-js";
import searchPlaces from "./tools/search-places";
import aboutTaai from "./tools/about-taai";

export default defineMcp({
  name: "taai-travel-mcp",
  title: "TAAI Travel",
  version: "0.1.0",
  instructions:
    "Tools for TAAI Travel. Use `about_taai` to learn what the platform does. Use `search_places` to resolve a city, region, or country name to coordinates before planning a trip.",
  tools: [searchPlaces, aboutTaai],
});
