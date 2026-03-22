import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import {
  Warehouse, Package, ArrowRightLeft, MapPin, TrendingUp,
  Clock, Plus, Search, Eye, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { useTheme } from "@/hooks/useTheme";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Ativo {
  id: string; codigo_remo: string; nome: string;
  destino: string; quantidade: number; categoria: string | null;
  created_at: string; updated_at: string;
}
interface Envio {
  id: string; ativo_id: string; origem: string; destino: string;
  quantidade: number; observacao: string | null; usuario_nome: string | null;
  created_at: string; ativo?: { nome: string; codigo_remo: string } | null;
}
interface Destino { id: string; nome: string; padrao: boolean; ativo: boolean; }

// ── KPI Card ──────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color = "hsl(207, 89%, 48%)", icon: Icon }: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2.5 rounded-lg shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function DashboardAlmoxarifado() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [ativos, setAtivos]     = useState<Ativo[]>([]);
  const [envios, setEnvios]     = useState<Envio[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  const isDark = theme === "dark" || theme === "medium";
  const axisColor  = isDark ? "hsl(215 20% 55%)" : "hsl(215 16% 47%)";
  const gridColor  = isDark ? "hsl(215 28% 22%)" : "hsl(214 32% 91%)";
  const tooltipStyle = {
    backgroundColor: isDark ? "hsl(222 47% 11%)" : "#fff",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8, fontSize: 12,
  };

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [r1, r2, r3] = await Promise.all([
      supabase.from("ativos_remo").select("id,codigo_remo,nome,destino,quantidade,categoria,created_at,updated_at")
        .order("updated_at", { ascending: false }),
      supabase.from("ativos_envios").select("*, ativo:ativos_remo(nome,codigo_remo)")
        .order("created_at", { ascending: false }).limit(8),
      supabase.from("ativos_destinos").select("*").eq("ativo", true).order("padrao", { ascending: false }).order("nome"),
    ]);
    setAtivos((r1.data ?? []) as Ativo[]);
    setEnvios((r2.data ?? []) as Envio[]);
    setDestinos((r3.data ?? []) as Destino[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtimeTable("ativos_remo", fetchAll);
  useRealtimeTable("ativos_envios", fetchAll);
  useRealtimeTable("ativos_destinos", fetchAll);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const totalItens    = ativos.length;
  const totalUnidades = ativos.reduce((s, a) => s + a.quantidade, 0);
  const totalEnvios   = envios.length; // últimas 8 mostradas, mas KPI mostra contagem real via envios carregados
  const destinosAtivos = destinos.filter(d => ativos.some(a => a.destino === d.nome));

  // Ativos com baixo estoque (≤ 2 unidades)
  const baixoEstoque = ativos.filter(a => a.quantidade <= 2);

  // Distribuição por destino para o gráfico
  const chartData = destinosAtivos.map(d => ({
    nome: d.nome.length > 14 ? d.nome.slice(0, 13) + "…" : d.nome,
    nomeCompleto: d.nome,
    itens: ativos.filter(a => a.destino === d.nome).length,
    unidades: ativos.filter(a => a.destino === d.nome).reduce((s, a) => s + a.quantidade, 0),
  })).sort((a, b) => b.unidades - a.unidades);

  const BAR_COLORS = [
    "hsl(207, 89%, 48%)", "hsl(174, 62%, 47%)", "hsl(271, 60%, 55%)",
    "hsl(28, 87%, 55%)",  "hsl(152, 60%, 38%)", "hsl(45, 100%, 45%)",
  ];

  // Busca rápida nos ativos
  const q = search.toLowerCase();
  const ativosFiltrados = q
    ? ativos.filter(a =>
        a.nome.toLowerCase().includes(q) ||
        a.codigo_remo.toLowerCase().includes(q) ||
        (a.categoria ?? "").toLowerCase().includes(q) ||
        a.destino.toLowerCase().includes(q)
      )
    : ativos.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
        Carregando almoxarifado...
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Boas-vindas */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
        <Warehouse className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">
            Bom dia, <span className="text-primary">{profile?.full_name ?? "Almoxarife"}</span>!
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Painel do almoxarifado — gerencie ativos, transferências e inventário.
          </p>
        </div>
        <Button size="sm" className="ml-auto shrink-0 gap-1.5" onClick={() => navigate("/almoxarifado")}>
          <Plus className="w-3.5 h-3.5" /> Ir ao almoxarifado
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Package}        label="Itens cadastrados"   value={totalItens}      color="hsl(207, 89%, 48%)" />
        <KPICard icon={TrendingUp}     label="Total de unidades"   value={totalUnidades}    color="hsl(152, 60%, 38%)" />
        <KPICard icon={MapPin}         label="Destinos com itens"  value={destinosAtivos.length} color="hsl(271, 60%, 55%)" />
        <KPICard
          icon={AlertTriangle}
          label="Baixo estoque"
          value={baixoEstoque.length}
          sub={baixoEstoque.length > 0 ? "≤ 2 unidades" : "Tudo OK"}
          color={baixoEstoque.length > 0 ? "hsl(28, 87%, 55%)" : "hsl(152, 60%, 38%)"}
        />
      </div>

      {/* Alerta baixo estoque */}
      {baixoEstoque.length > 0 && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/8 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-sm font-semibold text-foreground">Itens com baixo estoque</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {baixoEstoque.slice(0, 8).map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-background rounded-lg border border-orange-500/20 px-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground">{a.codigo_remo}</span>
                <span className="text-xs font-medium truncate max-w-[120px]">{a.nome}</span>
                <Badge variant="outline" className="text-orange-500 border-orange-500/40 text-[10px]">
                  {a.quantidade} un.
                </Badge>
              </div>
            ))}
            {baixoEstoque.length > 8 && (
              <span className="text-xs text-muted-foreground self-center">+{baixoEstoque.length - 8} itens</span>
            )}
          </div>
        </div>
      )}

      {/* Gráfico + Últimas transferências */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Gráfico por destino */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <p className="text-[13px] font-semibold text-foreground mb-4">Unidades por destino</p>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Nenhum ativo cadastrado ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _: string, props: any) => [
                    `${v} unidades (${props.payload.itens} itens)`,
                    props.payload.nomeCompleto,
                  ]}
                  labelFormatter={() => ""}
                />
                <Bar dataKey="unidades" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Últimas transferências */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">Últimas movimentações</p>
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground"
              onClick={() => navigate("/almoxarifado")}>
              Ver todas
            </Button>
          </div>
          {envios.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-muted-foreground gap-2">
              <ArrowRightLeft className="w-8 h-8 opacity-20" />
              <p className="text-xs">Nenhuma transferência ainda</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {envios.map(e => (
                <div key={e.id} className="rounded-lg bg-muted/40 border border-border px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-xs font-medium truncate flex-1">{e.ativo?.nome ?? "Item removido"}</p>
                    <Badge variant="outline" className="font-mono text-[9px] h-4 shrink-0">{e.quantidade}un</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[70px]">{e.origem}</span>
                    <ArrowRightLeft className="w-3 h-3 shrink-0 text-primary" />
                    <span className="truncate max-w-[70px]">{e.destino}</span>
                    <span className="ml-auto shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {format(new Date(e.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Busca rápida no inventário */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-[13px] font-semibold text-foreground shrink-0">Inventário rápido</p>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar ativo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0 h-8 text-xs"
            onClick={() => navigate("/almoxarifado")}>
            <Eye className="w-3.5 h-3.5" /> Ver completo
          </Button>
        </div>

        {ativosFiltrados.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            {search ? `Nenhum ativo encontrado para "${search}"` : "Nenhum ativo cadastrado"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[11px] text-muted-foreground font-medium py-2 pr-4">Código</th>
                  <th className="text-left text-[11px] text-muted-foreground font-medium py-2 pr-4">Nome</th>
                  <th className="text-left text-[11px] text-muted-foreground font-medium py-2 pr-4">Categoria</th>
                  <th className="text-left text-[11px] text-muted-foreground font-medium py-2 pr-4">Destino</th>
                  <th className="text-right text-[11px] text-muted-foreground font-medium py-2">Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {ativosFiltrados.map((a, i) => (
                  <tr key={a.id}
                    className={`border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    onClick={() => navigate("/almoxarifado")}>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-[11px] text-primary">{a.codigo_remo}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-xs truncate max-w-[180px] block">{a.nome}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs text-muted-foreground">{a.categoria ?? "—"}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="text-[10px] h-5">{a.destino}</Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-bold ${a.quantidade <= 2 ? "text-orange-500" : "text-foreground"}`}>
                        {a.quantidade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!search && ativos.length > 6 && (
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Mostrando 6 de {ativos.length} itens —{" "}
                <button className="text-primary hover:underline" onClick={() => navigate("/almoxarifado")}>
                  ver todos
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
