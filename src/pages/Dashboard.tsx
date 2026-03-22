import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import {
  DollarSign, Building2, HardHat, Users,
  TrendingUp, Calendar, Filter, ChevronDown, Target, Layers,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardRouter from "@/components/DashboardRouter";

const PBITile = ({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) => (
  <div className={`pbi-tile ${className}`}>
    {title && <h3 className="text-[13px] font-semibold text-foreground mb-3">{title}</h3>}
    {children}
  </div>
);

const ANOS_DISPONIVEIS = ["2024", "2025", "2026", "2027"];

type MetaItem = { status: string; categoria: string; obra_id: string | null };

export default function Dashboard() {
  const [periodo, setPeriodo] = useState(String(new Date().getFullYear()));
  const [showAnoMenu, setShowAnoMenu] = useState(false);
  const { userRole, profile, enabledModules } = useAuth();
  const { theme } = useTheme();
  const isNormal = userRole === "normal";

  // Estados de dados
  const [metasAll, setMetasAll] = useState<MetaItem[]>([]);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [obrasAtivas, setObrasAtivas] = useState(0);
  const [unidadesVendidas, setUnidadesVendidas] = useState(0);
  const [contratosAtivos, setContratosAtivos] = useState(0);
  const [obrasPorStatus, setObrasPorStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [fluxoDataAll, setFluxoDataAll] = useState<{ month: string; ano: number; receita: number; custo: number }[]>([]);
  const [progressoObras, setProgressoObras] = useState<{ obra: string; progresso: number }[]>([]);
  const [mapaSaude, setMapaSaude] = useState<{ label: string; pct: number; total: number; atingidas: number }[]>([]);

  const load = useCallback(async () => {
    try {
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        const [metas, fat, cp, emp, cont, execucao] = await Promise.all([
          // Busca obra_id junto — necessário para separar Obra vs Estratégicas
          supabase.from("metas").select("status,categoria,obra_id"),
          supabase.from("faturamento").select("valor,data_emissao"),
          supabase.from("contas_pagar").select("valor,data_emissao"),
          supabase.from("empreendimentos").select("nome,status,unidades,vendidas,fase"),
          supabase.from("contratos").select("status"),
          supabase.from("execucao_obras" as any)
            .select("nome,progresso,etapa_atual")
            .order("created_at", { ascending: false }),
        ]);

        // Guarda todas as metas para filtrar por ano depois
        if (metas.data) setMetasAll(metas.data as MetaItem[]);

        // Mapa de saúde — usa todas as metas (sem filtro de ano)
        if (metas.data) {
          const metasArr = metas.data as any[];
          const CATEGORIAS_SAUDE = ["Engenharia", "Projetos", "Orçamentos", "Contratos", "Quantitativos", "Materiais"];
          setMapaSaude(CATEGORIAS_SAUDE.map(cat => {
            const itensCat = metasArr.filter(m =>
              (m.categoria || "").toLowerCase().trim() === cat.toLowerCase().trim()
            );
            const total = itensCat.length;
            const atingidas = itensCat.filter(m => m.status === "atingida").length;
            return { label: cat, pct: total > 0 ? Math.round((atingidas / total) * 100) : 0, total, atingidas };
          }));
        }

        // Faturamento — guarda todos com data para filtrar por ano
        const fatData = (fat.data || []) as any[];
        const cpData = (cp.data || []) as any[];

        // Monta fluxo com ano incluso para poder filtrar
        const fluxoMap: Record<string, { month: string; ano: number; receita: number; custo: number }> = {};
        fatData.forEach((f: any) => {
          const d = new Date(f.data_emissao);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (!fluxoMap[key]) fluxoMap[key] = { month: monthNames[d.getMonth()], ano: d.getFullYear(), receita: 0, custo: 0 };
          fluxoMap[key].receita += Number(f.valor) / 1000;
        });
        cpData.forEach((c: any) => {
          const d = new Date(c.data_emissao);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (!fluxoMap[key]) fluxoMap[key] = { month: monthNames[d.getMonth()], ano: d.getFullYear(), receita: 0, custo: 0 };
          fluxoMap[key].custo += Number(c.valor) / 1000;
        });
        setFluxoDataAll(Object.values(fluxoMap));

        // KPIs financeiros totais (sem filtro de ano)
        setFaturamentoTotal(fatData.reduce((s: number, f: any) => s + Number(f.valor), 0));

        // Empreendimentos
        const empData = (emp.data || []) as any[];
        setObrasAtivas(empData.filter((e: any) => e.status !== "concluído").length);
        setUnidadesVendidas(empData.reduce((s: number, e: any) => s + Number(e.vendidas || 0), 0));

        // Obras por status
        const statusMap: Record<string, number> = {};
        empData.forEach((e: any) => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
        const statusColors: Record<string, string> = {
          "em andamento": "hsl(207, 89%, 48%)", planejamento: "hsl(45, 100%, 51%)",
          "concluído": "hsl(152, 60%, 38%)",
        };
        setObrasPorStatus(Object.entries(statusMap).map(([name, value]) => ({
          name, value, color: statusColors[name] || "hsl(0, 0%, 50%)",
        })));

        // Progresso real das obras
        const execData = ((execucao as any).data || []) as any[];
        if (execData.length > 0) {
          setProgressoObras(execData.slice(0, 5).map((e: any) => ({
            obra: e.nome, progresso: Number(e.progresso) || 0,
          })));
        } else {
          const faseProgress: Record<string, number> = { Projeto: 10, Fundação: 30, Estrutura: 55, Acabamento: 80, Entregue: 100 };
          setProgressoObras(empData.slice(0, 5).map((e: any) => ({
            obra: e.nome, progresso: faseProgress[e.fase] || 0,
          })));
        }

        // Contratos
        setContratosAtivos(((cont.data || []) as any[]).filter((c: any) => c.status === "ativo").length);
    } catch (err: any) {
      console.error("Dashboard load error:", err?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime — um único canal para todas as tabelas do Dashboard
  // Evita 6 subscriptions independentes que cada uma dispara load() completo
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const TABLES = ["metas", "faturamento", "contas_pagar", "empreendimentos", "contratos", "execucao_obras"];
    const channels = TABLES.map(table =>
      supabase
        .channel(`dashboard-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          clearTimeout(timer);
          timer = setTimeout(() => loadRef.current(), 600);
        })
        .subscribe()
    );
    return () => {
      clearTimeout(timer);
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  // ─── Derivados filtrados pelo ano selecionado ───────────────────────────
  const anoNum = parseInt(periodo);

  // Fluxo filtrado pelo ano
  const fluxoFiltrado = fluxoDataAll
    .filter(d => d.ano === anoNum)
    .sort((a, b) => {
      const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

  // Faturamento filtrado pelo ano (para KPI)
  const faturamentoAno = fluxoFiltrado.reduce((s, d) => s + d.receita * 1000, 0);

  // Metas separadas: de obra (tem obra_id) vs estratégicas (sem obra_id)
  const metasDeObra = metasAll.filter(m => m.obra_id !== null && m.obra_id !== undefined);
  const metasEstrategicas = metasAll.filter(m => !m.obra_id);

  const statsObra = {
    total: metasDeObra.length,
    atingidas: metasDeObra.filter(m => m.status === "atingida").length,
    emRisco: metasDeObra.filter(m => m.status === "em_risco").length,
  };
  const statsEstrategicas = {
    total: metasEstrategicas.length,
    atingidas: metasEstrategicas.filter(m => m.status === "atingida").length,
    emRisco: metasEstrategicas.filter(m => m.status === "em_risco").length,
  };

  // Totais globais (para o bloco superior de KPIs de metas)
  const metaStats = {
    total: metasAll.length,
    atingidas: metasAll.filter(m => m.status === "atingida").length,
    emRisco: metasAll.filter(m => m.status === "em_risco").length,
  };

  const kpis = [
    { title: "Faturamento", value: faturamentoAno > 0 ? `R$ ${(faturamentoAno / 1000).toFixed(0)}k` : `R$ ${(faturamentoTotal / 1000).toFixed(0)}k`, icon: DollarSign, color: "hsl(207, 89%, 48%)" },
    { title: "Obras Ativas", value: String(obrasAtivas), icon: Building2, color: "hsl(45, 100%, 51%)" },
    { title: "Unidades Vendidas", value: String(unidadesVendidas), icon: HardHat, color: "hsl(174, 62%, 47%)" },
    { title: "Contratos Ativos", value: String(contratosAtivos), icon: Users, color: "hsl(28, 87%, 55%)" },
  ];

  const gridColor = theme === "dark" ? "hsl(0, 0%, 25%)" : "hsl(0, 0%, 88%)";
  const axisColor = theme === "dark" ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 60%)";
  const tooltipBg = theme === "dark" ? "hsl(0, 0%, 18%)" : "#fff";
  const tooltipBorder = theme === "dark" ? "hsl(0, 0%, 30%)" : "hsl(0, 0%, 88%)";
  const tooltipStyle = { borderRadius: "4px", border: `1px solid ${tooltipBorder}`, fontSize: 12, backgroundColor: tooltipBg, color: theme === "dark" ? "#e8e8e8" : "#222" };

  const metaBarColor = (pct: number) => pct >= 80 ? "hsl(152, 60%, 38%)" : pct >= 50 ? "hsl(207, 89%, 48%)" : pct >= 30 ? "hsl(45, 100%, 51%)" : "hsl(0, 72%, 51%)";

  const dashboardCompleta = (
    <div className="space-y-3">
      {isNormal && (
        <div className="pbi-tile" style={{ borderLeft: "3px solid hsl(207, 89%, 48%)" }}>
          <p className="text-[12px] font-medium" style={{ color: "hsl(var(--pbi-text-primary))" }}>
            Bem-vindo, <strong style={{ color: "hsl(var(--pbi-yellow))" }}>{profile?.full_name}</strong>!
            Você está no modo <strong>visualização</strong>. Para editar metas ou gerar relatórios, solicite acesso ao administrador.
          </p>
        </div>
      )}

      {/* Filtro de ano — agora funcional */}
      <div className="pbi-filter-bar rounded-sm px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium">Filtros</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="relative">
          <button
            onClick={() => setShowAnoMenu(!showAnoMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Calendar className="w-3 h-3" /> Ano: {periodo} <ChevronDown className="w-3 h-3" />
          </button>
          {showAnoMenu && (
            <div className="absolute top-full left-0 mt-1 z-20 rounded border border-border bg-card shadow-md min-w-[100px]">
              {ANOS_DISPONIVEIS.map(ano => (
                <button
                  key={ano}
                  onClick={() => { setPeriodo(ano); setShowAnoMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-secondary transition-colors"
                  style={{ color: periodo === ano ? "hsl(var(--pbi-yellow))" : undefined, fontWeight: periodo === ano ? 600 : undefined }}
                >
                  {ano}
                </button>
              ))}
            </div>
          )}
        </div>
        {fluxoFiltrado.length === 0 && fluxoDataAll.length > 0 && (
          <span className="text-[11px] text-muted-foreground">Sem dados financeiros para {periodo}</span>
        )}
      </div>

      {/* KPIs de Metas globais */}
      <div className="pbi-tile" style={{ borderLeft: "3px solid hsl(var(--pbi-yellow))" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Resumo de Metas & OKRs</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total de Atividades", value: metaStats.total, color: "hsl(207, 89%, 48%)" },
            { label: "Atingidas", value: metaStats.atingidas, color: "hsl(152, 60%, 38%)" },
            { label: "Em Risco", value: metaStats.emRisco, color: "hsl(0, 72%, 51%)" },
            { label: "No Prazo", value: metaStats.total - metaStats.atingidas - metaStats.emRisco, color: "hsl(45, 100%, 51%)" },
          ].map(k => (
            <div key={k.label} className="text-center">
              <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards financeiros (filtrados pelo ano) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <PBITile key={kpi.title}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{kpi.title}</p>
                  <p className="pbi-kpi-value mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: `${kpi.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
            </PBITile>
          );
        })}
      </div>

      {/* Charts — faturamento filtrado pelo ano */}
      {!isNormal && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <PBITile title={`Faturamento vs Custos ${periodo} (R$ mil)`} className="lg:col-span-2">
            {fluxoFiltrado.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={fluxoFiltrado}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                  <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(0)}k`, ""]} contentStyle={tooltipStyle} />
                  <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="receita" fill="hsl(207, 89%, 48%)" radius={[2, 2, 0, 0]} barSize={18} name="Faturamento" />
                  <Line type="monotone" dataKey="custo" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name="Custos" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px]">
                <p className="text-[11px] text-muted-foreground text-center">
                  Sem dados de faturamento para {periodo}.<br />
                  <span className="text-[10px]">Dados disponíveis em: {[...new Set(fluxoDataAll.map(d => d.ano))].sort().join(", ") || "—"}</span>
                </p>
              </div>
            )}
          </PBITile>

          <PBITile title="Obras por Status">
            {obrasPorStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={obrasPorStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                      {obrasPorStatus.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "obras"]} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {obrasPorStatus.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-[11px]">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground flex-1">{item.name}</span>
                      <span className="font-bold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-12">Cadastre empreendimentos para ver o gráfico.</p>
            )}
          </PBITile>
        </div>
      )}

      {/* ── SEÇÃO: Metas de Obra vs Metas Estratégicas ── */}
      {!isNormal && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Metas de Obra */}
          <PBITile>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded" style={{ background: "hsl(207, 89%, 48%, 0.15)" }}>
                <HardHat className="w-3.5 h-3.5" style={{ color: "hsl(207, 89%, 48%)" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Metas de Obra</p>
                <p className="text-[10px] text-muted-foreground">Vinculadas a uma execução física</p>
              </div>
              <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(207, 89%, 48%, 0.15)", color: "hsl(207, 89%, 48%)" }}>
                {statsObra.total}
              </span>
            </div>
            {statsObra.total === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                Nenhuma meta vinculada a obra ainda.<br />
                <span className="text-[10px]">Ao criar uma meta, selecione uma obra no campo "Obra vinculada".</span>
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Atingidas", value: statsObra.atingidas, color: "hsl(152, 60%, 38%)" },
                  { label: "Em Risco", value: statsObra.emRisco, color: "hsl(0, 72%, 51%)" },
                  { label: "No Prazo", value: statsObra.total - statsObra.atingidas - statsObra.emRisco, color: "hsl(45, 100%, 51%)" },
                ].map(k => (
                  <div key={k.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground flex-1">{k.label}</span>
                    <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${statsObra.total > 0 ? Math.round((k.value / statsObra.total) * 100) : 0}%`,
                        backgroundColor: k.color,
                      }} />
                    </div>
                    <span className="text-[12px] font-bold w-6 text-right" style={{ color: k.color }}>{k.value}</span>
                  </div>
                ))}
                {statsObra.total > 0 && (
                  <div className="pt-1 mt-1 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Conclusão geral</span>
                      <span className="text-[11px] font-bold" style={{ color: metaBarColor(Math.round((statsObra.atingidas / statsObra.total) * 100)) }}>
                        {Math.round((statsObra.atingidas / statsObra.total) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </PBITile>

          {/* Metas Estratégicas */}
          <PBITile>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded" style={{ background: "hsl(271, 60%, 55%, 0.15)" }}>
                <Target className="w-3.5 h-3.5" style={{ color: "hsl(271, 60%, 55%)" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Metas Estratégicas</p>
                <p className="text-[10px] text-muted-foreground">Independentes — financeiras, comerciais, RH</p>
              </div>
              <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(271, 60%, 55%, 0.15)", color: "hsl(271, 60%, 55%)" }}>
                {statsEstrategicas.total}
              </span>
            </div>
            {statsEstrategicas.total === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                Nenhuma meta estratégica cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Atingidas", value: statsEstrategicas.atingidas, color: "hsl(152, 60%, 38%)" },
                  { label: "Em Risco", value: statsEstrategicas.emRisco, color: "hsl(0, 72%, 51%)" },
                  { label: "No Prazo", value: statsEstrategicas.total - statsEstrategicas.atingidas - statsEstrategicas.emRisco, color: "hsl(45, 100%, 51%)" },
                ].map(k => (
                  <div key={k.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground flex-1">{k.label}</span>
                    <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${statsEstrategicas.total > 0 ? Math.round((k.value / statsEstrategicas.total) * 100) : 0}%`,
                        backgroundColor: k.color,
                      }} />
                    </div>
                    <span className="text-[12px] font-bold w-6 text-right" style={{ color: k.color }}>{k.value}</span>
                  </div>
                ))}
                {statsEstrategicas.total > 0 && (
                  <div className="pt-1 mt-1 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Conclusão geral</span>
                      <span className="text-[11px] font-bold" style={{ color: metaBarColor(Math.round((statsEstrategicas.atingidas / statsEstrategicas.total) * 100)) }}>
                        {Math.round((statsEstrategicas.atingidas / statsEstrategicas.total) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </PBITile>
        </div>
      )}

      {/* Mapa de Saúde */}
      {!isNormal && (
        <PBITile title="Mapa de Saúde por Categoria">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-1">
            {[
              { label: "Engenharia", color: "hsl(207, 89%, 48%)" },
              { label: "Projetos", color: "hsl(174, 62%, 47%)" },
              { label: "Orçamentos", color: "hsl(45, 100%, 51%)" },
              { label: "Contratos", color: "hsl(28, 87%, 55%)" },
              { label: "Quantitativos", color: "hsl(271, 60%, 55%)" },
              { label: "Materiais", color: "hsl(152, 60%, 38%)" },
            ].map(cat => {
              const dado = mapaSaude.find(m => m.label === cat.label);
              const pct = dado?.pct ?? 0;
              const total = dado?.total ?? 0;
              const atingidas = dado?.atingidas ?? 0;
              const status = pct >= 75 ? "Ótimo" : pct >= 50 ? "Regular" : total === 0 ? "Sem metas" : "Atenção";
              const statusColor = pct >= 75 ? "hsl(152, 60%, 38%)" : pct >= 50 ? "hsl(45, 100%, 51%)" : total === 0 ? "hsl(0, 0%, 55%)" : "hsl(0, 72%, 51%)";
              return (
                <div key={cat.label} className="rounded p-3 text-center" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}30` }}>
                  <p className="text-[10px] font-semibold text-foreground mb-1">{cat.label}</p>
                  <p className="text-xl font-bold" style={{ color: total === 0 ? "hsl(0, 0%, 55%)" : cat.color }}>
                    {total === 0 ? "—" : `${pct}%`}
                  </p>
                  <p className="text-[9px] font-medium mt-0.5" style={{ color: statusColor }}>{status}</p>
                  {total > 0 && <p className="text-[9px] text-muted-foreground mt-0.5">{atingidas}/{total} metas</p>}
                  <div className="h-1 rounded-full bg-secondary overflow-hidden mt-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {mapaSaude.every(m => m.total === 0) && (
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              Cadastre metas com categorias: Engenharia, Projetos, Orçamentos, Contratos, Quantitativos ou Materiais.
            </p>
          )}
        </PBITile>
      )}

      {/* Progresso das obras + Resumo geral de metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PBITile title="Progresso das Obras (%)">
          {progressoObras.length > 0 ? (
            <div className="space-y-3 mt-1">
              {progressoObras.map((item) => {
                const barColor = metaBarColor(item.progresso);
                return (
                  <div key={item.obra}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-foreground font-medium">{item.obra}</span>
                      <span className="text-[11px] font-bold" style={{ color: barColor }}>{item.progresso}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.progresso}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center py-6">Nenhuma obra cadastrada ainda.</p>
          )}
        </PBITile>

        <PBITile title="Resumo Geral de Metas">
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Total de Metas</span>
              <span className="text-lg font-bold text-foreground">{metaStats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Atingidas</span>
              <span className="text-lg font-bold" style={{ color: "hsl(152, 60%, 38%)" }}>{metaStats.atingidas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Em Risco</span>
              <span className="text-lg font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>{metaStats.emRisco}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(207, 89%, 48%)" }} />
                <span className="text-[10px] text-muted-foreground">Obra: {statsObra.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(271, 60%, 55%)" }} />
                <span className="text-[10px] text-muted-foreground">Estratégicas: {statsEstrategicas.total}</span>
              </div>
            </div>
            {metaStats.total > 0 && (
              <div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((metaStats.atingidas / metaStats.total) * 100)}%`, backgroundColor: "hsl(152, 60%, 38%)" }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round((metaStats.atingidas / metaStats.total) * 100)}% concluídas</p>
              </div>
            )}
          </div>
        </PBITile>
      </div>
    </div>
  );

  return <DashboardRouter>{dashboardCompleta}</DashboardRouter>;
}
