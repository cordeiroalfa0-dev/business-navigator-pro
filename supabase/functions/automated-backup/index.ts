// Edge Function: automated-backup
// Executada pelo cron do Supabase OU manualmente pelo botão "Executar agora"
// Deploy: supabase functions deploy automated-backup
// Cron:   0 2 * * 0  (todo domingo às 02:00)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALL_TABLES = [
  "profiles","user_roles","admin_notifications","user_module_permissions",
  "metas","acoes_meta","meta_checkins","relatorios_gerados","dados_cadastro",
  "faturamento","contas_pagar","contas_receber",
  "empreendimentos","contratos","materiais",
  "execucao_obras","meta_predictions","meta_dependencies",
  "ativos_remo","ativos_fotos","ativos_envios",
  "dev_roadmap",
];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url        = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth       = req.headers.get("Authorization");

  const admin = createClient(url, serviceKey);

  // Aceita chamadas do cron (sem auth) e do frontend (com auth)
  // Apenas loga quem executou, sem usar no insert (schema não tem coluna executed_by)

  try {
    console.log("[AUTO-BACKUP] Iniciando backup automático...");
    const tableData: Record<string, any[]> = {};
    const metadata:  Record<string, number> = {};

    for (const t of ALL_TABLES) {
      const { data, error } = await admin.from(t).select("*");
      tableData[t] = error ? [] : (data ?? []);
      metadata[`total_${t}`] = tableData[t].length;
      console.log(`[AUTO-BACKUP] ${t}: ${tableData[t].length}`);
    }

    const total = Object.values(metadata).reduce((a, b) => a + b, 0);
    const now   = new Date().toISOString();

    // Monta JSON do backup
    const backupJson = JSON.stringify({
      version: "5.0",
      created_at: now,
      created_by: "automated-backup",
      data: tableData,
      metadata,
    });

    const sizeBytes = new TextEncoder().encode(backupJson).length;

    // Tenta salvar no Storage bucket 'backups'
    const dateStr  = now.split("T")[0];
    const fileName = `backup_auto_${dateStr}_${Date.now()}.json`;
    let filePath: string | null = null;

    try {
      const { error: storageErr } = await admin.storage
        .from("backups")
        .upload(fileName, backupJson, {
          contentType: "application/json",
          upsert: false,
        });

      if (storageErr) {
        console.warn("[AUTO-BACKUP] Storage indisponível:", storageErr.message);
      } else {
        filePath = fileName;
        console.log(`[AUTO-BACKUP] Arquivo salvo: ${fileName}`);
      }
    } catch (storageEx: any) {
      console.warn("[AUTO-BACKUP] Erro no storage:", storageEx.message);
    }

    // Registra no histórico
    await admin.from("backup_history").insert({
      backup_name: "backup-semanal",
      status: "success",
      total_records: total,
      size_bytes: sizeBytes,
      tables_count: ALL_TABLES.length,
    });

    // Atualiza o schedule com last/next backup
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7 + 7);
    nextSunday.setHours(2, 0, 0, 0);

    await admin.from("backup_schedule")
      .update({
        last_backup_at:    now,
        next_backup_at:    nextSunday.toISOString(),
        backup_size_bytes: sizeBytes,
        updated_at:        now,
      })
      .eq("backup_name", "weekly_auto");

    // Notifica admins
    const { data: admins } = await admin
      .from("user_roles").select("user_id").eq("role", "admin");

    if (admins?.length) {
      const notifications = admins.map((a: any) => ({
        user_id:   a.user_id,
        type:      "backup",
        title:     "Backup automático concluído",
        message:   `${total} registros salvos em ${now.split("T")[0]}`,
        read:      false,
      }));
      await admin.from("admin_notifications").insert(notifications).catch(() => {});
    }

    console.log(`[AUTO-BACKUP] ✅ Concluído. ${total} registros, ${Math.round(sizeBytes / 1024)}KB`);

    return json({
      success: true,
      total_records: total,
      tables_backed_up: ALL_TABLES.length,
      size_bytes: sizeBytes,
      file_path: filePath,
      executed_at: now,
    });

  } catch (err: any) {
    console.error("[AUTO-BACKUP] ❌ Erro:", err);

    // Registra falha no histórico
    await admin.from("backup_history").insert({
      backup_name: "backup-semanal",
      status: "error",
      error_message: err.message ?? "Erro desconhecido",
    }).catch(() => {});

    return json({ error: err.message ?? "Erro interno" }, 500);
  }
});
