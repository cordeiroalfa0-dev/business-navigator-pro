import { supabase } from "@/integrations/supabase/client";

interface BackupData {
  version: string;
  created_at: string;
  created_by: string;
  data: Record<string, any[]>;
  sql_dump: string;
  metadata: Record<string, number>;
}

const SYSTEM_TABLES = ["profiles", "user_roles", "admin_notifications", "user_module_permissions"];
const DATA_TABLES = [
  "metas", "acoes_meta", "meta_checkins", "relatorios_gerados", "dados_cadastro",
  "faturamento", "contas_pagar", "contas_receber",
  "empreendimentos", "contratos", "materiais",
  "execucao_obras",
  "meta_predictions", "meta_dependencies", "metas_sugestoes_fase",
  "ativos_remo", "ativos_fotos", "ativos_envios",
  "dev_roadmap",
];
const ALL_TABLES = [...SYSTEM_TABLES, ...DATA_TABLES];

function escapeSQL(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val))
    return `ARRAY[${val.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",")}]::text[]`;
  if (typeof val === "object")
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateTableSQL(tableName: string, rows: any[]): string {
  if (!rows || rows.length === 0) return `-- Table ${tableName}: no data\n`;
  const columns = Object.keys(rows[0]);
  const lines: string[] = [];
  lines.push(`-- Table: public.${tableName} (${rows.length} rows)`);
  for (const row of rows) {
    const vals = columns.map((col) => escapeSQL(row[col]));
    lines.push(
      `INSERT INTO public.${tableName} (${columns.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${columns
        .filter((c) => c !== "id")
        .map((c) => `${c} = EXCLUDED.${c}`)
        .join(", ")};`
    );
  }
  lines.push(``);
  return lines.join("\n");
}

async function fetchTableWithTimeout(table: string, timeoutMs = 15000): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`[EXPORT] Erro na tabela ${table}:`, error.message);
      if (error.message.includes('not found')) return [];
      throw error;
    }
    return data || [];
  } catch (e: any) {
    console.error(`[EXPORT] Falha na tabela ${table}:`, e.message);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function generateLocalBackup(): Promise<BackupData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");


  const tableData: Record<string, any[]> = {};
  for (const table of ALL_TABLES) {
    tableData[table] = await fetchTableWithTimeout(table);
  }

  const sqlParts: string[] = [
    `-- SAN REMO ERP — Database Backup (SQL)`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- By: ${user.email}`,
    `BEGIN;`,
  ];
  for (const table of ALL_TABLES) sqlParts.push(generateTableSQL(table, tableData[table]));
  sqlParts.push(`COMMIT;`);

  const metadata: Record<string, number> = {};
  for (const table of ALL_TABLES) metadata[`total_${table}`] = tableData[table].length;

  const total = Object.values(metadata).reduce((a, b) => a + b, 0);

  const backup: BackupData = {
    version: "5.0",
    created_at: new Date().toISOString(),
    created_by: user.email,
    data: tableData,
    sql_dump: sqlParts.join("\n"),
    metadata,
  };

  return backup;
}

export async function restoreLocalBackup(backupData: BackupData, scope: "system" | "database" | "all"): Promise<Record<string, number>> {
  const restored: Record<string, number> = {};

  const upsertTable = async (name: string, rows: any[]) => {
    if (!rows || rows.length === 0) {
      restored[name] = 0;
      return;
    }
    const BATCH_SIZE = 500;
    let count = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(name).upsert(batch, { onConflict: "id" });
      if (error) {
        console.error(`Erro ao importar lote em ${name}:`, error.message);
      } else {
        count += batch.length;
      }
    }
    restored[name] = count;
  };

  const tablesToRestore = scope === "system" ? SYSTEM_TABLES : scope === "database" ? DATA_TABLES : ALL_TABLES;
  for (const table of tablesToRestore) {
    await upsertTable(table, backupData.data[table] || []);
  }

  const total = Object.values(restored).reduce((a, b) => a + b, 0);
  return restored;
}
