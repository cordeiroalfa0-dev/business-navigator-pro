import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Meta, AcaoMeta, CheckIn } from "@/components/metas/types";
import { useRealtimeTable } from "./useRealtimeTable";

export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [acoes, setAcoes] = useState<AcaoMeta[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetas = useCallback(async () => {
    const { data, error } = await supabase.from("metas").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setMetas(data.map((m: any) => ({
        ...m,
        atual: Number(m.atual),
        objetivo: Number(m.objetivo),
        orcamento: Number(m.orcamento ?? 0),
        custo_atual: Number(m.custo_atual ?? 0),
        peso: Number(m.peso ?? 0),
        percentual_concluido: Number(m.percentual_concluido ?? 0),
      })));
    }
    setLoading(false);
  }, []);

  const fetchAcoes = useCallback(async () => {
    const { data } = await supabase.from("acoes_meta").select("*").order("created_at");
    if (data) setAcoes(data as AcaoMeta[]);
  }, []);

  const fetchCheckins = useCallback(async () => {
    const { data } = await supabase.from("meta_checkins").select("*").order("created_at", { ascending: false });
    if (data) setCheckins(data as CheckIn[]);
  }, []);

  useEffect(() => {
    fetchMetas();
    fetchAcoes();
    fetchCheckins();
  }, [fetchMetas, fetchAcoes, fetchCheckins]);

  useRealtimeTable("metas", fetchMetas);
  useRealtimeTable("acoes_meta", fetchAcoes);
  useRealtimeTable("meta_checkins", fetchCheckins);

  return {
    metas,
    acoes,
    checkins,
    loading,
    refresh: fetchMetas
  };
}
