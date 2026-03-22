import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HardHat, Building2, CheckCircle2, AlertTriangle, Clock, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const ETAPAS = ["Fundação", "Estrutura", "Alvenaria", "Instalações", "Acabamentos", "Entregue"];

const ETAPA_COLORS: Record<string, string> = {
  "Fundação":     "hsl(207, 89%, 48%)",
  "Estrutura":    "hsl(271, 60%, 55%)",
  "Alvenaria":    "hsl(28, 87%, 55%)",
  "Instalações":  "hsl(174, 62%, 47%)",
  "Acabamentos":  "hsl(45, 100%, 51%)",
  "Entregue":     "hsl(152, 60%, 38%)",
};

type ObraExecucao = {
  id: string;
  nome: string;
  etapa_atual: string;
  progresso: number; // 0-100
  responsavel: string;
  data_inicio: string;
  data_prevista: string;
  observacao: string;
};

const EMPTY_OBRA: Omit<ObraExecucao, "id"> = {
  nome: "",
  etapa_atual: "Fundação",
  progresso: 0,
  responsavel: "",
  data_inicio: new Date().toISOString().split("T")[0],
  data_prevista: "",
  observacao: "",
};

const PBITile = ({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) => (
  <div className={`pbi-tile ${className}`}>
    {title && <h3 className="text-[13px] font-semibold text-foreground mb-3">{title}</h3>}
    {children}
  </div>
);

export default function ExecucaoObra() {
  const { theme } = useTheme();
  const { userRole } = useAuth();
  const { toast } = useToast();
  const canEdit = userRole === "admin" || userRole === "master";
  const [obras, setObras] = useState<ObraExecucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ObraExecucao | null>(null);
  const [form, setForm] = useState<Omit<ObraExecucao, "id">>(EMPTY_OBRA);

  const gridColor = theme === "dark" ? "hsl(0, 0%, 25%)" : "hsl(0, 0%, 88%)";
  const axisColor = theme === "dark" ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 60%)";
  const tooltipStyle = {
    borderRadius: "4px",
    border: `1px solid ${theme === "dark" ? "hsl(0, 0%, 30%)" : "hsl(0, 0%, 88%)"}`,
    fontSize: 12,
    backgroundColor: theme === "dark" ? "hsl(0, 0%, 18%)" : "#fff",
    color: theme === "dark" ? "#e8e8e8" : "#222",
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("execucao_obras" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setObras(data as ObraExecucao[]);
    } catch (err: any) {
      toast({ title: "Erro ao carregar obras", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable("execucao_obras", load);

  const salvar = async () => {
    if (!form.nome.trim()) return;
    try {
      const { error } = editing
        ? await supabase.from("execucao_obras" as any).update(form).eq("id", editing.id)
        : await supabase.from("execucao_obras" as any).insert(form);
      if (error) throw error;
      toast({ title: editing ? "Obra atualizada!" : "Obra criada!" });
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_OBRA);
      load();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    }
  };

  const excluir = async (id: string) => {
    try {
      const { error } = await supabase.from("execucao_obras" as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Obra removida" });
      load();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err?.message, variant: "destructive" });
    }
  };

  const abrirEdicao = (obra: ObraExecucao) => {
    setEditing(obra);
    setForm({ nome: obra.nome, etapa_atual: obra.etapa_atual, progresso: obra.progresso, responsavel: obra.responsavel, data_inicio: obra.data_inicio, data_prevista: obra.data_prevista, observacao: obra.observacao });
    setShowForm(true);
  };

  // KPIs
  const total = obras.length;
  const concluidas = obras.filter(o => o.etapa_atual === "Entregue").length;
  const emAndamento = obras.filter(o => o.etapa_atual !== "Entregue").length;
  const atrasadas = obras.filter(o => o.data_prevista && new Date(o.data_prevista) < new Date() && o.etapa_atual !== "Entregue").length;
  const progressoMedio = total > 0 ? Math.round(obras.reduce((a, o) => a + o.progresso, 0) / total) : 0;

  // Dados por etapa para gráfico
  const dadosEtapa = ETAPAS.map(etapa => ({
    etapa,
    qtd: obras.filter(o => o.etapa_atual === etapa).length,
    progresso: obras.filter(o => o.etapa_atual === etapa).length > 0
      ? Math.round(obras.filter(o => o.etapa_atual === etapa).reduce((a, o) => a + o.progresso, 0) / obras.filter(o => o.etapa_atual === etapa).length)
      : 0,
  }));

  const inputClass = `w-full h-8 px-2 rounded text-[12px] border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-yellow-400`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <HardHat className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-foreground">Execução Real da Obra</h1>
            <p className="text-[11px] text-muted-foreground">Acompanhe o progresso físico — Fundação, Estrutura, Acabamentos...</p>
          </div>
        </div>
        {canEdit && (
        <button
          onClick={() => { setEditing(null); setForm(EMPTY_OBRA); setShowForm(true); }}
          className="flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold"
          style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}
        >
          <Plus className="w-3.5 h-3.5" /> Nova Obra
        </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total de Obras", value: total, color: "hsl(207, 89%, 48%)" },
          { label: "Em Andamento", value: emAndamento, color: "hsl(45, 100%, 51%)" },
          { label: "Concluídas", value: concluidas, color: "hsl(152, 60%, 38%)" },
          { label: "Atrasadas", value: atrasadas, color: "hsl(0, 72%, 51%)" },
          { label: "Progresso Médio", value: `${progressoMedio}%`, color: "hsl(var(--pbi-yellow))" },
        ].map(k => (
          <PBITile key={k.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </PBITile>
        ))}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="pbi-tile space-y-3" style={{ borderLeft: "3px solid hsl(var(--pbi-yellow))" }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">{editing ? "Editar Obra" : "Nova Obra"}</p>
            <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Nome da Obra *</label>
              <input className={inputClass} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Residencial Parque Sul" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Etapa Atual</label>
              <select className={inputClass} value={form.etapa_atual} onChange={e => setForm(f => ({ ...f, etapa_atual: e.target.value }))}>
                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Progresso (%): {form.progresso}%</label>
              <input type="range" min={0} max={100} value={form.progresso} onChange={e => setForm(f => ({ ...f, progresso: Number(e.target.value) }))} className="w-full" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Responsável</label>
              <input className={inputClass} value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do responsável" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Data de Início</label>
              <input type="date" className={inputClass} value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Previsão de Entrega</label>
              <input type="date" className={inputClass} value={form.data_prevista} onChange={e => setForm(f => ({ ...f, data_prevista: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Observações</label>
              <textarea className={`${inputClass} h-16 resize-none pt-1.5`} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Notas sobre o andamento..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="h-8 px-4 rounded text-[12px] font-medium bg-secondary text-foreground">Cancelar</button>
            <button onClick={salvar} className="h-8 px-4 rounded text-[12px] font-semibold flex items-center gap-1.5" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
              <Save className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* Gráfico + Resumo por etapa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PBITile title="Obras por Etapa">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosEtapa} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="etapa" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "obras"]} />
              <Bar dataKey="qtd" radius={[0, 4, 4, 0]}>
                {dadosEtapa.map((entry) => (
                  <Cell key={entry.etapa} fill={ETAPA_COLORS[entry.etapa]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PBITile>

        <PBITile title="Progresso Médio por Etapa">
          <div className="space-y-2.5 mt-1">
            {ETAPAS.map(etapa => {
              const itens = obras.filter(o => o.etapa_atual === etapa);
              const pct = itens.length > 0 ? Math.round(itens.reduce((a, o) => a + o.progresso, 0) / itens.length) : 0;
              const color = ETAPA_COLORS[etapa];
              return (
                <div key={etapa}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium text-foreground">{etapa}</span>
                    <span className="text-[10px] text-muted-foreground">{itens.length} obra{itens.length !== 1 ? "s" : ""} · <span className="font-bold" style={{ color }}>{pct}%</span></span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </PBITile>
      </div>

      {/* Lista de obras */}
      <PBITile title="Obras Cadastradas">
        {loading ? (
          <p className="text-[11px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : obras.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-[12px] text-muted-foreground">Nenhuma obra cadastrada ainda.</p>
            <p className="text-[11px] text-muted-foreground mt-1">Clique em <strong>Nova Obra</strong> para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {obras.map(obra => {
              const atrasada = obra.data_prevista && new Date(obra.data_prevista) < new Date() && obra.etapa_atual !== "Entregue";
              const color = ETAPA_COLORS[obra.etapa_atual] || "hsl(207, 89%, 48%)";
              return (
                <div key={obra.id} className="rounded p-3 border border-border hover:border-border/80 transition-colors" style={{ background: "hsl(var(--card))" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-semibold text-foreground">{obra.nome}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{obra.etapa_atual}</span>
                        {atrasada && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "hsl(0, 72%, 51%, 0.15)", color: "hsl(0, 72%, 51%)" }}>
                            <AlertTriangle className="w-2.5 h-2.5" /> Atrasada
                          </span>
                        )}
                        {obra.etapa_atual === "Entregue" && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "hsl(152, 60%, 38%, 0.15)", color: "hsl(152, 60%, 38%)" }}>
                            <CheckCircle2 className="w-2.5 h-2.5" /> Concluída
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {obra.responsavel && <span className="text-[10px] text-muted-foreground">👤 {obra.responsavel}</span>}
                        {obra.data_inicio && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(obra.data_inicio).toLocaleDateString("pt-BR")}</span>}
                        {obra.data_prevista && <span className="text-[10px] text-muted-foreground">→ {new Date(obra.data_prevista).toLocaleDateString("pt-BR")}</span>}
                      </div>
                      {obra.observacao && <p className="text-[10px] text-muted-foreground mt-1 truncate">{obra.observacao}</p>}
                      {/* barra de progresso */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${obra.progresso}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{obra.progresso}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <>
                          <button onClick={() => abrirEdicao(obra)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => excluir(obra.id)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                            <Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PBITile>
    </div>
  );
}
