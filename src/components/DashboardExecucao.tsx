import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { HardHat, CheckCircle2, Clock, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Obra { id: string; nome: string; progresso: number; etapa_atual: string; status: string; created_at: string; }

function KPICard({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardExecucao() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark" || theme === "medium";
  const gridColor = isDark ? "hsl(215 28% 22%)" : "hsl(214 32% 91%)";
  const axisColor = isDark ? "hsl(215 20% 55%)" : "hsl(215 16% 47%)";
  const tooltipStyle = { backgroundColor: isDark ? "hsl(222 47% 11%)" : "#fff", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("execucao_obras" as any).select("*").order("created_at", { ascending: false });
    setObras((data ?? []) as Obra[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const total      = obras.length;
  const concluidas = obras.filter(o => o.progresso >= 100).length;
  const emAndamento = obras.filter(o => o.progresso > 0 && o.progresso < 100).length;
  const atrasadas  = obras.filter(o => o.progresso < 30).length;
  const mediaProgresso = total > 0 ? Math.round(obras.reduce((s, o) => s + o.progresso, 0) / total) : 0;

  const barData = obras.slice(0, 8).map(o => ({
    nome: o.nome.length > 14 ? o.nome.slice(0, 13) + "…" : o.nome,
    progresso: o.progresso,
  }));

  const corProgresso = (p: number) => p >= 80 ? "hsl(152, 60%, 38%)" : p >= 50 ? "hsl(207, 89%, 48%)" : p >= 30 ? "hsl(45, 100%, 45%)" : "hsl(0, 72%, 51%)";

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
        <HardHat className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">Olá, <span className="text-primary">{profile?.full_name}</span>!</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Painel de Execução de Obra — progresso e etapas.</p>
        </div>
        <Button size="sm" className="ml-auto shrink-0 gap-1.5" onClick={() => navigate("/execucao")}>
          <HardHat className="w-3.5 h-3.5" /> Ver obras
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Layers}       label="Total de obras"   value={total}          color="hsl(207, 89%, 48%)" />
        <KPICard icon={CheckCircle2} label="Concluídas"       value={concluidas}     color="hsl(152, 60%, 38%)" />
        <KPICard icon={Clock}        label="Em andamento"     value={emAndamento}    color="hsl(45, 100%, 45%)" />
        <KPICard icon={AlertTriangle} label="Progresso médio" value={`${mediaProgresso}%`} color="hsl(174, 62%, 47%)" />
      </div>

      {/* Gráfico progresso */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[13px] font-semibold mb-4">Progresso por obra (%)</p>
        {barData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Nenhuma obra cadastrada</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} unit="%" />
              <YAxis dataKey="nome" type="category" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Progresso"]} />
              <Bar dataKey="progresso" radius={[0, 4, 4, 0]} barSize={18}>
                {barData.map((d, i) => <Cell key={i} fill={corProgresso(d.progresso)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Lista detalhada */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold">Obras em execução</p>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => navigate("/execucao")}>Ver todas</Button>
        </div>
        <div className="space-y-3">
          {obras.slice(0, 6).map(o => (
            <div key={o.id} className="rounded-lg bg-muted/30 px-4 py-3 hover:bg-muted/50 cursor-pointer" onClick={() => navigate("/execucao")}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium truncate flex-1">{o.nome}</p>
                <Badge variant="outline" className="text-[10px] ml-2 shrink-0" style={{ color: corProgresso(o.progresso), borderColor: `${corProgresso(o.progresso)}40` }}>
                  {o.etapa_atual || "Sem etapa"}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${o.progresso}%`, background: corProgresso(o.progresso) }} />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: corProgresso(o.progresso) }}>{o.progresso}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
