import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPlaces from "./tools/search-places";
import aboutTaai from "./tools/about-taai";

// The OAuth issuer must be the direct Supabase host, built from the project ref.
// Vite inlines this as a literal at build time, so the entry stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "taai-test",
  title: "taai-test",
  version: "0.1.0",
  instructions:
    "Tools for TAAI Travel. Use `about_taai` to learn what the platform does. Use `search_places` to resolve a city, region, or country name to coordinates before planning a trip.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPlaces, aboutTaai],
});
