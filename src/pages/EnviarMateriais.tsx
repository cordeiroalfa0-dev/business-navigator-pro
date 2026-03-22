import React, { useState, useEffect } from 'react'
import { materialService } from '../services/materialService'
import { envioService } from '../services/envioService'
import { Material, Destino, EnvioFormData } from '../types/material'
import { useAuth } from '../contexts/AuthContext'
import { Search, Package, Send, CheckCircle2, Circle, Info, Minus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const EnviarMateriais: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selecionados, setSelecionados] = useState<Record<string, number>>({})
  const [destino, setDestino] = useState<Destino>('Palazzo Lumini')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    carregarMateriais()
  }, [])

  const carregarMateriais = async () => {
    try {
      const { data } = await materialService.listarMateriais()
      setMateriais(data || [])
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => {
      const novo = { ...prev }
      if (novo[id]) {
        delete novo[id]
      } else {
        novo[id] = 1
      }
      return novo
    })
  }

  const ajustarQuantidade = (id: string, delta: number, max: number) => {
    setSelecionados(prev => {
      const atual = prev[id] || 0
      const nova = Math.max(1, Math.min(max, atual + delta))
      return { ...prev, [id]: nova }
    })
  }

  const handleEnviar = async () => {
    const ids = Object.keys(selecionados)
    if (ids.length === 0) return
    setEnviando(true)
    try {
      const envios: EnvioFormData[] = ids.map(id => {
        const material = materiais.find(m => m.id === id)!
        return {
          material_id: id,
          origem: material.destino,
          destino: destino,
          quantidade: selecionados[id],
          observacao: observacao,
          usuario_id: user?.id,
          usuario_nome: user?.name
        }
      })

      await envioService.criarEnviosEmLote(envios)
      alert('Envio realizado com sucesso!')
      navigate('/lista')
    } catch (error: any) {
      console.error('Erro detalhado ao enviar:', error)
      const mensagemErro = error.message || 'Erro desconhecido'
      alert(`Erro ao processar o envio: ${mensagemErro}`)
    } finally {
      setEnviando(false)
    }
  }

  const materiaisFiltrados = materiais.filter(m => 
    m.nome.toLowerCase().includes(search.toLowerCase()) || 
    m.codigo_remo.toLowerCase().includes(search.toLowerCase())
  )

  const totalItensSelecionados = Object.keys(selecionados).length

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Enviar <span className="text-grafite-600">Materiais</span></h2>
          <p className="text-grafite-500 font-bold uppercase tracking-widest text-[10px] mt-2">Selecione os itens e defina a quantidade para envio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Coluna de Seleção */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-grafite-500 group-focus-within:text-ciano-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar material para enviar..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-grafite-900/50 border border-grafite-800 rounded-2xl text-white placeholder:text-grafite-600 focus:border-ciano-500/50 transition-all"
            />
          </div>

          <div className="glass-card rounded-4xl overflow-hidden border border-grafite-800">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-20 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-ciano-500 mx-auto"></div>
                </div>
              ) : materiaisFiltrados.length === 0 ? (
                <div className="p-20 text-center text-grafite-600 uppercase font-black text-xs tracking-widest">
                  Nenhum material disponível
                </div>
              ) : (
                <div className="divide-y divide-grafite-800/50">
                  {materiaisFiltrados.map((m) => {
                    const isSelecionado = !!selecionados[m.id]
                    return (
                      <div 
                        key={m.id} 
                        className={`p-6 flex items-center gap-6 transition-all ${isSelecionado ? 'bg-ciano-500/5' : 'hover:bg-grafite-800/30'}`}
                      >
                        <div className="shrink-0 cursor-pointer" onClick={() => toggleSelecao(m.id)}>
                          {isSelecionado ? (
                            <CheckCircle2 className="w-6 h-6 text-ciano-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-grafite-700" />
                          )}
                        </div>
                        <div className="w-12 h-12 bg-grafite-900 rounded-xl flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-grafite-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-ciano-500 uppercase tracking-widest">{m.codigo_remo}</p>
                          <h4 className="text-sm font-black text-white uppercase">{m.nome}</h4>
                          <p className="text-[10px] font-bold text-grafite-500 uppercase">Local: {m.destino}</p>
                        </div>
                        
                        {isSelecionado ? (
                          <div className="flex items-center gap-4 bg-grafite-950 p-2 rounded-xl border border-grafite-800">
                            <button 
                              onClick={() => ajustarQuantidade(m.id, -1, m.quantidade)}
                              className="w-8 h-8 flex items-center justify-center bg-grafite-800 text-white rounded-lg hover:bg-grafite-700 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="flex flex-col items-center min-w-[40px]">
                              <span className="text-xs font-black text-white">{selecionados[m.id]}</span>
                              <span className="text-[8px] font-bold text-grafite-600 uppercase">de {m.quantidade}</span>
                            </div>
                            <button 
                              onClick={() => ajustarQuantidade(m.id, 1, m.quantidade)}
                              className="w-8 h-8 flex items-center justify-center bg-grafite-800 text-white rounded-lg hover:bg-grafite-700 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs font-black text-grafite-600 uppercase tracking-widest">Disponível</span>
                            <p className="text-xs font-black text-white">{m.quantidade} un</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna de Configuração do Envio */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-4xl border border-grafite-800 sticky top-32">
            <div className="flex items-center gap-3 mb-8">
              <Info className="text-ciano-500 w-5 h-5" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Configurar Envio</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Destino Final</label>
                <select 
                  value={destino} 
                  onChange={(e) => setDestino(e.target.value as Destino)}
                  className="w-full bg-grafite-950 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none cursor-pointer focus:border-ciano-500/50 transition-all"
                >
                  <option value="Almoxarifado">Almoxarifado</option>
                  <option value="Palazzo Lumini">Palazzo Lumini</option>
                  <option value="Queen Victoria">Queen Victoria</option>
                  <option value="Chateau Carmelo">Chateau Carmelo</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Observação</label>
                <textarea 
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Motivo do envio..."
                  className="w-full bg-grafite-950 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white font-medium resize-none focus:border-ciano-500/50 transition-all"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-grafite-800/50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-grafite-500 uppercase tracking-widest">Itens Selecionados</span>
                  <span className="text-lg font-black text-ciano-500">{totalItensSelecionados}</span>
                </div>

                <button 
                  onClick={handleEnviar}
                  disabled={totalItensSelecionados === 0 || enviando}
                  className="w-full py-5 bg-ciano-600 hover:bg-ciano-500 disabled:bg-grafite-800 disabled:text-grafite-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-lg shadow-ciano-900/20 flex items-center justify-center gap-3"
                >
                  {enviando ? 'Processando...' : (
                    <>
                      <Send size={18} />
                      Confirmar Envio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
