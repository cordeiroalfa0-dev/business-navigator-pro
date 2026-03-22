import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type RealtimeCallback = () => void;

/**
 * Assina mudanças em tempo real de uma tabela Supabase.
 * - Canal com nome estável (sem Math.random) — evita recriação desnecessária
 * - Usa ref estável para callback — evita re-subscribe ao re-render
 * - Debounce de 400ms para agrupar múltiplas mudanças simultâneas
 * - Cleanup correto ao desmontar
 */
export function useRealtimeTable(table: string, callback: RealtimeCallback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    // Nome de canal estável — sem Math.random() para não criar canais duplicados
    const channelName = `rt-${table}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            callbackRef.current();
          }, 400);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [table]);
}
