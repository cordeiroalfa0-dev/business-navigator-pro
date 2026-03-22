import { supabase } from './supabase'
import { Material, MaterialFormData, RelatorioFiltros } from '../types/material'

export const materialService = {
  async gerarProximoCodigoRemo(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('gerar_proximo_codigo_remo')
      if (error) {
        console.error('Erro RPC ao gerar código:', error)
        // Fallback caso a função RPC não exista
        const { data: lastItem } = await supabase
          .from('materiais')
          .select('codigo_remo')
          .order('codigo_remo', { ascending: false })
          .limit(1)
          .single()
        
        if (!lastItem) return 'REMO0001'
        const lastNum = parseInt(lastItem.codigo_remo.replace('REMO', ''))
        return `REMO${String(lastNum + 1).padStart(4, '0')}`
      }
      return data
    } catch (err) {
      console.error('Falha crítica ao gerar código:', err)
      return 'REMO0001'
    }
  },

  async criarMaterial(material: MaterialFormData & { codigo_remo: string }): Promise<Material> {
    const { data, error } = await supabase
      .from('materiais')
      .insert([material])
      .select()
      .single()
    
    if (error) {
      console.error('Erro detalhado ao inserir material:', error)
      throw new Error(`Erro ao salvar no banco: ${error.message}`)
    }
    return data
  },

  async listarMateriais(filtros?: { 
    destino?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: Material[], count: number }> {
    let query = supabase
      .from('materiais')
      .select('*, fotos(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filtros?.destino) {
      query = query.eq('destino', filtros.destino)
    }

    if (filtros?.search) {
      query = query.or(`nome.ilike.%${filtros.search}%,codigo_remo.ilike.%${filtros.search}%`)
    }

    const page = filtros?.page || 1
    const limit = filtros?.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  async buscarPorId(id: string): Promise<Material> {
    const { data, error } = await supabase
      .from('materiais')
      .select('*, fotos(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async atualizarMaterial(id: string, updates: Partial<MaterialFormData>): Promise<Material> {
    const { data, error } = await supabase
      .from('materiais')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deletarMaterial(id: string): Promise<void> {
    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async gerarRelatorio(filtros: RelatorioFiltros): Promise<Material[]> {
    let query = supabase
      .from('materiais')
      .select('*, fotos(*)')
      .order('created_at', { ascending: false })

    if (filtros.destino) {
      query = query.eq('destino', filtros.destino)
    }

    if (filtros.dataInicio) {
      query = query.gte('created_at', filtros.dataInicio)
    }

    if (filtros.dataFim) {
      query = query.lte('created_at', filtros.dataFim)
    }

    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }
}
