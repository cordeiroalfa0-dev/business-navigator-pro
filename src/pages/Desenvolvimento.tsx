import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import {
  Plus, Pencil, Trash2, X, Check, ChevronUp, ChevronDown,
  Rocket, Wrench, Bug, Plug, Loader2, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// ── Tipos ─────────────────────────────────────────────────────────────────
interface DevItem {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: "feature" | "melhoria" | "correcao" | "integracao";
  prioridade: "baixa" | "media" | "alta" | "critica";
  status: "planejado" | "em_andamento" | "concluido" | "cancelado";
  previsao: string | null;
  ordem: number;
  created_at: string;
}

type FormState = Omit<DevItem, "id" | "ordem" | "created_at">;

const EMPTY_FORM: FormState = {
  titulo: "",
  descricao: "",
  categoria: "feature",
  prioridade: "media",
  status: "planejado",
  previsao: "",
};

// ── Configurações visuais ─────────────────────────────────────────────────
const CATEGORIA_CFG = {
  feature:    { label: "Feature",     icon: Rocket, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  melhoria:   { label: "Melhoria",    icon: Wrench, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  correcao:   { label: "Correção",    icon: Bug,    color: "bg-red-500/15 text-red-400 border-red-500/30" },
  integracao: { label: "Integração",  icon: Plug,   color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

const PRIORIDADE_CFG = {
  baixa:   { label: "Baixa",   color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  media:   { label: "Média",   color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  alta:    { label: "Alta",    color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  critica: { label: "Crítica", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const STATUS_CFG = {
  planejado:    { label: "Planejado",     color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  em_andamento: { label: "Em andamento",  color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  concluido:    { label: "Concluído",     color: "bg-green-500/15 text-green-400 border-green-500/30" },
  cancelado:    { label: "Cancelado",     color: "bg-red-500/15 text-red-400/50 border-red-500/20" },
};

// ── Componente principal ──────────────────────────────────────────────────
export default function Desenvolvimento() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  const [items, setItems]         = useState<DevItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Guard
  if (!isAdmin) return <Navigate to="/" replace />;

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dev_roadmap")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar itens", description: error.message, variant: "destructive" });
    } else {
      setItems((data ?? []) as DevItem[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useRealtimeTable("dev_roadmap", fetchItems);

  // ── Helpers form ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: DevItem) => {
    setEditingId(item.id);
    setForm({
      titulo:     item.titulo,
      descricao:  item.descricao ?? "",
      categoria:  item.categoria,
      prioridade: item.prioridade,
      status:     item.status,
      previsao:   item.previsao ?? "",
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      titulo:     form.titulo.trim(),
      descricao:  form.descricao?.trim() || null,
      categoria:  form.categoria,
      prioridade: form.prioridade,
      status:     form.status,
      previsao:   form.previsao?.trim() || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("dev_roadmap").update(payload).eq("id", editingId));
    } else {
      const maxOrdem = items.length ? Math.max(...items.map(i => i.ordem)) + 1 : 0;
      ({ error } = await supabase.from("dev_roadmap").insert({
        ...payload,
        ordem:      maxOrdem,
        created_by: user?.id,
      }));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Item atualizado" : "Item criado" });
      setDialogOpen(false);
      fetchItems();
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("dev_roadmap").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item excluído" });
      setDeleteId(null);
      fetchItems();
    }
  };

  // ── Reordenar ───────────────────────────────────────────────────────────
  const moveItem = async (id: string, direction: "up" | "down") => {
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const a = items[idx];
    const b = items[swapIdx];

    // Atualiza local imediatamente
    const updated = [...items];
    updated[idx]     = { ...a, ordem: b.ordem };
    updated[swapIdx] = { ...b, ordem: a.ordem };
    setItems(updated.sort((x, y) => x.ordem - y.ordem));

    // Persiste no Supabase
    await Promise.all([
      supabase.from("dev_roadmap").update({ ordem: b.ordem }).eq("id", a.id),
      supabase.from("dev_roadmap").update({ ordem: a.ordem }).eq("id", b.id),
    ]);
  };

  // ── Filtros ─────────────────────────────────────────────────────────────
  const filtered = filterStatus === "todos"
    ? items
    : items.filter(i => i.status === filterStatus);

  const counts = {
    planejado:    items.filter(i => i.status === "planejado").length,
    em_andamento: items.filter(i => i.status === "em_andamento").length,
    concluido:    items.filter(i => i.status === "concluido").length,
    cancelado:    items.filter(i => i.status === "cancelado").length,
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            Área de Desenvolvimento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planejamento de features e melhorias futuras do sistema
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Novo item
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(STATUS_CFG) as [string, typeof STATUS_CFG[keyof typeof STATUS_CFG]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "todos" : key)}
            className={`rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${
              filterStatus === key ? "ring-1 ring-primary border-primary/50" : "border-border"
            } bg-card`}
          >
            <p className="text-2xl font-semibold text-foreground">
              {counts[key as keyof typeof counts]}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* Filtro label */}
      {filterStatus !== "todos" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtro ativo:</span>
          <Badge variant="outline">{STATUS_CFG[filterStatus as keyof typeof STATUS_CFG]?.label}</Badge>
          <button onClick={() => setFilterStatus("todos")} className="hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Rocket className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhum item encontrado. Que tal adicionar o primeiro?</p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar item
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, idx) => {
            const CatIcon = CATEGORIA_CFG[item.categoria]?.icon ?? Rocket;
            const catCfg  = CATEGORIA_CFG[item.categoria];
            const priCfg  = PRIORIDADE_CFG[item.prioridade];
            const stsCfg  = STATUS_CFG[item.status];
            const isFirst = idx === 0;
            const isLast  = idx === filtered.length - 1;

            return (
              <div
                key={item.id}
                className={`group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 ${
                  item.status === "concluido" ? "opacity-60" : ""
                } ${item.status === "cancelado" ? "opacity-40" : ""}`}
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
                  <button
                    onClick={() => moveItem(item.id, "up")}
                    disabled={isFirst}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/20 mx-auto" />
                  <button
                    onClick={() => moveItem(item.id, "down")}
                    disabled={isLast}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Ícone categoria */}
                <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center border ${catCfg?.color}`}>
                  <CatIcon className="w-4 h-4" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className={`font-medium text-sm leading-snug ${
                      item.status === "concluido" ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {item.titulo}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${stsCfg?.color}`}>
                        {stsCfg?.label}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${priCfg?.color}`}>
                        {priCfg?.label}
                      </span>
                    </div>
                  </div>

                  {item.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.descricao}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${catCfg?.color}`}>
                      {catCfg?.label}
                    </span>
                    {item.previsao && (
                      <span className="text-[11px] text-muted-foreground">
                        📅 {item.previsao}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog criar/editar ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar item" : "Novo item de desenvolvimento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Título *</label>
              <Input
                placeholder="Ex: Integração com WhatsApp Business"
                value={form.titulo}
                onChange={e => setField("titulo", e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Textarea
                placeholder="Detalhe o que será implementado..."
                value={form.descricao ?? ""}
                onChange={e => setField("descricao", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Select value={form.categoria} onValueChange={v => setField("categoria", v as FormState["categoria"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIA_CFG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Prioridade</label>
                <Select value={form.prioridade} onValueChange={v => setField("prioridade", v as FormState["prioridade"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_CFG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={form.status} onValueChange={v => setField("status", v as FormState["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Previsão</label>
                <Input
                  placeholder="Ex: Q2 2026 / Maio"
                  value={form.previsao ?? ""}
                  onChange={e => setField("previsao", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingId ? "Salvar alterações" : "Criar item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog confirmar exclusão ──────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O item será removido permanentemente do roadmap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
