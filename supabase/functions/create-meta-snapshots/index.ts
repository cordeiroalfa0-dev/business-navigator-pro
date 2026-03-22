import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agendamento recomendado: toda segunda-feira às 08:00 (0 8 * * 1)
// Supabase Dashboard → Edge Functions → create-meta-snapshots → Schedule

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Buscar todas as metas ativas
    const { data: metas, error: metasError } = await adminClient
      .from("metas")
      .select("id, nome, atual, objetivo, percentual_concluido, status, responsavel")
      .neq("status", "arquivada");

    if (metasError) throw metasError;

    if (!metas || metas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma meta para snapshot", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Calcular percentual se não estiver preenchido
    const snapshots = metas.map((meta: any) => {
      const pct = meta.objetivo > 0
        ? Math.min(Math.round((meta.atual / meta.objetivo) * 100), 100)
        : 0;
      return {
        meta_id: meta.id,
        snapshot_date: today,
        nome: meta.nome,
        atual: meta.atual ?? 0,
        objetivo: meta.objetivo ?? 0,
        percentual_concluido: meta.percentual_concluido ?? pct,
        status: meta.status ?? "no_prazo",
        responsavel: meta.responsavel ?? "",
      };
    });

    // UPSERT — não duplica se rodar mais de uma vez no mesmo dia
    const { error: upsertError } = await adminClient
      .from("meta_snapshots")
      .upsert(snapshots, {
        onConflict: "meta_id,snapshot_date",
        ignoreDuplicates: false,
      });

    if (upsertError) throw upsertError;

    const agora = new Date().toISOString();
    return new Response(
      JSON.stringify({
        success: true,
        message: `${snapshots.length} snapshots gravados`,
        count: snapshots.length,
        snapshot_date: today,
        executed_at: agora,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
