import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  HardHat, Building2, CheckCircle2, AlertTriangle, Clock,
  Plus, Pencil, Trash2, X, Save, Target, Zap,
  ChevronDown, ChevronUp, Settings, GripVertical,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// ── Etapas ───────────────────────────────────────────────────────────────
const ETAPAS = ["Fundação", "Estrutura", "Alvenaria", "Instalações", "Acabamentos", "Entregue"];
const ETAPA_COLORS: Record<string, string> = {
  "Fundação": "hsl(207, 89%, 48%)", "Estrutura": "hsl(271, 60%, 55%)",
  "Alvenaria": "hsl(28, 87%, 55%)", "Instalações": "hsl(174, 62%, 47%)",
  "Acabamentos": "hsl(42, 65%, 56%)", "Entregue": "hsl(152, 60%, 38%)",
};
const PRIORIDADE_COLORS: Record<string, string> = {
  alta: "hsl(0, 72%, 51%)", media: "hsl(42, 65%, 56%)", baixa: "hsl(207, 89%, 48%)",
};
const CATEGORIAS = ["Engenharia","Construção","Qualidade","Materiais","Segurança","Projetos","Financeiro","Operacional","RH"];
const UNIDADES   = ["%","m²","un","kg","m³","horas","dias","R$"];

// ── Tipos ─────────────────────────────────────────────────────────────────
type ObraExecucao = {
  id: string; nome: string; etapa_atual: string; progresso: number;
  responsavel: string; data_inicio: string; data_prevista: string; observacao: string;
};
type Sugestao = {
  id: string; fase: string; nome: string; descricao: string;
  unidade: string; objetivo: number; prioridade: string; categoria: string; ordem: number; ativo: boolean;
};
type MetaObra = {
  id: string; nome: string; atual: number; objetivo: number; unidade: string;
  status: string; prioridade: string; percentual_concluido: number;
};

const EMPTY_OBRA: Omit<ObraExecucao, "id"> = {
  nome: "", etapa_atual: "Fundação", progresso: 0, responsavel: "",
  data_inicio: new Date().toISOString().split("T")[0], data_prevista: "", observacao: "",
};
const EMPTY_SUG: Omit<Sugestao, "id" | "ativo"> = {
  fase: "Fundação", nome: "", descricao: "", unidade: "%", objetivo: 100, prioridade: "media", categoria: "Construção", ordem: 99,
};

const PBITile = ({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) => (
  <div className={`pbi-tile ${className}`}>
    {title && <h3 className="text-[13px] font-semibold text-foreground mb-3">{title}</h3>}
    {children}
  </div>
);

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  atingida:  { color: "hsl(152, 60%, 38%)", label: "Atingida" },
  no_prazo:  { color: "hsl(207, 89%, 48%)", label: "No prazo" },
  atencao:   { color: "hsl(42, 65%, 56%)", label: "Atenção" },
  em_risco:  { color: "hsl(0, 72%, 51%)",   label: "Em risco" },
};

export default function ExecucaoObra() {
  const { theme }   = useTheme();
  const { userRole, user } = useAuth();
  const { toast }   = useToast();
  const canEdit     = userRole === "admin" || userRole === "master";

  // ── Estado principal ──────────────────────────────────────────────────
  const [obras,   setObras]   = useState<ObraExecucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<ObraExecucao | null>(null);
  const [form,     setForm]     = useState<Omit<ObraExecucao, "id">>(EMPTY_OBRA);

  // ── Sugestões de metas por fase ───────────────────────────────────────
  const [sugestoes,       setSugestoes]       = useState<Sugestao[]>([]);
  const [showGerenciar,   setShowGerenciar]   = useState(false);
  const [faseFiltro,      setFaseFiltro]      = useState("Fundação");
  const [editSug,         setEditSug]         = useState<Sugestao | null>(null);
  const [formSug,         setFormSug]         = useState<Omit<Sugestao, "id" | "ativo">>(EMPTY_SUG);
  const [showFormSug,     setShowFormSug]     = useState(false);
  const [savingSug,       setSavingSug]       = useState(false);

  // ── Metas já criadas por obra ─────────────────────────────────────────
  const [metasPorObra,    setMetasPorObra]    = useState<Record<string, MetaObra[]>>({});
  const [metasExpand,     setMetasExpand]     = useState<Record<string, boolean>>({});

  // ── Sugestões expand por obra ─────────────────────────────────────────
  const [sugExpand,       setSugExpand]       = useState<Record<string, boolean>>({});
  const [selSug,          setSelSug]          = useState<Record<string, Record<string, boolean>>>({});
  const [valSug,          setValSug]          = useState<Record<string, Record<string, string>>>({});
  const [obraConfirm,     setObraConfirm]     = useState<ObraExecucao | null>(null);
  const [criandoMetas,    setCriandoMetas]    = useState(false);

  // ── Edição inline de meta já criada ──────────────────────────────────
  const [editMetaInline,  setEditMetaInline]  = useState<MetaObra | null>(null);
  const [formMetaInline,  setFormMetaInline]  = useState<Partial<MetaObra>>({});
  const [savingMeta,      setSavingMeta]      = useState(false);

  const gridColor    = theme === "dark" ? "hsl(0, 0%, 25%)" : "hsl(0, 0%, 88%)";
  const axisColor    = theme === "dark" ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 60%)";
  const tooltipStyle = {
    borderRadius: "4px", fontSize: 12,
    border: `1px solid ${theme === "dark" ? "hsl(0,0%,30%)" : "hsl(0,0%,88%)"}`,
    backgroundColor: theme === "dark" ? "hsl(0,0%,18%)" : "#fff",
    color: theme === "dark" ? "#e8e8e8" : "#222",
  };
  const inputCls = "w-full h-8 px-2 rounded text-[12px] border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-yellow-400";

  // ── Fetch ──────────────────────────────────────────────────────────────
  const loadSugestoes = useCallback(async () => {
    const { data } = await supabase
      .from("metas_sugestoes_fase" as any).select("*").order("ordem");
    if (data) setSugestoes(data as Sugestao[]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("execucao_obras" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        setObras(data as ObraExecucao[]);
        const ids = (data as any[]).map((o: any) => o.id).filter(Boolean);
        if (ids.length > 0) {
          const { data: mdata } = await supabase
            .from("metas")
            .select("id,nome,atual,objetivo,unidade,status,prioridade,percentual_concluido,obra_id")
            .in("obra_id", ids);
          const map: Record<string, MetaObra[]> = {};
          for (const m of mdata ?? []) {
            if (!map[m.obra_id]) map[m.obra_id] = [];
            map[m.obra_id].push(m as MetaObra);
          }
          setMetasPorObra(map);
        }
      }
    } catch (err: any) {
      toast({ title: "Erro ao carregar obras", description: err?.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); loadSugestoes(); }, [load, loadSugestoes]);
  useRealtimeTable("execucao_obras", load);
  useRealtimeTable("metas", load);
  useRealtimeTable("metas_sugestoes_fase", loadSugestoes);

  // ── CRUD Obras ────────────────────────────────────────────────────────
  const salvar = async () => {
    if (!form.nome.trim()) return;
    try {
      const { error } = editing
        ? await supabase.from("execucao_obras" as any).update(form).eq("id", editing.id)
        : await supabase.from("execucao_obras" as any).insert(form);
      if (error) throw error;
      toast({ title: editing ? "Obra atualizada!" : "Obra criada!" });
      setShowForm(false); setEditing(null); setForm(EMPTY_OBRA);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    }
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta obra?")) return;
    const { error } = await supabase.from("execucao_obras" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Obra removida" });
  };

  const abrirEdicao = (obra: ObraExecucao) => {
    setEditing(obra);
    setForm({ nome: obra.nome, etapa_atual: obra.etapa_atual, progresso: obra.progresso,
              responsavel: obra.responsavel, data_inicio: obra.data_inicio,
              data_prevista: obra.data_prevista, observacao: obra.observacao });
    setShowForm(true);
  };

  // ── CRUD Sugestões ────────────────────────────────────────────────────
  const salvarSugestao = async () => {
    if (!formSug.nome.trim()) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    setSavingSug(true);
    try {
      const payload = { ...formSug, criado_por: user?.id };
      const { error } = editSug
        ? await supabase.from("metas_sugestoes_fase" as any).update(payload).eq("id", editSug.id)
        : await supabase.from("metas_sugestoes_fase" as any).insert({ ...payload, ativo: true });
      if (error) throw error;
      toast({ title: editSug ? "Sugestão atualizada!" : "Sugestão adicionada!" });
      setShowFormSug(false); setEditSug(null); setFormSug({ ...EMPTY_SUG, fase: faseFiltro });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    } finally { setSavingSug(false); }
  };

  const excluirSugestao = async (id: string) => {
    if (!confirm("Excluir esta sugestão?")) return;
    const { error } = await supabase.from("metas_sugestoes_fase" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Sugestão removida" });
  };

  const toggleAtivoSugestao = async (sug: Sugestao) => {
    await supabase.from("metas_sugestoes_fase" as any).update({ ativo: !sug.ativo }).eq("id", sug.id);
  };

  // ── Criar metas sugeridas para uma obra ──────────────────────────────
  const abrirSugestoesFase = (obra: ObraExecucao) => {
    const sug = sugestoes.filter(s => s.fase === obra.etapa_atual && s.ativo);
    const sel: Record<string, boolean> = {};
    const val: Record<string, string>  = {};
    sug.forEach(s => { sel[s.id] = true; val[s.id] = ""; });
    setSelSug(prev => ({ ...prev, [obra.id]: sel }));
    setValSug(prev => ({ ...prev, [obra.id]: val }));
    setSugExpand(prev => ({ ...prev, [obra.id]: !prev[obra.id] }));
  };

  const confirmarCriarMetas = async () => {
    if (!obraConfirm || !user) return;
    const sug    = sugestoes.filter(s => s.fase === obraConfirm.etapa_atual && s.ativo);
    const sel    = selSug[obraConfirm.id] ?? {};
    const val    = valSug[obraConfirm.id] ?? {};
    const escolhidas = sug.filter(s => sel[s.id]);
    if (!escolhidas.length) { toast({ title: "Selecione ao menos uma meta", variant: "destructive" }); return; }
    setCriandoMetas(true);
    try {
      const coresMeta = ["hsl(207,89%,48%)","hsl(42, 65%, 56%)","hsl(152,60%,38%)","hsl(174,62%,47%)","hsl(0,72%,51%)","hsl(28,87%,55%)","hsl(270,60%,55%)","hsl(330,70%,50%)"];
      const inserts = escolhidas.map((s, idx) => ({
        nome: s.nome, atual: 0,
        objetivo: val[s.id] ? parseFloat(val[s.id]) : s.objetivo,
        unidade: s.unidade, cor: coresMeta[idx % coresMeta.length],
        categoria: s.categoria, responsavel: obraConfirm.responsavel || "",
        prioridade: s.prioridade, ciclo: "Q1 2026", status: "no_prazo",
        descricao: s.descricao, local_obra: obraConfirm.nome,
        etapa: obraConfirm.etapa_atual, obra_id: obraConfirm.id,
        created_by: user.id, tipo_meta: "quantitativa",
        prazo: obraConfirm.data_prevista || null,
      }));
      const { error } = await supabase.from("metas").insert(inserts);
      if (error) throw error;
      toast({ title: `${escolhidas.length} meta${escolhidas.length > 1 ? "s criadas" : " criada"}!`,
              description: `Vinculadas à obra "${obraConfirm.nome}"` });
      setObraConfirm(null);
      setSugExpand(prev => ({ ...prev, [obraConfirm.id]: false }));
    } catch (err: any) {
      toast({ title: "Erro ao criar metas", description: err?.message, variant: "destructive" });
    } finally { setCriandoMetas(false); }
  };

  // ── Edição inline de meta já criada ──────────────────────────────────
  const salvarMetaInline = async () => {
    if (!editMetaInline) return;
    setSavingMeta(true);
    const pct = formMetaInline.objetivo
      ? Math.min(Math.round(((formMetaInline.atual ?? editMetaInline.atual) / (formMetaInline.objetivo)) * 100), 100)
      : editMetaInline.percentual_concluido;
    const newStatus = pct >= 100 ? "atingida" : pct >= 60 ? "no_prazo" : pct >= 30 ? "atencao" : "em_risco";
    const { error } = await supabase.from("metas").update({
      nome:      formMetaInline.nome      ?? editMetaInline.nome,
      atual:     formMetaInline.atual     ?? editMetaInline.atual,
      objetivo:  formMetaInline.objetivo  ?? editMetaInline.objetivo,
      unidade:   formMetaInline.unidade   ?? editMetaInline.unidade,
      prioridade:formMetaInline.prioridade?? editMetaInline.prioridade,
      status:    newStatus,
    }).eq("id", editMetaInline.id);
    setSavingMeta(false);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Meta atualizada!" }); setEditMetaInline(null); }
  };

  const excluirMetaInline = async (id: string) => {
    if (!confirm("Excluir esta meta da obra?")) return;
    const { error } = await supabase.from("metas").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Meta removida" });
  };

  // ── KPIs ──────────────────────────────────────────────────────────────
  const total   = obras.length;
  const concluidas   = obras.filter(o => o.etapa_atual === "Entregue").length;
  const emAndamento  = obras.filter(o => o.etapa_atual !== "Entregue").length;
  const atrasadas    = obras.filter(o => o.data_prevista && new Date(o.data_prevista) < new Date() && o.etapa_atual !== "Entregue").length;
  const progressoMedio = total > 0 ? Math.round(obras.reduce((a, o) => a + o.progresso, 0) / total) : 0;
  const dadosEtapa   = ETAPAS.map(etapa => ({
    etapa, qtd: obras.filter(o => o.etapa_atual === etapa).length,
  }));

  const sugsFase = sugestoes.filter(s => s.fase === faseFiltro);

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
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={() => setShowGerenciar(v => !v)}
              className="flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-medium"
              style={{ background: showGerenciar ? "hsl(174,62%,47%,0.2)" : "hsl(var(--secondary))", color: showGerenciar ? "hsl(174,62%,47%)" : "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
              <Settings className="w-3.5 h-3.5" /> Gerenciar Sugestões
            </button>
          )}
          {canEdit && (
            <button onClick={() => { setEditing(null); setForm(EMPTY_OBRA); setShowForm(true); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold"
              style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
              <Plus className="w-3.5 h-3.5" /> Nova Obra
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total de Obras",  value: total,           color: "hsl(207,89%,48%)" },
          { label: "Em Andamento",    value: emAndamento,     color: "hsl(42, 65%, 56%)" },
          { label: "Concluídas",      value: concluidas,      color: "hsl(152,60%,38%)" },
          { label: "Atrasadas",       value: atrasadas,       color: "hsl(0,72%,51%)" },
          { label: "Progresso Médio", value: `${progressoMedio}%`, color: "hsl(var(--pbi-yellow))" },
        ].map(k => (
          <PBITile key={k.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </PBITile>
        ))}
      </div>

      {/* ── PAINEL: Gerenciar Sugestões por Fase ── */}
      {showGerenciar && canEdit && (
        <div className="pbi-tile space-y-3" style={{ borderLeft: "3px solid hsl(174,62%,47%)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: "hsl(174,62%,47%)" }} />
              <p className="text-[13px] font-semibold text-foreground">Gerenciar Sugestões de Metas por Fase</p>
            </div>
            <button onClick={() => setShowGerenciar(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Abas de fase */}
          <div className="flex gap-1 flex-wrap">
            {ETAPAS.map(f => (
              <button key={f} onClick={() => { setFaseFiltro(f); setShowFormSug(false); setEditSug(null); }}
                className="text-[11px] px-3 py-1.5 rounded font-medium transition-all"
                style={{
                  background: faseFiltro === f ? ETAPA_COLORS[f] : "hsl(var(--secondary))",
                  color: faseFiltro === f ? "white" : "hsl(var(--foreground))",
                }}>
                {f} <span className="opacity-70">({sugestoes.filter(s => s.fase === f).length})</span>
              </button>
            ))}
          </div>

          {/* Lista de sugestões da fase */}
          <div className="space-y-1.5">
            {sugsFase.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">Nenhuma sugestão para esta fase. Adicione abaixo.</p>
            )}
            {sugsFase.map(sug => (
              <div key={sug.id} className="flex items-center gap-2 p-2 rounded transition-colors"
                style={{ background: sug.ativo ? "hsl(var(--secondary)/0.5)" : "hsl(var(--secondary)/0.2)", border: "1px solid hsl(var(--border))", opacity: sug.ativo ? 1 : 0.5 }}>
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-medium text-foreground">{sug.nome}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${PRIORIDADE_COLORS[sug.prioridade]}18`, color: PRIORIDADE_COLORS[sug.prioridade] }}>{sug.prioridade}</span>
                    <span className="text-[9px] text-muted-foreground">{sug.categoria}</span>
                    <span className="text-[9px] text-muted-foreground">{sug.objetivo > 0 ? `${sug.objetivo} ${sug.unidade}` : sug.unidade}</span>
                  </div>
                  {sug.descricao && <p className="text-[10px] text-muted-foreground truncate">{sug.descricao}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* toggle ativo/inativo */}
                  <button onClick={() => toggleAtivoSugestao(sug)}
                    className="text-[10px] px-2 py-1 rounded font-medium transition-all"
                    style={{ background: sug.ativo ? "hsl(152,60%,38%,0.15)" : "hsl(0,0%,50%,0.15)", color: sug.ativo ? "hsl(152,60%,38%)" : "hsl(0,0%,50%)" }}>
                    {sug.ativo ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => { setEditSug(sug); setFormSug({ fase: sug.fase, nome: sug.nome, descricao: sug.descricao, unidade: sug.unidade, objetivo: sug.objetivo, prioridade: sug.prioridade, categoria: sug.categoria, ordem: sug.ordem }); setShowFormSug(true); }}
                    className="p-1.5 rounded hover:bg-secondary transition-colors">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button onClick={() => excluirSugestao(sug.id)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                    <Trash2 className="w-3 h-3" style={{ color: "hsl(0,72%,51%)" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botão adicionar nova sugestão */}
          {!showFormSug && (
            <button onClick={() => { setEditSug(null); setFormSug({ ...EMPTY_SUG, fase: faseFiltro }); setShowFormSug(true); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-medium w-full justify-center"
              style={{ background: "hsl(174,62%,47%,0.1)", color: "hsl(174,62%,47%)", border: "1px dashed hsl(174,62%,47%,0.4)" }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar sugestão para {faseFiltro}
            </button>
          )}

          {/* Formulário de sugestão */}
          {showFormSug && (
            <div className="p-3 rounded space-y-3" style={{ background: "hsl(174,62%,47%,0.06)", border: "1px solid hsl(174,62%,47%,0.2)" }}>
              <p className="text-[12px] font-semibold text-foreground">{editSug ? "Editar sugestão" : `Nova sugestão — ${faseFiltro}`}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Nome da meta *</label>
                  <input className={inputCls} value={formSug.nome} onChange={e => setFormSug(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Concretagem de pilares" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Descrição</label>
                  <input className={inputCls} value={formSug.descricao} onChange={e => setFormSug(f => ({ ...f, descricao: e.target.value }))} placeholder="Breve descrição do que deve ser feito" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Unidade</label>
                  <select className={inputCls} value={formSug.unidade} onChange={e => setFormSug(f => ({ ...f, unidade: e.target.value }))}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Objetivo padrão</label>
                  <input type="number" className={inputCls} value={formSug.objetivo} onChange={e => setFormSug(f => ({ ...f, objetivo: Number(e.target.value) }))} placeholder="100" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Prioridade</label>
                  <select className={inputCls} value={formSug.prioridade} onChange={e => setFormSug(f => ({ ...f, prioridade: e.target.value }))}>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Categoria</label>
                  <select className={inputCls} value={formSug.categoria} onChange={e => setFormSug(f => ({ ...f, categoria: e.target.value }))}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowFormSug(false); setEditSug(null); }} className="h-8 px-3 rounded text-[12px] bg-secondary text-foreground">Cancelar</button>
                <button onClick={salvarSugestao} disabled={savingSug}
                  className="h-8 px-4 rounded text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  style={{ background: "hsl(174,62%,47%)", color: "white" }}>
                  <Save className="w-3.5 h-3.5" /> {savingSug ? "Salvando..." : editSug ? "Atualizar" : "Adicionar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulário de obra */}
      {showForm && (
        <div className="pbi-tile space-y-3" style={{ borderLeft: "3px solid hsl(var(--pbi-yellow))" }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">{editing ? "Editar Obra" : "Nova Obra"}</p>
            <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Nome da Obra *</label>
              <input className={inputCls} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Residencial Parque Sul" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Etapa Atual</label>
              <select className={inputCls} value={form.etapa_atual} onChange={e => setForm(f => ({ ...f, etapa_atual: e.target.value }))}>
                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Progresso (%): {form.progresso}%</label>
              <input type="range" min={0} max={100} value={form.progresso} onChange={e => setForm(f => ({ ...f, progresso: Number(e.target.value) }))} className="w-full" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Responsável</label>
              <input className={inputCls} value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do responsável" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Data de Início</label>
              <input type="date" className={inputCls} value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Previsão de Entrega</label>
              <input type="date" className={inputCls} value={form.data_prevista} onChange={e => setForm(f => ({ ...f, data_prevista: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Observações</label>
              <textarea className={`${inputCls} h-16 resize-none pt-1.5`} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Notas sobre o andamento..." />
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PBITile title="Obras por Etapa">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosEtapa} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="etapa" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "obras"]} />
              <Bar dataKey="qtd" radius={[0, 4, 4, 0]}>
                {dadosEtapa.map(entry => <Cell key={entry.etapa} fill={ETAPA_COLORS[entry.etapa]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PBITile>
        <PBITile title="Progresso Médio por Etapa">
          <div className="space-y-2.5 mt-1">
            {ETAPAS.map(etapa => {
              const itens = obras.filter(o => o.etapa_atual === etapa);
              const pct   = itens.length > 0 ? Math.round(itens.reduce((a, o) => a + o.progresso, 0) / itens.length) : 0;
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
          </div>
        ) : (
          <div className="space-y-2">
            {obras.map(obra => {
              const atrasada  = obra.data_prevista && new Date(obra.data_prevista) < new Date() && obra.etapa_atual !== "Entregue";
              const color     = ETAPA_COLORS[obra.etapa_atual] || "hsl(207,89%,48%)";
              const metasObra = metasPorObra[obra.id] ?? [];
              const sugFase   = sugestoes.filter(s => s.fase === obra.etapa_atual && s.ativo);
              const selObra   = selSug[obra.id] ?? {};
              const valObra   = valSug[obra.id] ?? {};
              const expandMetas = metasExpand[obra.id];
              const expandSug   = sugExpand[obra.id];

              return (
                <div key={obra.id} className="rounded border border-border" style={{ background: "hsl(var(--card))" }}>
                  {/* Cabeçalho da obra */}
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-semibold text-foreground">{obra.nome}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{obra.etapa_atual}</span>
                        {atrasada && <span className="text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "hsl(0,72%,51%,0.15)", color: "hsl(0,72%,51%)" }}><AlertTriangle className="w-2.5 h-2.5" /> Atrasada</span>}
                        {obra.etapa_atual === "Entregue" && <span className="text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "hsl(152,60%,38%,0.15)", color: "hsl(152,60%,38%)" }}><CheckCircle2 className="w-2.5 h-2.5" /> Concluída</span>}
                        {metasObra.length > 0 && (
                          <button onClick={() => setMetasExpand(prev => ({ ...prev, [obra.id]: !prev[obra.id] }))}
                            className="text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition-all"
                            style={{ background: "hsl(271,60%,55%,0.15)", color: "hsl(271,60%,55%)" }}>
                            <Target className="w-2.5 h-2.5" /> {metasObra.length} meta{metasObra.length > 1 ? "s" : ""} {expandMetas ? "▲" : "▼"}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {obra.responsavel   && <span className="text-[10px] text-muted-foreground">👤 {obra.responsavel}</span>}
                        {obra.data_inicio   && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(obra.data_inicio).toLocaleDateString("pt-BR")}</span>}
                        {obra.data_prevista && <span className="text-[10px] text-muted-foreground">→ {new Date(obra.data_prevista).toLocaleDateString("pt-BR")}</span>}
                      </div>
                      {obra.observacao && <p className="text-[10px] text-muted-foreground mt-1 truncate">{obra.observacao}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${obra.progresso}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{obra.progresso}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && sugFase.length > 0 && (
                        <button onClick={() => abrirSugestoesFase(obra)}
                          className="flex items-center gap-1 h-7 px-2 rounded text-[10px] font-medium transition-all"
                          style={{ background: expandSug ? "hsl(271,60%,55%,0.2)" : "hsl(271,60%,55%,0.1)", color: "hsl(271,60%,55%)", border: "1px solid hsl(271,60%,55%,0.3)" }}>
                          <Zap className="w-3 h-3" />
                          <span className="hidden sm:inline">+ Metas da Fase</span>
                          {expandSug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                      {canEdit && (
                        <>
                          <button onClick={() => abrirEdicao(obra)} className="p-1.5 rounded hover:bg-secondary"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                          <button onClick={() => excluir(obra.id)} className="p-1.5 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0,72%,51%)" }} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metas já criadas para esta obra */}
                  {expandMetas && metasObra.length > 0 && (
                    <div className="border-t border-border px-3 pb-3 pt-2" style={{ background: "hsl(271,60%,55%,0.03)" }}>
                      <p className="text-[11px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" style={{ color: "hsl(271,60%,55%)" }} />
                        Metas vinculadas a esta obra
                      </p>
                      <div className="space-y-1.5">
                        {metasObra.map(meta => {
                          const pct   = Math.min(Math.round((meta.atual / (meta.objetivo || 1)) * 100), 100);
                          const scfg  = STATUS_CFG[meta.status] ?? STATUS_CFG.no_prazo;
                          const isEd  = editMetaInline?.id === meta.id;
                          return (
                            <div key={meta.id} className="rounded p-2" style={{ background: "hsl(var(--secondary)/0.5)", border: "1px solid hsl(var(--border))" }}>
                              {isEd ? (
                                /* ── Edição inline ── */
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="col-span-2 sm:col-span-4">
                                      <label className="text-[10px] text-muted-foreground block mb-0.5">Nome</label>
                                      <input className={inputCls} value={formMetaInline.nome ?? meta.nome} onChange={e => setFormMetaInline(f => ({ ...f, nome: e.target.value }))} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground block mb-0.5">Atual</label>
                                      <input type="number" className={inputCls} value={formMetaInline.atual ?? meta.atual} onChange={e => setFormMetaInline(f => ({ ...f, atual: Number(e.target.value) }))} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground block mb-0.5">Objetivo</label>
                                      <input type="number" className={inputCls} value={formMetaInline.objetivo ?? meta.objetivo} onChange={e => setFormMetaInline(f => ({ ...f, objetivo: Number(e.target.value) }))} />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground block mb-0.5">Unidade</label>
                                      <select className={inputCls} value={formMetaInline.unidade ?? meta.unidade} onChange={e => setFormMetaInline(f => ({ ...f, unidade: e.target.value }))}>
                                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-muted-foreground block mb-0.5">Prioridade</label>
                                      <select className={inputCls} value={formMetaInline.prioridade ?? meta.prioridade} onChange={e => setFormMetaInline(f => ({ ...f, prioridade: e.target.value }))}>
                                        <option value="alta">Alta</option>
                                        <option value="media">Média</option>
                                        <option value="baixa">Baixa</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditMetaInline(null)} className="h-7 px-3 rounded text-[11px] bg-secondary text-foreground">Cancelar</button>
                                    <button onClick={salvarMetaInline} disabled={savingMeta} className="h-7 px-3 rounded text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50" style={{ background: "hsl(271,60%,55%)", color: "white" }}>
                                      <Save className="w-3 h-3" /> {savingMeta ? "Salvando..." : "Salvar"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* ── Visualização ── */
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-medium text-foreground">{meta.nome}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${scfg.color}18`, color: scfg.color }}>{scfg.label}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${PRIORIDADE_COLORS[meta.prioridade]}18`, color: PRIORIDADE_COLORS[meta.prioridade] }}>{meta.prioridade}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: scfg.color }} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground shrink-0">{meta.atual}/{meta.objetivo} {meta.unidade} · {pct}%</span>
                                    </div>
                                  </div>
                                  {canEdit && (
                                    <div className="flex gap-1 shrink-0">
                                      <button onClick={() => { setEditMetaInline(meta); setFormMetaInline({}); }} className="p-1 rounded hover:bg-secondary"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                                      <button onClick={() => excluirMetaInline(meta.id)} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0,72%,51%)" }} /></button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sugestões de metas da fase */}
                  {expandSug && canEdit && sugFase.length > 0 && (
                    <div className="border-t border-border px-3 pb-3 pt-2" style={{ background: "hsl(271,60%,55%,0.04)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5" style={{ color: "hsl(271,60%,55%)" }} />
                        <p className="text-[11px] font-semibold text-foreground">Sugestões para fase <span style={{ color }}>{obra.etapa_atual}</span></p>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {Object.values(selObra).filter(Boolean).length} selecionada{Object.values(selObra).filter(Boolean).length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {sugFase.map(sug => {
                          const sel = selObra[sug.id] ?? true;
                          const pc  = PRIORIDADE_COLORS[sug.prioridade];
                          return (
                            <div key={sug.id} className="flex items-center gap-2 p-2 rounded cursor-pointer transition-all"
                              style={{ background: sel ? "hsl(271,60%,55%,0.08)" : "hsl(var(--secondary)/0.5)", border: `1px solid ${sel ? "hsl(271,60%,55%,0.25)" : "hsl(var(--border))"}` }}
                              onClick={() => setSelSug(prev => ({ ...prev, [obra.id]: { ...(prev[obra.id] ?? {}), [sug.id]: !sel } }))}>
                              <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all"
                                style={{ background: sel ? "hsl(271,60%,55%)" : "transparent", border: `1.5px solid ${sel ? "hsl(271,60%,55%)" : "hsl(var(--border))"}` }}>
                                {sel && <span className="text-white text-[9px] font-bold">✓</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-medium text-foreground">{sug.nome}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${pc}18`, color: pc }}>{sug.prioridade}</span>
                                  <span className="text-[9px] text-muted-foreground">{sug.categoria}</span>
                                </div>
                                {sug.descricao && <p className="text-[10px] text-muted-foreground">{sug.descricao}</p>}
                              </div>
                              {sel && (
                                <div className="shrink-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <input type="number" placeholder={sug.objetivo > 0 ? String(sug.objetivo) : "Qtd"}
                                    value={valObra[sug.id] || ""}
                                    onChange={e => setValSug(prev => ({ ...prev, [obra.id]: { ...(prev[obra.id] ?? {}), [sug.id]: e.target.value } }))}
                                    className="w-16 h-6 px-1.5 rounded text-[11px] border border-border bg-background text-foreground text-right" />
                                  <span className="text-[10px] text-muted-foreground">{sug.unidade}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => setObraConfirm(obra)}
                          disabled={!Object.values(selObra).some(Boolean)}
                          className="flex items-center gap-1.5 h-7 px-3 rounded text-[11px] font-semibold disabled:opacity-40"
                          style={{ background: "hsl(271,60%,55%)", color: "white" }}>
                          <Plus className="w-3 h-3" /> Criar Metas Selecionadas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PBITile>

      {/* Modal de confirmação */}
      {obraConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border shadow-xl" style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: "hsl(271,60%,55%)" }} />
                <p className="text-[13px] font-semibold text-foreground">Confirmar criação de metas</p>
              </div>
              <button onClick={() => setObraConfirm(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 rounded" style={{ background: "hsl(271,60%,55%,0.08)", border: "1px solid hsl(271,60%,55%,0.2)" }}>
                <p className="text-[12px] font-medium text-foreground">{obraConfirm.nome}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Fase: <span style={{ color: ETAPA_COLORS[obraConfirm.etapa_atual] }}>{obraConfirm.etapa_atual}</span>
                  {obraConfirm.responsavel && <> · {obraConfirm.responsavel}</>}
                </p>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {sugestoes.filter(s => s.fase === obraConfirm.etapa_atual && s.ativo && (selSug[obraConfirm.id] ?? {})[s.id]).map(sug => {
                  const obj = valSug[obraConfirm.id]?.[sug.id] ? parseFloat(valSug[obraConfirm.id][sug.id]) : sug.objetivo;
                  return (
                    <div key={sug.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-[11px]" style={{ background: "hsl(var(--secondary)/0.5)" }}>
                      <Target className="w-3 h-3 shrink-0" style={{ color: "hsl(271,60%,55%)" }} />
                      <span className="flex-1 text-foreground">{sug.nome}</span>
                      <span className="text-muted-foreground shrink-0">{obj > 0 ? `${obj} ${sug.unidade}` : sug.unidade}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                As metas criadas aparecerão no módulo <strong>Metas</strong> vinculadas a esta obra e podem ser editadas lá também.
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setObraConfirm(null)} className="h-8 px-4 rounded text-[12px] font-medium bg-secondary text-foreground">Cancelar</button>
              <button onClick={confirmarCriarMetas} disabled={criandoMetas}
                className="h-8 px-4 rounded text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-60"
                style={{ background: "hsl(271,60%,55%)", color: "white" }}>
                {criandoMetas ? "Criando..." : <><Zap className="w-3.5 h-3.5" /> Criar Metas</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
