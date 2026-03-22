import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Building2, FileSignature, Users, TrendingUp, Home, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Empreendimento { id: string; nome: string; status: string; unidades: number; vendidas: number; fase: string; }
interface Contrato { id: string; status: string; }

function KPICard({ label, value, color, icon: Icon, sub }: { label: string; value: string | number; color: string; icon: React.ElementType; sub?: string }) {
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

export default function DashboardObras() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark" || theme === "medium";
  const gridColor = isDark ? "hsl(215 28% 22%)" : "hsl(214 32% 91%)";
  const axisColor = isDark ? "hsl(215 20% 55%)" : "hsl(215 16% 47%)";
  const tooltipStyle = { backgroundColor: isDark ? "hsl(222 47% 11%)" : "#fff", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  const fetch = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      supabase.from("empreendimentos").select("id,nome,status,unidades,vendidas,fase").order("created_at", { ascending: false }),
      supabase.from("contratos").select("id,status"),
    ]);
    setEmpreendimentos((r1.data ?? []) as Empreendimento[]);
    setContratos((r2.data ?? []) as Contrato[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const totalEmp      = empreendimentos.length;
  const empAtivas     = empreendimentos.filter(e => e.status !== "concluído").length;
  const totalUnidades = empreendimentos.reduce((s, e) => s + (e.unidades || 0), 0);
  const totalVendidas = empreendimentos.reduce((s, e) => s + (e.vendidas || 0), 0);
  const contratosAtivos = contratos.filter(c => c.status === "ativo").length;
  const txVenda = totalUnidades > 0 ? Math.round((totalVendidas / totalUnidades) * 100) : 0;

  const statusMap = empreendimentos.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const pieData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  const COLORS = ["hsl(207, 89%, 48%)", "hsl(45, 100%, 51%)", "hsl(152, 60%, 38%)", "hsl(0, 72%, 51%)"];

  const barData = empreendimentos.slice(0, 6).map(e => ({
    nome: e.nome.length > 12 ? e.nome.slice(0, 11) + "…" : e.nome,
    vendidas: e.vendidas || 0,
    disponiveis: (e.unidades || 0) - (e.vendidas || 0),
  }));

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
        <Building2 className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">Olá, <span className="text-primary">{profile?.full_name}</span>!</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Painel de Obras — empreendimentos e contratos.</p>
        </div>
        <Button size="sm" className="ml-auto shrink-0 gap-1.5" onClick={() => navigate("/pedidos")}>
          <Building2 className="w-3.5 h-3.5" /> Ver obras
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Building2}     label="Empreendimentos" value={totalEmp}         color="hsl(207, 89%, 48%)" sub={`${empAtivas} em andamento`} />
        <KPICard icon={Home}          label="Unidades vendidas" value={totalVendidas}   color="hsl(152, 60%, 38%)" sub={`${txVenda}% das ${totalUnidades}`} />
        <KPICard icon={FileSignature} label="Contratos ativos" value={contratosAtivos} color="hsl(45, 100%, 45%)" />
        <KPICard icon={TrendingUp}    label="Taxa de venda"    value={`${txVenda}%`}   color="hsl(174, 62%, 47%)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <p className="text-[13px] font-semibold mb-3">Status das obras</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground flex-1 capitalize">{d.name}</span>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <p className="text-[13px] font-semibold mb-4">Unidades por empreendimento</p>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem empreendimentos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: axisColor }} stroke={axisColor} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="vendidas"    fill="hsl(152, 60%, 38%)" radius={[4, 4, 0, 0]} barSize={14} name="Vendidas" stackId="a" />
                <Bar dataKey="disponiveis" fill="hsl(207, 89%, 48%)" radius={[4, 4, 0, 0]} barSize={14} name="Disponíveis" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold">Empreendimentos</p>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => navigate("/pedidos/vendas")}>Ver todos</Button>
        </div>
        <div className="space-y-2">
          {empreendimentos.slice(0, 6).map(e => {
            const tx = e.unidades > 0 ? Math.round((e.vendidas / e.unidades) * 100) : 0;
            const cor = e.status === "concluído" ? "hsl(152, 60%, 38%)" : e.status === "em andamento" ? "hsl(207, 89%, 48%)" : "hsl(45, 100%, 45%)";
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 hover:bg-muted/50 cursor-pointer" onClick={() => navigate("/pedidos/vendas")}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{e.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{e.fase} · {e.vendidas}/{e.unidades} unidades</p>
                </div>
                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                  <div className="h-full rounded-full" style={{ width: `${tx}%`, background: cor }} />
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 capitalize" style={{ color: cor, borderColor: `${cor}40` }}>{e.status}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
