import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuditAction = "INSERT" | "UPDATE" | "DELETE";

interface AuditParams {
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
}

/**
 * FASE 2 — hook que invoca a edge function audit-action.
 * Falha silenciosa: nunca bloqueia a operação principal.
 */
export function useAudit() {
  const registrar = useCallback(async (params: AuditParams) => {
    try {
      await supabase.functions.invoke("audit-action", { body: params });
    } catch {
      // silencioso — auditoria nunca deve travar o fluxo principal
    }
  }, []);

  return { registrar };
}
