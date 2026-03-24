import { useState, useEffect, useCallback } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { supabase } from "@/integrations/supabase/client";
import { Meta, AcaoMeta, CheckIn } from "@/components/metas/types";
import { useRealtimeTable } from "./useRealtimeTable";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { calculateStatus } from "@/components/metas/utils";

export function useMetas() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [metas, setMetas] = useState<Meta[]>([]);
  const [acoes, setAcoes] = useState<AcaoMeta[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMetas = useCallback(async () => {
    const { data, error } = await supabase
      .from("metas")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setMetas(data.map((m: any) => ({
        ...m,
        atual: Number(m.atual),
        objetivo: Number(m.objetivo),
        orcamento: Number(m.orcamento ?? 0),
        custo_atual: Number(m.custo_atual ?? 0),
        peso: Number(m.peso ?? 0),
        percentual_concluido: Number(m.percentual_concluido ?? 0),
        tags: m.tags ?? [],
        campos_extras: (m.campos_extras && typeof m.campos_extras === "object") ? m.campos_extras : {},
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

  useEffect(() => { fetchMetas(); fetchAcoes(); fetchCheckins(); }, [fetchMetas, fetchAcoes, fetchCheckins]);
  useRealtimeTable("metas", fetchMetas);
  useRealtimeTable("acoes_meta", fetchAcoes);
  useRealtimeTable("meta_checkins", fetchCheckins);

  const addMeta = useCallback(async (payload: Partial<Meta> & { nome: string }) => {
    setSaving(true);
    const { error } = await supabase.from("metas").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) { toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Meta criada!" });
    return true;
  }, [user, toast]);

  const updateMeta = useCallback(async (id: string, payload: Partial<Meta>) => {
    setSaving(true);
    const { error } = await supabase.from("metas").update(payload).eq("id", id);
    setSaving(false);
    if (error) { toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Meta atualizada!" });
    return true;
  }, [toast]);

  const removeMeta = useCallback(async (id: string) => {
    if (!(await confirm({ message: "Excluir esta meta? Esta ação não pode ser desfeita.", title: "Excluir Meta", confirmLabel: "Excluir", variant: "danger" }))) return false;
    await supabase.from("metas").delete().eq("id", id);
    toast({ title: "Meta removida" });
    return true;
  }, [toast]);

  const addAcao = useCallback(async (metaId: string, descricao: string, tipo: "acao" | "contribuicao", responsavel?: string, prazo?: string, imagens?: string[]) => {
    const { error } = await supabase.from("acoes_meta").insert({ meta_id: metaId, descricao, tipo, responsavel: responsavel || null, prazo: prazo || null, created_by: user?.id, imagens: imagens || [] });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    toast({ title: tipo === "contribuicao" ? "Contribuição adicionada!" : "Ação adicionada!" });
    return true;
  }, [user, toast]);

  const toggleAcao = useCallback(async (acao: AcaoMeta) => {
    await supabase.from("acoes_meta").update({ concluida: !acao.concluida }).eq("id", acao.id);
  }, []);

  const removeAcao = useCallback(async (id: string) => {
    if (!(await confirm({ message: "Excluir esta ação?", title: "Excluir Ação", confirmLabel: "Excluir", variant: "danger" }))) return false;
    await supabase.from("acoes_meta").delete().eq("id", id);
    toast({ title: "Ação removida" });
    return true;
  }, [toast]);

  const addCheckin = useCallback(async (metaId: string, comentario: string, confianca: CheckIn["confianca"], novoValor?: number, imagens?: string[]) => {
    const meta = metas.find((m) => m.id === metaId);
    if (!meta) return false;
    const valorFinal = novoValor ?? meta.atual;
    const { error } = await supabase.from("meta_checkins").insert({ meta_id: metaId, user_id: user!.id, user_name: profile?.full_name || user?.email || "—", valor_anterior: meta.atual, valor_novo: valorFinal, comentario, confianca, imagens: imagens || [] });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    if (valorFinal !== meta.atual) {
      const isQual = meta.unidade === "texto";
      const newStatus = calculateStatus(valorFinal, meta.objetivo, isQual);
      await supabase.from("metas").update({ atual: valorFinal, status: newStatus }).eq("id", metaId);
    }
    toast({ title: "Check-in registrado!" });
    return true;
  }, [metas, user, profile, toast]);

  const removeCheckin = useCallback(async (id: string) => {
    if (!(await confirm({ message: "Excluir este check-in?", title: "Excluir Check-in", confirmLabel: "Excluir", variant: "danger" }))) return false;
    await supabase.from("meta_checkins").delete().eq("id", id);
    toast({ title: "Check-in removido" });
    return true;
  }, [toast]);

  return {
    metas, acoes, checkins, loading, saving,
    getAcoesByMeta: (id: string) => acoes.filter((a) => a.meta_id === id),
    getCheckinsByMeta: (id: string) => checkins.filter((c) => c.meta_id === id),
    getChildMetas: (parentId: string) => metas.filter((m) => m.parent_id === parentId),
    addMeta, updateMeta, removeMeta,
    addAcao, toggleAcao, removeAcao,
    addCheckin, removeCheckin,
    refresh: fetchMetas,
  };
}
