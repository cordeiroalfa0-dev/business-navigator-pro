import { supabase } from './supabase'
import { Envio, EnvioFormData } from '../types/material'
import { materialService } from './materialService'

export const envioService = {
  async criarEnvio(dados: EnvioFormData): Promise<void> {
    // 1. Registrar o envio na tabela 'envios'
    const { error } = await supabase
      .from('envios')
      .insert([{
        ...dados,
        usuario_id: dados.usuario_id,
        usuario_nome: dados.usuario_nome
      }])
    
    if (error) {
      console.error('Erro ao inserir na tabela envios:', error)
      throw error
    }

    // 2. Atualizar o destino do material original
    await materialService.atualizarMaterial(dados.material_id, {
      destino: dados.destino
    })

  },

  async criarEnviosEmLote(envios: EnvioFormData[]): Promise<void> {
    for (const envio of envios) {
      await this.criarEnvio(envio)
    }
  },

  async listarEnvios(): Promise<Envio[]> {
    const { data, error } = await supabase
      .from('envios')
      .select('*, material:materiais(*)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}
