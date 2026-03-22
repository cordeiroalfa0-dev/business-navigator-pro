import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseSupabaseQueryOptions<T> {
  table: string;
  select?: string;
  order?: { column: string; ascending?: boolean };
  filter?: (query: any) => any;
  transform?: (data: any[]) => T[];
  enabled?: boolean;
  errorMessage?: string;
}

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook centralizado para queries no Supabase.
 * - try/catch automático
 * - cleanup de estado ao desmontar
 * - toast de erro configurável
 * - transformação de dados opcional
 */
export function useSupabaseQuery<T = any>({
  table,
  select = "*",
  order,
  filter,
  transform,
  enabled = true,
  errorMessage,
}: UseSupabaseQueryOptions<T>): QueryState<T> {
  const { toast } = useToast();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table as any).select(select);
      if (filter) query = filter(query);
      if (order) query = query.order(order.column, { ascending: order.ascending ?? false });

      const { data: raw, error: sbError } = await query;

      if (!mountedRef.current) return;

      if (sbError) {
        const msg = errorMessage ?? `Erro ao carregar ${table}`;
        setError(msg);
        toast({ title: "Erro", description: msg, variant: "destructive" });
        return;
      }

      const result = transform ? transform(raw ?? []) : (raw ?? []) as T[];
      setData(result);
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = errorMessage ?? `Falha ao carregar ${table}`;
      setError(msg);
      toast({ title: "Erro inesperado", description: msg, variant: "destructive" });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [table, select, enabled, errorMessage]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

/**
 * Hook para mutações (insert/update/delete) com try/catch e feedback.
 */
export function useSupabaseMutation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(async (
    fn: () => Promise<{ error: any }>,
    options?: { successMessage?: string; errorMessage?: string; onSuccess?: () => void }
  ) => {
    setLoading(true);
    try {
      const { error } = await fn();
      if (error) {
        toast({
          title: "Erro",
          description: options?.errorMessage ?? error.message ?? "Operação falhou",
          variant: "destructive",
        });
        return false;
      }
      if (options?.successMessage) {
        toast({ title: options.successMessage });
      }
      options?.onSuccess?.();
      return true;
    } catch (err: any) {
      toast({
        title: "Erro inesperado",
        description: options?.errorMessage ?? "Tente novamente",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { mutate, loading };
}
