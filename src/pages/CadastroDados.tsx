import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Trash2, CheckCircle2, Database, Filter, ChevronDown, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

interface DataEntry {
  id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  responsavel: string;
  created_at: string;
}

const categorias = [
  "Vendas de Unidades", "Compra de Materiais", "Serviços Terceirizados",
  "Mão de Obra", "Despesas Administrativas", "Receitas Financeiras",
  "Infraestrutura", "Licenças e Alvarás",
];

export default function CadastroDados() {
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();
  if (!authLoading && userRole === "normal") return <AccessDenied requiredRole="Admin ou Master" />;
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responsaveis, setResponsaveis] = useState<string[]>([]);
  const [form, setForm] = useState({
    categoria: "", descricao: "", valor: "",
    data: new Date().toISOString().split("T")[0], responsavel: "",
  });

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("dados_cadastro")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setEntries(data as DataEntry[]);
    } catch (err: any) {
      toast({ title: "Erro ao carregar dados", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca responsáveis dinamicamente da tabela profiles
  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .order("full_name", { ascending: true });
        if (data && data.length > 0) {
          setResponsaveis(data.map((p: any) => p.full_name).filter(Boolean));
        }
      } catch {}
    };
    fetchResponsaveis();
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useRealtimeTable("dados_cadastro", fetchEntries);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoria || !form.descricao || !form.valor) {
      toast({ title: "Campos obrigatórios", description: "Preencha categoria, descrição e valor.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("dados_cadastro").insert({
      categoria: form.categoria,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data: form.data,
      responsavel: form.responsavel,
      created_by: user!.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setForm({ categoria: "", descricao: "", valor: "", data: new Date().toISOString().split("T")[0], responsavel: "" });
    toast({ title: "Dado registrado!", description: `${form.categoria}: ${form.descricao}` });
    fetchEntries();
  };

  const removeEntry = async (id: string) => {
    const { error } = await supabase.from("dados_cadastro").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Registro excluído" });
    fetchEntries();
  };

  return (
    <div className="space-y-4">
      {/* PBI Header */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-white">Cadastro de Dados</h1>
            <p className="text-[11px]" style={{ color: "hsl(0, 0%, 72%)" }}>Registre dados de obras, vendas e despesas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEntries} className="h-7 text-[11px] border-none gap-1 bg-secondary text-foreground hover:bg-secondary/80">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
          <span className="text-[11px] px-2.5 py-1 rounded" style={{ background: "hsl(45, 100%, 51%, 0.15)", color: "hsl(var(--pbi-yellow))" }}>
            {entries.length} registros
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap rounded-md p-2 px-3 bg-card border border-border">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground">Filtros:</span>
        {["Categoria", "Responsável", "Período"].map((f) => (
          <button key={f} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-colors bg-muted text-foreground border border-border">
            {f} <ChevronDown className="w-3 h-3" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Form tile */}
        <div className="lg:col-span-2 pbi-tile">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4" style={{ color: "hsl(var(--pbi-yellow))" }} />
            <span className="text-[12px] font-semibold text-foreground">Novo Registro</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="h-8 text-[12px] pbi-input-bg border-none">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Responsável</Label>
              {responsaveis.length > 0 ? (
                <Select value={form.responsavel} onValueChange={(v) => setForm({ ...form, responsavel: v })}>
                  <SelectTrigger className="h-8 text-[12px] pbi-input-bg border-none">
                    <SelectValue placeholder="Selecione o responsável..." />
                  </SelectTrigger>
                  <SelectContent>
                    {responsaveis.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                  className="h-8 text-[12px] pbi-input-bg border-none"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Descrição *</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Compra de cimento para Bloco C..."
                className="resize-none h-16 text-[12px] pbi-input-bg border-none"
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" className="h-8 text-[12px] pbi-input-bg border-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="h-8 text-[12px] pbi-input-bg border-none" />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full h-8 text-[12px] font-semibold" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Salvando..." : "Salvar Registro"}
            </Button>
          </form>
        </div>

        {/* Entries tile */}
        <div className="lg:col-span-3 pbi-tile">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(152, 60%, 38%)" }} />
            <span className="text-[12px] font-semibold text-foreground">
              Registros Recentes ({entries.length})
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">Nenhum registro ainda</p>
              <p className="text-[11px] mt-1 text-muted-foreground/60">Use o formulário ao lado para cadastrar</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-md transition-colors bg-muted border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(45, 100%, 51%, 0.15)", color: "hsl(var(--pbi-yellow))" }}>
                        {entry.categoria}
                      </span>
                      {entry.responsavel && (
                        <span className="text-[10px] text-muted-foreground">{entry.responsavel}</span>
                      )}
                    </div>
                    <p className="text-[12px] mt-1 text-foreground">{entry.descricao}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[12px] font-bold text-foreground">
                        R$ {Number(entry.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="p-1.5 rounded hover:bg-destructive/20 transition-colors text-muted-foreground">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
