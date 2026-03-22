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

    // Fetch all metas
    const { data: metas, error: metasError } = await adminClient
      .from("metas")
      .select("*");

    if (metasError) throw metasError;
    if (!metas || metas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No metas to snapshot", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create snapshots for today
    const today = new Date().toISOString().split("T")[0];
    const snapshots = metas.map((meta: any) => ({
      meta_id: meta.id,
      snapshot_date: today,
      nome: meta.nome,
      atual: meta.atual,
      objetivo: meta.objetivo,
      percentual_concluido: meta.percentual_concluido || 0,
      status: meta.status || "no_prazo",
      responsavel: meta.responsavel,
    }));

    // Insert snapshots
    const { data: inserted, error: insertError } = await adminClient
      .from("meta_snapshots")
      .insert(snapshots);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Snapshots created successfully",
        count: inserted?.length || snapshots.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
