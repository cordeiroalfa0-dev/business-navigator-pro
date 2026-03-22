// Edge Function: backup-system
// Deploy: supabase functions deploy backup-system
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_TABLES = ["profiles", "user_roles", "admin_notifications", "user_module_permissions"];
const DATA_TABLES   = [
  "metas","acoes_meta","meta_checkins","relatorios_gerados","dados_cadastro",
  "faturamento","contas_pagar","contas_receber",
  "empreendimentos","contratos","materiais",
  "execucao_obras","meta_predictions","meta_dependencies",
  "ativos_remo","ativos_fotos","ativos_envios",
  "dev_roadmap",
];
const ALL_TABLES = [...SYSTEM_TABLES, ...DATA_TABLES];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url        = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth       = req.headers.get("Authorization");

    if (!auth) return json({ error: "Não autorizado" }, 401);

    // Valida JWT e role do usuário
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Token inválido" }, 401);

    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Apenas administradores" }, 403);

    const admin  = createClient(url, serviceKey);
    const body   = await req.json().catch(() => ({}));
    const action = body.action ?? "export";

    // ── EXPORT ──────────────────────────────────────────────
    if (action === "export") {
      const tableData: Record<string, any[]> = {};
      const metadata:  Record<string, number> = {};

      for (const t of ALL_TABLES) {
        const { data, error } = await admin.from(t).select("*");
        tableData[t]    = error ? [] : (data ?? []);
        metadata[`total_${t}`] = tableData[t].length;
        if (error) console.error(`[EXPORT] ${t}:`, error.message);
        else       console.log(`[EXPORT] ${t}: ${tableData[t].length}`);
      }

      const total = Object.values(metadata).reduce((a, b) => a + b, 0);

      // Registra no histórico
      await admin.from("backup_history").insert({
        backup_name: "manual-export",
        status: "success",
        total_records: total,
        tables_count: ALL_TABLES.length,
      }).catch(() => {});

      return json({
        version: "5.0",
        created_at: new Date().toISOString(),
        created_by: user.email,
        data: tableData,
        metadata,
        tables_backed_up: ALL_TABLES.length,
        total_records: total,
      });
    }

    // ── IMPORT ──────────────────────────────────────────────
    if (action === "import") {
      const backup = body.backup;
      const scope  = body.scope ?? "all";

      if (!backup?.data || !backup?.version)
        return json({ error: "Formato de backup inválido" }, 400);

      const targets = scope === "system"   ? SYSTEM_TABLES
                    : scope === "database" ? DATA_TABLES
                    : ALL_TABLES;

      const restored: Record<string, number> = {};
      for (const t of targets) {
        const rows = backup.data[t] ?? [];
        if (!rows.length) { restored[t] = 0; continue; }
        let count = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await admin.from(t).upsert(rows.slice(i, i + 500), { onConflict: "id" });
          if (!error) count += Math.min(500, rows.length - i);
          else console.error(`[IMPORT] ${t} lote ${i}:`, error.message);
        }
        restored[t] = count;
        console.log(`[IMPORT] ${t}: ${count}/${rows.length}`);
      }

      const total = Object.values(restored).reduce((a, b) => a + b, 0);
      await admin.from("backup_history").insert({
        backup_name: "manual-restore",
        status: "success",
        total_records: total,
        tables_count: ALL_TABLES.length,
      }).catch(() => {});

      return json({ restored, total });
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400);

  } catch (err: any) {
    console.error("backup-system error:", err);
    return json({ error: err.message ?? "Erro interno" }, 500);
  }
});
