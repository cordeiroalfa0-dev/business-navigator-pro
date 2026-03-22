import { LucideIcon } from "lucide-react";

export interface Meta {
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
}

export type MetaTipo = "quantitativa" | "qualitativa";

export interface FieldToggles {
  valores: boolean;
  responsavel: boolean;
  aprovador: boolean;
  equipe: boolean;
  departamento: boolean;
  prazo: boolean;
  data_inicio: boolean;
  ciclo: boolean;
  frequencia_checkin: boolean;
  orcamento: boolean;
  local_obra: boolean;
  etapa: boolean;
  fornecedor: boolean;
  marco_critico: boolean;
  descricao: boolean;
  observacoes: boolean;
  risco: boolean;
  impacto: boolean;
  dependencias: boolean;
  prioridade: boolean;
  peso: boolean;
  tags: boolean;
  indicador_chave: boolean;
  fonte_dados: boolean;
  categoria: boolean;
  metaPai: boolean;
}

export interface AcaoMeta {
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

export interface CheckIn {
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

export interface ConfigItem {
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}
