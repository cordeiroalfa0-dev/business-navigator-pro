import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Meta, MetaTipo, FieldToggles } from "./types";
import { 
  categoriasBase, ciclosDisponiveis, unidadesPreset, 
  defaultTogglesQuant, defaultTogglesQual, etapasPreset, 
  frequenciasCheckin, coresMeta 
} from "./constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MetaFormProps {
  initialData?: Meta | null;
  onSuccess: () => void;
  onCancel: () => void;
  metasCount: number;
}

const inputStyle = { background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" };
const labelStyle = { color: "hsl(var(--pbi-text-secondary))" };

export const MetaForm: React.FC<MetaFormProps> = ({ initialData, onSuccess, onCancel, metasCount }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<MetaTipo>(initialData?.tipo_meta as MetaTipo || "quantitativa");
  const [toggles, setToggles] = useState<FieldToggles>(
    initialData ? {
      valores: initialData.unidade !== "texto",
      responsavel: !!initialData.responsavel,
      aprovador: !!initialData.aprovador,
      equipe: !!initialData.equipe,
      departamento: !!initialData.departamento,
      prazo: !!initialData.prazo,
      data_inicio: !!initialData.data_inicio,
      ciclo: !!initialData.ciclo,
      frequencia_checkin: initialData.frequencia_checkin !== "semanal",
      orcamento: initialData.orcamento > 0,
      local_obra: !!initialData.local_obra,
      etapa: !!initialData.etapa,
      fornecedor: !!initialData.fornecedor,
      marco_critico: !!initialData.marco_critico,
      descricao: !!initialData.descricao,
      observacoes: !!initialData.observacoes,
      risco: !!initialData.risco,
      impacto: !!initialData.impacto,
      dependencias: !!initialData.dependencias,
      prioridade: true,
      peso: initialData.peso > 0,
      tags: (initialData.tags?.length ?? 0) > 0,
      indicador_chave: !!initialData.indicador_chave,
      fonte_dados: !!initialData.fonte_dados,
      categoria: !!initialData.categoria,
      metaPai: !!initialData.parent_id,
    } : (tipo === "quantitativa" ? defaultTogglesQuant : defaultTogglesQual)
  );

  const [values, setValues] = useState<Record<string, string>>({
    nome: initialData?.nome || "",
    atual: initialData?.atual.toString() || "0",
    objetivo: initialData?.objetivo.toString() || "100",
    unidade: initialData?.unidade || "R$",
    categoria: initialData?.categoria || "Financeiro",
    categoriaCustom: "",
    responsavel: initialData?.responsavel || "",
    prioridade: initialData?.prioridade || "media",
    ciclo: initialData?.ciclo || "Q1 2026",
    parent_id: initialData?.parent_id || "",
    prazo: initialData?.prazo || "",
    descricao: initialData?.descricao || "",
    local_obra: initialData?.local_obra || "",
    orcamento: initialData?.orcamento.toString() || "0",
    custo_atual: initialData?.custo_atual.toString() || "0",
    equipe: initialData?.equipe || "",
    fornecedor: initialData?.fornecedor || "",
    etapa: initialData?.etapa || "",
    peso: initialData?.peso.toString() || "0",
    tags: (initialData?.tags || []).join(", "),
    data_inicio: initialData?.data_inicio || "",
    frequencia_checkin: initialData?.frequencia_checkin || "semanal",
    risco: initialData?.risco || "",
    observacoes: initialData?.observacoes || "",
    aprovador: initialData?.aprovador || "",
    departamento: initialData?.departamento || "",
    indicador_chave: initialData?.indicador_chave || "",
    fonte_dados: initialData?.fonte_dados || "",
    impacto: initialData?.impacto || "",
    dependencias: initialData?.dependencias || "",
    marco_critico: initialData?.marco_critico || "",
  });

  const set = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!values.nome) {
      toast({ title: "Preencha o nome da meta", variant: "destructive" });
      return;
    }

    const isQual = tipo === "qualitativa";
    const categoriaFinal = values.categoria === "__outra__" ? values.categoriaCustom.trim() : values.categoria;
    const cor = initialData?.cor || coresMeta[metasCount % coresMeta.length];

    const data = {
      nome: values.nome,
      atual: isQual ? 0 : (parseFloat(values.atual) || 0),
      objetivo: isQual ? 1 : (parseFloat(values.objetivo) || 1),
      unidade: isQual ? "texto" : values.unidade,
      cor,
      categoria: categoriaFinal || "Geral",
      responsavel: values.responsavel,
      prioridade: values.prioridade,
      created_by: user?.id,
      ciclo: values.ciclo,
      parent_id: values.parent_id || null,
      tipo_meta: tipo,
      descricao: values.descricao,
      local_obra: values.local_obra,
      orcamento: parseFloat(values.orcamento) || 0,
      custo_atual: parseFloat(values.custo_atual) || 0,
      equipe: values.equipe,
      fornecedor: values.fornecedor,
      etapa: values.etapa,
      peso: parseFloat(values.peso) || 0,
      tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      data_inicio: values.data_inicio || null,
      prazo: values.prazo || null,
      frequencia_checkin: values.frequencia_checkin,
      risco: values.risco,
      observacoes: values.observacoes,
      aprovador: values.aprovador,
      departamento: values.departamento,
      indicador_chave: values.indicador_chave,
      fonte_dados: values.fonte_dados,
      impacto: values.impacto,
      dependencias: values.dependencias,
      marco_critico: values.marco_critico,
    };

    let error;
    if (initialData) {
      const { error: err } = await supabase.from("metas").update(data).eq("id", initialData.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("metas").insert(data);
      error = err;
    }

    if (error) {
      toast({ title: "Erro ao salvar meta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: initialData ? "Meta atualizada!" : "Meta criada!" });
      onSuccess();
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: step >= s ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-dark))" }} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={labelStyle}>Nome da Meta</Label>
            <Input value={values.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Aumentar faturamento" style={inputStyle} className="border-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={labelStyle}>Tipo</Label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as MetaTipo)} className="w-full h-10 rounded px-3 border-none outline-none" style={inputStyle}>
                <option value="quantitativa">Quantitativa</option>
                <option value="qualitativa">Qualitativa</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label style={labelStyle}>Prioridade</Label>
              <select value={values.prioridade} onChange={(e) => set("prioridade", e.target.value)} className="w-full h-10 rounded px-3 border-none outline-none" style={inputStyle}>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🔵 Baixa</option>
              </select>
            </div>
          </div>
          {tipo === "quantitativa" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label style={labelStyle}>Atual</Label>
                <Input type="number" value={values.atual} onChange={(e) => set("atual", e.target.value)} style={inputStyle} className="border-none" />
              </div>
              <div className="space-y-1.5">
                <Label style={labelStyle}>Objetivo</Label>
                <Input type="number" value={values.objetivo} onChange={(e) => set("objetivo", e.target.value)} style={inputStyle} className="border-none" />
              </div>
              <div className="space-y-1.5">
                <Label style={labelStyle}>Unidade</Label>
                <select value={values.unidade} onChange={(e) => set("unidade", e.target.value)} className="w-full h-10 rounded px-3 border-none outline-none" style={inputStyle}>
                  {unidadesPreset.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={labelStyle}>Responsável</Label>
              <Input value={values.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Nome" style={inputStyle} className="border-none" />
            </div>
            <div className="space-y-1.5">
              <Label style={labelStyle}>Ciclo</Label>
              <select value={values.ciclo} onChange={(e) => set("ciclo", e.target.value)} className="w-full h-10 rounded px-3 border-none outline-none" style={inputStyle}>
                {ciclosDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={labelStyle}>Data Início</Label>
              <Input type="date" value={values.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} style={inputStyle} className="border-none" />
            </div>
            <div className="space-y-1.5">
              <Label style={labelStyle}>Prazo Final</Label>
              <Input type="date" value={values.prazo} onChange={(e) => set("prazo", e.target.value)} style={inputStyle} className="border-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label style={labelStyle}>Categoria</Label>
            <select value={values.categoria} onChange={(e) => set("categoria", e.target.value)} className="w-full h-10 rounded px-3 border-none outline-none" style={inputStyle}>
              {categoriasBase.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__outra__">✨ Outra</option>
            </select>
            {values.categoria === "__outra__" && (
              <Input value={values.categoriaCustom} onChange={(e) => set("categoriaCustom", e.target.value)} placeholder="Nova categoria..." className="mt-2 border-none" style={inputStyle} />
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={labelStyle}>Descrição</Label>
            <Textarea value={values.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes da meta..." className="resize-none h-20 border-none" style={inputStyle} />
          </div>
          <div className="space-y-1.5">
            <Label style={labelStyle}>Observações / Riscos</Label>
            <Textarea value={values.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Notas adicionais..." className="resize-none h-20 border-none" style={inputStyle} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)} style={{ color: "hsl(var(--pbi-text-secondary))" }}>
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        <Button 
          onClick={step === 3 ? handleSubmit : () => setStep(s => s + 1)}
          style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}
          className="hover:bg-yellow-500"
        >
          {step === 3 ? (initialData ? "Salvar Alterações" : "Criar Meta") : "Próximo"}
        </Button>
      </div>
    </div>
  );
};
