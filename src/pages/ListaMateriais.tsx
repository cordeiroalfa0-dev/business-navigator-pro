import React, { useEffect, useState } from 'react'
import { materialService } from '../services/materialService'
import { Material, Destino } from '../types/material'
import { Search, Edit, Trash2, Eye, Package, Filter, LayoutGrid, List as ListIcon, ArrowRightLeft } from 'lucide-react'
import { ModalTransferencia } from '../components/materiais/ModalTransferencia'
import { ModalDetalhesMaterial } from '../components/materiais/ModalDetalhesMaterial'

export const ListaMateriais: React.FC = () => {
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroDestino, setFiltroDestino] = useState<Destino | ''>('')
  const [materialParaTransferir, setMaterialParaTransferir] = useState<Material | null>(null)
  const [materialParaVer, setMaterialParaVer] = useState<Material | null>(null)

  useEffect(() => {
    carregarMateriais()
  }, [search, filtroDestino])

  const carregarMateriais = async () => {
    try {
      const { data } = await materialService.listarMateriais({
        search,
        destino: filtroDestino || undefined
      })
      setMateriais(data || [])
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return
    try {
      await materialService.deletarMaterial(id)
      carregarMateriais()
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 md:py-40 gap-6">
        <div className="w-16 h-16 border-4 border-grafite-800 border-t-ciano-500 rounded-full animate-spin"></div>
        <p className="text-grafite-500 font-bold uppercase tracking-widest text-[10px]">Mapeando Inventário...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-ciano-500 rounded-full animate-pulse"></div>
            <span className="text-ciano-500 font-black uppercase tracking-[0.4em] text-[10px]">Ativos</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">Inventário <span className="text-grafite-600">Global</span></h2>
        </div>
        
        <div className="flex items-center gap-4 bg-grafite-900/50 p-2 rounded-2xl border border-grafite-800 self-start md:self-auto">
           <button className="p-2 md:p-2.5 bg-ciano-600 text-white rounded-xl shadow-lg shadow-ciano-900/20"><LayoutGrid size={18} /></button>
           <button className="p-2 md:p-2.5 text-grafite-500 hover:text-white transition-colors"><ListIcon size={18} /></button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-3xl flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-grafite-500 group-focus-within:text-ciano-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, código ou categoria..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-grafite-950/50 border border-grafite-800 rounded-2xl text-white placeholder:text-grafite-600 focus:border-ciano-500/50 focus:ring-0 transition-all font-medium text-sm"
          />
        </div>
        
        <div className="relative min-w-full lg:min-w-[240px]">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-grafite-500 pointer-events-none" size={18} />
          <select 
            value={filtroDestino} 
            onChange={(e) => setFiltroDestino(e.target.value as Destino | '')}
            className="w-full pl-14 pr-10 py-4 bg-grafite-950/50 border border-grafite-800 rounded-2xl text-white appearance-none focus:border-ciano-500/50 focus:ring-0 transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest cursor-pointer"
          >
            <option value="">Todos os Destinos</option>
            <option value="Almoxarifado">Almoxarifado</option>
            <option value="Palazzo Lumini">Palazzo Lumini</option>
            <option value="Queen Victoria">Queen Victoria</option>
            <option value="Chateau Carmelo">Chateau Carmelo</option>
          </select>
        </div>
      </div>

      {/* Grid de Materiais */}
      {materiais.length === 0 ? (
        <div className="glass-card py-20 md:py-32 rounded-3xl md:rounded-5xl text-center border-dashed border-2 border-grafite-800">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-grafite-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 md:w-12 md:h-12 text-grafite-700" />
          </div>
          <p className="text-grafite-600 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {materiais.map((material) => (
            <div 
              key={material.id} 
              onClick={() => setMaterialParaVer(material)}
              className="glass-card rounded-3xl md:rounded-4xl overflow-hidden group hover:border-ciano-500/40 transition-all duration-500 flex flex-col cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {material.fotos && material.fotos[0] ? (
                  <img 
                    src={material.fotos[0].url_imagem} 
                    alt={material.nome} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full bg-grafite-900 flex flex-col items-center justify-center gap-4">
                    <Package className="w-12 h-12 md:w-16 md:h-16 text-grafite-800" />
                    <span className="text-[8px] md:text-[10px] font-black text-grafite-700 uppercase tracking-[0.2em]">Sem Imagem Disponível</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                   <span className="px-2 md:px-3 py-1 md:py-1.5 bg-grafite-950/90 backdrop-blur-md border border-grafite-800 rounded-xl text-[8px] md:text-[9px] font-black text-ciano-500 uppercase tracking-widest shadow-2xl">
                     {material.codigo_remo}
                   </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-grafite-950 via-transparent to-transparent opacity-60"></div>
              </div>

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 bg-ciano-500 rounded-full"></span>
                    <span className="text-[9px] md:text-[10px] font-black text-grafite-500 uppercase tracking-widest">{material.categoria || 'Sem categoria'}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight uppercase group-hover:text-ciano-400 transition-colors truncate">{material.nome}</h3>
                </div>

                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  <div className="flex items-center justify-between p-3 bg-grafite-950/50 rounded-2xl border border-grafite-800/50">
                    <span className="text-[9px] md:text-[10px] font-bold text-grafite-600 uppercase tracking-widest">Localização</span>
                    <span className="text-[10px] md:text-xs font-black text-grafite-200 uppercase">{material.destino}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-grafite-950/50 rounded-2xl border border-grafite-800/50">
                    <span className="text-[9px] md:text-[10px] font-bold text-grafite-600 uppercase tracking-widest">Estoque</span>
                    <span className="text-[10px] md:text-xs font-black text-white">{material.quantidade} unidades</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 md:pt-6 border-t border-grafite-800/50 flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMaterialParaVer(material); }}
                      className="w-10 h-10 md:w-12 md:h-12 bg-grafite-800 hover:bg-ciano-950 hover:text-ciano-500 text-grafite-400 rounded-xl md:rounded-2xl transition-all flex items-center justify-center border border-grafite-700/50"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); /* Navegar para edição se necessário */ }}
                      className="w-10 h-10 md:w-12 md:h-12 bg-grafite-800 hover:bg-white hover:text-grafite-950 text-grafite-400 rounded-xl md:rounded-2xl transition-all flex items-center justify-center border border-grafite-700/50"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMaterialParaTransferir(material); }}
                      className="w-10 h-10 md:w-12 md:h-12 bg-grafite-800 hover:bg-ciano-500 hover:text-white text-grafite-400 rounded-xl md:rounded-2xl transition-all flex items-center justify-center border border-grafite-700/50"
                      title="Enviar para outro destino"
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(material.id, material.nome); }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-grafite-800 hover:bg-red-900/30 hover:text-red-500 text-grafite-600 rounded-xl md:rounded-2xl transition-all flex items-center justify-center border border-grafite-700/50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {materialParaTransferir && (
        <ModalTransferencia 
          material={materialParaTransferir}
          onClose={() => setMaterialParaTransferir(null)}
          onSuccess={() => {
            setMaterialParaTransferir(null)
            carregarMateriais()
          }}
        />
      )}

      {materialParaVer && (
        <ModalDetalhesMaterial 
          material={materialParaVer}
          onClose={() => setMaterialParaVer(null)}
        />
      )}
    </div>
  )
}
