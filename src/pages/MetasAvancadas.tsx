import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, TrendingDown, Link2, Calendar, Zap, TrendingUp, BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
    depends_on_meta_id: string;
    dependency_type: string;
    is_critical: boolean;
  }>;
}

const RISCO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  baixo:   { label: "Baixo",   color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.12)" },
  medio:   { label: "Médio",   color: "hsl(42, 65%, 56%)", bg: "hsl(45, 100%, 51%, 0.12)" },
  alto:    { label: "Alto",    color: "hsl(0, 72%, 51%)",   bg: "hsl(0, 72%, 51%, 0.12)"   },
  critico: { label: "Crítico", color: "hsl(0, 72%, 51%)",   bg: "hsl(0, 72%, 51%, 0.18)"   },
};

export default function MetasAvancadas() {
  const { isAdmin, userRole, loading: authLoading } = useAuth();
  const canView = isAdmin || userRole === "master";
  const [metas, setMetas] = useState<MetaComPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<MetaComPrediction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"predicoes" | "historico">("predicoes");
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [metaSnapSelecionada, setMetaSnapSelecionada] = useState<string>("");

  // ✅ CORRIGIDO: useCallback declarado ANTES do useEffect
  // ✅ CORRIGIDO: N+1 resolvido — busca tudo em 3 queries paralelas, sem loop
  const fetchSnapshots = useCallback(async (metaId?: string) => {
    setLoadingSnaps(true);
    let query = supabase
      .from("meta_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: true })
      .limit(200);
    if (metaId) query = query.eq("meta_id", metaId);
    const { data } = await query;
    setSnapshots(data ?? []);
    setLoadingSnaps(false);
  }, []);

  const fetchMetasComPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: metasData },
        { data: predictionsData },
        { data: depsData },
      ] = await Promise.all([
        supabase.from("metas").select("*").order("created_at", { ascending: false }),
        supabase.from("meta_predictions").select("*").order("data_analise", { ascending: false }),
        supabase.from("meta_dependencies").select("*"),
      ]);

      if (!metasData) { setLoading(false); return; }

      // Montar mapa de predictions por meta_id (pega a mais recente)
      const predictionsMap: Record<string, any> = {};
      for (const p of predictionsData ?? []) {
        if (!predictionsMap[p.meta_id]) predictionsMap[p.meta_id] = p;
      }

      // Montar mapa de dependências por meta_id
      const depsMap: Record<string, any[]> = {};
      for (const d of depsData ?? []) {
        if (!depsMap[d.meta_id]) depsMap[d.meta_id] = [];
        depsMap[d.meta_id].push(d);
      }

      const metasComPredictions: MetaComPrediction[] = metasData.map((meta) => ({
        id: meta.id,
        nome: meta.nome,
        atual: Number(meta.atual),
        objetivo: Number(meta.objetivo),
        prazo: meta.prazo,
        status: meta.status,
        prediction: predictionsMap[meta.id] ?? undefined,
        dependencias: depsMap[meta.id] ?? [],
      }));

      setMetas(metasComPredictions);
    } catch (err) {
      console.error("Erro ao carregar metas avançadas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ useEffect agora vem DEPOIS do useCallback
  useEffect(() => { fetchMetasComPredictions(); }, [fetchMetasComPredictions]);

  useRealtimeTable("metas", fetchMetasComPredictions);
  useRealtimeTable("meta_predictions", fetchMetasComPredictions);
  useRealtimeTable("meta_dependencies", fetchMetasComPredictions);

  if (authLoading) return null;
  if (!canView) return <AccessDenied />;

  const metasEmRisco = metas.filter(
    (m) => m.prediction?.margem_risco === "alto" || m.prediction?.margem_risco === "critico"
  );
  const metasAtrasadas = metas.filter(
    (m) => m.prediction?.dias_atraso_estimado && m.prediction.dias_atraso_estimado > 0
  );
  const metasComDeps = metas.filter((m) => (m.dependencias?.length ?? 0) > 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Metas",       value: metas.length,          color: "hsl(207, 89%, 48%)", icon: Zap },
          { label: "Com Predição",      value: metas.filter(m => m.prediction).length, color: "hsl(174, 62%, 47%)", icon: TrendingDown },
          { label: "Em Risco/Crítico",  value: metasEmRisco.length,   color: "hsl(0, 72%, 51%)",   icon: AlertTriangle },
          { label: "Com Dependências",  value: metasComDeps.length,   color: "hsl(42, 65%, 56%)", icon: Link2 },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="pbi-tile">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded" style={{ backgroundColor: `${kpi.color}1F` }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Abas: Predições | Evolução Histórica */}
      <div className="flex gap-2">
        {[
          { key: "predicoes", label: "Predições e Dependências", icon: TrendingDown },
          { key: "historico", label: `Evolução Histórica ${snapshots.length > 0 ? `(${[...new Set(snapshots.map((s:any) => s.snapshot_date))].length} semanas)` : ""}`, icon: TrendingUp },
        ].map((aba) => {
          const Icon = aba.icon;
          return (
            <button key={aba.key} onClick={() => setAbaAtiva(aba.key as any)}
              className="flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-medium transition-all"
              style={{
                background: abaAtiva === aba.key ? "hsl(42, 65%, 56%)" : "hsl(var(--secondary))",
                color: abaAtiva === aba.key ? "hsl(var(--pbi-dark))" : "hsl(var(--muted-foreground))",
              }}>
              <Icon className="w-3.5 h-3.5" /> {aba.label}
            </button>
          );
        })}
      </div>

      {/* ── ABA: EVOLUÇÃO HISTÓRICA ── */}
      {abaAtiva === "historico" && (
        <div className="space-y-4">
          {snapshots.length === 0 ? (
            <div className="pbi-tile text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(42,65%,56%,0.1)" }}>
                <BarChart2 className="w-6 h-6" style={{ color: "hsl(42,65%,56%)" }} />
              </div>
              <p className="text-[13px] font-semibold text-foreground">Nenhum snapshot ainda</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Os snapshots são gerados automaticamente toda semana pela edge function
                <strong> create-meta-snapshots</strong>. Configure o agendamento no Supabase Dashboard
                em Edge Functions → create-meta-snapshots → Schedule:
                <code className="block mt-1 text-[10px] bg-secondary px-2 py-1 rounded">0 8 * * 1</code>
                (toda segunda às 08:00)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Seletor de meta */}
              <div className="pbi-tile">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-[11px] text-muted-foreground">Meta:</label>
                  <select
                    value={metaSnapSelecionada}
                    onChange={e => { setMetaSnapSelecionada(e.target.value); fetchSnapshots(e.target.value || undefined); }}
                    className="h-8 px-2 rounded text-[12px] border border-border bg-secondary text-foreground focus:outline-none"
                    style={{ minWidth: 220 }}
                  >
                    <option value="">Todas as metas</option>
                    {metas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  {loadingSnaps && <span className="text-[11px] text-muted-foreground">Carregando...</span>}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {[...new Set(snapshots.map((s:any) => s.meta_id))].length} metas ·{" "}
                    {[...new Set(snapshots.map((s:any) => s.snapshot_date))].length} semanas
                  </span>
                </div>
              </div>

              {/* Gráfico de evolução */}
              {(() => {
                // Agrupar snapshots por data, calcular média de percentual
                const datas = [...new Set(snapshots.map((s:any) => s.snapshot_date))].sort();
                const metasUnicas = [...new Set(snapshots.map((s:any) => s.meta_id))];
                const cores = ["hsl(207,89%,48%)","hsl(42,65%,56%)","hsl(152,60%,38%)","hsl(174,62%,47%)","hsl(0,72%,51%)","hsl(271,60%,55%)"];

                // Dados para recharts: [{date, meta1_pct, meta2_pct...}]
                const chartData = datas.map(dt => {
                  const row: any = { data: dt.slice(5) }; // MM-DD
                  metasUnicas.forEach(mid => {
                    const snap = snapshots.find((s:any) => s.meta_id === mid && s.snapshot_date === dt);
                    const nome = snap?.nome || mid.slice(0,8);
                    const key = nome.length > 20 ? nome.slice(0,18)+"…" : nome;
                    row[key] = snap ? (snap.percentual_concluido ?? (snap.objetivo > 0 ? Math.round((snap.atual/snap.objetivo)*100) : 0)) : null;
                  });
                  return row;
                });

                const linhas = metasUnicas.map((mid, idx) => {
                  const snap = snapshots.find((s:any) => s.meta_id === mid);
                  const nome = snap?.nome || mid.slice(0,8);
                  const key = nome.length > 20 ? nome.slice(0,18)+"…" : nome;
                  return { key, cor: cores[idx % cores.length] };
                });

                return (
                  <div className="pbi-tile">
                    <p className="text-[13px] font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: "hsl(42,65%,56%)" }} />
                      Progresso (%) ao longo do tempo
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="data" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={(v:any) => [`${v}%`, ""]} contentStyle={{
                          background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                          borderRadius: 6, fontSize: 11,
                        }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {linhas.map(l => (
                          <Line key={l.key} type="monotone" dataKey={l.key}
                            stroke={l.cor} strokeWidth={2} dot={{ r: 3 }}
                            connectNulls activeDot={{ r: 5 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Tabela de snapshots recentes */}
              <div className="pbi-tile overflow-x-auto">
                <p className="text-[12px] font-semibold text-foreground mb-3">Snapshots recentes</p>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      {["Data", "Meta", "Atual", "Objetivo", "Progresso", "Status"].map(h => (
                        <th key={h} className="py-2 px-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.slice(0, 50).map((s:any) => {
                      const pct = s.percentual_concluido ?? (s.objetivo > 0 ? Math.round((s.atual/s.objetivo)*100) : 0);
                      const scfg: Record<string,string> = {
                        atingida: "hsl(152,60%,38%)", no_prazo: "hsl(207,89%,48%)",
                        atencao: "hsl(42,65%,56%)", em_risco: "hsl(0,72%,51%)"
                      };
                      return (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/50">
                          <td className="py-1.5 px-2 text-muted-foreground">{s.snapshot_date}</td>
                          <td className="py-1.5 px-2 font-medium text-foreground max-w-[160px] truncate">{s.nome}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{s.atual}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{s.objetivo}</td>
                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scfg[s.status] || "hsl(207,89%,48%)" }} />
                              </div>
                              <span className="font-medium" style={{ color: scfg[s.status] || "hsl(207,89%,48%)" }}>{pct}%</span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: `${scfg[s.status] || "hsl(207,89%,48%)"}18`, color: scfg[s.status] || "hsl(207,89%,48%)" }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: PREDIÇÕES (conteúdo original) ── */}
      {abaAtiva === "predicoes" && <>

      {/* Metas atrasadas */}
      {metasAtrasadas.length > 0 && (
        <div className="pbi-tile">
          <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "hsl(0, 72%, 51%)" }} />
            Metas com atraso estimado
          </h3>
          <div className="space-y-2">
            {metasAtrasadas.map((meta) => {
              const risco = RISCO_CONFIG[meta.prediction?.margem_risco ?? "baixo"] ?? RISCO_CONFIG.baixo;
              const pct = Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
              return (
                <div key={meta.id} className="flex items-center justify-between p-3 rounded"
                  style={{ background: risco.bg, border: `1px solid ${risco.color}30` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">{meta.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Progresso: {pct}% · Prazo: {meta.prazo ? new Date(meta.prazo).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: risco.bg, color: risco.color, border: `1px solid ${risco.color}50` }}>
                      {risco.label}
                    </span>
                    {meta.prediction?.dias_atraso_estimado && (
                      <span className="text-[10px] font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>
                        +{meta.prediction.dias_atraso_estimado}d
                      </span>
                    )}
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                      onClick={() => { setSelectedMeta(meta); setShowDetails(true); }}>
                      Ver
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dependências */}
      {metasComDeps.length > 0 && (
        <div className="pbi-tile">
          <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" style={{ color: "hsl(207, 89%, 48%)" }} />
            Mapa de Dependências
          </h3>
          <div className="space-y-2">
            {metasComDeps.map((meta) => (
              <div key={meta.id} className="p-3 rounded bg-secondary/50 border border-border">
                <p className="text-[12px] font-medium text-foreground mb-1">{meta.nome}</p>
                <div className="flex flex-wrap gap-1">
                  {meta.dependencias?.map((dep) => {
                    const depMeta = metas.find((m) => m.id === dep.depends_on_meta_id);
                    return (
                      <span key={dep.id} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: dep.is_critical ? "hsl(0, 72%, 51%, 0.12)" : "hsl(207, 89%, 48%, 0.12)",
                          color: dep.is_critical ? "hsl(0, 72%, 51%)" : "hsl(207, 89%, 48%)",
                          border: `1px solid ${dep.is_critical ? "hsl(0, 72%, 51%, 0.3)" : "hsl(207, 89%, 48%, 0.3)"}`,
                        }}>
                        {dep.is_critical && "⚠ "}
                        {depMeta?.nome ?? dep.depends_on_meta_id.slice(0, 8)}
                        <span className="opacity-60">({dep.dependency_type})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todas as metas */}
      <div className="pbi-tile">
        <h3 className="text-[13px] font-semibold text-foreground mb-3">Todas as Metas com Análise Preditiva</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
          </div>
        ) : metas.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-8">Nenhuma meta encontrada.</p>
        ) : (
          <div className="space-y-2">
            {metas.map((meta) => {
              const pct = Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
              const risco = meta.prediction ? RISCO_CONFIG[meta.prediction.margem_risco] ?? RISCO_CONFIG.baixo : null;
              return (
                <div key={meta.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-medium text-foreground">{meta.nome}</span>
                      {risco && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: risco.bg, color: risco.color }}>
                          {risco.label}
                        </span>
                      )}
                      {(meta.dependencias?.length ?? 0) > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          <Link2 className="w-3 h-3 inline mr-0.5" />{meta.dependencias?.length} dep.
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: risco?.color ?? "hsl(207, 89%, 48%)" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-bold text-foreground">{pct}%</p>
                    {meta.prediction?.data_estimada_conclusao && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(meta.prediction.data_estimada_conclusao).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 shrink-0"
                    onClick={() => { setSelectedMeta(meta); setShowDetails(true); }}>
                    Detalhar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[14px]">
              <Zap className="w-4 h-4 inline mr-2" style={{ color: "hsl(42, 65%, 56%)" }} />
              Análise: {selectedMeta?.nome}
            </DialogTitle>
          </DialogHeader>
          {selectedMeta && (
            <div className="space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-secondary">
                  <p className="text-muted-foreground text-[10px]">Progresso</p>
                  <p className="font-bold text-foreground">
                    {Math.round((selectedMeta.atual / selectedMeta.objetivo) * 100)}%
                  </p>
                </div>
                <div className="p-2 rounded bg-secondary">
                  <p className="text-muted-foreground text-[10px]">Prazo</p>
                  <p className="font-bold text-foreground">
                    {selectedMeta.prazo ? new Date(selectedMeta.prazo).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>

              {selectedMeta.prediction ? (
                <div className="space-y-2 p-3 rounded" style={{ background: "hsl(var(--secondary))" }}>
                  <p className="font-semibold text-foreground">Predição de Conclusão</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-muted-foreground text-[10px]">Data estimada</p>
                      <p className="text-foreground">{selectedMeta.prediction.data_estimada_conclusao
                        ? new Date(selectedMeta.prediction.data_estimada_conclusao).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Atraso estimado</p>
                      <p className="text-foreground">{selectedMeta.prediction.dias_atraso_estimado ?? 0} dias</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Velocidade média</p>
                      <p className="text-foreground">{selectedMeta.prediction.velocidade_media?.toFixed(2) ?? "—"} %/dia</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Confiança</p>
                      <p className="text-foreground">{selectedMeta.prediction.confianca_predicao ?? 0}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-center py-2">Sem predição disponível para esta meta.</p>
              )}

              {(selectedMeta.dependencias?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Dependências</p>
                  {selectedMeta.dependencias?.map((dep) => {
                    const depMeta = metas.find((m) => m.id === dep.depends_on_meta_id);
                    return (
                      <div key={dep.id} className="flex items-center gap-2 p-2 rounded bg-secondary">
                        {dep.is_critical && <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: "hsl(0, 72%, 51%)" }} />}
                        <span className="text-foreground">{depMeta?.nome ?? dep.depends_on_meta_id.slice(0, 12)}</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">{dep.dependency_type}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
    }
    </div>
  );
}
