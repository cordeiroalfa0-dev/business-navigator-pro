import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Bases fixas (nunca removíveis)
const CATEGORIAS_BASE = ["Financeiro", "Vendas", "Operacional", "Qualidade", "RH", "Engenharia", "Construção", "Projetos"];
const CICLOS_BASE = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Anual 2026"];
const UNIDADES_BASE = [
  { value: "R$", label: "R$ (Reais)" },
  { value: "%", label: "% (Percentual)" },
  { value: "dias", label: "Dias" },
  { value: "un", label: "Unidades" },
  { value: "horas", label: "Horas" },
  { value: "m²", label: "m² (Metros²)" },
  { value: "kg", label: "Kg" },
  { value: "tarefas", label: "Tarefas" },
];
const ETAPAS_BASE = [
  "Planejamento", "Fundação", "Estrutura", "Alvenaria",
  "Elétrica", "Hidráulica", "Acabamento", "Entrega",
  "Em andamento", "Concluído",
];

export type TipoCampo = "categoria" | "ciclo" | "unidade" | "etapa" | "campo";

export interface CampoCustomizado {
  id: string;
  tipo: TipoCampo;
  valor: string;   // chave única (para "campo": "campo_<nome_slug>")
  label?: string;  // nome exibido
  secao?: string;
  created_by?: string;
}

export function useMetaCampos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customCampos, setCustomCampos] = useState<CampoCustomizado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampos = useCallback(async () => {
    const { data, error } = await supabase
      .from("meta_campos_customizados")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setCustomCampos(data as CampoCustomizado[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampos(); }, [fetchCampos]);

  /** Adiciona novo valor ao Supabase */
  const adicionarCampo = useCallback(
    async (tipo: TipoCampo, valor: string, label?: string, secao?: string): Promise<boolean> => {
      const valorTrimmed = valor.trim();
      if (!valorTrimmed) return false;

      // Para tipo "campo", gerar chave slug única
      const chave = tipo === "campo"
        ? `campo_${valorTrimmed.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}_${Date.now()}`
        : valorTrimmed;

      const { error } = await supabase.from("meta_campos_customizados").insert({
        tipo,
        valor: chave,
        label: label?.trim() || valorTrimmed,
        secao: secao || "Personalizados",
        created_by: user?.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Valor já existe", description: `"${valorTrimmed}" já está na lista.`, variant: "destructive" });
        } else {
          toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        }
        return false;
      }

      toast({ title: "Campo adicionado!", description: `"${label || valorTrimmed}" adicionado com sucesso.` });
      await fetchCampos();
      return true;
    },
    [user, fetchCampos, toast]
  );

  /** Remove campo customizado */
  const removerCampo = useCallback(
    async (id: string, label: string): Promise<boolean> => {
      const { error } = await supabase.from("meta_campos_customizados").delete().eq("id", id);
      if (error) {
        toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Campo removido", description: `"${label}" removido.` });
      await fetchCampos();
      return true;
    },
    [fetchCampos, toast]
  );

  // Listas combinadas
  const categorias = [
    ...CATEGORIAS_BASE,
    ...customCampos.filter(c => c.tipo === "categoria" && !CATEGORIAS_BASE.includes(c.valor)).map(c => c.valor),
  ];
  const ciclos = [
    ...CICLOS_BASE,
    ...customCampos.filter(c => c.tipo === "ciclo" && !CICLOS_BASE.includes(c.valor)).map(c => c.valor),
  ];
  const unidades = [
    ...UNIDADES_BASE,
    ...customCampos
      .filter(c => c.tipo === "unidade" && !UNIDADES_BASE.some(u => u.value === c.valor))
      .map(c => ({ value: c.valor, label: c.label || c.valor })),
  ];
  const etapas = [
    ...ETAPAS_BASE,
    ...customCampos.filter(c => c.tipo === "etapa" && !ETAPAS_BASE.includes(c.valor)).map(c => c.valor),
  ];

  /** Apenas campos de formulário personalizados (tipo = "campo") */
  const camposExtras: CampoCustomizado[] = customCampos.filter(c => c.tipo === "campo");

  const customPorTipo = (tipo: TipoCampo) => customCampos.filter(c => c.tipo === tipo);

  return {
    loading,
    categorias,
    ciclos,
    unidades,
    etapas,
    camposExtras,
    customCampos,
    customPorTipo,
    adicionarCampo,
    removerCampo,
    refresh: fetchCampos,
  };
}
