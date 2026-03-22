import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, TrendingDown, Link2, Calendar, Zap } from "lucide-react";

interface MetaComPrediction {
  id: string;
  nome: string;
  atual: number;
  objetivo: number;
  prazo: string;
  status: string;
  prediction?: {
    data_estimada_conclusao: string;
    margem_risco: string;
    dias_atraso_estimado: number;
    velocidade_media: number;
    confianca_predicao: number;
  };
  dependencias?: Array<{
    id: string;
    meta_dependente: string;
    dependency_type: string;
  }>;
}

export default function MetasAvancadas() {
  const { isAdmin, userRole, loading: authLoading } = useAuth();
  const canView = isAdmin || userRole === "master";
  const [metas, setMetas] = useState<MetaComPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<MetaComPrediction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => { fetchMetasComPredictions(); }, [fetchMetasComPredictions]);

  useRealtimeTable("metas", fetchMetasComPredictions);
  useRealtimeTable("meta_predictions", fetchMetasComPredictions);
  useRealtimeTable("meta_dependencies", fetchMetasComPredictions);

  const fetchMetasComPredictions = useCallback(async () => {
    setLoading(true);
    const { data: metasData } = await supabase.from("metas").select("*").order("created_at", { ascending: false });

    if (metasData) {
      const metasComPredictions = await Promise.all(
        metasData.map(async (meta) => {
          const { data: predictionData } = await supabase
            .from("meta_predictions")
            .select("*")
            .eq("meta_id", meta.id)
            .order("data_analise", { ascending: false })
            .limit(1);

          const { data: dependenciesData } = await supabase
            .from("meta_dependencies")
            .select("*")
            .eq("meta_id", meta.id);

          return {
            ...meta,
            prediction: predictionData?.[0],
            dependencias: dependenciesData,
          };
        })
      );

      setMetas(metasComPredictions);
    }
    setLoading(false);
  }, []);

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case "baixo":
        return "bg-green-600";
      case "medio":
        return "bg-yellow-600";
      case "alto":
        return "bg-orange-600";
      case "critico":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getRiscoLabel = (risco: string) => {
    switch (risco) {
      case "baixo":
        return "✅ Baixo Risco";
      case "medio":
        return "⚠️ Risco Médio";
      case "alto":
        return "🔴 Alto Risco";
      case "critico":
        return "🚨 Crítico";
      default:
        return risco;
    }
  };

  const metasComRisco = metas.filter((m) => m.prediction?.margem_risco !== "baixo");

  if (!authLoading && !canView) return <AccessDenied requiredRole="Admin ou Master" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <Zap className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Metas Avançadas</h1>
          <p className="text-xs text-slate-500">Análise preditiva, dependências e riscos</p>
        </div>
      </div>

      {/* Alertas Críticos */}
      {metasComRisco.length > 0 && (
        <Card className="bg-red-950/30 border-red-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" /> {metasComRisco.length} Meta(s) em Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metasComRisco.slice(0, 5).map((meta) => (
                <div key={meta.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-red-800/30">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{meta.nome}</p>
                    <p className="text-xs text-slate-400">
                      {meta.prediction?.dias_atraso_estimado} dias de atraso estimado
                    </p>
                  </div>
                  <Badge className={getRiscoColor(meta.prediction?.margem_risco || "")}>
                    {getRiscoLabel(meta.prediction?.margem_risco || "")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de Metas */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metas.map((meta) => (
            <Card key={meta.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer" onClick={() => { setSelectedMeta(meta); setShowDetails(true); }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm flex-1">{meta.nome}</CardTitle>
                  {meta.prediction && (
                    <Badge className={getRiscoColor(meta.prediction.margem_risco)}>
                      {meta.prediction.margem_risco}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progresso */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Progresso</span>
                    <span className="text-sm font-bold">{meta.atual}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${meta.atual}%` }}
                    />
                  </div>
                </div>

                {/* Previsão */}
                {meta.prediction && (
                  <div className="bg-slate-800/50 p-2 rounded text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Estimado:</span>
                      <span className="font-semibold">
                        {new Date(meta.prediction.data_estimada_conclusao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Velocidade:</span>
                      <span className="font-semibold">{meta.prediction.velocidade_media?.toFixed(2)}%/dia</span>
                    </div>
                    {meta.prediction.dias_atraso_estimado > 0 && (
                      <div className="text-red-400">
                        ⚠️ {meta.prediction.dias_atraso_estimado} dias de atraso estimado
                      </div>
                    )}
                  </div>
                )}

                {/* Dependências */}
                {meta.dependencias && meta.dependencias.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Link2 className="w-3 h-3" />
                    <span>{meta.dependencias.length} dependência(s)</span>
                  </div>
                )}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMeta(meta);
                    setShowDetails(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMeta?.nome}</DialogTitle>
          </DialogHeader>

          {selectedMeta && (
            <div className="space-y-6 py-4">
              {/* Análise Preditiva */}
              {selectedMeta.prediction && (
                <div className="space-y-3 bg-slate-800/50 p-4 rounded border border-slate-700">
                  <h3 className="font-bold text-sm">Análise Preditiva</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1">Data Estimada</p>
                      <p className="text-lg font-bold">
                        {new Date(selectedMeta.prediction.data_estimada_conclusao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1">Margem de Risco</p>
                      <Badge className={getRiscoColor(selectedMeta.prediction.margem_risco)}>
                        {getRiscoLabel(selectedMeta.prediction.margem_risco)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1">Velocidade Média</p>
                      <p className="text-lg font-bold">{selectedMeta.prediction.velocidade_media?.toFixed(2)}%/dia</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1">Confiança</p>
                      <p className="text-lg font-bold">{selectedMeta.prediction.confianca_predicao}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dependências */}
              {selectedMeta.dependencias && selectedMeta.dependencias.length > 0 && (
                <div className="space-y-3 bg-slate-800/50 p-4 rounded border border-slate-700">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Dependências
                  </h3>
                  <div className="space-y-2">
                    {selectedMeta.dependencias.map((dep) => (
                      <div key={dep.id} className="text-sm p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-slate-300">{dep.meta_dependente}</p>
                        <p className="text-xs text-slate-500 mt-1">Tipo: {dep.dependency_type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
