import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/useConfirm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, FileText, Trash2, Eye, CloudRain, Sun, Cloud,
  Users, Clock, Loader2, ChevronDown, ChevronUp,
  HardHat, Camera, AlertTriangle, Wrench, X, Check,
  Download, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import AccessDenied from "@/components/AccessDenied";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Obra { id: string; nome: string; etapa_atual: string; }
interface Efetivo { funcao: string; quantidade: number; horas: number; empresa: string; }
interface Diario {
  id: string; obra_id: string | null; obra_nome: string;
  data_registro: string;
  clima_manha: string; clima_tarde: string;
  temperatura_max: number | null; temperatura_min: number | null;
  total_trabalhadores: number; horas_trabalhadas: number;
  atividades_dia: string; ocorrencias: string | null;
  equipamentos: string | null; materiais_usados: string | null;
  observacoes: string | null; fotos: string[];
  created_at: string;
}

// ── Helpers visuais ────────────────────────────────────────────────────────
const CLIMA_CFG: Record<string, { label: string; icon: any; color: string }> = {
  bom:         { label: "Bom",          icon: Sun,       color: "hsl(42,65%,56%)"  },
  nublado:     { label: "Nublado",      icon: Cloud,     color: "hsl(215,20%,60%)" },
  chuvoso:     { label: "Chuvoso",      icon: CloudRain, color: "hsl(210,80%,48%)" },
  chuva_forte: { label: "Chuva Forte",  icon: CloudRain, color: "hsl(0,72%,51%)"   },
  tempestade:  { label: "Tempestade",   icon: AlertTriangle, color: "hsl(0,72%,51%)" },
};

const EMPTY_EFETIVO: Efetivo = { funcao: "", quantidade: 1, horas: 8, empresa: "" };

const EMPTY_FORM = {
  obra_id: "",
  obra_nome: "",
  data_registro: new Date().toISOString().split("T")[0],
  clima_manha: "bom",
  clima_tarde: "bom",
  temperatura_max: "" as any,
  temperatura_min: "" as any,
  atividades_dia: "",
  ocorrencias: "",
  equipamentos: "",
  materiais_usados: "",
  observacoes: "",
};

// ── Componente ─────────────────────────────────────────────────────────────
export default function DiarioObra() {
  const { isAdmin, userRole, user } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();
  const canEdit = isAdmin || userRole === "master";

  const [diarios,    setDiarios]    = useState<Diario[]>([]);
  const [obras,      setObras]      = useState<Obra[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewModal,  setViewModal]  = useState<Diario | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [filterObra, setFilterObra] = useState("todas");
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [efetivo,    setEfetivo]    = useState<Efetivo[]>([{ ...EMPTY_EFETIVO }]);
  const [uploading,  setUploading]  = useState(false);
  const [fotos,      setFotos]      = useState<string[]>([]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchDiarios = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("diario_obra")
      .select("*")
      .order("data_registro", { ascending: false })
      .limit(200);
    setDiarios((data ?? []) as Diario[]);
    setLoading(false);
  }, []);

  const fetchObras = useCallback(async () => {
    const { data } = await supabase
      .from("execucao_obras")
      .select("id, nome, etapa_atual")
      .order("nome");
    setObras((data ?? []) as Obra[]);
  }, []);

  useEffect(() => { fetchDiarios(); fetchObras(); }, [fetchDiarios, fetchObras]);
  useRealtimeTable("diario_obra", fetchDiarios);

  // ── Upload de fotos ──────────────────────────────────────────────────────
  const handleFotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 5)) {
      const path = `${user?.id}/${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const { error } = await supabase.storage
        .from("diario-fotos").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from("diario-fotos").getPublicUrl(path);
        urls.push(publicUrl);
      }
    }
    setFotos(prev => [...prev, ...urls]);
    setUploading(false);
  };

  // ── Salvar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.atividades_dia.trim()) {
      toast({ title: "Descreva as atividades do dia", variant: "destructive" });
      return;
    }
    setSaving(true);

    const obra = obras.find(o => o.id === form.obra_id);
    const totalTrab = efetivo.reduce((s, e) => s + (Number(e.quantidade) || 0), 0);
    const totalHoras = efetivo.reduce((s, e) => s + ((Number(e.quantidade) || 0) * (Number(e.horas) || 0)), 0);

    const payload = {
      obra_id:            form.obra_id || null,
      obra_nome:          obra?.nome || form.obra_nome || "Obra não vinculada",
      data_registro:      form.data_registro,
      clima_manha:        form.clima_manha,
      clima_tarde:        form.clima_tarde,
      temperatura_max:    form.temperatura_max ? Number(form.temperatura_max) : null,
      temperatura_min:    form.temperatura_min ? Number(form.temperatura_min) : null,
      total_trabalhadores: totalTrab,
      horas_trabalhadas:  totalHoras,
      atividades_dia:     form.atividades_dia.trim(),
      ocorrencias:        form.ocorrencias?.trim() || null,
      equipamentos:       form.equipamentos?.trim() || null,
      materiais_usados:   form.materiais_usados?.trim() || null,
      observacoes:        form.observacoes?.trim() || null,
      fotos,
      created_by:         user?.id,
    };

    const { error: errDiario, data: novoDiario } = await supabase
      .from("diario_obra").insert(payload).select().single();

    if (errDiario) {
      toast({ title: "Erro ao salvar", description: errDiario.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Salvar efetivo detalhado
    const efetivoValido = efetivo.filter(e => e.funcao.trim() && e.quantidade > 0);
    if (efetivoValido.length > 0 && novoDiario) {
      await supabase.from("diario_obra_efetivo").insert(
        efetivoValido.map(e => ({ ...e, diario_id: novoDiario.id }))
      );
    }

    toast({ title: "RDO salvo com sucesso!" });
    setDialogOpen(false);
    setForm({ ...EMPTY_FORM });
    setEfetivo([{ ...EMPTY_EFETIVO }]);
    setFotos([]);
    setSaving(false);
    fetchDiarios();
  };

  // ── Excluir ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: "Excluir este RDO permanentemente? Esta ação não pode ser desfeita.", title: "Excluir RDO", confirmLabel: "Excluir", variant: "danger" }))) return;
    await supabase.from("diario_obra").delete().eq("id", id);
    toast({ title: "RDO excluído" });
    fetchDiarios();
  };

  // ── Exportar TXT simples (RDO) ───────────────────────────────────────────
  const exportarRDO = (d: Diario) => {
    const linhas = [
      "═══════════════════════════════════════════════════",
      "         RELATÓRIO DIÁRIO DE OBRA — RDO",
      "═══════════════════════════════════════════════════",
      `Obra:          ${d.obra_nome}`,
      `Data:          ${format(new Date(d.data_registro + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })}`,
      "",
      "── CONDIÇÕES CLIMÁTICAS ─────────────────────────",
      `Manhã:         ${CLIMA_CFG[d.clima_manha]?.label ?? d.clima_manha}`,
      `Tarde:         ${CLIMA_CFG[d.clima_tarde]?.label ?? d.clima_tarde}`,
      d.temperatura_max != null ? `Temperatura:   ${d.temperatura_min}°C – ${d.temperatura_max}°C` : "",
      "",
      "── EFETIVO ──────────────────────────────────────",
      `Total:         ${d.total_trabalhadores} trabalhadores`,
      `H/H Total:     ${d.horas_trabalhadas} horas`,
      "",
      "── ATIVIDADES DO DIA ────────────────────────────",
      d.atividades_dia,
      "",
      d.ocorrencias     ? `── OCORRÊNCIAS ─────────────────────────────────\n${d.ocorrencias}\n` : "",
      d.equipamentos    ? `── EQUIPAMENTOS ────────────────────────────────\n${d.equipamentos}\n` : "",
      d.materiais_usados? `── MATERIAIS UTILIZADOS ─────────────────────────\n${d.materiais_usados}\n` : "",
      d.observacoes     ? `── OBSERVAÇÕES ──────────────────────────────────\n${d.observacoes}\n` : "",
      d.fotos.length > 0? `── FOTOS (${d.fotos.length}) ───────────────────────────────────\n${d.fotos.join("\n")}\n` : "",
      "═══════════════════════════════════════════════════",
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    ].filter(l => l !== "").join("\n");

    const blob = new Blob([linhas], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `RDO_${d.obra_nome.replace(/\s/g, "_")}_${d.data_registro}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtros ──────────────────────────────────────────────────────────────
  const filtered = filterObra === "todas"
    ? diarios
    : diarios.filter(d => d.obra_id === filterObra || d.obra_nome === filterObra);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalRDOs       = diarios.length;
  const totalTrab       = diarios.reduce((s, d) => s + (d.total_trabalhadores || 0), 0);
  const totalHH         = diarios.reduce((s, d) => s + Number(d.horas_trabalhadas || 0), 0);
  const comOcorrencias  = diarios.filter(d => d.ocorrencias?.trim()).length;

  // ── Render ────────────────────────────────────────────────────────────────
  if (!canEdit && userRole !== "normal") return <AccessDenied requiredRole="Usuário" />;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: "hsl(42,65%,56%)" }} />
            Diário de Obra — RDO
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro Diário de Obra · atividades, efetivo, clima e ocorrências
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => { setDialogOpen(true); setForm({ ...EMPTY_FORM }); setEfetivo([{ ...EMPTY_EFETIVO }]); setFotos([]); }}
            className="gap-2 h-9 text-[12px]">
            <Plus className="w-4 h-4" /> Novo RDO
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total de RDOs",       value: totalRDOs,       color: "hsl(210,80%,48%)", icon: FileText  },
          { label: "Trabalhadores (total)",value: totalTrab,       color: "hsl(42,65%,56%)",  icon: Users     },
          { label: "Homem-hora total",     value: `${totalHH}h`,   color: "hsl(174,62%,47%)", icon: Clock     },
          { label: "Com ocorrências",      value: comOcorrencias,  color: "hsl(0,72%,51%)",   icon: AlertTriangle },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="pbi-tile flex items-center gap-3">
              <div className="p-2 rounded-lg shrink-0" style={{ background: `${k.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtro por obra */}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={filterObra}
          onChange={e => setFilterObra(e.target.value)}
          className="h-8 px-2 text-[12px] rounded border border-border bg-secondary text-foreground">
          <option value="todas">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <span className="text-[11px] text-muted-foreground">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Lista de RDOs */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="pbi-tile text-center py-16 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
          <p className="text-[13px] font-medium">Nenhum RDO registrado ainda</p>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Criar primeiro RDO
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const ClimaM = CLIMA_CFG[d.clima_manha]?.icon ?? Sun;
            const ClimaT = CLIMA_CFG[d.clima_tarde]?.icon ?? Sun;
            const isExp  = expanded === d.id;
            return (
              <div key={d.id} className="pbi-tile">
                {/* Linha principal */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Data */}
                    <div className="shrink-0 text-center rounded-lg p-2 min-w-[52px]"
                      style={{ background: "hsl(42,65%,56%,0.1)", border: "1px solid hsl(42,65%,56%,0.25)" }}>
                      <p className="text-[10px] text-muted-foreground leading-none">
                        {format(new Date(d.data_registro + "T12:00:00"), "MMM", { locale: ptBR }).toUpperCase()}
                      </p>
                      <p className="text-xl font-bold leading-tight" style={{ color: "hsl(42,65%,56%)" }}>
                        {format(new Date(d.data_registro + "T12:00:00"), "dd")}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground">{d.obra_nome}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(d.data_registro + "T12:00:00"), "EEEE", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{d.atividades_dia}</p>
                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px]"
                          style={{ color: CLIMA_CFG[d.clima_manha]?.color }}>
                          <ClimaM className="w-3 h-3" />
                          {CLIMA_CFG[d.clima_manha]?.label}
                        </span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />{d.total_trabalhadores} trab.
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{d.horas_trabalhadas}h
                        </span>
                        {d.ocorrencias && (
                          <Badge className="text-[9px] px-1.5 py-0" style={{ background: "hsl(0,72%,51%,0.15)", color: "hsl(0,72%,51%)" }}>
                            Ocorrência
                          </Badge>
                        )}
                        {d.fotos.length > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Camera className="w-3 h-3" />{d.fotos.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setViewModal(d)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Ver RDO">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => exportarRDO(d)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Exportar TXT">
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {canEdit && (
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExp ? null : d.id)}
                      className="p-1.5 rounded hover:bg-muted transition-colors">
                      {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expandido */}
                {isExp && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-[11px]">
                    {d.ocorrencias && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Ocorrências
                        </p>
                        <p className="text-foreground">{d.ocorrencias}</p>
                      </div>
                    )}
                    {d.equipamentos && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Equipamentos
                        </p>
                        <p className="text-foreground">{d.equipamentos}</p>
                      </div>
                    )}
                    {d.materiais_usados && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">Materiais utilizados</p>
                        <p className="text-foreground">{d.materiais_usados}</p>
                      </div>
                    )}
                    {d.fotos.length > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Fotos ({d.fotos.length})
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {d.fotos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`Foto ${i+1}`}
                                className="w-16 h-16 object-cover rounded border border-border hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog Criar RDO ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "hsl(42,65%,56%)" }} />
              Novo Registro Diário de Obra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Obra + Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Obra</label>
                <Select value={form.obra_id}
                  onValueChange={v => setForm(f => ({ ...f, obra_id: v, obra_nome: obras.find(o => o.id === v)?.nome || "" }))}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Selecionar obra" /></SelectTrigger>
                  <SelectContent>
                    {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Data *</label>
                <Input type="date" value={form.data_registro} className="h-8 text-[12px]"
                  onChange={e => setForm(f => ({ ...f, data_registro: e.target.value }))} />
              </div>
            </div>

            {/* Clima */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Clima manhã</label>
                <Select value={form.clima_manha} onValueChange={v => setForm(f => ({ ...f, clima_manha: v }))}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLIMA_CFG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Clima tarde</label>
                <Select value={form.clima_tarde} onValueChange={v => setForm(f => ({ ...f, clima_tarde: v }))}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLIMA_CFG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Temp. mín (°C)</label>
                <Input type="number" value={form.temperatura_min} className="h-8 text-[12px]"
                  onChange={e => setForm(f => ({ ...f, temperatura_min: e.target.value }))} placeholder="Ex: 18" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Temp. máx (°C)</label>
                <Input type="number" value={form.temperatura_max} className="h-8 text-[12px]"
                  onChange={e => setForm(f => ({ ...f, temperatura_max: e.target.value }))} placeholder="Ex: 28" />
              </div>
            </div>

            {/* Efetivo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" /> Efetivo
                </label>
                <button onClick={() => setEfetivo(e => [...e, { ...EMPTY_EFETIVO }])}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Adicionar função
                </button>
              </div>
              {efetivo.map((ef, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                  <Input placeholder="Função" value={ef.funcao} className="h-7 text-[11px] col-span-2"
                    onChange={e => { const n=[...efetivo]; n[idx].funcao=e.target.value; setEfetivo(n); }} />
                  <Input type="number" placeholder="Qtd" value={ef.quantidade} className="h-7 text-[11px]"
                    onChange={e => { const n=[...efetivo]; n[idx].quantidade=Number(e.target.value); setEfetivo(n); }} />
                  <div className="flex items-center gap-1">
                    <Input type="number" placeholder="H" value={ef.horas} className="h-7 text-[11px]"
                      onChange={e => { const n=[...efetivo]; n[idx].horas=Number(e.target.value); setEfetivo(n); }} />
                    {efetivo.length > 1 && (
                      <button onClick={() => setEfetivo(e => e.filter((_, i) => i !== idx))}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">
                Total: {efetivo.reduce((s, e) => s + (Number(e.quantidade)||0), 0)} trabalhadores ·{" "}
                {efetivo.reduce((s, e) => s + (Number(e.quantidade)||0)*(Number(e.horas)||0), 0)} H/H
              </p>
            </div>

            {/* Atividades */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Atividades do dia *</label>
              <Textarea value={form.atividades_dia} rows={3} className="text-[12px] resize-none"
                placeholder="Descreva as atividades executadas no dia..."
                onChange={e => setForm(f => ({ ...f, atividades_dia: e.target.value }))} />
            </div>

            {/* Ocorrências + Equipamentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Ocorrências
                </label>
                <Textarea value={form.ocorrencias} rows={2} className="text-[12px] resize-none"
                  placeholder="Acidentes, paralisações, problemas..."
                  onChange={e => setForm(f => ({ ...f, ocorrencias: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Equipamentos
                </label>
                <Textarea value={form.equipamentos} rows={2} className="text-[12px] resize-none"
                  placeholder="Betoneira, escavadeira, andaime..."
                  onChange={e => setForm(f => ({ ...f, equipamentos: e.target.value }))} />
              </div>
            </div>

            {/* Materiais + Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Materiais utilizados</label>
                <Textarea value={form.materiais_usados} rows={2} className="text-[12px] resize-none"
                  placeholder="Cimento, areia, ferro..."
                  onChange={e => setForm(f => ({ ...f, materiais_usados: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Observações gerais</label>
                <Textarea value={form.observacoes} rows={2} className="text-[12px] resize-none"
                  placeholder="Visitas, reuniões, anotações..."
                  onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>

            {/* Upload de fotos */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Camera className="w-3 h-3" /> Fotos (máx. 5)
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-1.5 h-8 px-3 rounded border border-dashed border-border text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  {uploading ? "Enviando..." : "Adicionar fotos"}
                  <input type="file" multiple accept="image/*" className="hidden"
                    onChange={e => handleFotos(e.target.files)} disabled={uploading || fotos.length >= 5} />
                </label>
                <span className="text-[10px] text-muted-foreground">{fotos.length}/5</span>
              </div>
              {fotos.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-1">
                  {fotos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-14 h-14 object-cover rounded border border-border" />
                      <button onClick={() => setFotos(f => f.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full hidden group-hover:flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Salvar RDO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal visualização RDO ────────────────────────────────────────── */}
      {viewModal && (
        <Dialog open onOpenChange={() => setViewModal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HardHat className="w-4 h-4" style={{ color: "hsl(42,65%,56%)" }} />
                  RDO — {viewModal.obra_nome}
                </span>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-[11px]"
                  onClick={() => exportarRDO(viewModal)}>
                  <Download className="w-3 h-3" /> Exportar TXT
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-[12px]">
              {/* Cabeçalho */}
              <div className="grid grid-cols-2 gap-3">
                <div className="pbi-tile">
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data
                  </p>
                  <p className="font-semibold">
                    {format(new Date(viewModal.data_registro + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                  </p>
                </div>
                <div className="pbi-tile">
                  <p className="text-[10px] text-muted-foreground mb-1">Clima</p>
                  <p className="font-semibold">
                    Manhã: {CLIMA_CFG[viewModal.clima_manha]?.label} · Tarde: {CLIMA_CFG[viewModal.clima_tarde]?.label}
                  </p>
                  {(viewModal.temperatura_min != null || viewModal.temperatura_max != null) && (
                    <p className="text-muted-foreground text-[10px]">
                      {viewModal.temperatura_min}°C – {viewModal.temperatura_max}°C
                    </p>
                  )}
                </div>
              </div>
              {/* Efetivo */}
              <div className="pbi-tile">
                <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Efetivo
                </p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-lg font-bold" style={{ color: "hsl(42,65%,56%)" }}>{viewModal.total_trabalhadores}</p>
                    <p className="text-[10px] text-muted-foreground">Trabalhadores</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: "hsl(174,62%,47%)" }}>{viewModal.horas_trabalhadas}</p>
                    <p className="text-[10px] text-muted-foreground">Homem-hora</p>
                  </div>
                </div>
              </div>
              {/* Atividades */}
              <div>
                <p className="font-semibold text-foreground mb-1">Atividades do dia</p>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewModal.atividades_dia}</p>
              </div>
              {viewModal.ocorrencias && (
                <div className="rounded-lg p-3" style={{ background: "hsl(0,72%,51%,0.08)", border: "1px solid hsl(0,72%,51%,0.2)" }}>
                  <p className="font-semibold flex items-center gap-1 mb-1" style={{ color: "hsl(0,72%,51%)" }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Ocorrências
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{viewModal.ocorrencias}</p>
                </div>
              )}
              {viewModal.equipamentos && (
                <div><p className="font-semibold mb-1">Equipamentos</p>
                  <p className="text-muted-foreground">{viewModal.equipamentos}</p></div>
              )}
              {viewModal.materiais_usados && (
                <div><p className="font-semibold mb-1">Materiais utilizados</p>
                  <p className="text-muted-foreground">{viewModal.materiais_usados}</p></div>
              )}
              {viewModal.observacoes && (
                <div><p className="font-semibold mb-1">Observações</p>
                  <p className="text-muted-foreground">{viewModal.observacoes}</p></div>
              )}
              {viewModal.fotos.length > 0 && (
                <div>
                  <p className="font-semibold mb-2 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Fotos ({viewModal.fotos.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {viewModal.fotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Foto ${i+1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-border hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
