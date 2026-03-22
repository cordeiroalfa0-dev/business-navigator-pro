import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Target, CheckCircle2, AlertTriangle, Clock, TrendingUp, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meta {
  id: string; nome: string; status: string; categoria: string;
  responsavel: string; prazo: string; percentual_concluido: number;
  prioridade: string; atual: number; objetivo: number; unidade: string;
}

function KPICard({ label, value, color, icon: Icon, sub }: {
  label: string; value: string | number; color: string;
  icon: React.ElementType; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardMetas() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(false);

  const isDark = theme === "dark" || theme === "medium";
  const gridColor = isDark ? "hsl(215 28% 22%)" : "hsl(214 32% 91%)";
  const axisColor = isDark ? "hsl(215 20% 55%)" : "hsl(215 16% 47%)";
  const tooltipStyle = {
    backgroundColor: isDark ? "hsl(222 47% 11%)" : "#fff",
    border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12,
  };

  const fetch = useCallback(async () => {
    if (loadRef.current) return;
    loadRef.current = true;
    const { data } = await supabase.from("metas")
      .select("id,nome,status,categoria,responsavel,prazo,percentual_concluido,prioridade,atual,objetivo,unidade")
      .eq("is_deleted", false).order("prazo", { ascending: true });
    setMetas((data ?? []) as Meta[]);
    setLoading(false);
    loadRef.current = false;
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const hoje = new Date();
  const total     = metas.length;
  const atingidas = metas.filter(m => m.status === "atingida").length;
  const emRisco   = metas.filter(m => m.status === "em_risco").length;
  const noPrazo   = metas.filter(m => m.status === "no_prazo").length;
  const pct = total > 0 ? Math.round((atingidas / total) * 100) : 0;

  // Metas próximas do prazo (próximos 7 dias, não atingidas)
  const proximas = metas.filter(m => {
    const prazo = new Date(m.prazo);
    const diff = (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && m.status !== "atingida";
  });

  // Por categoria
  const porCategoria = Object.entries(
    metas.reduce((acc, m) => {
      if (!acc[m.categoria]) acc[m.categoria] = { total: 0, atingidas: 0 };
      acc[m.categoria].total++;
      if (m.status === "atingida") acc[m.categoria].atingidas++;
      return acc;
    }, {} as Record<string, { total: number; atingidas: number }>)
  ).map(([cat, v]) => ({ cat, ...v, pct: Math.round((v.atingidas / v.total) * 100) }))
   .sort((a, b) => b.total - a.total).slice(0, 6);

  const radialData = [{ name: "Conclusão", value: pct, fill: pct >= 75 ? "hsl(152, 60%, 38%)" : pct >= 50 ? "hsl(207, 89%, 48%)" : pct >= 25 ? "hsl(45, 100%, 51%)" : "hsl(0, 72%, 51%)" }];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground gap-2">
      <div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Boas-vindas */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
        <Target className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">Olá, <span className="text-primary">{profile?.full_name}</span>!</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Painel de Metas — acompanhe OKRs e indicadores.</p>
        </div>
        <Button size="sm" className="ml-auto shrink-0 gap-1.5" onClick={() => navigate("/metas")}>
          <Target className="w-3.5 h-3.5" /> Ver metas
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={BarChart2}     label="Total de metas"  value={total}     color="hsl(207, 89%, 48%)" />
        <KPICard icon={CheckCircle2}  label="Atingidas"       value={atingidas} color="hsl(152, 60%, 38%)" sub={`${pct}% de conclusão`} />
        <KPICard icon={Clock}         label="No prazo"        value={noPrazo}   color="hsl(45, 100%, 45%)" />
        <KPICard icon={AlertTriangle} label="Em risco"        value={emRisco}   color="hsl(0, 72%, 51%)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Radial de conclusão */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center">
          <p className="text-[13px] font-semibold mb-2">Conclusão geral</p>
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: isDark ? "hsl(215 28% 17%)" : "hsl(214 32% 91%)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold" style={{ color: radialData[0].fill }}>{pct}%</p>
              <p className="text-[11px] text-muted-foreground">atingidas</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full mt-2 text-center">
            {[{ l: "Atingidas", v: atingidas, c: "hsl(152, 60%, 38%)" },
              { l: "No prazo", v: noPrazo, c: "hsl(45, 100%, 45%)" },
              { l: "Em risco", v: emRisco, c: "hsl(0, 72%, 51%)" }].map(k => (
              <div key={k.l}>
                <p className="text-lg font-bold" style={{ color: k.c }}>{k.v}</p>
                <p className="text-[10px] text-muted-foreground">{k.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Por categoria */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <p className="text-[13px] font-semibold mb-4">Metas por categoria</p>
          {porCategoria.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Nenhuma meta cadastrada</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porCategoria} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="cat" tick={{ fontSize: 10, fill: axisColor }} stroke={axisColor} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, k: string) => [v, k === "total" ? "Total" : "Atingidas"]} />
                <Bar dataKey="total" fill="hsl(207, 89%, 48%)" radius={[4, 4, 0, 0]} barSize={18} name="Total" />
                <Bar dataKey="atingidas" fill="hsl(152, 60%, 38%)" radius={[4, 4, 0, 0]} barSize={18} name="Atingidas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Proximas do prazo */}
      {proximas.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-[13px] font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Vencem nos próximos 7 dias ({proximas.length})
          </p>
          <div className="space-y-2">
            {proximas.map(m => {
              const diff = Math.ceil((new Date(m.prazo).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={m.id} className="flex items-center gap-3 bg-background rounded-lg border border-amber-500/20 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{m.responsavel} · {m.categoria}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/40 shrink-0 text-[10px]">
                    {diff === 0 ? "Hoje" : `${diff}d`}
                  </Badge>
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${m.percentual_concluido}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimas metas */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold">Metas recentes</p>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => navigate("/metas")}>Ver todas</Button>
        </div>
        <div className="space-y-2">
          {metas.slice(0, 6).map(m => {
            const statusCfg: Record<string, { color: string; label: string }> = {
              atingida: { color: "hsl(152, 60%, 38%)", label: "Atingida" },
              em_risco: { color: "hsl(0, 72%, 51%)", label: "Em risco" },
              no_prazo: { color: "hsl(207, 89%, 48%)", label: "No prazo" },
            };
            const s = statusCfg[m.status] ?? { color: "hsl(215 16% 47%)", label: m.status };
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate("/metas")}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <p className="text-xs font-medium flex-1 truncate">{m.nome}</p>
                <span className="text-[10px] shrink-0" style={{ color: s.color }}>{s.label}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{format(new Date(m.prazo), "dd/MM", { locale: ptBR })}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
