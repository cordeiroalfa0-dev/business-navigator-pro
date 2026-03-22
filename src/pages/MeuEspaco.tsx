import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import MetaFileUpload from "@/components/MetaFileUpload";
import {
  MessageCircle, Plus, CheckCircle2, Target, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Send, ImagePlus, ListChecks, User,
  TrendingUp, FileText, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

interface Meta {
  id: string; nome: string; atual: number; objetivo: number; unidade: string;
  cor: string; categoria: string; responsavel: string; prazo: string;
  prioridade: "alta" | "media" | "baixa"; status: string; ciclo: string;
  descricao: string; tipo_meta: string;
}
interface Acao {
  id: string; meta_id: string; descricao: string; responsavel: string;
  prazo: string; concluida: boolean; tipo: string; imagens: string[];
  created_by: string; created_at: string; user_name: string;
}
interface CheckIn {
  id: string; meta_id: string; user_id: string; user_name: string;
  valor_anterior: number; valor_novo: number; comentario: string;
  confianca: string; imagens: string[]; created_at: string;
}

const prioridadeConfig: Record<string, { label: string; color: string; bg: string }> = {
  alta:  { label: "Alta",  color: "hsl(0, 72%, 51%)",    bg: "hsl(0, 72%, 51%, 0.15)" },
  media: { label: "Média", color: "hsl(45, 100%, 51%)",  bg: "hsl(45, 100%, 51%, 0.15)" },
  baixa: { label: "Baixa", color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.15)" },
};
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  no_prazo: { label: "No Prazo",  color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.15)" },
  atencao:  { label: "Atenção",   color: "hsl(45, 100%, 51%)",  bg: "hsl(45, 100%, 51%, 0.15)" },
  em_risco: { label: "Em Risco",  color: "hsl(0, 72%, 51%)",    bg: "hsl(0, 72%, 51%, 0.15)" },
  atingida: { label: "Atingida",  color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.15)" },
};

function isQualitativa(m: Meta) {
  return m.tipo_meta === "qualitativa" || m.unidade === "texto";
}

function formatVal(v: number, u: string) {
  if (u === "R$") return `R$ ${v.toLocaleString("pt-BR")}`;
  return `${v.toLocaleString("pt-BR")} ${u}`;
}

const PBITile = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`pbi-tile ${className}`}>{children}</div>
);

export default function MeuEspaco() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const [metas, setMetas] = useState<Meta[]>([]);
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeta, setExpandedMeta] = useState<string | null>(null);

  // Form de check-in
  const [checkinMetaId, setCheckinMetaId] = useState<string | null>(null);
  const [newCheckin, setNewCheckin] = useState({ valor: "", comentario: "", confianca: "no_prazo", imagens: [] as string[] });
  const [savingCheckin, setSavingCheckin] = useState(false);

  // Form de contribuição
  const [contribMetaId, setContribMetaId] = useState<string | null>(null);
  const [newContrib, setNewContrib] = useState({ descricao: "", imagens: [] as string[] });
  const [savingContrib, setSavingContrib] = useState(false);

  const fetchData = useCallback(async () => {
    const [m, a, c] = await Promise.all([
      supabase.from("metas").select("*").order("created_at", { ascending: false }),
      supabase.from("acoes_meta").select("*").order("created_at", { ascending: false }),
      supabase.from("meta_checkins").select("*").order("created_at", { ascending: false }),
    ]);
    if (m.data) setMetas(m.data as Meta[]);
    if (a.data) setAcoes(a.data as Acao[]);
    if (c.data) setCheckins(c.data as CheckIn[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeTable("metas", fetchData);
  useRealtimeTable("meta_checkins", fetchData);
  useRealtimeTable("acoes_meta", fetchData);

  // Minhas contribuições e checkins
  const meusCheckins = checkins.filter(c => c.user_id === user?.id);
  const minhasContribs = acoes.filter(a => a.created_by === user?.id && a.tipo === "contribuicao");
  const minhasAcoesConc = acoes.filter(a => a.created_by === user?.id && a.concluida);

  const salvarCheckin = async () => {
    if (!checkinMetaId || !newCheckin.comentario.trim()) {
      toast({ title: "Comentário obrigatório", variant: "destructive" }); return;
    }
    setSavingCheckin(true);
    const meta = metas.find(m => m.id === checkinMetaId);
    if (!meta) return;
    const novoValor = newCheckin.valor ? parseFloat(newCheckin.valor) : meta.atual;
    const pct = (novoValor / meta.objetivo) * 100;
    let st = newCheckin.confianca === "em_risco" ? "em_risco"
           : newCheckin.confianca === "atencao" ? "atencao"
           : pct >= 100 ? "atingida" : "no_prazo";

    await supabase.from("meta_checkins").insert({
      meta_id: checkinMetaId,
      user_id: user!.id,
      user_name: profile?.full_name || user?.email || "Usuário",
      valor_anterior: meta.atual,
      valor_novo: novoValor,
      comentario: newCheckin.comentario,
      confianca: newCheckin.confianca,
      imagens: newCheckin.imagens,
    });
    if (!isQualitativa(meta) && newCheckin.valor) {
      await supabase.from("metas").update({ atual: novoValor, status: st }).eq("id", checkinMetaId);
    }
    toast({ title: "Check-in registrado!" });
    setNewCheckin({ valor: "", comentario: "", confianca: "no_prazo", imagens: [] });
    setCheckinMetaId(null);
    setSavingCheckin(false);
    fetchData();
  };

  const salvarContrib = async () => {
    if (!contribMetaId || !newContrib.descricao.trim()) {
      toast({ title: "Descrição obrigatória", variant: "destructive" }); return;
    }
    setSavingContrib(true);
    await supabase.from("acoes_meta").insert({
      meta_id: contribMetaId,
      descricao: newContrib.descricao,
      responsavel: profile?.full_name || user?.email || "Usuário",
      tipo: "contribuicao",
      concluida: false,
      imagens: newContrib.imagens,
      created_by: user!.id,
      user_name: profile?.full_name || user?.email || "Usuário",
    } as any);
    toast({ title: "Contribuição adicionada!" });
    setNewContrib({ descricao: "", imagens: [] });
    setContribMetaId(null);
    setSavingContrib(false);
    fetchData();
  };

  const marcarConcluida = async (acaoId: string, atual: boolean) => {
    await supabase.from("acoes_meta").update({ concluida: !atual }).eq("id", acaoId);
    fetchData();
  };

  const barColor = (pct: number) =>
    pct >= 80 ? "hsl(152, 60%, 38%)" : pct >= 50 ? "hsl(207, 89%, 48%)" : pct >= 30 ? "hsl(45, 100%, 51%)" : "hsl(0, 72%, 51%)";

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Meu Espaço — <span style={{ color: "hsl(var(--pbi-yellow))" }}>{profile?.full_name}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Registre check-ins, contribuições e acompanhe seu progresso</p>
          </div>
        </div>
      </div>

      {/* KPIs pessoais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Metas ativas", value: metas.filter(m => m.status !== "atingida").length, color: "hsl(207, 89%, 48%)", icon: Target },
          { label: "Meus check-ins", value: meusCheckins.length, color: "hsl(152, 60%, 38%)", icon: MessageCircle },
          { label: "Minhas contribuições", value: minhasContribs.length, color: "hsl(174, 62%, 47%)", icon: ListChecks },
          { label: "Ações concluídas", value: minhasAcoesConc.length, color: "hsl(45, 100%, 51%)", icon: CheckCircle2 },
        ].map(k => {
          const Icon = k.icon;
          return (
            <PBITile key={k.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{k.label}</p>
                  <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                </div>
                <div className="p-2 rounded" style={{ background: `${k.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
              </div>
            </PBITile>
          );
        })}
      </div>

      {/* Instrução */}
      <div className="pbi-tile" style={{ borderLeft: "4px solid hsl(174, 62%, 47%)" }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: "hsl(174, 62%, 47%)" }} />
          <p className="text-[13px] font-semibold text-foreground">O que você pode fazer aqui</p>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Para cada meta abaixo você pode: registrar um <strong className="text-foreground">check-in</strong> com atualização de progresso e fotos,
          adicionar uma <strong className="text-foreground">contribuição</strong> descrevendo o que está fazendo para ajudar,
          e <strong className="text-foreground">marcar ações como concluídas</strong>.
          Cada envio pode incluir imagens, PDFs ou planilhas como evidência.
        </p>
      </div>

      {/* Lista de metas */}
      <div className="space-y-3">
        {metas.length === 0 && (
          <PBITile>
            <p className="text-[12px] text-muted-foreground text-center py-8">Nenhuma meta cadastrada ainda.</p>
          </PBITile>
        )}

        {metas.map(meta => {
          const qual = isQualitativa(meta);
          const pct = qual ? 0 : Math.min(Math.round((meta.atual / meta.objetivo) * 100), 100);
          const metaAcoes = acoes.filter(a => a.meta_id === meta.id && a.tipo === "acao");
          const metaContribs = acoes.filter(a => a.meta_id === meta.id && a.tipo === "contribuicao");
          const metaCheckins = checkins.filter(c => c.meta_id === meta.id);
          const pCfg = prioridadeConfig[meta.prioridade] || prioridadeConfig.media;
          const sCfg = statusConfig[meta.status] || statusConfig.no_prazo;
          const expanded = expandedMeta === meta.id;
          const isCheckinOpen = checkinMetaId === meta.id;
          const isContribOpen = contribMetaId === meta.id;

          return (
            <PBITile key={meta.id}>
              {/* Cabeçalho da meta */}
              <div
                className="flex items-start justify-between gap-2 cursor-pointer"
                onClick={() => setExpandedMeta(expanded ? null : meta.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {qual ? <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: meta.cor }} />
                           : <Target className="w-3.5 h-3.5 shrink-0" style={{ color: meta.cor }} />}
                    <span className="text-[13px] font-semibold text-foreground">{meta.nome}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                    {meta.ciclo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{meta.ciclo}</span>}
                  </div>
                  {!qual && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor(pct) }} />
                      </div>
                      <span className="text-[11px] font-bold shrink-0" style={{ color: barColor(pct) }}>{pct}%</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatVal(meta.atual, meta.unidade)} / {formatVal(meta.objetivo, meta.unidade)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {meta.responsavel && <span className="text-[10px] text-muted-foreground">👤 {meta.responsavel}</span>}
                    {meta.prazo && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(meta.prazo).toLocaleDateString("pt-BR")}</span>}
                    <span className="text-[10px] text-muted-foreground">{metaCheckins.length} check-ins · {metaContribs.length} contribuições · {metaAcoes.length} ações</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2 mt-0.5">
                  {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Área expandida */}
              {expanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">

                  {/* Botões de ação */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => { setCheckinMetaId(isCheckinOpen ? null : meta.id); setContribMetaId(null); }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded text-[11px] font-semibold transition-colors"
                      style={{
                        background: isCheckinOpen ? "hsl(262, 52%, 47%)" : "hsl(262, 52%, 47%, 0.15)",
                        color: isCheckinOpen ? "white" : "hsl(262, 52%, 47%)",
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Fazer Check-in
                    </button>
                    <button
                      onClick={() => { setContribMetaId(isContribOpen ? null : meta.id); setCheckinMetaId(null); }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded text-[11px] font-semibold transition-colors"
                      style={{
                        background: isContribOpen ? "hsl(174, 62%, 47%)" : "hsl(174, 62%, 47%, 0.15)",
                        color: isContribOpen ? "white" : "hsl(174, 62%, 47%)",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Contribuição
                    </button>
                  </div>

                  {/* Form check-in */}
                  {isCheckinOpen && (
                    <div className="rounded-lg p-4 space-y-3" style={{ background: "hsl(262, 52%, 47%, 0.06)", border: "1px solid hsl(262, 52%, 47%, 0.2)" }}>
                      <p className="text-[12px] font-semibold text-foreground flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5" style={{ color: "hsl(262, 52%, 47%)" }} /> Registrar Check-in
                      </p>
                      {!qual && (
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Valor atual ({meta.unidade}) — opcional</label>
                          <input
                            type="number"
                            className="h-8 w-full rounded text-[12px] px-2 border border-border bg-secondary focus:outline-none"
                            placeholder={`Atual: ${meta.atual}`}
                            value={newCheckin.valor}
                            onChange={e => setNewCheckin(p => ({ ...p, valor: e.target.value }))}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Comentário *</label>
                        <textarea
                          className="w-full h-20 rounded text-[12px] px-2 py-1.5 border border-border bg-secondary resize-none focus:outline-none"
                          placeholder="Descreva o andamento, o que foi feito, próximos passos..."
                          value={newCheckin.comentario}
                          onChange={e => setNewCheckin(p => ({ ...p, comentario: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 block">Confiança</label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { key: "no_prazo", label: "No Prazo", color: "hsl(152, 60%, 38%)" },
                            { key: "atencao",  label: "Atenção",  color: "hsl(45, 100%, 51%)" },
                            { key: "em_risco", label: "Em Risco", color: "hsl(0, 72%, 51%)" },
                          ].map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => setNewCheckin(p => ({ ...p, confianca: opt.key }))}
                              className="text-[11px] px-3 py-1.5 rounded font-medium transition-colors"
                              style={{
                                background: newCheckin.confianca === opt.key ? opt.color : "hsl(var(--secondary))",
                                color: newCheckin.confianca === opt.key ? "white" : "hsl(var(--muted-foreground))",
                                border: `1px solid ${newCheckin.confianca === opt.key ? opt.color : "transparent"}`,
                              }}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 block">Anexos (imagens, PDF, planilhas)</label>
                        <MetaFileUpload files={newCheckin.imagens} onChange={imgs => setNewCheckin(p => ({ ...p, imagens: imgs }))} folder="checkins" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setCheckinMetaId(null)} className="h-8 px-4 rounded text-[12px] bg-secondary text-foreground">Cancelar</button>
                        <button onClick={salvarCheckin} disabled={savingCheckin} className="h-8 px-4 rounded text-[12px] font-semibold flex items-center gap-1.5 text-white" style={{ background: "hsl(262, 52%, 47%)" }}>
                          <Send className="w-3.5 h-3.5" /> {savingCheckin ? "Salvando..." : "Registrar"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form contribuição */}
                  {isContribOpen && (
                    <div className="rounded-lg p-4 space-y-3" style={{ background: "hsl(174, 62%, 47%, 0.06)", border: "1px solid hsl(174, 62%, 47%, 0.2)" }}>
                      <p className="text-[12px] font-semibold text-foreground flex items-center gap-2">
                        <ListChecks className="w-3.5 h-3.5" style={{ color: "hsl(174, 62%, 47%)" }} /> Adicionar Contribuição
                      </p>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">O que você está fazendo para ajudar? *</label>
                        <textarea
                          className="w-full h-20 rounded text-[12px] px-2 py-1.5 border border-border bg-secondary resize-none focus:outline-none"
                          placeholder="Descreva sua contribuição, tarefa ou atividade relacionada a esta meta..."
                          value={newContrib.descricao}
                          onChange={e => setNewContrib(p => ({ ...p, descricao: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 block">Anexos (imagens, PDF, planilhas)</label>
                        <MetaFileUpload files={newContrib.imagens} onChange={imgs => setNewContrib(p => ({ ...p, imagens: imgs }))} folder="acoes" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setContribMetaId(null)} className="h-8 px-4 rounded text-[12px] bg-secondary text-foreground">Cancelar</button>
                        <button onClick={salvarContrib} disabled={savingContrib} className="h-8 px-4 rounded text-[12px] font-semibold flex items-center gap-1.5 text-white" style={{ background: "hsl(174, 62%, 47%)" }}>
                          <Send className="w-3.5 h-3.5" /> {savingContrib ? "Salvando..." : "Contribuir"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ações existentes */}
                  {metaAcoes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ações ({metaAcoes.length})</p>
                      <div className="space-y-1.5">
                        {metaAcoes.map(acao => (
                          <div key={acao.id} className="flex items-start gap-2 p-2 rounded" style={{ background: "hsl(var(--secondary))" }}>
                            <button
                              onClick={() => marcarConcluida(acao.id, acao.concluida)}
                              className="shrink-0 mt-0.5 transition-colors"
                              title={acao.concluida ? "Marcar como pendente" : "Marcar como concluída"}
                            >
                              <CheckCircle2 className="w-4 h-4" style={{ color: acao.concluida ? "hsl(152, 60%, 38%)" : "hsl(0, 0%, 50%)" }} />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-foreground" style={{ textDecoration: acao.concluida ? "line-through" : "none", opacity: acao.concluida ? 0.6 : 1 }}>{acao.descricao}</p>
                              {acao.responsavel && <p className="text-[10px] text-muted-foreground mt-0.5">👤 {acao.responsavel}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contribuições */}
                  {metaContribs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Contribuições ({metaContribs.length})</p>
                      <div className="space-y-1.5">
                        {metaContribs.map(c => (
                          <div key={c.id} className="flex items-start gap-2 p-2 rounded" style={{ background: "hsl(174, 62%, 47%, 0.08)" }}>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "hsl(174, 62%, 47%, 0.2)" }}>
                              <span className="text-[9px] font-bold" style={{ color: "hsl(174, 62%, 47%)" }}>{(c.user_name || "?")[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-foreground">{c.descricao}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{c.user_name} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                              {c.imagens?.length > 0 && (
                                <p className="text-[10px] mt-0.5" style={{ color: "hsl(174, 62%, 47%)" }}>
                                  <ImagePlus className="w-3 h-3 inline mr-0.5" />{c.imagens.length} anexo(s)
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Últimos check-ins */}
                  {metaCheckins.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Últimos check-ins</p>
                      <div className="space-y-1.5">
                        {metaCheckins.slice(0, 3).map(ci => (
                          <div key={ci.id} className="p-2 rounded" style={{ background: "hsl(262, 52%, 47%, 0.08)" }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-foreground font-medium">{ci.user_name}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(ci.created_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{ci.comentario}</p>
                            {ci.imagens?.length > 0 && (
                              <p className="text-[10px] mt-0.5" style={{ color: "hsl(262, 52%, 47%)" }}>
                                <ImagePlus className="w-3 h-3 inline mr-0.5" />{ci.imagens.length} anexo(s)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </PBITile>
          );
        })}
      </div>
    </div>
  );
}
