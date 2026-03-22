import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Chamada via cron do Supabase ou manualmente via Dashboard
// Configurar em: Supabase Dashboard → Edge Functions → Schedule
// Frequência recomendada: todo dia às 08:00 (0 8 * * *)

Deno.serve(async (req) => {
  // Aceita GET (cron) ou POST (manual)
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Chama a função PL/pgSQL que verifica prazos e gera notificações
    const { error } = await supabase.rpc("gerar_alertas_prazo");

    if (error) {
      console.error("Erro ao gerar alertas:", error.message);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const agora = new Date().toISOString();
    console.log(`[${agora}] Alertas de prazo gerados com sucesso.`);

    return new Response(
      JSON.stringify({ ok: true, executado_em: agora }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
