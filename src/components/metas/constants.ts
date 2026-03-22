import { 
  Flame, AlertTriangle, Clock, CheckCircle2, XCircle, Trophy 
} from "lucide-react";
import { FieldToggles, ConfigItem } from "./types";

export const defaultTogglesQuant: FieldToggles = {
  valores: true, responsavel: true, aprovador: false, equipe: false, departamento: false,
  prazo: false, data_inicio: false, ciclo: true, frequencia_checkin: false,
  orcamento: false, local_obra: false, etapa: false, fornecedor: false, marco_critico: false,
  descricao: false, observacoes: false, risco: false, impacto: false, dependencias: false,
  prioridade: true, peso: false, tags: false, indicador_chave: false, fonte_dados: false,
  categoria: true, metaPai: false,
};

export const defaultTogglesQual: FieldToggles = {
  valores: false, responsavel: true, aprovador: false, equipe: false, departamento: false,
  prazo: true, data_inicio: false, ciclo: false, frequencia_checkin: false,
  orcamento: false, local_obra: false, etapa: false, fornecedor: false, marco_critico: false,
  descricao: true, observacoes: false, risco: false, impacto: false, dependencias: false,
  prioridade: true, peso: false, tags: false, indicador_chave: false, fonte_dados: false,
  categoria: true, metaPai: false,
};

export const fieldSections = [
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

export const frequenciasCheckin = ["diário", "semanal", "quinzenal", "mensal"];
export const etapasPreset = ["Planejamento", "Fundação", "Estrutura", "Alvenaria", "Elétrica", "Hidráulica", "Acabamento", "Entrega", "Em andamento", "Concluído"];

export const coresMeta = [
  "hsl(207, 89%, 48%)", "hsl(45, 100%, 51%)", "hsl(152, 60%, 38%)",
  "hsl(174, 62%, 47%)", "hsl(0, 72%, 51%)", "hsl(28, 87%, 55%)",
  "hsl(270, 60%, 55%)", "hsl(330, 70%, 50%)",
];

export const categoriasBase = ["Financeiro", "Vendas", "Operacional", "Qualidade", "RH", "Engenharia", "Construção", "Projetos"];
export const ciclosDisponiveis = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Anual 2026"];

export const unidadesPreset = [
  { value: "R$", label: "R$ (Reais)" },
  { value: "%", label: "% (Percentual)" },
  { value: "dias", label: "Dias" },
  { value: "un", label: "Unidades" },
  { value: "horas", label: "Horas" },
  { value: "m²", label: "m² (Metros²)" },
  { value: "kg", label: "Kg" },
  { value: "tarefas", label: "Tarefas" },
];

export const prioridadeConfig: Record<string, ConfigItem> = {
  alta: { label: "Alta", color: "hsl(0, 72%, 51%)", bg: "hsl(0, 72%, 51%, 0.12)", icon: Flame },
  media: { label: "Média", color: "hsl(45, 100%, 51%)", bg: "hsl(45, 100%, 51%, 0.12)", icon: AlertTriangle },
  baixa: { label: "Baixa", color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.12)", icon: Clock },
};

export const statusConfig: Record<string, ConfigItem> = {
  no_prazo: { label: "No Prazo", color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.12)", icon: CheckCircle2 },
  atencao: { label: "Atenção", color: "hsl(45, 100%, 51%)", bg: "hsl(45, 100%, 51%, 0.12)", icon: AlertTriangle },
  em_risco: { label: "Em Risco", color: "hsl(0, 72%, 51%)", bg: "hsl(0, 72%, 51%, 0.12)", icon: XCircle },
  atingida: { label: "Atingida", color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.12)", icon: Trophy },
};
