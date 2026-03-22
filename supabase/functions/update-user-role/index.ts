import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
    if (roleRow?.role !== "admin") throw new Error("Not authorized");
    const { user_id, role } = await req.json();
    if (!user_id || !role) throw new Error("Missing required fields");
    if (!["admin", "master", "normal"].includes(role)) throw new Error("Invalid role");
    if (user_id === caller.id) throw new Error("Cannot change own role");
    const { data: existing } = await adminClient.from("user_roles").select("id").eq("user_id", user_id).maybeSingle();
    if (existing) {
      const { error } = await adminClient.from("user_roles").update({ role }).eq("user_id", user_id);
      if (error) throw error;
    } else {
      const { error } = await adminClient.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});