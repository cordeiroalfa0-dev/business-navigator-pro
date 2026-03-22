import React, { useState, useEffect } from 'react'
import { envioService } from '../services/envioService'
import { Envio } from '../types/material'
import { ArrowRightLeft, Calendar, Package, History, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const Transferencias: React.FC = () => {
  const [transferencias, setEnvios] = useState<Envio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarEnvios()
  }, [])

  const carregarEnvios = async () => {
    try {
      const data = await envioService.listarEnvios()
      setEnvios(data)
    } catch (error) {
      console.error('Erro ao carregar transferências:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Histórico de <span className="text-grafite-600">Envios</span></h2>
          <p className="text-grafite-500 font-bold uppercase tracking-widest text-[10px] mt-2">Rastreamento de movimentação entre unidades</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ciano-500"></div>
        </div>
      ) : transferencias.length === 0 ? (
        <div className="glass-card p-20 rounded-5xl text-center">
          <History className="w-16 h-16 text-grafite-800 mx-auto mb-6" />
          <p className="text-grafite-500 font-black uppercase tracking-widest">Nenhum envio registrado</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {transferencias.map((t) => (
            <div key={t.id} className="glass-card p-8 rounded-4xl border border-grafite-800/50 hover:border-ciano-500/30 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-grafite-900 flex items-center justify-center shrink-0 group-hover:bg-ciano-500/10 transition-colors">
                    <Package className="w-8 h-8 text-grafite-600 group-hover:text-ciano-500 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t.material?.nome || 'Item Removido'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-ciano-500 uppercase tracking-widest bg-ciano-500/10 px-2 py-0.5 rounded-md">
                        {t.material?.codigo_remo || 'N/A'}
                      </span>
                      <span className="text-[10px] font-black text-grafite-500 uppercase tracking-widest">
                        Qtd: {t.quantidade}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <div className="flex-1 text-right">
                    <p className="text-[9px] font-black text-grafite-600 uppercase tracking-widest mb-1">Origem</p>
                    <p className="text-sm font-bold text-white">{t.origem}</p>
                  </div>
                  <div className="px-4">
                    <ArrowRightLeft className="w-5 h-5 text-ciano-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-grafite-600 uppercase tracking-widest mb-1">Destino</p>
                    <p className="text-sm font-bold text-white">{t.destino}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-2 text-grafite-500 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {format(new Date(t.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-grafite-600 uppercase tracking-widest">
                    {format(new Date(t.created_at), "HH:mm")}
                  </p>
                  <div className="flex items-center justify-end gap-2 text-ciano-500 mt-2">
                    <User className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {t.usuario_nome || 'Sistema'}
                    </span>
                  </div>
                </div>
              </div>
              {t.observacao && (
                <div className="mt-6 pt-6 border-t border-grafite-800/50">
                  <p className="text-[9px] font-black text-grafite-600 uppercase tracking-widest mb-2">Observação</p>
                  <p className="text-sm text-grafite-400 italic">"{t.observacao}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
