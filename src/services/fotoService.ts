import { supabase } from './supabase'
import { Foto } from '../types/material'

export const fotoService = {
  async uploadFoto(file: File, materialId: string, ordem: number): Promise<Foto> {
    // 1. Upload para Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${materialId}-${Date.now()}-${ordem}.${fileExt}`
    const filePath = `${materialId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('fotos-materiais')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro ao fazer upload da imagem:', uploadError)
      throw new Error(`Erro no Storage: ${uploadError.message}`)
    }

    // 2. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('fotos-materiais')
      .getPublicUrl(filePath)

    // 3. Salvar registro no banco
    const { data, error } = await supabase
      .from('fotos')
      .insert([{
        material_id: materialId,
        url_imagem: publicUrl,
        nome_arquivo: file.name,
        tamanho: file.size,
        ordem
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar registro da foto no banco:', error)
      throw new Error(`Erro ao salvar metadados da foto: ${error.message}`)
    }
    return data
  },

  async uploadMultiplasFotos(files: File[], materialId: string): Promise<Foto[]> {
    try {
      const uploadPromises = files.map((file, index) => 
        this.uploadFoto(file, materialId, index)
      )
      return await Promise.all(uploadPromises)
    } catch (err) {
      console.error('Erro no upload múltiplo:', err)
      throw err
    }
  },

  async deletarFoto(foto: Foto): Promise<void> {
    // 1. Deletar do Storage
    const urlParts = foto.url_imagem.split('/')
    const filePath = urlParts.slice(-2).join('/')
    
    const { error: storageError } = await supabase.storage
      .from('fotos-materiais')
      .remove([filePath])

    if (storageError) console.error('Erro ao deletar do storage:', storageError)

    // 2. Deletar registro do banco
    const { error } = await supabase
      .from('fotos')
      .delete()
      .eq('id', foto.id)

    if (error) throw error
  }
}