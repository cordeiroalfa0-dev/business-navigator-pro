import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, TrendingDown, Scale, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LancRow { valor: number; data_emissao: string; }

function KPICard({ label, value, color, icon: Icon, sub }: { label: string; value: string; color: string; icon: React.ElementType; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

export default function DashboardFinanceiro() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [fat, setFat] = useState<LancRow[]>([]);
  const [pagar, setPagar] = useState<LancRow[]>([]);
  const [receber, setReceber] = useState<LancRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark" || theme === "medium";
  const gridColor = isDark ? "hsl(215 28% 22%)" : "hsl(214 32% 91%)";
  const axisColor = isDark ? "hsl(215 20% 55%)" : "hsl(215 16% 47%)";
  const tooltipStyle = { backgroundColor: isDark ? "hsl(222 47% 11%)" : "#fff", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

  const fetch = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      supabase.from("faturamento").select("valor,data_emissao"),
      supabase.from("contas_pagar").select("valor,data_emissao"),
      supabase.from("contas_receber").select("valor,data_emissao"),
    ]);
    setFat((r1.data ?? []) as LancRow[]);
    setPagar((r2.data ?? []) as LancRow[]);
    setReceber((r3.data ?? []) as LancRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const totalFat     = fat.reduce((s, r) => s + Number(r.valor), 0);
  const totalPagar   = pagar.reduce((s, r) => s + Number(r.valor), 0);
  const totalReceber = receber.reduce((s, r) => s + Number(r.valor), 0);
  const saldo        = totalFat - totalPagar;

  // Fluxo mensal últimos 6 meses
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const hoje = new Date();
  const fluxoMap: Record<string, { mes: string; receita: number; custo: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    fluxoMap[k] = { mes: months[d.getMonth()], receita: 0, custo: 0 };
  }
  fat.forEach(r => {
    const d = new Date(r.data_emissao); const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (fluxoMap[k]) fluxoMap[k].receita += Number(r.valor) / 1000;
  });
  pagar.forEach(r => {
    const d = new Date(r.data_emissao); const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (fluxoMap[k]) fluxoMap[k].custo += Number(r.valor) / 1000;
  });
  const fluxo = Object.values(fluxoMap);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
        <DollarSign className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">Olá, <span className="text-primary">{profile?.full_name}</span>!</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">Painel Financeiro — faturamento, contas e fluxo de caixa.</p>
        </div>
        <Button size="sm" className="ml-auto shrink-0 gap-1.5" onClick={() => navigate("/contabilidade")}>
          <DollarSign className="w-3.5 h-3.5" /> Financeiro
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={TrendingUp}   label="Faturamento total" value={fmt(totalFat)}     color="hsl(207, 89%, 48%)" />
        <KPICard icon={TrendingDown} label="Contas a pagar"    value={fmt(totalPagar)}   color="hsl(0, 72%, 51%)" />
        <KPICard icon={Calendar}     label="A receber"         value={fmt(totalReceber)} color="hsl(45, 100%, 45%)" />
        <KPICard icon={Scale}        label="Saldo líquido"     value={fmt(saldo)}        color={saldo >= 0 ? "hsl(152, 60%, 38%)" : "hsl(0, 72%, 51%)"} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[13px] font-semibold mb-4">Fluxo de caixa — últimos 6 meses (R$ mil)</p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={fluxo} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(0)}k`]} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="receita" fill="hsl(207, 89%, 48%)" radius={[4,4,0,0]} barSize={20} name="Receita" />
            <Bar dataKey="custo"   fill="hsl(0, 72%, 51%)"   radius={[4,4,0,0]} barSize={20} name="Custo" />
            <Line type="monotone" dataKey="receita" stroke="hsl(152, 60%, 38%)" strokeWidth={2} dot={false} name="Tendência" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Receita vs Custo", pct: totalFat > 0 ? Math.round((totalPagar / totalFat) * 100) : 0, cor: "hsl(207, 89%, 48%)", desc: "% do faturamento comprometido" },
          { label: "Margem estimada", pct: totalFat > 0 ? Math.round(((totalFat - totalPagar) / totalFat) * 100) : 0, cor: "hsl(152, 60%, 38%)", desc: "% de margem bruta" },
          { label: "Receber / Faturado", pct: totalFat > 0 ? Math.round((totalReceber / totalFat) * 100) : 0, cor: "hsl(45, 100%, 45%)", desc: "% ainda a receber" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[12px] font-semibold mb-2">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.cor }}>{k.pct}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.desc}</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(k.pct, 100)}%`, background: k.cor }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
