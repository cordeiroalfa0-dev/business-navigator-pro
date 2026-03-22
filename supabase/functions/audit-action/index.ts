import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const body = await req.json();
    const {
      table_name,
      record_id,
      action, // 'INSERT', 'UPDATE', 'DELETE'
      old_values,
      new_values,
    } = body;

    // Generate summary of changes
    let changes_summary = "";
    if (action === "INSERT") {
      changes_summary = `Created new record`;
    } else if (action === "UPDATE" && old_values && new_values) {
      const changed = [];
      for (const key in new_values) {
        if (old_values[key] !== new_values[key]) {
          changed.push(`${key}: ${old_values[key]} → ${new_values[key]}`);
        }
      }
      changes_summary = `Updated: ${changed.join(", ")}`;
    } else if (action === "DELETE") {
      changes_summary = `Deleted record`;
    }

    // Get user info
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Insert audit log
    const { error: auditError } = await adminClient
      .from("audit_logs")
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: profile?.full_name || user.email,
        table_name,
        record_id,
        action,
        old_values: old_values || null,
        new_values: new_values || null,
        changes_summary,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

    if (auditError) throw auditError;

    return new Response(
      JSON.stringify({ success: true, message: "Audit log created" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Audit error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
