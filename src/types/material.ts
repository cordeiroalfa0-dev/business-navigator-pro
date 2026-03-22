export interface Material {
  id: string
  codigo_remo: string
  nome: string
  descricao: string
  destino: Destino
  quantidade: number
  categoria: string
  created_at: string
  updated_at: string
  usuario_id?: string
  usuario_nome?: string
  fotos?: Foto[]
}

export interface Foto {
  id: string
  material_id: string
  url_imagem: string
  nome_arquivo: string
  tamanho: number
  ordem: number
  created_at: string
}

export type Destino = 'Almoxarifado' | 'Palazzo Lumini' | 'Queen Victoria' | 'Chateau Carmelo'

export interface MaterialFormData {
  nome: string
  descricao: string
  destino: Destino
  quantidade: number
  categoria: string
}

export interface RelatorioFiltros {
  destino?: Destino
  dataInicio?: string
  dataFim?: string
  categoria?: string
}

export interface EstatisticasDestino {
  'Almoxarifado': number; 'Palazzo Lumini': number
  'Queen Victoria': number
  'Chateau Carmelo': number
}

export interface Envio {
  id: string
  material_id: string
  origem: Destino
  destino: Destino
  quantidade: number
  observacao?: string
  usuario_id?: string
  usuario_nome?: string
  created_at: string
  material?: Material
}

export interface EnvioFormData {
  material_id: string
  origem: Destino
  destino: Destino
  quantidade: number
  observacao?: string
  usuario_id?: string
  usuario_nome?: string
}
