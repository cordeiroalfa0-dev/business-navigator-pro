import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { materialService } from '../services/materialService'
import { fotoService } from '../services/fotoService'
import { Destino } from '../types/material'
import { useAuth } from '../contexts/AuthContext'
import { Upload, X, Save, ArrowLeft, Info, Image as ImageIcon, AlertCircle } from 'lucide-react'

export const AdicionarMaterial: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [codigoRemo, setCodigoRemo] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [destino] = useState<Destino>('Almoxarifado')
  const [quantidade, setQuantidade] = useState(1)
  const [categoria, setCategoria] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    carregarProximoCodigo()
  }, [])

  const carregarProximoCodigo = async () => {
    try {
      const codigo = await materialService.gerarProximoCodigoRemo()
      setCodigoRemo(codigo)
    } catch (error) {
      console.error('Erro ao gerar código:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const totalFotos = fotos.length + files.length
      
      if (totalFotos > 3) {
        alert('Você pode enviar no máximo 3 imagens por material.')
        const remainingSlots = 3 - fotos.length
        if (remainingSlots <= 0) return
        
        const allowedFiles = files.slice(0, remainingSlots)
        processFiles(allowedFiles)
      } else {
        processFiles(files)
      }
    }
  }

  const processFiles = (files: File[]) => {
    setFotos(prev => [...prev, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrls(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removerFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    setErrorMsg(null)
    
    try {
      const material = await materialService.criarMaterial({
        codigo_remo: codigoRemo,
        nome: nome.trim(),
        descricao: descricao.trim(),
        destino,
        quantidade,
        categoria: categoria.trim(),
        usuario_id: user?.id,
        usuario_nome: user?.name
      })
      
      if (fotos.length > 0) {
        try {
          await fotoService.uploadMultiplasFotos(fotos, material.id)
        } catch (fotoErr: any) {
          console.error('Material salvo, mas erro nas fotos:', fotoErr)
          alert('Material salvo, mas houve um erro ao enviar as fotos. Verifique se o bucket "fotos-materiais" existe no Supabase.')
        }
      }
      
      navigate('/lista')
    } catch (err: any) {
      console.error('Erro ao cadastrar:', err)
      setErrorMsg(err.message || 'Erro desconhecido ao salvar dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/lista')}
            className="group flex items-center gap-2 text-grafite-500 hover:text-ciano-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar ao Inventário</span>
          </button>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Novo <span className="text-grafite-600">Registro</span></h2>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-4 text-red-500 animate-shake">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-black uppercase tracking-widest text-[10px] md:text-xs mb-1">Erro na Persistência</p>
            <p className="text-xs md:text-sm font-medium opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="glass-card p-6 md:p-10 rounded-3xl md:rounded-5xl space-y-6 md:space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Info className="text-ciano-500 w-5 h-5" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Informações Essenciais</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Código de Controle</label>
                  <input type="text" value={codigoRemo} disabled className="w-full bg-grafite-950/50 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-ciano-500 font-black tracking-widest text-base md:text-lg cursor-not-allowed" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Categoria do Ativo</label>
                  <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Mobiliário" className="input-field text-xs md:text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Nome do Item *</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Nome identificador do material" className="input-field text-base md:text-lg font-bold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Quantidade Inicial *</label>
                  <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)} required className="input-field text-base md:text-lg font-bold" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Descrição Técnica</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} placeholder="Descreva detalhes, estado de conservação ou especificações..." className="input-field resize-none text-xs md:text-sm" />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-6 md:space-y-8">
            <div className="glass-card p-6 md:p-8 rounded-3xl md:rounded-5xl">
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="text-ciano-500 w-5 h-5" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Mídia</h3>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" id="file-upload" disabled={fotos.length >= 3} />
                  <label 
                    htmlFor="file-upload" 
                    className={`flex flex-col items-center justify-center border-2 border-dashed border-grafite-800 rounded-3xl md:rounded-4xl p-6 md:p-10 transition-all text-center group ${fotos.length >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:border-ciano-500/50 hover:bg-ciano-500/5 cursor-pointer'}`}
                  >
                    <Upload className={`w-10 h-10 md:w-12 md:h-12 mb-4 transition-colors ${fotos.length >= 3 ? 'text-grafite-800' : 'text-grafite-700 group-hover:text-ciano-500'}`} />
                    <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter">
                      {fotos.length >= 3 ? 'Limite de Imagens Atingido' : 'Upload de Imagens'}
                    </p>
                    <p className="text-[8px] md:text-[9px] text-grafite-600 mt-2 font-bold uppercase tracking-widest">
                      {fotos.length >= 3 ? 'Máximo de 3 fotos permitido' : `Selecionadas: ${fotos.length} de 3`}
                    </p>
                  </label>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-xl md:rounded-2xl aspect-square border border-grafite-800">
                        <img src={url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <button type="button" onClick={() => removerFoto(index)} className="absolute top-2 right-2 bg-red-500/90 text-white rounded-lg p-1 md:p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-red-600">
                          <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 md:py-5 text-xs md:text-sm uppercase tracking-[0.2em] justify-center">
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Confirmar Registro'}
              </button>
              <button type="button" onClick={() => navigate('/lista')} className="btn-secondary w-full py-4 md:py-5 text-xs md:text-sm uppercase tracking-[0.2em] justify-center">
                Descartar Alterações
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
