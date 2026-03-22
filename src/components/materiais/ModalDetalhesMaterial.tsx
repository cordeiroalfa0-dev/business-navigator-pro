import React, { useState } from 'react'
import { Material } from '../../types/material'
import { X, Package, ChevronLeft, ChevronRight, Info, MapPin, Box, Maximize2, Minimize2 } from 'lucide-react'

interface ModalDetalhesMaterialProps {
  material: Material
  onClose: () => void
}

export const ModalDetalhesMaterial: React.FC<ModalDetalhesMaterialProps> = ({ material, onClose }) => {
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [ajusteInteiro, setAjusteInteiro] = useState(false)
  const temFotos = material.fotos && material.fotos.length > 0

  const proximaFoto = () => {
    if (!temFotos) return
    setFotoAtiva((prev) => (prev + 1) % material.fotos!.length)
  }

  const fotoAnterior = () => {
    if (!temFotos) return
    setFotoAtiva((prev) => (prev - 1 + material.fotos!.length) % material.fotos!.length)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-grafite-950/90 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-3xl md:rounded-5xl flex flex-col md:flex-row border-grafite-800 shadow-2xl">
        
        {/* Lado Esquerdo: Galeria de Fotos */}
        <div className="w-full md:w-3/5 aspect-square md:aspect-auto relative bg-grafite-900 flex items-center justify-center border-b md:border-b-0 md:border-r border-grafite-800 overflow-hidden">
          {temFotos ? (
            <div className={`w-full h-full flex items-center justify-center overflow-auto custom-scrollbar ${ajusteInteiro ? 'p-4' : ''}`}>
              <img 
                src={material.fotos![fotoAtiva].url_imagem} 
                alt={material.nome} 
                className={`transition-all duration-300 ${ajusteInteiro ? 'max-w-full max-h-full object-contain' : 'min-w-full min-h-full object-cover cursor-zoom-in'}`}
                onClick={() => setAjusteInteiro(!ajusteInteiro)}
              />
              
              {/* Botão de Alternar Ajuste */}
              <button 
                onClick={() => setAjusteInteiro(!ajusteInteiro)}
                className="absolute top-4 right-4 w-10 h-10 bg-grafite-950/80 text-white rounded-xl flex items-center justify-center hover:bg-ciano-500 transition-all z-10 border border-grafite-800"
                title={ajusteInteiro ? "Ver em tamanho real / Rolagem" : "Ajustar para tela"}
              >
                {ajusteInteiro ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </button>

              {material.fotos!.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); fotoAnterior(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-grafite-950/80 text-white rounded-full flex items-center justify-center hover:bg-ciano-500 transition-colors z-10"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); proximaFoto(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-grafite-950/80 text-white rounded-full flex items-center justify-center hover:bg-ciano-500 transition-colors z-10"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {material.fotos!.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-all ${idx === fotoAtiva ? 'bg-ciano-500 w-4' : 'bg-grafite-700'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-grafite-700">
              <Package size={64} />
              <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagens</span>
            </div>
          )}
          
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 bg-grafite-950/90 border border-grafite-800 rounded-xl text-[10px] font-black text-ciano-500 uppercase tracking-widest">
              {material.codigo_remo}
            </span>
          </div>
        </div>

        {/* Lado Direito: Informações */}
        <div className="w-full md:w-2/5 p-6 md:p-10 overflow-y-auto flex flex-col bg-grafite-950/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-ciano-500 rounded-full"></span>
                <span className="text-[10px] font-black text-grafite-500 uppercase tracking-widest">
                  {material.categoria || 'Sem categoria'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                {material.nome}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-grafite-500 hover:text-white hover:bg-grafite-800 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Status e Localização */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-grafite-950/50 rounded-2xl border border-grafite-800/50">
                <div className="flex items-center gap-2 mb-1 text-grafite-600">
                  <MapPin size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Localização</span>
                </div>
                <p className="text-xs font-black text-white uppercase">{material.destino}</p>
              </div>
              <div className="p-4 bg-grafite-950/50 rounded-2xl border border-grafite-800/50">
                <div className="flex items-center gap-2 mb-1 text-grafite-600">
                  <Box size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Quantidade</span>
                </div>
                <p className="text-xs font-black text-white">{material.quantidade} unidades</p>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-ciano-500">
                <Info size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Descrição Técnica</h3>
              </div>
              <div className="p-6 bg-grafite-950/30 rounded-2xl border border-grafite-800/30 min-h-[120px]">
                <p className="text-sm text-grafite-300 leading-relaxed font-medium italic">
                  {material.descricao || 'Nenhuma descrição técnica fornecida para este item.'}
                </p>
              </div>
            </div>

            {/* Metadados */}
            <div className="pt-6 border-t border-grafite-800/50">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-grafite-600">Registrado por:</span>
                  <span className="text-grafite-400">{material.usuario_nome || 'Sistema'}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-grafite-600">Data do Registro:</span>
                  <span className="text-grafite-400">
                    {new Date(material.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-auto pt-8 w-full btn-primary py-4 text-[10px] uppercase tracking-[0.2em] justify-center"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  )
}
