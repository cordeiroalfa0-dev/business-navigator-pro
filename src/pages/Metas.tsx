import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Target, TrendingUp, Award, Plus, X, Pencil, Check, Filter, Calendar,
  ChevronDown, AlertTriangle, BarChart3, Clock, CheckCircle2, XCircle,
  Flame, Trophy, ListChecks, Eye, RefreshCw, Trash2, Users, Zap, MessageSquarePlus,
  History, MessageCircle, ArrowRight, ChevronRight, CircleDot, Activity,
  Layers, GitBranch, FileText, FileSpreadsheet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadialBarChart, RadialBar, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart,
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { subscribe } from "@/store/metasStore";
import MetaFileUpload from "@/components/MetaFileUpload";
import { MetaAcoesKanban } from "@/components/MetaAcoesKanban";
import { useMetaCampos } from "@/hooks/useMetaCampos";
import { useAudit } from "@/hooks/useAudit";
import { CampoCustomizadoSelect } from "@/components/metas/CampoCustomizadoSelect";

interface Meta {
  id: string;
  nome: string;
  atual: number;
  objetivo: number;
  unidade: string;
  cor: string;
  categoria: string;
  responsavel: string;
  prazo: string;
  prioridade: "alta" | "media" | "baixa";
  parent_id: string | null;
  ciclo: string;
  status: "no_prazo" | "atencao" | "em_risco" | "atingida";
  // New extended fields
  descricao: string;
  local_obra: string;
  orcamento: number;
  custo_atual: number;
  equipe: string;
  fornecedor: string;
  etapa: string;
  peso: number;
  tags: string[];
  data_inicio: string | null;
  frequencia_checkin: string;
  risco: string;
  observacoes: string;
  aprovador: string;
  departamento: string;
  tipo_meta: string;
  indicador_chave: string;
  fonte_dados: string;
  impacto: string;
  dependencias: string;
  marco_critico: string;
  percentual_concluido: number;
  campos_extras: Record<string, string>;
}

type MetaTipo = "quantitativa" | "qualitativa";

// All possible toggleable fields organized by section
interface FieldToggles {
  // Progresso
  valores: boolean;
  // Gestão
  responsavel: boolean;
  aprovador: boolean;
  equipe: boolean;
  departamento: boolean;
  // Tempo
  prazo: boolean;
  data_inicio: boolean;
  ciclo: boolean;
  frequencia_checkin: boolean;
  // Financeiro
  orcamento: boolean;
  // Obra/Projeto
  local_obra: boolean;
  etapa: boolean;
  fornecedor: boolean;
  marco_critico: boolean;
  // Detalhes
  descricao: boolean;
  observacoes: boolean;
  risco: boolean;
  impacto: boolean;
  dependencias: boolean;
  // Configuração
  prioridade: boolean;
  peso: boolean;
  tags: boolean;
  indicador_chave: boolean;
  fonte_dados: boolean;
  categoria: boolean;
  metaPai: boolean;
}

const defaultTogglesQuant: FieldToggles = {
  valores: true, responsavel: true, aprovador: false, equipe: false, departamento: false,
  prazo: false, data_inicio: false, ciclo: true, frequencia_checkin: false,
  orcamento: false, local_obra: false, etapa: false, fornecedor: false, marco_critico: false,
  descricao: false, observacoes: false, risco: false, impacto: false, dependencias: false,
  prioridade: true, peso: false, tags: false, indicador_chave: false, fonte_dados: false,
  categoria: true, metaPai: false,
};
const defaultTogglesQual: FieldToggles = {
  valores: false, responsavel: true, aprovador: false, equipe: false, departamento: false,
  prazo: true, data_inicio: false, ciclo: false, frequencia_checkin: false,
  orcamento: false, local_obra: false, etapa: false, fornecedor: false, marco_critico: false,
  descricao: true, observacoes: false, risco: false, impacto: false, dependencias: false,
  prioridade: true, peso: false, tags: false, indicador_chave: false, fonte_dados: false,
  categoria: true, metaPai: false,
};

// Field definitions for the toggle UI, organized by section
const fieldSections = [
  { section: "📊 Progresso", fields: [
    { key: "valores" as keyof FieldToggles, label: "Valores/Progresso", quantOnly: true },
  ]},
  { section: "👤 Gestão", fields: [
    { key: "responsavel" as keyof FieldToggles, label: "Responsável" },
    { key: "aprovador" as keyof FieldToggles, label: "Aprovador" },
    { key: "equipe" as keyof FieldToggles, label: "Equipe" },
    { key: "departamento" as keyof FieldToggles, label: "Departamento" },
  ]},
  { section: "📅 Tempo", fields: [
    { key: "prazo" as keyof FieldToggles, label: "Prazo Final" },
    { key: "data_inicio" as keyof FieldToggles, label: "Data Início" },
    { key: "ciclo" as keyof FieldToggles, label: "Ciclo" },
    { key: "frequencia_checkin" as keyof FieldToggles, label: "Freq. Check-in" },
  ]},
  { section: "💰 Financeiro", fields: [
    { key: "orcamento" as keyof FieldToggles, label: "Orçamento/Custo" },
  ]},
  { section: "🏗️ Obra/Projeto", fields: [
    { key: "local_obra" as keyof FieldToggles, label: "Local/Obra" },
    { key: "etapa" as keyof FieldToggles, label: "Etapa/Fase" },
    { key: "fornecedor" as keyof FieldToggles, label: "Fornecedor" },
    { key: "marco_critico" as keyof FieldToggles, label: "Marco Crítico" },
  ]},
  { section: "📋 Detalhes", fields: [
    { key: "descricao" as keyof FieldToggles, label: "Descrição" },
    { key: "observacoes" as keyof FieldToggles, label: "Observações" },
    { key: "risco" as keyof FieldToggles, label: "Riscos" },
    { key: "impacto" as keyof FieldToggles, label: "Impacto" },
    { key: "dependencias" as keyof FieldToggles, label: "Dependências" },
  ]},
  { section: "⚙️ Configuração", fields: [
    { key: "prioridade" as keyof FieldToggles, label: "Prioridade" },
    { key: "peso" as keyof FieldToggles, label: "Peso" },
    { key: "tags" as keyof FieldToggles, label: "Tags" },
    { key: "indicador_chave" as keyof FieldToggles, label: "Indicador-Chave" },
    { key: "fonte_dados" as keyof FieldToggles, label: "Fonte de Dados" },
    { key: "categoria" as keyof FieldToggles, label: "Categoria" },
    { key: "metaPai" as keyof FieldToggles, label: "Meta Pai" },
  ]},
];

const frequenciasCheckin = ["diário", "semanal", "quinzenal", "mensal"];
const etapasPreset = ["Planejamento", "Fundação", "Estrutura", "Alvenaria", "Elétrica", "Hidráulica", "Acabamento", "Entrega", "Em andamento", "Concluído"];

interface AcaoMeta {
  id: string;
  meta_id: string;
  descricao: string;
  concluida: boolean;
  responsavel: string | null;
  prazo: string | null;
  tipo: "acao" | "contribuicao";
  created_by: string | null;
  imagens: string[];
}

interface CheckIn {
  id: string;
  meta_id: string;
  user_id: string;
  user_name: string;
  valor_anterior: number;
  valor_novo: number;
  comentario: string | null;
  confianca: "no_prazo" | "atencao" | "em_risco";
  created_at: string;
  imagens: string[];
}

const coresMeta = [
  "hsl(207, 89%, 48%)", "hsl(42, 65%, 56%)", "hsl(152, 60%, 38%)",
  "hsl(174, 62%, 47%)", "hsl(0, 72%, 51%)", "hsl(28, 87%, 55%)",
  "hsl(270, 60%, 55%)", "hsl(330, 70%, 50%)",
];

const categoriasBase = ["Financeiro", "Vendas", "Operacional", "Qualidade", "RH", "Engenharia", "Construção", "Projetos"];
const ciclosDisponiveis = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Anual 2026"];
const unidadesPreset = [
  { value: "R$", label: "R$ (Reais)" },
  { value: "%", label: "% (Percentual)" },
  { value: "dias", label: "Dias" },
  { value: "un", label: "Unidades" },
  { value: "horas", label: "Horas" },
  { value: "m²", label: "m² (Metros²)" },
  { value: "kg", label: "Kg" },
  { value: "tarefas", label: "Tarefas" },
];

const prioridadeConfig = {
  alta: { label: "Alta", color: "hsl(0, 72%, 51%)", bg: "hsl(0, 72%, 51%, 0.12)", icon: Flame },
  media: { label: "Média", color: "hsl(42, 65%, 56%)", bg: "hsl(45, 100%, 51%, 0.12)", icon: AlertTriangle },
  baixa: { label: "Baixa", color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.12)", icon: Clock },
};

const statusConfig = {
  no_prazo: { label: "No Prazo", color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.12)", icon: CheckCircle2 },
  atencao: { label: "Atenção", color: "hsl(42, 65%, 56%)", bg: "hsl(45, 100%, 51%, 0.12)", icon: AlertTriangle },
  em_risco: { label: "Em Risco", color: "hsl(0, 72%, 51%)", bg: "hsl(0, 72%, 51%, 0.12)", icon: XCircle },
  atingida: { label: "Atingida", color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.12)", icon: Trophy },
};

const PBITile = ({ children, title, className = "", actions }: { children: React.ReactNode; title?: string; className?: string; actions?: React.ReactNode }) => (
  <div className={`pbi-tile ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        {title && <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>}
        {actions}
      </div>
    )}
    {children}
  </div>
);

const FileThumbnail = ({ url }: { url: string }) => {
  const isPdf = /\.pdf(\?|$)/i.test(url);
  const isExcel = /\.(xlsx|xls)(\?|$)/i.test(url);
  const isImg = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  if (isImg) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="" className="w-8 h-8 rounded object-cover" style={{ border: "1px solid hsl(var(--pbi-border))" }} />
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="w-8 h-8 rounded flex items-center justify-center"
      style={{ border: "1px solid hsl(var(--pbi-border))", background: "hsl(var(--pbi-dark))" }}
      title={isPdf ? "PDF" : isExcel ? "Excel" : "Arquivo"}
    >
      {isPdf ? <FileText className="w-4 h-4" style={{ color: "hsl(0, 72%, 51%)" }} /> :
       isExcel ? <FileSpreadsheet className="w-4 h-4" style={{ color: "hsl(152, 60%, 38%)" }} /> :
       <FileText className="w-4 h-4" style={{ color: "hsl(var(--pbi-text-secondary))" }} />}
    </a>
  );
};
// Helper to render all dynamic fields based on toggles
const inputStyle = { background: "hsl(var(--card))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" };
const labelStyle = { color: "hsl(var(--muted-foreground))" };

function renderDynamicFields(
  toggles: FieldToggles,
  values: Record<string, string>,
  setValues: (v: Record<string, string>) => void,
  categorias: string[],
  metas: Meta[],
  editingId: string | null,
  campos?: {
    ciclos?: string[];
    etapas?: string[];
    adicionarCampo?: (tipo: import("@/hooks/useMetaCampos").TipoCampo, valor: string, label?: string) => Promise<boolean>;
    removerCampo?: (id: string, valor: string) => Promise<boolean>;
    customPorTipo?: (tipo: import("@/hooks/useMetaCampos").TipoCampo) => import("@/hooks/useMetaCampos").CampoCustomizado[];
  },
  usuariosDisponiveis?: { id: string; full_name: string; email: string }[],
) {
  const set = (key: string, val: string) => setValues({ ...values, [key]: val });
  const fields: React.ReactNode[] = [];

  // Row 1: Gestão
  const gestaoFields: React.ReactNode[] = [];
  if (toggles.responsavel) gestaoFields.push(
    <div key="resp" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Responsável</Label>
      {usuariosDisponiveis && usuariosDisponiveis.length > 0 ? (
        <select
          value={values.responsavel_id || ""}
          onChange={(e) => {
            const uid = e.target.value;
            const u = usuariosDisponiveis.find(u => u.id === uid);
            set("responsavel_id", uid);
            set("responsavel", u?.full_name || u?.email || "");
          }}
          className="w-full h-8 px-2 rounded text-[12px] border-none focus:outline-none"
          style={inputStyle}
        >
          <option value="">— Sem responsável —</option>
          {usuariosDisponiveis.map(u => (
            <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
          ))}
        </select>
      ) : (
        <Input value={values.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Nome" className="h-8 text-[12px] border-none" style={inputStyle} />
      )}
    </div>
  );
  if (toggles.aprovador) gestaoFields.push(
    <div key="aprov" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Aprovador</Label>
      <Input value={values.aprovador} onChange={(e) => set("aprovador", e.target.value)} placeholder="Quem aprova" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.equipe) gestaoFields.push(
    <div key="equipe" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Equipe</Label>
      <Input value={values.equipe} onChange={(e) => set("equipe", e.target.value)} placeholder="Membros da equipe" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.departamento) gestaoFields.push(
    <div key="depto" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Departamento</Label>
      <Input value={values.departamento} onChange={(e) => set("departamento", e.target.value)} placeholder="Setor" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (gestaoFields.length > 0) fields.push(
    <div key="gestao" className="grid grid-cols-1 sm:grid-cols-3 gap-3">{gestaoFields}</div>
  );

  // Row 2: Config (prioridade, categoria, ciclo)
  const cfgFields: React.ReactNode[] = [];
  if (toggles.prioridade) cfgFields.push(
    <div key="prio" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Prioridade</Label>
      <select value={values.prioridade} onChange={(e) => set("prioridade", e.target.value)} className="w-full h-8 rounded text-[12px] px-2 border-none outline-none" style={inputStyle}>
        <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🔵 Baixa</option>
      </select>
    </div>
  );
  if (toggles.categoria) cfgFields.push(
    <div key="cat" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Categoria</Label>
      {campos?.adicionarCampo ? (
        <CampoCustomizadoSelect
          tipo="categoria"
          value={values.categoria}
          onChange={(val) => setValues({ ...values, categoria: val, categoriaCustom: "" })}
          options={categorias.map((c) => ({ value: c, label: c }))}
          style={inputStyle}
          className="w-full"
        />
      ) : (
        <select value={values.categoria} onChange={(e) => setValues({ ...values, categoria: e.target.value, categoriaCustom: "" })} className="w-full h-8 rounded text-[12px] px-2 border-none outline-none" style={inputStyle}>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__outra__">✨ Outra</option>
        </select>
      )}
      {values.categoria === "__outra__" && (
        <Input value={values.categoriaCustom} onChange={(e) => set("categoriaCustom", e.target.value)} placeholder="Nova categoria..." maxLength={40} className="h-7 text-[11px] border-none mt-1" style={inputStyle} />
      )}
    </div>
  );
  if (toggles.ciclo) cfgFields.push(
    <div key="ciclo" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Ciclo</Label>
      {campos?.adicionarCampo ? (
        <CampoCustomizadoSelect
          tipo="ciclo"
          value={values.ciclo}
          onChange={(val) => set("ciclo", val)}
          options={(campos.ciclos || ciclosDisponiveis).map((c) => ({ value: c, label: c }))}
          style={inputStyle}
          className="w-full"
        />
      ) : (
        <select value={values.ciclo} onChange={(e) => set("ciclo", e.target.value)} className="w-full h-8 rounded text-[12px] px-2 border-none outline-none" style={inputStyle}>
          {ciclosDisponiveis.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
    </div>
  );
  if (cfgFields.length > 0) fields.push(
    <div key="cfg" className="grid grid-cols-1 sm:grid-cols-3 gap-3">{cfgFields}</div>
  );

  // Row 3: Tempo
  const tempoFields: React.ReactNode[] = [];
  if (toggles.data_inicio) tempoFields.push(
    <div key="di" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Data Início</Label>
      <Input type="date" value={values.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.prazo) tempoFields.push(
    <div key="prazo" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Prazo Final</Label>
      <Input type="date" value={values.prazo} onChange={(e) => set("prazo", e.target.value)} className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.frequencia_checkin) tempoFields.push(
    <div key="freq" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Frequência Check-in</Label>
      <select value={values.frequencia_checkin} onChange={(e) => set("frequencia_checkin", e.target.value)} className="w-full h-8 rounded text-[12px] px-2 border-none outline-none" style={inputStyle}>
        {frequenciasCheckin.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
      </select>
    </div>
  );
  if (tempoFields.length > 0) fields.push(
    <div key="tempo" className="grid grid-cols-1 sm:grid-cols-3 gap-3">{tempoFields}</div>
  );

  // Row 4: Financeiro
  if (toggles.orcamento) fields.push(
    <div key="fin" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-[11px]" style={labelStyle}>Orçamento (R$)</Label>
        <Input type="number" value={values.orcamento} onChange={(e) => set("orcamento", e.target.value)} placeholder="0" className="h-8 text-[12px] border-none" style={inputStyle} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px]" style={labelStyle}>Custo Atual (R$)</Label>
        <Input type="number" value={values.custo_atual} onChange={(e) => set("custo_atual", e.target.value)} placeholder="0" className="h-8 text-[12px] border-none" style={inputStyle} />
      </div>
    </div>
  );

  // Row 5: Obra/Projeto
  const obraFields: React.ReactNode[] = [];
  if (toggles.local_obra) obraFields.push(
    <div key="local" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Local / Obra</Label>
      <Input value={values.local_obra} onChange={(e) => set("local_obra", e.target.value)} placeholder="Endereço ou nome da obra" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.etapa) obraFields.push(
    <div key="etapa" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Etapa / Fase</Label>
      {campos?.adicionarCampo ? (
        <CampoCustomizadoSelect
          tipo="etapa"
          value={values.etapa}
          onChange={(val) => set("etapa", val)}
          options={(campos.etapas || etapasPreset).map((e) => ({ value: e, label: e }))}
          emptyOption
          style={inputStyle}
          className="w-full"
        />
      ) : (
        <select value={values.etapa} onChange={(e) => set("etapa", e.target.value)} className="w-full h-8 rounded text-[12px] px-2 border-none outline-none" style={inputStyle}>
          <option value="">Selecione...</option>
          {etapasPreset.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      )}
    </div>
  );
  if (toggles.fornecedor) obraFields.push(
    <div key="forn" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Fornecedor</Label>
      <Input value={values.fornecedor} onChange={(e) => set("fornecedor", e.target.value)} placeholder="Nome do fornecedor" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.marco_critico) obraFields.push(
    <div key="marco" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Marco Crítico</Label>
      <Input value={values.marco_critico} onChange={(e) => set("marco_critico", e.target.value)} placeholder="Próximo marco importante" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (obraFields.length > 0) fields.push(
    <div key="obra" className="grid grid-cols-1 sm:grid-cols-2 gap-3">{obraFields}</div>
  );

  // Row 6: Textos longos
  if (toggles.observacoes) fields.push(
    <div key="obs" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Observações</Label>
      <Textarea value={values.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Notas adicionais..." className="resize-none h-14 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.risco) fields.push(
    <div key="risco" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Riscos</Label>
      <Textarea value={values.risco} onChange={(e) => set("risco", e.target.value)} placeholder="Riscos identificados..." className="resize-none h-14 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.impacto) fields.push(
    <div key="impacto" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Impacto</Label>
      <Input value={values.impacto} onChange={(e) => set("impacto", e.target.value)} placeholder="Impacto esperado" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.dependencias) fields.push(
    <div key="dep" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Dependências</Label>
      <Input value={values.dependencias} onChange={(e) => set("dependencias", e.target.value)} placeholder="O que depende disso?" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );

  // Row 7: Avançados
  const advFields: React.ReactNode[] = [];
  if (toggles.peso) advFields.push(
    <div key="peso" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Peso (0-100)</Label>
      <Input type="number" value={values.peso} onChange={(e) => set("peso", e.target.value)} placeholder="0" min="0" max="100" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.tags) advFields.push(
    <div key="tags" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Tags (separadas por vírgula)</Label>
      <Input value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="urgente, fase1, obra-sp" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.indicador_chave) advFields.push(
    <div key="kpi" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Indicador-Chave (KPI)</Label>
      <Input value={values.indicador_chave} onChange={(e) => set("indicador_chave", e.target.value)} placeholder="Ex: NPS, ROI, CAC" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.fonte_dados) advFields.push(
    <div key="fonte" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Fonte de Dados</Label>
      <Input value={values.fonte_dados} onChange={(e) => set("fonte_dados", e.target.value)} placeholder="De onde vem a informação" className="h-8 text-[12px] border-none" style={inputStyle} />
    </div>
  );
  if (toggles.metaPai) advFields.push(
    <div key="pai" className="space-y-1.5">
      <Label className="text-[11px]" style={labelStyle}>Meta Pai (cascata)</Label>
      <select value={values.parent_id} onChange={(e) => set("parent_id", e.target.value)} className="w-full h-8 rounded text-[12px] px-2 border-none outline-none" style={inputStyle}>
        <option value="">Nenhuma (meta raiz)</option>
        {metas.filter(m => m.id !== editingId && !m.parent_id).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
      </select>
    </div>
  );
  if (advFields.length > 0) fields.push(
    <div key="adv" className="grid grid-cols-1 sm:grid-cols-2 gap-3">{advFields}</div>
  );

  return <>{fields}</>;
}

// Seção de campos extras (personalizados) nos toggles do formulário
interface CampoExtraToggleSectionProps {
  camposExtras: import("@/hooks/useMetaCampos").CampoCustomizado[];
  ativosMap: Record<string, boolean>;
  onToggle: (chave: string) => void;
  onAdicionar: (label: string) => Promise<boolean | void>;
  onRemover: (id: string, label: string) => Promise<boolean | void>;
}

function CampoExtraToggleSection({ camposExtras, ativosMap, onToggle, onAdicionar, onRemover }: CampoExtraToggleSectionProps) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [novoLabel, setNovoLabel] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const handleAdd = async () => {
    if (!novoLabel.trim()) return;
    setSaving(true);
    const ok = await onAdicionar(novoLabel.trim());
    if (ok !== false) { setNovoLabel(""); setShowAdd(false); }
    setSaving(false);
  };

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1">➕ Personalizados</p>
      <div className="flex flex-wrap gap-1">
        {camposExtras.map((campo) => (
          <div key={campo.id} className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onToggle(campo.valor)}
              className="text-[10px] px-2 py-1 rounded font-medium transition-all"
              style={{
                background: ativosMap[campo.valor] ? "hsl(152, 60%, 38%, 0.15)" : "hsl(var(--pbi-dark))",
                color: ativosMap[campo.valor] ? "hsl(152, 60%, 38%)" : "hsl(var(--pbi-text-secondary))",
                border: `1px solid ${ativosMap[campo.valor] ? "hsl(152, 60%, 38%, 0.4)" : "hsl(var(--pbi-border))"}`,
              }}
            >
              {ativosMap[campo.valor] ? "✓ " : ""}{campo.label || campo.valor}
            </button>
            <button
              type="button"
              onClick={() => onRemover(campo.id, campo.label || campo.valor)}
              className="text-[9px] px-1 py-0.5 rounded opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: "hsl(var(--pbi-text-secondary))" }}
              title="Remover campo"
            >✕</button>
          </div>
        ))}

        {/* Botão + para adicionar novo campo */}
        <button
          type="button"
          onClick={() => setShowAdd(v => !v)}
          className="text-[10px] px-2 py-1 rounded font-medium transition-all flex items-center gap-1"
          style={{
            background: "hsl(var(--pbi-yellow) / 0.15)",
            color: "hsl(var(--pbi-yellow))",
            border: "1px dashed hsl(var(--pbi-yellow) / 0.5)",
          }}
        >
          + Novo campo
        </button>
      </div>

      {showAdd && (
        <div className="mt-2 flex gap-2 items-center">
          <Input
            value={novoLabel}
            onChange={(e) => setNovoLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do campo (ex: Observação Técnica)"
            className="h-7 text-[11px] border-none flex-1"
            style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }}
            maxLength={50}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !novoLabel.trim()}
            className="h-7 px-3 rounded text-[11px] font-medium"
            style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "..." : "Criar"}
          </button>
          <button
            type="button"
            onClick={() => { setShowAdd(false); setNovoLabel(""); }}
            className="h-7 px-2 rounded text-[11px]"
            style={{ color: "hsl(var(--pbi-text-secondary))" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function Metas() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const { user, profile, canEditMetas, userRole } = useAuth();
  const metaCampos = useMetaCampos();
  const { registrar: registrarAudit } = useAudit();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [acoes, setAcoes] = useState<AcaoMeta[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acaoDialogOpen, setAcaoDialogOpen] = useState(false);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [timelineMetaId, setTimelineMetaId] = useState<string | null>(null);
  const [acaoMetaId, setAcaoMetaId] = useState<string | null>(null);
  const [checkinMetaId, setCheckinMetaId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({
    nome: "", atual: "", objetivo: "", unidade: "", categoria: "Financeiro", categoriaCustom: "",
    responsavel: "", prioridade: "media", ciclo: "Q1 2026", parent_id: "", prazo: "",
    descricao: "", local_obra: "", orcamento: "", custo_atual: "", equipe: "", fornecedor: "",
    etapa: "", peso: "", tags: "", data_inicio: "", frequencia_checkin: "semanal",
    risco: "", observacoes: "", aprovador: "", departamento: "", indicador_chave: "",
    fonte_dados: "", impacto: "", dependencias: "", marco_critico: "", obra_id: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newMetaTipo, setNewMetaTipo] = useState<MetaTipo>("quantitativa");
  const [newMetaToggles, setNewMetaToggles] = useState<FieldToggles>(defaultTogglesQuant);
  const [editMetaTipo, setEditMetaTipo] = useState<MetaTipo>("quantitativa");
  const [editMetaToggles, setEditMetaToggles] = useState<FieldToggles>(defaultTogglesQuant);
  // Toggles para campos extras (chave = valor do campo, boolean)
  const [newCamposExtrasAtivos, setNewCamposExtrasAtivos] = useState<Record<string, boolean>>({});
  const [editCamposExtrasAtivos, setEditCamposExtrasAtivos] = useState<Record<string, boolean>>({});
  const [newMeta, setNewMeta] = useState<Record<string, string>>({
    nome: "", atual: "", objetivo: "", unidade: "", categoria: "Financeiro", categoriaCustom: "",
    responsavel: "", prioridade: "media", ciclo: "Q1 2026", parent_id: "", descricao: "",
    local_obra: "", orcamento: "", custo_atual: "", equipe: "", fornecedor: "",
    etapa: "", peso: "", tags: "", data_inicio: "", frequencia_checkin: "semanal",
    risco: "", observacoes: "", aprovador: "", departamento: "", indicador_chave: "",
    fonte_dados: "", impacto: "", dependencias: "", marco_critico: "", obra_id: "",
  });

  // Obras disponíveis para vínculo
  const [obrasDisponiveis, setObrasDisponiveis] = useState<{ id: string; nome: string; etapa_atual: string }[]>([]);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [sugestoesFase, setSugestoesFase]   = useState<any[]>([]);
  const [selSugNew,     setSelSugNew]       = useState<Record<string, boolean>>({});
  const [valSugNew,     setValSugNew]       = useState<Record<string, string>>({});
  const [selSugEdit,    setSelSugEdit]      = useState<Record<string, boolean>>({});
  const [valSugEdit,    setValSugEdit]      = useState<Record<string, string>>({});

  // Dynamic categories: base + custom from Supabase + any from existing metas
  const categorias = useMemo(() => {
    const fromCampos = metaCampos.categorias;
    const fromMetas = metas.map(m => m.categoria).filter(c => c && !fromCampos.includes(c));
    return [...fromCampos, ...Array.from(new Set(fromMetas))];
  }, [metas, metaCampos.categorias]);
  const [newAcao, setNewAcao] = useState({ descricao: "", responsavel: "", prazo: "", imagens: [] as string[] });
  const [newCheckin, setNewCheckin] = useState({ valor: "", comentario: "", confianca: "no_prazo" as CheckIn["confianca"], imagens: [] as string[] });
  const [activeTab, setActiveTab] = useState<"editor" | "analytics" | "ranking" | "acoes" | "timeline" | "historico">(canEditMetas ? "editor" : "acoes");
  const [historyMeta, setHistoryMeta] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");
  const [filtroCiclo, setFiltroCiclo] = useState("Todos");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async (metaId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("metas_history")
      .select("*")
      .eq("meta_id", metaId)
      .order("edited_at", { ascending: false })
      .limit(50);
    setHistoryMeta(data ?? []);
    setLoadingHistory(false);
  }, []);

  const fetchMetas = useCallback(async () => {
    const { data, error } = await supabase.from("metas").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setMetas(data.map((m: any) => ({
        id: m.id, nome: m.nome, atual: Number(m.atual), objetivo: Number(m.objetivo), responsavel_id: (m as any).responsavel_id ?? '',
        unidade: m.unidade, cor: m.cor, categoria: m.categoria, responsavel: m.responsavel,
        prazo: m.prazo, prioridade: m.prioridade as Meta["prioridade"],
        parent_id: m.parent_id ?? null, ciclo: m.ciclo ?? "Q1 2026",
        status: m.status ?? "no_prazo",
        descricao: m.descricao ?? "", local_obra: m.local_obra ?? "",
        orcamento: Number(m.orcamento ?? 0), custo_atual: Number(m.custo_atual ?? 0),
        equipe: m.equipe ?? "", fornecedor: m.fornecedor ?? "",
        etapa: m.etapa ?? "", peso: Number(m.peso ?? 0),
        tags: m.tags ?? [], data_inicio: m.data_inicio ?? null,
        frequencia_checkin: m.frequencia_checkin ?? "semanal",
        risco: m.risco ?? "", observacoes: m.observacoes ?? "",
        aprovador: m.aprovador ?? "", departamento: m.departamento ?? "",
        tipo_meta: m.tipo_meta ?? "quantitativa",
        indicador_chave: m.indicador_chave ?? "", fonte_dados: m.fonte_dados ?? "",
        impacto: m.impacto ?? "", dependencias: m.dependencias ?? "",
        marco_critico: m.marco_critico ?? "", percentual_concluido: Number(m.percentual_concluido ?? 0),
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

  useEffect(() => {
    fetchMetas(); fetchAcoes(); fetchCheckins();
    // Carrega obras e sugestões de fase
    supabase.from("execucao_obras" as any)
      .select("id,nome,etapa_atual")
      .order("nome", { ascending: true })
      .then(({ data }) => { if (data) setObrasDisponiveis(data as any); });
    supabase.from("metas_sugestoes_fase" as any)
      .select("*").eq("ativo", true).order("ordem")
      .then(({ data }) => { if (data) setSugestoesFase(data as any[]); });
    // Carregar perfis de usuários para o select de responsável
    supabase.from("profiles").select("id, full_name, email").order("full_name")
      .then(({ data }) => { if (data) setUsuariosDisponiveis(data as any[]); });
  }, [fetchMetas, fetchAcoes, fetchCheckins]);
  // Fase 1 — Store centralizado: um único canal Supabase para as 3 tabelas
  // Elimina subscriptions duplicadas ao remontar
  useEffect(() => {
    const unsub1 = subscribe("metas",         fetchMetas);
    const unsub2 = subscribe("acoes_meta",    fetchAcoes);
    const unsub3 = subscribe("meta_checkins", fetchCheckins);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [fetchMetas, fetchAcoes, fetchCheckins]);

  useEffect(() => {
    if (canEditMetas) setActiveTab("editor");
    else setActiveTab("acoes");
  }, [canEditMetas]);

  const addMeta = async () => {
    if (!newMeta.nome) {
      toast({ title: "Preencha o nome da meta", variant: "destructive" });
      return;
    }
    // objetivo não é mais obrigatório — se vazio usa padrão inteligente por unidade
    const categoriaFinal = !newMetaToggles.categoria ? "Geral" : newMeta.categoria === "__outra__" ? newMeta.categoriaCustom.trim() : newMeta.categoria;
    setSaving(true);
    const cor = coresMeta[metas.length % coresMeta.length];
    const isQual = newMetaTipo === "qualitativa" || !newMetaToggles.valores;
    const { error } = await supabase.from("metas").insert({
      nome: newMeta.nome,
      atual: isQual ? 0 : (parseFloat(newMeta.atual) || 0),
      objetivo: isQual ? 1 : (parseFloat(newMeta.objetivo) || (newMeta.unidade === "%" ? 100 : 0)),
      unidade: isQual ? "texto" : newMeta.unidade,
      cor,
      categoria: categoriaFinal || "Geral",
      responsavel: newMetaToggles.responsavel ? newMeta.responsavel : "",
      prioridade: newMetaToggles.prioridade ? (newMeta.prioridade || "media") : "media",
      created_by: user?.id,
      ciclo: newMetaToggles.ciclo ? newMeta.ciclo : "Q1 2026",
      parent_id: newMetaToggles.metaPai ? (newMeta.parent_id || null) : null,
      tipo_meta: newMetaTipo,
      descricao: newMetaToggles.descricao ? newMeta.descricao : "",
      local_obra: newMetaToggles.local_obra ? newMeta.local_obra : "",
      orcamento: newMetaToggles.orcamento ? (parseFloat(newMeta.orcamento) || 0) : 0,
      custo_atual: newMetaToggles.orcamento ? (parseFloat(newMeta.custo_atual) || 0) : 0,
      equipe: newMetaToggles.equipe ? newMeta.equipe : "",
      fornecedor: newMetaToggles.fornecedor ? newMeta.fornecedor : "",
      etapa: newMetaToggles.etapa ? newMeta.etapa : "",
      peso: newMetaToggles.peso ? (parseFloat(newMeta.peso) || 0) : 0,
      tags: newMetaToggles.tags ? (newMeta.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      data_inicio: newMetaToggles.data_inicio ? (newMeta.data_inicio || null) : null,
      frequencia_checkin: newMetaToggles.frequencia_checkin ? (newMeta.frequencia_checkin || "semanal") : "semanal",
      risco: newMetaToggles.risco ? newMeta.risco : "",
      observacoes: newMetaToggles.observacoes ? newMeta.observacoes : "",
      aprovador: newMetaToggles.aprovador ? newMeta.aprovador : "",
      departamento: newMetaToggles.departamento ? newMeta.departamento : "",
      indicador_chave: newMetaToggles.indicador_chave ? newMeta.indicador_chave : "",
      fonte_dados: newMetaToggles.fonte_dados ? newMeta.fonte_dados : "",
      impacto: newMetaToggles.impacto ? newMeta.impacto : "",
      dependencias: newMetaToggles.dependencias ? newMeta.dependencias : "",
      marco_critico: newMetaToggles.marco_critico ? newMeta.marco_critico : "",
      obra_id: newMeta.obra_id || null,
      responsavel_id: newMeta.responsavel_id || null,
      campos_extras: Object.fromEntries(
        metaCampos.camposExtras
          .filter(c => newCamposExtrasAtivos[c.valor] && newMeta[c.valor])
          .map(c => [c.valor, newMeta[c.valor]])
      ),
    });
    if (error) { toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" }); return; }

    // Auditoria — INSERT
    registrarAudit({ table_name: "metas", record_id: "novo", action: "INSERT", new_values: { nome: newMeta.nome, categoria: newMeta.categoria } });

    // Criar metas sugeridas selecionadas (se obra vinculada)
    if (newMeta.obra_id) {
      const obra = obrasDisponiveis.find(o => o.id === newMeta.obra_id);
      const sugs = sugestoesFase.filter(s => s.fase === obra?.etapa_atual && selSugNew[s.id]);
      if (sugs.length > 0) {
        const coresMeta = ["hsl(207,89%,48%)","hsl(42, 65%, 56%)","hsl(152,60%,38%)","hsl(174,62%,47%)","hsl(0,72%,51%)","hsl(28,87%,55%)","hsl(270,60%,55%)","hsl(330,70%,50%)"];
        const extras = sugs.map((s: any, idx: number) => ({
          nome: s.nome, atual: 0,
          objetivo: valSugNew[s.id] ? parseFloat(valSugNew[s.id]) : (s.unidade === "%" ? 100 : s.objetivo),
          unidade: s.unidade, cor: coresMeta[idx % coresMeta.length],
          categoria: s.categoria, responsavel: newMeta.responsavel || "",
          prioridade: s.prioridade, ciclo: newMeta.ciclo || "Q1 2026",
          status: "no_prazo", descricao: s.descricao,
          local_obra: obra?.nome || "", etapa: obra?.etapa_atual || "",
          obra_id: newMeta.obra_id, created_by: user?.id, tipo_meta: "quantitativa",
          prazo: newMeta.prazo || null,
        }));
        await supabase.from("metas").insert(extras);
        toast({ title: "Meta criada!", description: `+ ${sugs.length} meta${sugs.length > 1 ? "s" : ""} da fase criada${sugs.length > 1 ? "s" : ""}` });
      } else {
        toast({ title: "Meta criada!" });
      }
    } else {
      toast({ title: "Meta criada!" });
    }

    setSaving(false);
    setSelSugNew({}); setValSugNew({});
    setNewMeta({ nome: "", atual: "", objetivo: "", unidade: "", categoria: "Financeiro", categoriaCustom: "", responsavel: "", prioridade: "media", ciclo: "Q1 2026", parent_id: "", descricao: "", local_obra: "", orcamento: "", custo_atual: "", equipe: "", fornecedor: "", etapa: "", peso: "", tags: "", data_inicio: "", frequencia_checkin: "semanal", risco: "", observacoes: "", aprovador: "", departamento: "", indicador_chave: "", fonte_dados: "", impacto: "", dependencias: "", marco_critico: "", obra_id: "" });
    setDialogOpen(false);
  };

  const saveEdit = async (id: string) => {
    const meta = metas.find(m => m.id === id);
    const isQual = editMetaTipo === "qualitativa" || !editMetaToggles.valores;
    const novoValor = isQual ? 0 : (parseFloat(editValues.atual) || 0);
    const novoObj = isQual ? 1 : (parseFloat(editValues.objetivo) || (editValues.unidade === "%" ? 100 : 0));
    const categoriaFinal = !editMetaToggles.categoria ? (meta?.categoria || "Geral") : editValues.categoria === "__outra__" ? editValues.categoriaCustom.trim() : editValues.categoria;
    // Auto-calculate status with deadline-based predictive risk
    const pct = isQual ? 0 : (novoValor / novoObj) * 100;
    let newStatus: Meta["status"] = "no_prazo";
    if (!isQual) {
      if (pct >= 100) newStatus = "atingida";
      else if (pct < 30) newStatus = "em_risco";
      else if (pct < 60) newStatus = "atencao";
    }
    // Prazo vencido e meta nao atingida -> forcado em_risco (status preditivo)
    if (newStatus !== "atingida" && editMetaToggles.prazo && editValues.prazo) {
      const prazoDate = new Date(editValues.prazo);
      prazoDate.setHours(23, 59, 59, 999);
      if (prazoDate < new Date() && pct < 100) newStatus = "em_risco";
    }

    const { error } = await supabase.from("metas").update({
      nome: editValues.nome,
      atual: novoValor,
      objetivo: novoObj,
      unidade: isQual ? "texto" : editValues.unidade,
      categoria: categoriaFinal || "Geral",
      responsavel: editMetaToggles.responsavel ? editValues.responsavel : "",
      prioridade: editMetaToggles.prioridade ? (editValues.prioridade || "media") : "media",
      ciclo: editMetaToggles.ciclo ? editValues.ciclo : meta?.ciclo || "Q1 2026",
      parent_id: editMetaToggles.metaPai ? (editValues.parent_id || null) : null,
      prazo: editMetaToggles.prazo ? (editValues.prazo || null) : null,
      status: newStatus,
      tipo_meta: editMetaTipo,
      descricao: editMetaToggles.descricao ? editValues.descricao : "",
      local_obra: editMetaToggles.local_obra ? editValues.local_obra : "",
      orcamento: editMetaToggles.orcamento ? (parseFloat(editValues.orcamento) || 0) : 0,
      custo_atual: editMetaToggles.orcamento ? (parseFloat(editValues.custo_atual) || 0) : 0,
      equipe: editMetaToggles.equipe ? editValues.equipe : "",
      fornecedor: editMetaToggles.fornecedor ? editValues.fornecedor : "",
      etapa: editMetaToggles.etapa ? editValues.etapa : "",
      peso: editMetaToggles.peso ? (parseFloat(editValues.peso) || 0) : 0,
      tags: editMetaToggles.tags ? (editValues.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      data_inicio: editMetaToggles.data_inicio ? (editValues.data_inicio || null) : null,
      frequencia_checkin: editMetaToggles.frequencia_checkin ? (editValues.frequencia_checkin || "semanal") : "semanal",
      risco: editMetaToggles.risco ? editValues.risco : "",
      observacoes: editMetaToggles.observacoes ? editValues.observacoes : "",
      aprovador: editMetaToggles.aprovador ? editValues.aprovador : "",
      departamento: editMetaToggles.departamento ? editValues.departamento : "",
      indicador_chave: editMetaToggles.indicador_chave ? editValues.indicador_chave : "",
      fonte_dados: editMetaToggles.fonte_dados ? editValues.fonte_dados : "",
      impacto: editMetaToggles.impacto ? editValues.impacto : "",
      dependencias: editMetaToggles.dependencias ? editValues.dependencias : "",
      marco_critico: editMetaToggles.marco_critico ? editValues.marco_critico : "",
      obra_id: editValues.obra_id || null,
      campos_extras: Object.fromEntries(
        metaCampos.camposExtras
          .filter(c => editCamposExtrasAtivos[c.valor] && editValues[c.valor])
          .map(c => [c.valor, editValues[c.valor]])
      ),
    }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }

    // Auto check-in when editor updates value (only for quantitative)
    if (!isQual && meta && novoValor !== meta.atual) {
      await supabase.from("meta_checkins").insert({
        meta_id: id, user_id: user!.id,
        user_name: profile?.full_name || user?.email || "—",
        valor_anterior: meta.atual, valor_novo: novoValor,
        comentario: `Atualização de progresso: ${meta.atual} → ${novoValor}`,
        confianca: newStatus === "atingida" ? "no_prazo" : newStatus === "em_risco" ? "em_risco" : "no_prazo",
      });
    }
    setEditingId(null);
    setEditDialogOpen(false);
    toast({ title: "Meta atualizada!" });
  };

  const removeMeta = async (id: string) => {
    if (!(await confirm({ message: "Excluir esta meta? Esta ação não pode ser desfeita.", title: "Excluir Meta", confirmLabel: "Excluir", variant: "danger" }))) return;
    await supabase.from("metas").delete().eq("id", id);
    toast({ title: "Meta removida" });
  };

  const addAcao = async (tipo: "acao" | "contribuicao" = "acao") => {
    if (!newAcao.descricao || !acaoMetaId) return;
    const { error } = await supabase.from("acoes_meta").insert({
      meta_id: acaoMetaId, descricao: newAcao.descricao,
      responsavel: newAcao.responsavel || null, prazo: newAcao.prazo || null,
      tipo, created_by: user?.id, imagens: newAcao.imagens,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewAcao({ descricao: "", responsavel: "", prazo: "", imagens: [] });
    setAcaoDialogOpen(false);
    toast({ title: tipo === "contribuicao" ? "Contribuição adicionada!" : "Ação adicionada!" });
  };

  const toggleAcao = async (acao: AcaoMeta) => {
    await supabase.from("acoes_meta").update({ concluida: !acao.concluida }).eq("id", acao.id);
  };

  const removeAcao = async (id: string) => {
    if (!(await confirm({ message: "Excluir esta ação/contribuição?", title: "Excluir Ação", confirmLabel: "Excluir", variant: "danger" }))) return;
    await supabase.from("acoes_meta").delete().eq("id", id);
    toast({ title: "Ação removida" });
  };

  const removeCheckin = async (id: string) => {
    if (!(await confirm({ message: "Excluir este check-in?", title: "Excluir Check-in", confirmLabel: "Excluir", variant: "danger" }))) return;
    await supabase.from("meta_checkins").delete().eq("id", id);
    toast({ title: "Check-in removido" });
  };

  // Toggle conclusion for qualitative metas
  const toggleQualMeta = async (meta: Meta) => {
    const isAtingida = meta.status === 'atingida';
    const novoStatus = isAtingida ? 'no_prazo' : 'atingida';
    await supabase.from('metas').update({ status: novoStatus }).eq('id', meta.id);
    toast({ title: isAtingida ? 'Meta desmarcada como concluída' : 'Meta qualitativa concluída!' });
  };

  const addCheckin = async () => {
    if (!checkinMetaId || !newCheckin.comentario) {
      toast({ title: "Adicione um comentário", variant: "destructive" });
      return;
    }
    const meta = metas.find(m => m.id === checkinMetaId);
    if (!meta) return;
    const novoValor = newCheckin.valor ? parseFloat(newCheckin.valor) : meta.atual;

    const { error } = await supabase.from("meta_checkins").insert({
      meta_id: checkinMetaId, user_id: user!.id,
      user_name: profile?.full_name || user?.email || "—",
      valor_anterior: meta.atual, valor_novo: novoValor,
      comentario: newCheckin.comentario, confianca: newCheckin.confianca,
      imagens: newCheckin.imagens,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }

    // Update meta value and status if changed
    if (novoValor !== meta.atual) {
      const pct = meta.objetivo > 0 ? (novoValor / meta.objetivo) * 100 : 0;
      let st: Meta["status"] = newCheckin.confianca === "em_risco" ? "em_risco" : newCheckin.confianca === "atencao" ? "atencao" : pct >= 100 ? "atingida" : "no_prazo";
      await supabase.from("metas").update({ atual: novoValor, status: st }).eq("id", checkinMetaId);
    }

    setNewCheckin({ valor: "", comentario: "", confianca: "no_prazo", imagens: [] });
    setCheckinDialogOpen(false);
    toast({ title: "Check-in registrado!" });
  };

  // Filtered metas
  const filteredMetas = metas.filter((m) => {
    if (filtroCategoria !== "Todas" && m.categoria !== filtroCategoria) return false;
    if (filtroPrioridade !== "Todas" && m.prioridade !== filtroPrioridade) return false;
    if (filtroCiclo !== "Todos" && m.ciclo !== filtroCiclo) return false;
    return true;
  });

  // ✅ MELHORIA: Reset de página ao mudar filtros
  useEffect(() => { setPage(0); }, [filtroCategoria, filtroPrioridade, filtroCiclo]);

  // ✅ MELHORIA: Paginação — 20 metas por página
  const totalPages = Math.ceil(filteredMetas.length / PAGE_SIZE);
  const pagedMetas = filteredMetas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Analytics
  const quantMetas = metas.filter(m => m.unidade !== "texto");
  const totalProgress = quantMetas.length > 0 ? quantMetas.reduce((acc, m) => acc + (m.objetivo > 0 ? m.atual / m.objetivo : 0) * 100, 0) / quantMetas.length : 0;
  const metasAtingidas = quantMetas.filter((m) => m.atual >= m.objetivo).length;
  const metasEmRisco = metas.filter((m) => m.status === "em_risco" || (m.unidade !== "texto" && (m.objetivo > 0 ? m.atual / m.objetivo : 0) < 0.3)).length;
  const metasNoPrazo = metas.filter((m) => m.status === "no_prazo" || (m.unidade !== "texto" && (m.objetivo > 0 ? m.atual / m.objetivo : 0) >= 0.7)).length;

  const categoriasData = categorias.map((cat) => {
    const catMetas = metas.filter((m) => m.categoria === cat);
    if (catMetas.length === 0) return null;
    const avg = catMetas.reduce((a, m) => a + (m.objetivo > 0 ? m.atual / m.objetivo : 0) * 100, 0) / catMetas.length;
    return { name: cat, progresso: Math.round(avg), count: catMetas.length };
  }).filter(Boolean) as { name: string; progresso: number; count: number }[];

  const prioridadeData = [
    { name: "Alta", value: metas.filter((m) => m.prioridade === "alta").length, color: "hsl(0, 72%, 51%)" },
    { name: "Média", value: metas.filter((m) => m.prioridade === "media").length, color: "hsl(42, 65%, 56%)" },
    { name: "Baixa", value: metas.filter((m) => m.prioridade === "baixa").length, color: "hsl(207, 89%, 48%)" },
  ].filter((d) => d.value > 0);

  const statusData = [
    { name: "Atingida", value: metas.filter(m => m.status === "atingida").length, color: "hsl(152, 60%, 38%)" },
    { name: "No Prazo", value: metas.filter(m => m.status === "no_prazo").length, color: "hsl(207, 89%, 48%)" },
    { name: "Atenção", value: metas.filter(m => m.status === "atencao").length, color: "hsl(42, 65%, 56%)" },
    { name: "Em Risco", value: metas.filter(m => m.status === "em_risco").length, color: "hsl(0, 72%, 51%)" },
  ].filter((d) => d.value > 0);

  const radialData = metas.slice(0, 6).map((m) => ({
    name: m.nome.length > 18 ? m.nome.slice(0, 18) + "…" : m.nome,
    value: Math.round((m.objetivo > 0 ? m.atual / m.objetivo : 0) * 100), fill: m.cor,
  }));

  const rankingMetas = [...metas].sort((a, b) => (b.atual / b.objetivo) - (a.atual / a.objetivo));

  const formatVal = (v: number, unidade: string) => {
    if (unidade === "texto") return "";
    if (!unidade) return v.toLocaleString("pt-BR");
    if (unidade === "R$") return `R$ ${v.toLocaleString("pt-BR")}`;
    if (unidade === "%") return `${v}%`;
    return `${v.toLocaleString("pt-BR")} ${unidade}`;
  };

  const isQualitativa = (meta: Meta) => meta.unidade === "texto" || meta.tipo_meta === "qualitativa";

  // Parent metas (top-level)
  const parentMetas = metas.filter(m => !m.parent_id);
  const getChildMetas = (parentId: string) => metas.filter(m => m.parent_id === parentId);

  const editorTabs = canEditMetas
    ? [
        { key: "editor" as const, label: "Editor", icon: Pencil },
        { key: "acoes" as const, label: "Plano de Ação", icon: ListChecks },
        { key: "timeline" as const, label: "Check-ins", icon: History },
        { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
        { key: "historico" as const, label: "Histórico", icon: FileText },
        { key: "ranking" as const, label: "Ranking", icon: Trophy },
      ]
    : [
        { key: "acoes" as const, label: "Plano de Ação", icon: ListChecks },
        { key: "timeline" as const, label: "Check-ins", icon: History },
        { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
        { key: "ranking" as const, label: "Ranking", icon: Trophy },
      ];

  const roleLabel = userRole === "admin" ? "Administrador" : userRole === "master" ? "Editor Premium" : "Visualizador";
  const roleBadgeColor = userRole === "admin" ? "hsl(0, 72%, 51%)" : userRole === "master" ? "hsl(42, 65%, 56%)" : "hsl(207, 89%, 48%)";

  // Health heatmap data
  const healthData = categorias.map(cat => {
    const catMetas = metas.filter(m => m.categoria === cat);
    if (catMetas.length === 0) return null;
    const avgPct = catMetas.reduce((a, m) => a + (m.objetivo > 0 ? m.atual / m.objetivo : 0) * 100, 0) / catMetas.length;
    const riskCount = catMetas.filter(m => m.status === "em_risco").length;
    const okCount = catMetas.filter(m => m.status === "atingida" || m.status === "no_prazo").length;
    return { cat, avgPct: Math.round(avgPct), total: catMetas.length, risk: riskCount, ok: okCount };
  }).filter(Boolean) as { cat: string; avgPct: number; total: number; risk: number; ok: number }[];

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="pbi-filter-bar rounded-sm px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium">Filtros</span>
        </div>
        <div className="h-4 w-px bg-border hidden sm:block" />

        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground border-none outline-none cursor-pointer">
          <option value="Todas">Todas Categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)} className="px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground border-none outline-none cursor-pointer">
          <option value="Todas">Todas Prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>

        <select value={filtroCiclo} onChange={(e) => setFiltroCiclo(e.target.value)} className="px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground border-none outline-none cursor-pointer">
          <option value="Todos">Todos Ciclos</option>
          {metaCampos.ciclos.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex-1" />

        <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{ background: `${roleBadgeColor}18`, color: roleBadgeColor }}>
          {canEditMetas ? <Pencil className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
          {roleLabel}
        </span>

        {canEditMetas && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[12px] bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-3 h-3 mr-1" /> Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "hsl(var(--pbi-surface))", border: "1px solid hsl(var(--pbi-border))" }} onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="text-[14px]" style={{ color: "hsl(var(--pbi-text-primary))" }}>🛠️ Criar Nova Meta — Editor Avançado</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                {/* Tipo de Meta */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Tipo de Meta</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                      { key: "quantitativa" as MetaTipo, label: "📊 Quantitativa", desc: "Com valores numéricos e progresso" },
                      { key: "qualitativa" as MetaTipo, label: "📝 Qualitativa", desc: "Apenas texto, sem valores" },
                    ]).map((t) => (
                      <button key={t.key} type="button" onClick={() => {
                        setNewMetaTipo(t.key);
                        setNewMetaToggles(t.key === "quantitativa" ? defaultTogglesQuant : defaultTogglesQual);
                      }}
                        className="text-left p-2.5 rounded transition-all"
                        style={{
                          background: newMetaTipo === t.key ? "hsl(var(--pbi-yellow) / 0.15)" : "hsl(var(--pbi-dark))",
                          border: `1.5px solid ${newMetaTipo === t.key ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))"}`,
                        }}
                      >
                        <p className="text-[12px] font-semibold" style={{ color: newMetaTipo === t.key ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-text-primary))" }}>{t.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campos opcionais toggle — POR SEÇÃO */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Campos da Meta (clique para ativar/desativar)</Label>
                  {fieldSections.map((section) => {
                    const visibleFields = section.fields.filter(f => !(f as any).quantOnly || newMetaTipo === "quantitativa");
                    if (visibleFields.length === 0) return null;
                    return (
                      <div key={section.section}>
                        <p className="text-[10px] text-muted-foreground mb-1">{section.section}</p>
                        <div className="flex flex-wrap gap-1">
                          {visibleFields.map((f) => (
                            <button key={f.key} type="button" onClick={() => setNewMetaToggles({ ...newMetaToggles, [f.key]: !newMetaToggles[f.key] })}
                              className="text-[10px] px-2 py-1 rounded font-medium transition-all"
                              style={{
                                background: newMetaToggles[f.key] ? "hsl(152, 60%, 38%, 0.15)" : "hsl(var(--pbi-dark))",
                                color: newMetaToggles[f.key] ? "hsl(152, 60%, 38%)" : "hsl(var(--pbi-text-secondary))",
                                border: `1px solid ${newMetaToggles[f.key] ? "hsl(152, 60%, 38%, 0.4)" : "hsl(var(--pbi-border))"}`,
                              }}
                            >
                              {newMetaToggles[f.key] ? "✓ " : ""}{f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Seção de campos extras personalizados */}
                  <CampoExtraToggleSection
                    camposExtras={metaCampos.camposExtras}
                    ativosMap={newCamposExtrasAtivos}
                    onToggle={(chave) => setNewCamposExtrasAtivos(prev => ({ ...prev, [chave]: !prev[chave] }))}
                    onAdicionar={(label) => metaCampos.adicionarCampo("campo", label, label)}
                    onRemover={(id, label) => metaCampos.removerCampo(id, label)}
                  />
                </div>

                {/* Nome — sempre visível */}
                <div className="space-y-1.5">
                  <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Nome da Meta *</Label>
                  <Input value={newMeta.nome} onChange={(e) => setNewMeta({ ...newMeta, nome: e.target.value })} placeholder="Ex: Construir muro, Faturamento Mensal..." className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                </div>

                {/* Descrição */}
                {newMetaToggles.descricao && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Descrição</Label>
                    <Textarea value={newMeta.descricao} onChange={(e) => setNewMeta({ ...newMeta, descricao: e.target.value })} placeholder="Descreva a meta em detalhes..." className="resize-none h-16 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                  </div>
                )}

                {/* Valores/Progresso */}
                {newMetaTipo === "quantitativa" && newMetaToggles.valores && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Unidade de Medida</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Opção sem unidade */}
                        <button type="button" onClick={() => setNewMeta({ ...newMeta, unidade: "", objetivo: "" })}
                          className="text-[10px] px-2.5 py-1.5 rounded font-medium transition-all"
                          style={{
                            background: newMeta.unidade === "" ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-dark))",
                            color: newMeta.unidade === "" ? "hsl(var(--pbi-dark))" : "hsl(var(--pbi-text-secondary))",
                            border: `1px solid ${newMeta.unidade === "" ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))"}`,
                          }}
                        >Sem unidade</button>
                        {metaCampos.unidades.map((u) => (
                          <button key={u.value} type="button" onClick={() => setNewMeta({ ...newMeta, unidade: u.value, objetivo: u.value === "%" ? "100" : (newMeta.objetivo || "") })}
                            className="text-[10px] px-2.5 py-1.5 rounded font-medium transition-all"
                            style={{
                              background: newMeta.unidade === u.value ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-dark))",
                              color: newMeta.unidade === u.value ? "hsl(var(--pbi-dark))" : "hsl(var(--pbi-text-secondary))",
                              border: `1px solid ${newMeta.unidade === u.value ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))"}`,
                            }}
                          >{u.label}</button>
                        ))}
                        {/* Botão para adicionar unidade customizada */}
                        <CampoCustomizadoSelect
                          tipo="unidade"
                          value={newMeta.unidade}
                          onChange={(val) => setNewMeta({ ...newMeta, unidade: val })}
                          options={metaCampos.unidades}
                          hideSelect
                        />
                      </div>
                      <Input value={newMeta.unidade} onChange={(e) => setNewMeta({ ...newMeta, unidade: e.target.value, objetivo: e.target.value === "%" ? "100" : newMeta.objetivo })} placeholder="Ou personalizada..." className="h-7 text-[11px] border-none mt-1" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Valor Atual{newMeta.unidade ? ` (${newMeta.unidade})` : ""} <span style={{fontWeight:400,opacity:0.6}}>(opcional)</span></Label>
                        <Input type="number" value={newMeta.atual} onChange={(e) => setNewMeta({ ...newMeta, atual: e.target.value })} placeholder="0" className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Objetivo{newMeta.unidade ? ` (${newMeta.unidade})` : ""} <span style={{fontWeight:400,opacity:0.6}}>(opcional)</span></Label>
                        <Input type="number" value={newMeta.objetivo} onChange={(e) => setNewMeta({ ...newMeta, objetivo: e.target.value })} placeholder={newMeta.unidade === "%" ? "100" : "Ex: 50"} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                      </div>
                    </div>
                  </>
                )}

                {/* Dynamic fields based on toggles */}
                {renderDynamicFields(newMetaToggles, newMeta, (v) => setNewMeta(v), categorias, metas, null, {
                  ciclos: metaCampos.ciclos,
                  etapas: metaCampos.etapas,
                  adicionarCampo: metaCampos.adicionarCampo,
                  removerCampo: metaCampos.removerCampo,
                  customPorTipo: metaCampos.customPorTipo,
                })}

                {/* Inputs dos campos extras personalizados */}
                {metaCampos.camposExtras.filter(c => newCamposExtrasAtivos[c.valor]).map(campo => (
                  <div key={campo.valor} className="space-y-1.5">
                    <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>{campo.label || campo.valor}</Label>
                    <Input
                      value={newMeta[campo.valor] || ""}
                      onChange={(e) => setNewMeta({ ...newMeta, [campo.valor]: e.target.value })}
                      placeholder={`Preencha ${campo.label || campo.valor}...`}
                      className="h-8 text-[12px] border-none"
                      style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }}
                    />
                  </div>
                ))}

                {/* Tipo de meta: estratégica ou vinculada a obra */}
                <div className="space-y-1.5 pt-1 border-t border-border/40">
                  <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                    Tipo de meta
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "", label: "🎯 Estratégica", desc: "Sem vínculo com obra" },
                      { value: "obra", label: "🏗️ De Obra", desc: "Vinculada a um empreendimento" },
                    ].map(opt => {
                      const isSelected = opt.value === "obra"
                        ? !!newMeta.obra_id
                        : !newMeta.obra_id;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (opt.value === "") setNewMeta({ ...newMeta, obra_id: "" });
                          }}
                          className="flex flex-col items-start p-2.5 rounded-lg border text-left transition-all"
                          style={{
                            background: isSelected ? "hsl(var(--pbi-yellow), 0.12)" : "hsl(var(--pbi-dark))",
                            borderColor: isSelected ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))",
                          }}
                        >
                          <span className="text-[12px] font-semibold" style={{ color: "hsl(var(--pbi-text-primary))" }}>{opt.label}</span>
                          <span className="text-[10px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Select de obra — só aparece quando "De Obra" está selecionado */}
                  <div className="mt-2">
                    <Label className="text-[11px] mb-1 block" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                      Empreendimento vinculado
                    </Label>
                    <select
                      value={newMeta.obra_id || ""}
                      onChange={(e) => {
                        const obraId = e.target.value;
                        const obra = obrasDisponiveis.find(o => o.id === obraId);
                        const sugs = sugestoesFase.filter(s => s.fase === obra?.etapa_atual);
                        const sel: Record<string, boolean> = {};
                        const val: Record<string, string>  = {};
                        sugs.forEach(s => { sel[s.id] = true; val[s.id] = ""; });
                        setSelSugNew(sel);
                        setValSugNew(val);
                        setNewMeta({ ...newMeta, obra_id: obraId,
                          etapa: obra?.etapa_atual || newMeta.etapa,
                          local_obra: obra?.nome || newMeta.local_obra,
                        });
                      }}
                      className="w-full h-9 rounded-lg text-[12px] px-3 border outline-none transition-colors cursor-pointer"
                      style={{
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                        borderColor: "hsl(var(--border))",
                      }}
                    >
                      <option value="">— Sem vínculo (meta estratégica) —</option>
                      {obrasDisponiveis.length === 0 && (
                        <option disabled value="__empty">Nenhum empreendimento cadastrado ainda</option>
                      )}
                      {obrasDisponiveis.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.nome}{o.etapa_atual ? ` · ${o.etapa_atual}` : ""}
                        </option>
                      ))}
                    </select>
                    {obrasDisponiveis.length === 0 && (
                      <p className="text-[10px] mt-1" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                        💡 Cadastre empreendimentos em <strong>Obras → Empreendimentos</strong> para vincular aqui.
                      </p>
                    )}

                    {/* Sugestões da fase da obra selecionada */}
                    {newMeta.obra_id && (() => {
                      const obra = obrasDisponiveis.find(o => o.id === newMeta.obra_id);
                      const sugs = sugestoesFase.filter(s => s.fase === obra?.etapa_atual);
                      if (!sugs.length) return null;
                      const selCount = Object.values(selSugNew).filter(Boolean).length;
                      return (
                        <div className="mt-3 p-3 rounded-lg space-y-2" style={{ background: "hsl(271,60%,55%,0.06)", border: "1px solid hsl(271,60%,55%,0.2)" }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-foreground" style={{ color: "hsl(271,60%,55%)" }}>
                              ⚡ {sugs.length} metas sugeridas para fase
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "hsl(271,60%,55%,0.15)", color: "hsl(271,60%,55%)" }}>
                              {obra?.etapa_atual}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{selCount} selecionada{selCount !== 1 ? "s" : ""}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Selecione as que deseja criar junto com esta meta. Elas serão vinculadas à mesma obra.</p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {sugs.map((sug: any) => {
                              const sel = selSugNew[sug.id] ?? true;
                              const pc  = sug.prioridade === "alta" ? "hsl(0,72%,51%)" : sug.prioridade === "media" ? "hsl(42, 65%, 56%)" : "hsl(207,89%,48%)";
                              return (
                                <div key={sug.id}
                                  className="flex items-center gap-2 p-2 rounded cursor-pointer transition-all"
                                  style={{ background: sel ? "hsl(271,60%,55%,0.1)" : "hsl(var(--pbi-dark))", border: `1px solid ${sel ? "hsl(271,60%,55%,0.3)" : "hsl(var(--pbi-border))"}` }}
                                  onClick={() => setSelSugNew(prev => ({ ...prev, [sug.id]: !prev[sug.id] }))}>
                                  <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
                                    style={{ background: sel ? "hsl(271,60%,55%)" : "transparent", border: `1.5px solid ${sel ? "hsl(271,60%,55%)" : "hsl(var(--pbi-border))"}` }}>
                                    {sel && <span className="text-white text-[9px] font-bold">✓</span>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-medium text-foreground">{sug.nome}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${pc}18`, color: pc }}>{sug.prioridade}</span>
                                      <span className="text-[9px] text-muted-foreground">{sug.categoria}</span>
                                    </div>
                                    {sug.descricao && <p className="text-[10px] text-muted-foreground">{sug.descricao}</p>}
                                  </div>
                                  {sel && (
                                    <div className="shrink-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                      <input type="number"
                                        placeholder={sug.objetivo > 0 ? String(sug.objetivo) : "Qtd"}
                                        value={valSugNew[sug.id] || ""}
                                        onChange={e => setValSugNew(prev => ({ ...prev, [sug.id]: e.target.value }))}
                                        className="w-14 h-6 px-1.5 rounded text-[11px] border border-border bg-background text-foreground text-right" />
                                      <span className="text-[10px] text-muted-foreground">{sug.unidade}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {selCount > 0 && (
                            <p className="text-[10px] text-muted-foreground pt-1" style={{ borderTop: "1px solid hsl(271,60%,55%,0.15)" }}>
                              ✓ {selCount} meta{selCount > 1 ? "s adicionais serão criadas" : " adicional será criada"} junto com esta ao salvar.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <Button onClick={addMeta} className="w-full h-8 text-[12px] font-semibold" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }} disabled={saving}>{saving ? "Salvando..." : "Criar Meta"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <div className="pbi-tabs-scroll" style={{ background: "hsl(var(--pbi-surface))", border: "1px solid hsl(var(--pbi-border))" }}>
        {editorTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
                  const handleTabClick = () => {
                    setActiveTab(tab.key);
                    if (tab.key === "historico" && editingId) fetchHistory(editingId);
                  };
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded text-[12px] font-medium transition-all whitespace-nowrap" style={{ background: isActive ? "hsl(var(--pbi-yellow))" : "transparent", color: isActive ? "hsl(var(--pbi-dark))" : "hsl(var(--pbi-text-secondary))" }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Metas", value: metas.length, color: "hsl(207, 89%, 48%)", icon: Target },
          { label: "Progresso Médio", value: `${Math.round(totalProgress)}%`, color: "hsl(152, 60%, 38%)", icon: TrendingUp },
          { label: "Atingidas", value: `${metasAtingidas}/${metas.length}`, color: "hsl(42, 65%, 56%)", icon: Award },
          { label: "Em Risco", value: metasEmRisco, color: "hsl(0, 72%, 51%)", icon: AlertTriangle },
          { label: "Check-ins", value: checkins.length, color: "hsl(174, 62%, 47%)", icon: MessageCircle },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <PBITile key={kpi.label}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: `${kpi.color}1F` }}><Icon className="w-4 h-4" style={{ color: kpi.color }} /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              </div>
            </PBITile>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ========== EDITOR TAB ========== */}
      {activeTab === "editor" && canEditMetas && !loading && (
        <>
          {/* Health Heatmap */}
          {healthData.length > 0 && (
            <PBITile title="🗺️ Mapa de Saúde por Categoria">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {healthData.map((h) => {
                  const color = h.avgPct >= 80 ? "hsl(152, 60%, 38%)" : h.avgPct >= 50 ? "hsl(42, 65%, 56%)" : "hsl(0, 72%, 51%)";
                  const bgOpacity = h.avgPct >= 80 ? "0.12" : h.avgPct >= 50 ? "0.12" : "0.15";
                  return (
                    <div key={h.cat} className="p-3 rounded text-center" style={{ background: `${color.replace(")", `, ${bgOpacity})`)}`, border: `1px solid ${color.replace(")", ", 0.25)")}` }}>
                      <p className="text-[10px] font-medium text-muted-foreground">{h.cat}</p>
                      <p className="text-lg font-bold mt-1" style={{ color }}>{h.avgPct}%</p>
                      <p className="text-[9px] text-muted-foreground">{h.total} metas · {h.risk} risco</p>
                    </div>
                  );
                })}
              </div>
            </PBITile>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <PBITile title="Progresso Individual" className="lg:col-span-2">
              <div className="space-y-2.5">
                {pagedMetas.map((meta) => {
                  const qual = isQualitativa(meta);
                  const pct = qual ? 0 : Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
                  const pCfg = prioridadeConfig[meta.prioridade];
                  const sCfg = statusConfig[meta.status];
                  const metaAcoes = acoes.filter((a) => a.meta_id === meta.id);
                  const childMetas = getChildMetas(meta.id);
                  const metaCheckins = checkins.filter(c => c.meta_id === meta.id);

                  return (
                    <div key={meta.id} className="group">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {meta.parent_id && <GitBranch className="w-3 h-3 text-muted-foreground" />}
                          {qual && <FileText className="w-3 h-3 text-muted-foreground" />}
                          <span className="text-[12px] font-medium text-foreground">{meta.nome}</span>
                          {qual && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">📝 Qualitativa</span>}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                          {meta.ciclo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{meta.ciclo}</span>}
                          {/* Badge de obra vinculada */}
                          {(meta as any).obra_id && obrasDisponiveis.find(o => o.id === (meta as any).obra_id) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"
                              style={{ background: "hsl(207, 89%, 48%, 0.15)", color: "hsl(207, 89%, 48%)" }}>
                              🏗️ {obrasDisponiveis.find(o => o.id === (meta as any).obra_id)?.nome}
                            </span>
                          )}
                          {metaAcoes.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              <ListChecks className="w-3 h-3 inline mr-0.5" />{metaAcoes.filter((a) => a.concluida).length}/{metaAcoes.length}
                            </span>
                          )}
                          {childMetas.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              <Layers className="w-3 h-3 inline mr-0.5" />{childMetas.length} sub
                            </span>
                          )}
                          {metaCheckins.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              <MessageCircle className="w-3 h-3 inline mr-0.5" />{metaCheckins.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                              {meta.responsavel && <span className="text-[10px] text-muted-foreground hidden sm:inline">{meta.responsavel}</span>}
                              {!qual && <span className="text-[11px] text-muted-foreground">{formatVal(meta.atual, meta.unidade)} / {formatVal(meta.objetivo, meta.unidade)}</span>}
                              {!qual && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${meta.cor}18`, color: meta.cor }}>{pct}%</span>}
                              <button onClick={() => { setCheckinMetaId(meta.id); setCheckinDialogOpen(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Check-in"><MessageCircle className="w-3 h-3" /></button>
                              <button onClick={() => {
                                setEditingId(meta.id);
                                const isMetaQual = meta.unidade === "texto";
                                setEditMetaTipo(isMetaQual ? "qualitativa" : "quantitativa");
                                setEditMetaToggles({
                                  ...defaultTogglesQuant,
                                  valores: !isMetaQual,
                                  responsavel: !!meta.responsavel,
                                  prazo: !!meta.prazo,
                                  prioridade: true,
                                  ciclo: !!meta.ciclo,
                                  metaPai: !!meta.parent_id,
                                  categoria: !!meta.categoria,
                                  descricao: !!meta.descricao,
                                  local_obra: !!meta.local_obra,
                                  orcamento: meta.orcamento > 0,
                                  equipe: !!meta.equipe,
                                  fornecedor: !!meta.fornecedor,
                                  etapa: !!meta.etapa,
                                  risco: !!meta.risco,
                                  observacoes: !!meta.observacoes,
                                  aprovador: !!meta.aprovador,
                                  departamento: !!meta.departamento,
                                  impacto: !!meta.impacto,
                                  dependencias: !!meta.dependencias,
                                  marco_critico: !!meta.marco_critico,
                                  peso: meta.peso > 0,
                                  tags: (meta.tags?.length ?? 0) > 0,
                                  indicador_chave: !!meta.indicador_chave,
                                  fonte_dados: !!meta.fonte_dados,
                                  data_inicio: !!meta.data_inicio,
                                  frequencia_checkin: meta.frequencia_checkin !== "semanal",
                                });
                                setEditValues({
                                  nome: meta.nome, atual: meta.atual.toString(), objetivo: meta.objetivo.toString(),
                                  unidade: meta.unidade === "texto" ? "" : meta.unidade,
                                  categoria: categorias.includes(meta.categoria) ? meta.categoria : "__outra__",
                                  categoriaCustom: categorias.includes(meta.categoria) ? "" : meta.categoria,
                                  responsavel: meta.responsavel, prioridade: meta.prioridade,
                                  ciclo: meta.ciclo, parent_id: meta.parent_id || "", prazo: meta.prazo || "",
                                  descricao: meta.descricao || "", local_obra: meta.local_obra || "",
                                  orcamento: meta.orcamento.toString(), custo_atual: meta.custo_atual.toString(),
                                  equipe: meta.equipe || "", fornecedor: meta.fornecedor || "",
                                  etapa: meta.etapa || "", peso: meta.peso.toString(),
                                  tags: (meta.tags || []).join(", "), data_inicio: meta.data_inicio || "",
                                  frequencia_checkin: meta.frequencia_checkin || "semanal",
                                  risco: meta.risco || "", observacoes: meta.observacoes || "",
                                  aprovador: meta.aprovador || "", departamento: meta.departamento || "",
                                  indicador_chave: meta.indicador_chave || "", fonte_dados: meta.fonte_dados || "",
                                  impacto: meta.impacto || "", dependencias: meta.dependencias || "",
                                  marco_critico: meta.marco_critico || "",
                                  obra_id: (meta as any).obra_id || "",
                                  ...(meta.campos_extras || {}),
                                });
                                // Ativar toggles dos campos extras que a meta já possui
                                const extrasAtivos: Record<string, boolean> = {};
                                if (meta.campos_extras) {
                                  Object.keys(meta.campos_extras).forEach(k => { extrasAtivos[k] = true; });
                                }
                                setEditCamposExtrasAtivos(extrasAtivos);
                                setEditDialogOpen(true);
                              }} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Editar meta"><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => { setAcaoMetaId(meta.id); setAcaoDialogOpen(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Adicionar ação"><ListChecks className="w-3 h-3" /></button>
                              <button onClick={() => removeMeta(meta.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      {!qual && (
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.cor }} />
                        </div>
                      )}
                      {qual && canEditMetas && (
                        <button
                          onClick={() => toggleQualMeta(meta)}
                          className="mt-1 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                          style={meta.status === "atingida"
                            ? { background: "hsl(152, 60%, 38%, 0.12)", color: "hsl(152, 60%, 38%)" }
                            : { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
                        >
                          {meta.status === "atingida"
                            ? <><CheckCircle2 className="w-3 h-3" /> Concluída — clique para desfazer</>
                            : <><CircleDot className="w-3 h-3" /> Marcar como concluída</>}
                        </button>
                      )}
                    </div>
                  );
                })}
                {pagedMetas.length === 0 && !loading && (
                  <p className="text-[12px] text-muted-foreground text-center py-8">Nenhuma meta encontrada. Crie a primeira!</p>
                )}
              </div>
            </PBITile>

            <PBITile title="Gauges de Desempenho">
              {radialData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="15%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                    <RadialBar label={{ position: "insideStart", fill: "#fff", fontSize: 9 }} background dataKey="value" />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Progresso"]} contentStyle={{ borderRadius: "4px", fontSize: 11 }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[12px] text-muted-foreground text-center py-12">Sem dados</p>
              )}
            </PBITile>
          {/* ✅ Controle de Paginação — Aba Editor */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-3">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded text-[11px] font-medium disabled:opacity-40 transition-all"
                style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))", border: "1px solid hsl(var(--pbi-border))" }}
              >
                ← Anterior
              </button>
              <span className="text-[11px] text-muted-foreground">
                Página {page + 1} de {totalPages} · {filteredMetas.length} metas
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 rounded text-[11px] font-medium disabled:opacity-40 transition-all"
                style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))", border: "1px solid hsl(var(--pbi-border))" }}
              >
                Próxima →
              </button>
            </div>
          )}

          </div>
        </>
      )}

      {/* ========== PLANO DE AÇÃO TAB ========== */}
      {activeTab === "acoes" && !loading && (
        <div className="space-y-3">
          {!canEditMetas && (
            <div className="pbi-tile" style={{ borderLeft: "4px solid hsl(174, 62%, 47%)" }}>
              <div className="flex items-center gap-2 mb-1">
                <ListChecks className="w-4 h-4" style={{ color: "hsl(174, 62%, 47%)" }} />
                <p className="text-[13px] font-semibold text-foreground">Acompanhe e Contribua!</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Você pode <strong className="text-foreground">fazer check-ins</strong> informando como está o andamento de cada meta, 
                <strong className="text-foreground"> adicionar contribuições</strong> descrevendo o que está fazendo para ajudar, 
                e <strong className="text-foreground">marcar ações como concluídas</strong>. Sua participação é essencial!
              </p>
            </div>
          )}

          {pagedMetas.map((meta) => {
            const qual = isQualitativa(meta);
            const pct = qual ? 0 : Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
            const metaAcoes = acoes.filter((a) => a.meta_id === meta.id && a.tipo === "acao");
            const metaContribs = acoes.filter((a) => a.meta_id === meta.id && a.tipo === "contribuicao");
            const pCfg = prioridadeConfig[meta.prioridade];
            const sCfg = statusConfig[meta.status];
            const barColor = pct >= 80 ? "hsl(152, 60%, 38%)" : pct >= 50 ? "hsl(207, 89%, 48%)" : pct >= 30 ? "hsl(42, 65%, 56%)" : "hsl(0, 72%, 51%)";

            return (
              <PBITile key={meta.id}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {qual ? <FileText className="w-4 h-4" style={{ color: meta.cor }} /> : <Target className="w-4 h-4" style={{ color: meta.cor }} />}
                    <span className="text-[13px] font-semibold text-foreground">{meta.nome}</span>
                    {qual && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">📝 Qualitativa</span>}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                    {meta.ciclo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{meta.ciclo}</span>}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {!qual && <span className="text-[11px] text-muted-foreground">{formatVal(meta.atual, meta.unidade)} / {formatVal(meta.objetivo, meta.unidade)}</span>}
                    {!qual && <span className="text-[14px] font-bold" style={{ color: barColor }}>{pct}%</span>}
                    <button onClick={() => { setCheckinMetaId(meta.id); setCheckinDialogOpen(true); }} className="text-[10px] px-2 py-1 rounded font-medium" style={{ background: "hsl(262, 52%, 47%)", color: "white" }}>
                      <MessageCircle className="w-3 h-3 inline mr-0.5" /> Check-in
                    </button>
                    {canEditMetas && (
                      <button onClick={() => { setAcaoMetaId(meta.id); setAcaoDialogOpen(true); }} className="text-[10px] px-2 py-1 rounded font-medium" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                        <Plus className="w-3 h-3 inline mr-0.5" /> Ação
                      </button>
                    )}
                    {!canEditMetas && (
                      <button onClick={() => { setAcaoMetaId(meta.id); setAcaoDialogOpen(true); }} className="text-[10px] px-2 py-1 rounded font-medium" style={{ background: "hsl(174, 62%, 47%)", color: "hsl(var(--pbi-dark))" }}>
                        <Plus className="w-3 h-3 inline mr-0.5" /> Contribuição
                      </button>
                    )}
                  </div>
                </div>
                {!qual && (
                  <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                )}

                {meta.responsavel && (
                  <p className="text-[10px] text-muted-foreground mb-2">Responsável: <span className="text-foreground font-medium">{meta.responsavel}</span></p>
                )}

                {/* Ações com toggle */}
                {metaAcoes.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5" style={{ color: "hsl(var(--pbi-yellow))" }} />
                      Ações para cumprir esta meta:
                    </p>
                    {metaAcoes.map((acao) => (
                      <div key={acao.id} className="flex items-center gap-2 py-1.5 px-2 rounded" style={{ background: acao.concluida ? "hsl(152, 60%, 38%, 0.06)" : "hsl(var(--pbi-dark) / 0.3)", border: `1px solid ${acao.concluida ? "hsl(152, 60%, 38%, 0.15)" : "hsl(var(--pbi-border))"}` }}>
                        <button onClick={() => toggleAcao(acao)} className="shrink-0">
                          {acao.concluida ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(152, 60%, 38%)" }} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 hover:border-green-500 transition-colors" style={{ borderColor: "hsl(var(--pbi-text-secondary))" }} />
                          )}
                        </button>
                        <span className={`text-[11px] flex-1 ${acao.concluida ? "line-through text-muted-foreground" : "text-foreground"}`}>{acao.descricao}</span>
                        {acao.imagens && acao.imagens.length > 0 && (
                          <div className="flex gap-1">
                            {acao.imagens.map((f, i) => <FileThumbnail key={i} url={f} />)}
                          </div>
                        )}
                        {acao.responsavel && <span className="text-[9px] text-muted-foreground hidden sm:inline">{acao.responsavel}</span>}
                        {acao.prazo && <span className="text-[9px] text-muted-foreground">{new Date(acao.prazo).toLocaleDateString("pt-BR")}</span>}
                        {canEditMetas && (
                          <button onClick={() => removeAcao(acao.id)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contribuições */}
                {metaContribs.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" style={{ color: "hsl(174, 62%, 47%)" }} />
                      Contribuições da equipe:
                    </p>
                    {metaContribs.map((contrib) => (
                      <div key={contrib.id} className="flex items-center gap-2 py-1.5 px-2 rounded" style={{ background: "hsl(174, 62%, 47%, 0.06)", border: "1px solid hsl(174, 62%, 47%, 0.15)" }}>
                        <button onClick={() => toggleAcao(contrib)} className="shrink-0">
                          {contrib.concluida ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(152, 60%, 38%)" }} />
                          ) : (
                            <Zap className="w-3.5 h-3.5" style={{ color: "hsl(174, 62%, 47%)" }} />
                          )}
                        </button>
                        <span className={`text-[11px] flex-1 ${contrib.concluida ? "line-through text-muted-foreground" : "text-foreground"}`}>{contrib.descricao}</span>
                        {contrib.imagens && contrib.imagens.length > 0 && (
                          <div className="flex gap-1">
                            {contrib.imagens.map((f, i) => <FileThumbnail key={i} url={f} />)}
                          </div>
                        )}
                        {contrib.responsavel && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hidden sm:inline">{contrib.responsavel}</span>}
                        {(canEditMetas || contrib.created_by === user?.id) && (
                          <button onClick={() => removeAcao(contrib.id)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Kanban de ações */}
                {canEditMetas && (
                  <div className="mt-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                    <MetaAcoesKanban metaId={meta.id} />
                  </div>
                )}

                {/* Recent check-ins preview */}
                {checkins.filter(c => c.meta_id === meta.id).slice(0, 2).length > 0 && (
                  <div className="mt-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                    <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                      <History className="w-3 h-3" /> Últimos check-ins
                    </p>
                    {checkins.filter(c => c.meta_id === meta.id).slice(0, 2).map(ci => {
                      const ciCfg = statusConfig[ci.confianca === "em_risco" ? "em_risco" : ci.confianca === "atencao" ? "atencao" : "no_prazo"];
                      return (
                        <div key={ci.id} className="flex items-start gap-2 py-1 text-[10px]">
                          <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: ciCfg.color }} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground">{ci.user_name}</span>
                            <span className="text-muted-foreground"> · {new Date(ci.created_at).toLocaleDateString("pt-BR")}</span>
                            {ci.comentario && <p className="text-muted-foreground truncate">{ci.comentario}</p>}
                            {ci.imagens && ci.imagens.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {ci.imagens.map((f, i) => <FileThumbnail key={i} url={f} />)}
                              </div>
                            )}
                          </div>
                          {ci.valor_anterior !== ci.valor_novo && (
                            <span className="text-[9px] font-medium shrink-0" style={{ color: ci.valor_novo > ci.valor_anterior ? "hsl(152, 60%, 38%)" : "hsl(0, 72%, 51%)" }}>
                              {ci.valor_anterior} → {ci.valor_novo}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {metaAcoes.length === 0 && metaContribs.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">Nenhuma ação ou contribuição definida ainda.</p>
                )}
              </PBITile>
            );
          })}

          {pagedMetas.length === 0 && (
            <PBITile><p className="text-[12px] text-muted-foreground text-center py-8">Nenhuma meta encontrada.</p></PBITile>
          )}
          {/* ✅ MELHORIA: Paginação na aba Ações */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-3">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded text-[11px] font-medium disabled:opacity-40 transition-all"
                style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))", border: "1px solid hsl(var(--pbi-border))" }}
              >
                ← Anterior
              </button>
              <span className="text-[11px] text-muted-foreground">
                Página {page + 1} de {totalPages} · {filteredMetas.length} metas
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 rounded text-[11px] font-medium disabled:opacity-40 transition-all"
                style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))", border: "1px solid hsl(var(--pbi-border))" }}
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== CHECK-INS / TIMELINE TAB ========== */}
      {activeTab === "timeline" && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <PBITile title="📋 Timeline de Check-ins" className="lg:col-span-2">
            {checkins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="w-8 h-8 mb-3 text-muted-foreground" />
                <p className="text-[12px] text-muted-foreground">Nenhum check-in registrado ainda.</p>
                <p className="text-[11px] text-muted-foreground mt-1">Faça check-ins nas metas para acompanhar o progresso ao longo do tempo.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {checkins.slice(0, 50).map((ci) => {
                  const meta = metas.find(m => m.id === ci.meta_id);
                  const ciCfg = statusConfig[ci.confianca === "em_risco" ? "em_risco" : ci.confianca === "atencao" ? "atencao" : "no_prazo"];
                  const CiIcon = ciCfg.icon;
                  return (
                    <div key={ci.id} className="flex gap-3 p-3 rounded" style={{ background: "hsl(var(--secondary) / 0.5)", border: "1px solid hsl(var(--border))" }}>
                      <div className="shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: ciCfg.bg }}>
                          <CiIcon className="w-4 h-4" style={{ color: ciCfg.color }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-semibold text-foreground">{ci.user_name}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(ci.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: ciCfg.bg, color: ciCfg.color }}>{ciCfg.label}</span>
                        </div>
                        {meta && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            <Target className="w-3 h-3 inline mr-1" style={{ color: meta.cor }} />
                            {meta.nome}
                            {ci.valor_anterior !== ci.valor_novo && (
                              <span className="ml-2 font-medium" style={{ color: ci.valor_novo > ci.valor_anterior ? "hsl(152, 60%, 38%)" : "hsl(0, 72%, 51%)" }}>
                                {formatVal(ci.valor_anterior, meta.unidade)} → {formatVal(ci.valor_novo, meta.unidade)}
                              </span>
                            )}
                          </p>
                        )}
                        {ci.comentario && (
                          <p className="text-[11px] text-foreground mt-1 bg-background/50 rounded px-2 py-1.5" style={{ border: "1px solid hsl(var(--border))" }}>
                            💬 {ci.comentario}
                          </p>
                        )}
                        {ci.imagens && ci.imagens.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {ci.imagens.map((f, i) => <FileThumbnail key={i} url={f} />)}
                          </div>
                        )}
                      </div>
                      {(canEditMetas || ci.user_id === user?.id) && (
                        <button onClick={() => removeCheckin(ci.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground shrink-0 self-start" title="Excluir check-in">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </PBITile>

          <div className="space-y-3">
            <PBITile title="📊 Atividade por Meta">
              {metas.map((meta) => {
                const count = checkins.filter(c => c.meta_id === meta.id).length;
                if (count === 0) return null;
                return (
                  <div key={meta.id} className="flex items-center gap-2 py-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.cor }} />
                    <span className="text-[11px] text-foreground flex-1 truncate">{meta.nome}</span>
                    <span className="text-[11px] font-bold text-foreground">{count}</span>
                  </div>
                );
              })}
              {checkins.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">Sem dados</p>}
            </PBITile>

            <PBITile title="🔥 Confiança Geral">
              {[
                { label: "No Prazo", count: checkins.filter(c => c.confianca === "no_prazo").length, color: "hsl(152, 60%, 38%)" },
                { label: "Atenção", count: checkins.filter(c => c.confianca === "atencao").length, color: "hsl(42, 65%, 56%)" },
                { label: "Em Risco", count: checkins.filter(c => c.confianca === "em_risco").length, color: "hsl(0, 72%, 51%)" },
              ].filter(d => d.count > 0).map((d) => (
                <div key={d.label} className="flex items-center gap-2 py-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                  <span className="text-[11px] text-muted-foreground flex-1">{d.label}</span>
                  <span className="text-[12px] font-bold" style={{ color: d.color }}>{d.count}</span>
                </div>
              ))}
            </PBITile>
          </div>
        </div>
      )}

      {/* ========== ANALYTICS TAB ========== */}
      {activeTab === "analytics" && !loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <PBITile title="Progresso por Categoria">
              {categoriasData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoriasData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(0, 0%, 60%)" tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(0, 0%, 60%)" width={80} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Progresso"]} contentStyle={{ borderRadius: "4px", fontSize: 11 }} />
                    <Bar dataKey="progresso" radius={[0, 4, 4, 0]} barSize={18}>
                      {categoriasData.map((entry, i) => (
                        <Cell key={i} fill={entry.progresso >= 80 ? "hsl(152, 60%, 38%)" : entry.progresso >= 50 ? "hsl(207, 89%, 48%)" : "hsl(0, 72%, 51%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-[12px] text-muted-foreground text-center py-12">Sem dados</p>}
            </PBITile>

            <PBITile title="Distribuição por Prioridade">
              {prioridadeData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={prioridadeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {prioridadeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, "metas"]} contentStyle={{ borderRadius: "4px", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {prioridadeData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-[11px]">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground flex-1">{item.name}</span>
                        <span className="font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-[12px] text-muted-foreground text-center py-12">Sem dados</p>}
            </PBITile>

            <PBITile title="Status das Metas (RAG)">
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, "metas"]} contentStyle={{ borderRadius: "4px", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-[11px]">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground flex-1">{item.name}</span>
                        <span className="font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-[12px] text-muted-foreground text-center py-12">Sem dados</p>}
            </PBITile>
          </div>
        </>
      )}

      {/* ========== HISTÓRICO TAB ========== */}
      {activeTab === "historico" && !loading && (
        <div className="space-y-3">
          <div className="pbi-tile" style={{ borderLeft: "3px solid hsl(207,89%,48%)" }}>
            <p className="text-[12px] font-semibold text-foreground mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "hsl(207,89%,48%)" }} />
              Histórico de Alterações
            </p>
            <p className="text-[11px] text-muted-foreground">
              Registro automático de todas as mudanças em metas. Selecione uma meta no Editor para ver seu histórico específico.
            </p>
          </div>
          {loadingHistory ? (
            <div className="pbi-tile text-center py-8">
              <p className="text-[11px] text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : historyMeta.length === 0 ? (
            <div className="pbi-tile text-center py-10 space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-[12px] text-muted-foreground">Nenhuma alteração registrada ainda.</p>
              <p className="text-[11px] text-muted-foreground">O histórico é gerado automaticamente a partir do próximo UPDATE em qualquer meta.</p>
            </div>
          ) : (
            <div className="pbi-tile overflow-x-auto">
              <p className="text-[12px] font-semibold text-foreground mb-3">
                {historyMeta.length} alteração{historyMeta.length !== 1 ? "ões" : ""} registrada{historyMeta.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {historyMeta.map((h: any) => {
                  // Descobrir o que mudou nesse registro
                  const campos = [
                    { label: "Nome",        ant: h.nome_anterior,       nov: h.nome_novo },
                    { label: "Status",      ant: h.status_anterior,     nov: h.status_novo },
                    { label: "Atual",       ant: h.atual_anterior,      nov: h.atual_novo },
                    { label: "Objetivo",    ant: h.objetivo_anterior,   nov: h.objetivo_novo },
                    { label: "Responsável", ant: h.responsavel_anterior, nov: h.responsavel_novo },
                    { label: "Prioridade",  ant: h.prioridade_anterior, nov: h.prioridade_novo },
                    { label: "Prazo",       ant: h.prazo_anterior,      nov: h.prazo_novo },
                    { label: "Categoria",   ant: h.categoria_anterior,  nov: h.categoria_novo },
                    { label: "Orçamento",   ant: h.orcamento_anterior,  nov: h.orcamento_novo },
                  ].filter(c => c.ant !== null || c.nov !== null);

                  if (campos.length === 0) return null;
                  return (
                    <div key={h.id} className="rounded p-3" style={{ background: "hsl(var(--secondary)/0.5)", border: "1px solid hsl(var(--border))" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(h.edited_at).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "hsl(207,89%,48%,0.15)", color: "hsl(207,89%,48%)" }}>
                          {campos.length} campo{campos.length > 1 ? "s" : ""} alterado{campos.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {campos.map(c => (
                          <div key={c.label} className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground w-20 shrink-0">{c.label}</span>
                            {c.ant !== null && (
                              <span className="line-through text-muted-foreground">{String(c.ant)}</span>
                            )}
                            {c.ant !== null && c.nov !== null && (
                              <span className="text-muted-foreground">→</span>
                            )}
                            {c.nov !== null && (
                              <span className="font-medium text-foreground">{String(c.nov)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== RANKING TAB ========== */}
      {activeTab === "ranking" && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <PBITile title="🏆 Ranking de Metas (% Atingido)">
            <div className="space-y-2">
              {rankingMetas.map((meta, idx) => {
                const pct = Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
                const medalColors = ["hsl(42, 65%, 56%)", "hsl(0, 0%, 75%)", "hsl(28, 87%, 55%)"];
                const pCfg = prioridadeConfig[meta.prioridade];
                return (
                  <div key={meta.id} className="flex items-center gap-3 py-2 px-3 rounded transition-colors hover:bg-white/5" style={{ borderBottom: "1px solid hsl(var(--pbi-border) / 0.3)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{
                      background: idx < 3 ? `${medalColors[idx]}20` : "hsl(var(--pbi-surface))",
                      color: idx < 3 ? medalColors[idx] : "hsl(var(--pbi-text-secondary))",
                      border: idx < 3 ? `2px solid ${medalColors[idx]}` : "1px solid hsl(var(--pbi-border))",
                    }}>
                      {idx + 1}º
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-foreground truncate">{meta.nome}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{meta.responsavel} · {meta.ciclo}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-bold" style={{ color: pct >= 100 ? "hsl(152, 60%, 38%)" : pct >= 70 ? "hsl(207, 89%, 48%)" : pct >= 50 ? "hsl(42, 65%, 56%)" : "hsl(0, 72%, 51%)" }}>{pct}%</p>
                      <div className="w-20 h-1.5 bg-secondary rounded-full mt-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "hsl(152, 60%, 38%)" : pct >= 70 ? "hsl(207, 89%, 48%)" : "hsl(42, 65%, 56%)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {rankingMetas.length === 0 && <p className="text-[12px] text-muted-foreground text-center py-8">Sem metas</p>}
            </div>
          </PBITile>

          <PBITile title="Metas em Risco 🚨">
            {metasEmRisco === 0 ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(152, 60%, 38%)" }} />
                <p className="text-[12px]" style={{ color: "hsl(152, 60%, 38%)" }}>Nenhuma meta em risco!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metas.filter((m) => m.status === "em_risco" || (m.objetivo > 0 ? m.atual / m.objetivo : 0) < 0.3).map((meta) => {
                  const pct = Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100);
                  const metaAcoesRisk = acoes.filter((a) => a.meta_id === meta.id);
                  return (
                    <div key={meta.id} className="p-3 rounded" style={{ background: "hsl(0, 72%, 51%, 0.06)", border: "1px solid hsl(0, 72%, 51%, 0.15)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 shrink-0" style={{ color: "hsl(0, 72%, 51%)" }} />
                        <span className="text-[11px] font-medium text-foreground flex-1">{meta.nome}</span>
                        <span className="text-[12px] font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>{pct}%</span>
                      </div>
                      {metaAcoesRisk.length > 0 && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          <p className="text-[10px] text-muted-foreground font-semibold">Ações pendentes:</p>
                          {metaAcoesRisk.filter((a) => !a.concluida).map((a) => (
                            <p key={a.id} className="text-[10px] text-muted-foreground">• {a.descricao}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </PBITile>
        </div>
      )}

      {/* Add Action Dialog */}
      <Dialog open={acaoDialogOpen} onOpenChange={setAcaoDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "hsl(var(--pbi-surface))", border: "1px solid hsl(var(--pbi-border))" }} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[14px]" style={{ color: "hsl(var(--pbi-text-primary))" }}>
              {canEditMetas ? "Adicionar Ação" : "Adicionar Contribuição"} — {metas.find((m) => m.id === acaoMetaId)?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>{canEditMetas ? "O que precisa ser feito? *" : "O que você está fazendo para ajudar? *"}</Label>
              <Input value={newAcao.descricao} onChange={(e) => setNewAcao({ ...newAcao, descricao: e.target.value })} placeholder={canEditMetas ? "Descrição da ação" : "Descreva sua contribuição"} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Responsável</Label>
                <Input value={newAcao.responsavel} onChange={(e) => setNewAcao({ ...newAcao, responsavel: e.target.value })} placeholder="Nome" className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Prazo</Label>
                <Input type="date" value={newAcao.prazo} onChange={(e) => setNewAcao({ ...newAcao, prazo: e.target.value })} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Anexos (opcional)</Label>
              <MetaFileUpload files={newAcao.imagens} onChange={(imgs) => setNewAcao({ ...newAcao, imagens: imgs })} folder="acoes" />
            </div>
            <Button onClick={() => addAcao(canEditMetas ? "acao" : "contribuicao")} className="w-full h-8 text-[12px] font-semibold" style={{ background: canEditMetas ? "hsl(var(--pbi-yellow))" : "hsl(174, 62%, 47%)", color: "hsl(var(--pbi-dark))" }}>
              {canEditMetas ? "Adicionar Ação" : "Adicionar Minha Contribuição"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={checkinDialogOpen} onOpenChange={setCheckinDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "hsl(var(--pbi-surface))", border: "1px solid hsl(var(--pbi-border))" }} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[14px]" style={{ color: "hsl(var(--pbi-text-primary))" }}>
              <MessageCircle className="w-4 h-4 inline mr-2" style={{ color: "hsl(262, 52%, 47%)" }} />
              Check-in — {metas.find((m) => m.id === checkinMetaId)?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {checkinMetaId && (() => {
              const meta = metas.find(m => m.id === checkinMetaId);
              if (!meta) return null;
              const pct = Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100);
              return (
                <div className="flex items-center gap-3 p-2 rounded" style={{ background: "hsl(var(--pbi-dark))" }}>
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground">Progresso atual</p>
                    <p className="text-[14px] font-bold text-foreground">{formatVal(meta.atual, meta.unidade)} / {formatVal(meta.objetivo, meta.unidade)} ({pct}%)</p>
                  </div>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: `${meta.cor}20`, color: meta.cor }}>{pct}%</div>
                </div>
              );
            })()}

            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Novo valor (opcional)</Label>
              <Input type="number" value={newCheckin.valor} onChange={(e) => setNewCheckin({ ...newCheckin, valor: e.target.value })} placeholder={`Atual: ${metas.find(m => m.id === checkinMetaId)?.atual || 0}`} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Nível de confiança</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  { key: "no_prazo" as const, label: "No Prazo", color: "hsl(152, 60%, 38%)" },
                  { key: "atencao" as const, label: "Atenção", color: "hsl(42, 65%, 56%)" },
                  { key: "em_risco" as const, label: "Em Risco", color: "hsl(0, 72%, 51%)" },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setNewCheckin({ ...newCheckin, confianca: opt.key })}
                    className="text-[11px] py-2 rounded font-medium transition-all"
                    style={{
                      background: newCheckin.confianca === opt.key ? opt.color : "hsl(var(--pbi-dark))",
                      color: newCheckin.confianca === opt.key ? "white" : "hsl(var(--pbi-text-secondary))",
                      border: `1px solid ${newCheckin.confianca === opt.key ? opt.color : "hsl(var(--pbi-border))"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Comentário / Atualização *</Label>
              <Textarea
                value={newCheckin.comentario}
                onChange={(e) => setNewCheckin({ ...newCheckin, comentario: e.target.value })}
                placeholder="Como está o progresso? Algum bloqueio? O que foi feito?"
                className="resize-none h-20 text-[12px] border-none"
                style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Anexos (opcional)</Label>
              <MetaFileUpload files={newCheckin.imagens} onChange={(imgs) => setNewCheckin({ ...newCheckin, imagens: imgs })} folder="checkins" />
            </div>

            <Button onClick={addCheckin} className="w-full h-8 text-[12px] font-semibold" style={{ background: "hsl(262, 52%, 47%)", color: "white" }}>
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Registrar Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== EDIT META DIALOG ========== */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingId(null); }}>
        <DialogContent className="pbi-tile border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "hsl(var(--pbi-surface))" }} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[14px] font-bold text-foreground flex items-center gap-2">
              <Pencil className="w-4 h-4" style={{ color: "hsl(var(--pbi-yellow))" }} /> 🛠️ Editar Meta — Editor Avançado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Tipo de Meta */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Tipo de Meta</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { key: "quantitativa" as MetaTipo, label: "📊 Quantitativa", desc: "Com valores numéricos" },
                  { key: "qualitativa" as MetaTipo, label: "📝 Qualitativa", desc: "Apenas texto" },
                ]).map((t) => (
                  <button key={t.key} type="button" onClick={() => {
                    setEditMetaTipo(t.key);
                    if (t.key === "qualitativa") setEditMetaToggles(prev => ({ ...prev, valores: false }));
                    else setEditMetaToggles(prev => ({ ...prev, valores: true }));
                  }}
                    className="text-left p-2 rounded transition-all"
                    style={{
                      background: editMetaTipo === t.key ? "hsl(var(--pbi-yellow) / 0.15)" : "hsl(var(--pbi-dark))",
                      border: `1.5px solid ${editMetaTipo === t.key ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))"}`,
                    }}
                  >
                    <p className="text-[11px] font-semibold" style={{ color: editMetaTipo === t.key ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-text-primary))" }}>{t.label}</p>
                    <p className="text-[9px] text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Field toggles — POR SEÇÃO */}
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Campos ativos (clique para ativar/desativar)</Label>
              {fieldSections.map((section) => {
                const visibleFields = section.fields.filter(f => !(f as any).quantOnly || editMetaTipo === "quantitativa");
                if (visibleFields.length === 0) return null;
                return (
                  <div key={section.section}>
                    <p className="text-[10px] text-muted-foreground mb-1">{section.section}</p>
                    <div className="flex flex-wrap gap-1">
                      {visibleFields.map((f) => (
                        <button key={f.key} type="button" onClick={() => setEditMetaToggles({ ...editMetaToggles, [f.key]: !editMetaToggles[f.key] })}
                          className="text-[9px] px-2 py-1 rounded font-medium transition-all"
                          style={{
                            background: editMetaToggles[f.key] ? "hsl(152, 60%, 38%, 0.15)" : "hsl(var(--pbi-dark))",
                            color: editMetaToggles[f.key] ? "hsl(152, 60%, 38%)" : "hsl(var(--pbi-text-secondary))",
                            border: `1px solid ${editMetaToggles[f.key] ? "hsl(152, 60%, 38%, 0.4)" : "hsl(var(--pbi-border))"}`,
                          }}
                        >
                          {editMetaToggles[f.key] ? "✓ " : ""}{f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Seção de campos extras personalizados */}
              <CampoExtraToggleSection
                camposExtras={metaCampos.camposExtras}
                ativosMap={editCamposExtrasAtivos}
                onToggle={(chave) => setEditCamposExtrasAtivos(prev => ({ ...prev, [chave]: !prev[chave] }))}
                onAdicionar={(label) => metaCampos.adicionarCampo("campo", label, label)}
                onRemover={(id, label) => metaCampos.removerCampo(id, label)}
              />
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Nome da Meta</Label>
              <Input value={editValues.nome} onChange={(e) => setEditValues({ ...editValues, nome: e.target.value })} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
            </div>

            {/* Descrição */}
            {editMetaToggles.descricao && (
              <div className="space-y-1.5">
                <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Descrição</Label>
                <Textarea value={editValues.descricao} onChange={(e) => setEditValues({ ...editValues, descricao: e.target.value })} placeholder="Descreva a meta em detalhes..." className="resize-none h-16 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
              </div>
            )}

            {/* Valores/Progresso */}
            {editMetaToggles.valores && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Unidade de Medida</Label>
                  <div className="flex flex-wrap gap-1">
                    {/* Opção sem unidade */}
                    <button type="button" onClick={() => setEditValues({ ...editValues, unidade: "", objetivo: "" })}
                      className="text-[9px] px-2 py-1 rounded font-medium transition-all"
                      style={{
                        background: editValues.unidade === "" ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-dark))",
                        color: editValues.unidade === "" ? "hsl(var(--pbi-dark))" : "hsl(var(--pbi-text-secondary))",
                        border: `1px solid ${editValues.unidade === "" ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))"}`,
                      }}
                    >Sem unidade</button>
                    {metaCampos.unidades.map((u) => (
                      <button key={u.value} type="button" onClick={() => setEditValues({ ...editValues, unidade: u.value, objetivo: u.value === "%" ? "100" : (editValues.objetivo || "") })}
                        className="text-[9px] px-2 py-1 rounded font-medium transition-all"
                        style={{
                          background: editValues.unidade === u.value ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-dark))",
                          color: editValues.unidade === u.value ? "hsl(var(--pbi-dark))" : "hsl(var(--pbi-text-secondary))",
                          border: `1px solid ${editValues.unidade === u.value ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))"}`,
                        }}
                      >{u.label}</button>
                    ))}
                    {/* Botão para adicionar unidade customizada */}
                    <CampoCustomizadoSelect
                      tipo="unidade"
                      value={editValues.unidade}
                      onChange={(val) => setEditValues({ ...editValues, unidade: val })}
                      options={metaCampos.unidades}
                      hideSelect
                    />
                  </div>
                  <Input value={editValues.unidade} onChange={(e) => setEditValues({ ...editValues, unidade: e.target.value, objetivo: e.target.value === "%" ? "100" : editValues.objetivo })} placeholder="Personalizada..." className="h-7 text-[11px] border-none mt-1" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Valor Atual{editValues.unidade ? ` (${editValues.unidade})` : ""}</Label>
                    <Input type="number" value={editValues.atual} onChange={(e) => setEditValues({ ...editValues, atual: e.target.value })} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Objetivo{editValues.unidade ? ` (${editValues.unidade})` : ""} <span style={{fontWeight:400,opacity:0.6}}>(opcional)</span></Label>
                    <Input type="number" value={editValues.objetivo} onChange={(e) => setEditValues({ ...editValues, objetivo: e.target.value })} placeholder={editValues.unidade === "%" ? "100" : "Ex: 50"} className="h-8 text-[12px] border-none" style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }} />
                  </div>
                </div>
              </>
            )}

            {/* Dynamic fields */}
            {renderDynamicFields(editMetaToggles, editValues, (v) => setEditValues(v), categorias, metas, editingId, {
              ciclos: metaCampos.ciclos,
              etapas: metaCampos.etapas,
              adicionarCampo: metaCampos.adicionarCampo,
              removerCampo: metaCampos.removerCampo,
              customPorTipo: metaCampos.customPorTipo,
            }, usuariosDisponiveis)}

            {/* Inputs dos campos extras personalizados */}
            {metaCampos.camposExtras.filter(c => editCamposExtrasAtivos[c.valor]).map(campo => (
              <div key={campo.valor} className="space-y-1.5">
                <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>{campo.label || campo.valor}</Label>
                <Input
                  value={editValues[campo.valor] || ""}
                  onChange={(e) => setEditValues({ ...editValues, [campo.valor]: e.target.value })}
                  placeholder={`Preencha ${campo.label || campo.valor}...`}
                  className="h-8 text-[12px] border-none"
                  style={{ background: "hsl(var(--pbi-dark))", color: "hsl(var(--pbi-text-primary))" }}
                />
              </div>
            ))}

            {/* Campo de vínculo com obra no form de edição */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <Label className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                Tipo de meta / Obra vinculada
              </Label>
              {/* Botões de tipo */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { value: "", label: "🎯 Estratégica", desc: "Sem vínculo com obra" },
                  { value: "obra", label: "🏗️ De Obra", desc: "Vinculada a um empreendimento" },
                ].map(opt => {
                  const isSelected = opt.value === "obra"
                    ? !!editValues.obra_id
                    : !editValues.obra_id;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (opt.value === "") setEditValues({ ...editValues, obra_id: "" });
                      }}
                      className="flex flex-col items-start p-2.5 rounded-lg border text-left transition-all"
                      style={{
                        background: isSelected ? "hsl(var(--pbi-yellow), 0.12)" : "hsl(var(--pbi-dark))",
                        borderColor: isSelected ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-border))",
                      }}
                    >
                      <span className="text-[12px] font-semibold" style={{ color: "hsl(var(--pbi-text-primary))" }}>{opt.label}</span>
                      <span className="text-[10px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
              {/* Select de empreendimento */}
              <select
                value={editValues.obra_id || ""}
                onChange={(e) => {
                  const obraId = e.target.value;
                  const obra = obrasDisponiveis.find(o => o.id === obraId);
                  const sugs = sugestoesFase.filter(s => s.fase === obra?.etapa_atual);
                  const sel: Record<string, boolean> = {};
                  const val: Record<string, string>  = {};
                  sugs.forEach(s => { sel[s.id] = false; val[s.id] = ""; }); // desmarcadas por padrão na edição
                  setSelSugEdit(sel);
                  setValSugEdit(val);
                  setEditValues({ ...editValues, obra_id: obraId });
                }}
                className="w-full h-9 rounded-lg text-[12px] px-3 border outline-none transition-colors cursor-pointer"
                style={{
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                <option value="">— Sem vínculo (meta estratégica) —</option>
                {obrasDisponiveis.length === 0 && (
                  <option disabled value="__empty">Nenhum empreendimento cadastrado ainda</option>
                )}
                {obrasDisponiveis.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.nome}{o.etapa_atual ? ` · ${o.etapa_atual}` : ""}
                  </option>
                ))}
              </select>
              {obrasDisponiveis.length === 0 && (
                <p className="text-[10px] mt-1" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                  💡 Cadastre empreendimentos em <strong>Obras → Empreendimentos</strong> para vincular aqui.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { setEditDialogOpen(false); setEditingId(null); }} variant="outline" className="flex-1 h-8 text-[12px]">Cancelar</Button>
              <Button onClick={() => editingId && saveEdit(editingId)} className="flex-1 h-8 text-[12px] font-semibold bg-primary text-primary-foreground">
                <Check className="w-3.5 h-3.5 mr-1.5" /> Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
