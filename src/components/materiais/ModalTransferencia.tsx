import React, { useState } from 'react'
import { Material, Destino } from '../../types/material'
import { envioService } from '../../services/envioService'
import { X, ArrowRightLeft, Send, Package } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface ModalTransferenciaProps {
  material: Material
  onClose: () => void
  onSuccess: () => void
}

export const ModalTransferencia: React.FC<ModalTransferenciaProps> = ({ material, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [destino, setDestino] = useState<Destino>(
    material.destino === 'Almoxarifado' ? 'Palazzo Lumini' : 'Almoxarifado'
  )
  const [quantidade, setQuantidade] = useState(material.quantidade)
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await envioService.criarEnvio({
        material_id: material.id,
        origem: material.destino,
        destino,
        quantidade,
        observacao,
        usuario_id: user?.id,
        usuario_nome: user?.name
      })
      onSuccess()
    } catch (error) {
      console.error('Erro ao transferir:', error)
      alert('Erro ao realizar o envio.')
    } finally {
      setLoading(false)
    }
  }

  const destinosDisponiveis: Destino[] = [
    'Almoxarifado',
    'Palazzo Lumini',
    'Queen Victoria',
    'Chateau Carmelo'
  ].filter(d => d !== material.destino) as Destino[]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-grafite-950/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl bg-grafite-900 border border-grafite-800 rounded-5xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-8 border-b border-grafite-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ciano-500/10 rounded-2xl flex items-center justify-center">
              <ArrowRightLeft className="text-ciano-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Enviar Item</h3>
              <p className="text-[10px] font-bold text-grafite-500 uppercase tracking-widest">Movimentação de Ativo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-grafite-800 rounded-xl transition-colors text-grafite-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="bg-grafite-950/50 p-6 rounded-3xl border border-grafite-800/50 flex items-center gap-6">
            <div className="w-16 h-16 bg-grafite-900 rounded-2xl flex items-center justify-center shrink-0">
              <Package className="w-8 h-8 text-grafite-700" />
            </div>
            <div>
              <p className="text-[9px] font-black text-ciano-500 uppercase tracking-widest mb-1">{material.codigo_remo}</p>
              <h4 className="text-lg font-black text-white uppercase">{material.nome}</h4>
              <p className="text-xs font-bold text-grafite-500 uppercase">Local Atual: {material.destino}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Novo Destino</label>
              <select 
                value={destino} 
                onChange={(e) => setDestino(e.target.value as Destino)}
                className="w-full bg-grafite-950 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white font-bold appearance-none cursor-pointer focus:border-ciano-500/50 transition-all"
              >
                {destinosDisponiveis.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Quantidade</label>
              <input 
                type="number" 
                value={quantidade} 
                max={material.quantidade}
                min={1}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                className="w-full bg-grafite-950 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white font-black focus:border-ciano-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">Observação do Envio</label>
            <textarea 
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da movimentação ou detalhes adicionais..."
              className="w-full bg-grafite-950 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white font-medium resize-none focus:border-ciano-500/50 transition-all"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-grafite-800 hover:bg-grafite-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-4 bg-ciano-600 hover:bg-ciano-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-ciano-900/20 flex items-center justify-center gap-2">
              <Send size={16} />
              {loading ? 'Enviando...' : 'Confirmar Envio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
