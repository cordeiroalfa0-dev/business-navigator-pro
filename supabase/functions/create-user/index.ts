import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin": "*","Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleRow } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
    if (roleRow?.role !== "admin") throw new Error("Not authorized");
    const { email, password, full_name, role } = await req.json();
    if (!email || !password || !full_name || !role) throw new Error("Missing required fields");
    if (!["admin", "master", "normal", "almoxarife"].includes(role)) throw new Error("Invalid role");
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
    if (createError) throw createError;
    const { error: roleAssignError } = await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role });
    if (roleAssignError) throw roleAssignError;
    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("ERRO create-user:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});