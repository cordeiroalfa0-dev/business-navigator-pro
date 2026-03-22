import { supabase } from '@/integrations/supabase/client'

export interface FotoUpload {
  url: string
  nome_arquivo: string
  tamanho: number
}

export const fotoService = {
  /**
   * Faz upload de uma foto para o bucket 'fotos-materiais' e retorna a URL pública.
   * Não salva metadados em banco — a URL é salva junto ao registro do material.
   */
  async uploadFoto(file: File, materialId: string, ordem: number): Promise<FotoUpload> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${materialId}-${Date.now()}-${ordem}.${fileExt}`
    const filePath = `${materialId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('fotos-materiais')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('fotos-materiais')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      nome_arquivo: file.name,
      tamanho: file.size,
    }
  },

  async uploadMultiplasFotos(files: File[], materialId: string): Promise<FotoUpload[]> {
    return Promise.all(files.map((file, index) => this.uploadFoto(file, materialId, index)))
  },

  async deletarFoto(url: string): Promise<void> {
    // Extrai o path relativo da URL pública
    const urlParts = url.split('/fotos-materiais/')
    if (urlParts.length < 2) return
    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from('fotos-materiais')
      .remove([filePath])

    if (error) console.error('Erro ao deletar foto do storage:', error)
  }
}
