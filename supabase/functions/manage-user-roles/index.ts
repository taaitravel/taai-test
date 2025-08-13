import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const client = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userRes } = await client.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    // Check admin privileges (must have 'admin' role)
    const { data: myRoles, error: rolesErr } = await client
      .from("user_roles")
      .select("role");
    if (rolesErr) throw rolesErr;
    const isAdmin = (myRoles || []).some((r: any) => r.role === "admin");

    if (action === "list") {
      if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
      if (listErr) throw listErr;
      const users = list?.users || [];

      const userIds = users.map((u: any) => u.id);
      const { data: rolesRows, error: rrErr } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (rrErr) throw rrErr;

      const rolesMap = new Map<string, string[]>();
      (rolesRows || []).forEach((r: any) => {
        const arr = rolesMap.get(r.user_id) || [];
        if (!arr.includes(r.role)) arr.push(r.role);
        rolesMap.set(r.user_id, arr);
      });

      const result = users.map((u: any) => ({ id: u.id, email: u.email, roles: rolesMap.get(u.id) || [] }));
      return new Response(JSON.stringify({ users: result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "add" || action === "remove") {
      if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const role = String(body.role || "").toLowerCase();
      if (!role || (role !== "admin" && role !== "support")) {
        return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let targetId: string | undefined = body.userId;
      const email: string | undefined = body.email;

      if (!targetId && email) {
        // No direct get by email; list and filter
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) throw listErr;
        const found = (list?.users || []).find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
        if (!found) {
          return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        targetId = found.id;
      }

      if (!targetId) {
        return new Response(JSON.stringify({ error: "Missing userId or email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "add") {
        const { error } = await admin.from("user_roles").upsert({ user_id: targetId, role });
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        const { error } = await admin.from("user_roles").delete().eq("user_id", targetId).eq("role", role);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("manage-user-roles error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
