import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, FileText, TrendingUp, Users, Trash2, Pencil, Search, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Empreendimento = {
  id: string; codigo: string; nome: string; fase: string; unidades: number;
  vendidas: number; status: string; previsao: string | null; endereco: string;
  created_by: string; created_at: string;
};
type Contrato = {
  id: string; numero: string; fornecedor: string; objeto: string; valor: number;
  status: string; data_inicio: string; data_fim: string | null;
  empreendimento_id: string | null; created_by: string; created_at: string;
};
type Material = {
  id: string; codigo: string; nome: string; canteiro: string; quantidade: number;
  minimo: number; unidade: string; created_by: string; created_at: string;
};

const statusColors: Record<string, { color: string; bg: string }> = {
  "em andamento": { color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.15)" },
  planejamento: { color: "hsl(45, 100%, 51%)", bg: "hsl(45, 100%, 51%, 0.15)" },
  "concluído": { color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.15)" },
  ativo: { color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.15)" },
};

type TabKey = "empreendimentos" | "contratos" | "materiais" | "clientes";
const EMPTY_EMP = { codigo: "", nome: "", fase: "Projeto", unidades: "", vendidas: "", status: "planejamento", previsao: "", endereco: "" };

export default function Pedidos() {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const canEdit = userRole === "admin" || userRole === "master";
  const routeTabMap: Record<string, TabKey> = {
    "/pedidos/vendas": "empreendimentos",
    "/pedidos/compras": "contratos",
    "/pedidos/estoque": "materiais",
    "/pedidos/crm": "clientes",
  };
  const [activeTab, setActiveTab] = useState<TabKey>(routeTabMap[location.pathname] || "empreendimentos");
  useEffect(() => { const m = routeTabMap[location.pathname]; if (m) setActiveTab(m); }, [location.pathname]);

  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmp, setSearchEmp] = useState("");
  const [searchCont, setSearchCont] = useState("");
  const [searchMat, setSearchMat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empreendimento | null>(null);
  const [formEmp, setFormEmp] = useState<Record<string, string>>(EMPTY_EMP);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ table: string; id: string; nome: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [e, c, m] = await Promise.all([
        supabase.from("empreendimentos").select("*").order("created_at", { ascending: false }),
        supabase.from("contratos").select("*").order("created_at", { ascending: false }),
        supabase.from("materiais").select("*").order("created_at", { ascending: false }),
      ]);
      if (e.data) setEmpreendimentos(e.data as any);
      if (c.data) setContratos(c.data as any);
      if (m.data) setMateriais(m.data as any);
    } catch (err: any) {
      toast.error("Erro ao carregar dados de obras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useRealtimeTable("empreendimentos", loadData);
  useRealtimeTable("contratos", loadData);
  useRealtimeTable("materiais", loadData);

  const handleSaveEmp = async () => {
    if (!user || !formEmp.nome) { toast.error("Nome obrigatório"); return; }
    try {
      const payload = {
        codigo: formEmp.codigo, nome: formEmp.nome, fase: formEmp.fase || "Projeto",
        unidades: parseInt(formEmp.unidades || "0"), vendidas: parseInt(formEmp.vendidas || "0"),
        status: formEmp.status || "planejamento", previsao: formEmp.previsao || null, endereco: formEmp.endereco || "",
      };
      if (editingEmp) {
        const { error } = await supabase.from("empreendimentos").update(payload).eq("id", editingEmp.id);
        if (error) throw error;
        toast.success("Empreendimento atualizado!");
      } else {
        const { error } = await supabase.from("empreendimentos").insert({ ...payload, created_by: user.id } as any);
        if (error) throw error;
        toast.success("Empreendimento adicionado!");
      }
      setShowForm(false); setEditingEmp(null); setFormEmp(EMPTY_EMP); loadData();
    } catch (err: any) { toast.error(err?.message ?? "Erro ao salvar"); }
  };

  const handleAddOther = async () => {
    if (!user) return;
    try {
      if (activeTab === "contratos") {
        const { error } = await supabase.from("contratos").insert({
          numero: formData.numero || "", fornecedor: formData.fornecedor || "",
          objeto: formData.objeto || "", valor: parseFloat(formData.valor || "0"),
          status: formData.status || "ativo",
          data_inicio: formData.data_inicio || new Date().toISOString().split("T")[0],
          data_fim: formData.data_fim || null, created_by: user.id,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("materiais").insert({
          codigo: formData.codigo || "", nome: formData.nome || "", canteiro: formData.canteiro || "",
          quantidade: parseFloat(formData.quantidade || "0"), minimo: parseFloat(formData.minimo || "0"),
          unidade: formData.unidade || "un", created_by: user.id,
        } as any);
        if (error) throw error;
      }
      toast.success("Registro adicionado!"); setFormData({}); setShowForm(false); loadData();
    } catch (err: any) { toast.error(err?.message ?? "Erro ao salvar"); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error } = await supabase.from(deleteConfirm.table as any).delete().eq("id", deleteConfirm.id);
      if (error) throw error;
      toast.success("Removido!");
      loadData();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openEditEmp = (e: Empreendimento) => {
    setEditingEmp(e);
    setFormEmp({ codigo: e.codigo, nome: e.nome, fase: e.fase, unidades: String(e.unidades), vendidas: String(e.vendidas), status: e.status, previsao: e.previsao || "", endereco: e.endereco });
    setShowForm(true);
  };

  const empFiltrados = empreendimentos.filter(e => !searchEmp || [e.nome, e.codigo, e.endereco].some(v => v.toLowerCase().includes(searchEmp.toLowerCase())));
  const contFiltrados = contratos.filter(c => !searchCont || [c.fornecedor, c.numero, c.objeto].some(v => v.toLowerCase().includes(searchCont.toLowerCase())));
  const matFiltrados = materiais.filter(m => !searchMat || [m.nome, m.codigo, m.canteiro].some(v => v.toLowerCase().includes(searchMat.toLowerCase())));

  const inp = "h-8 text-[12px] border border-border bg-secondary rounded px-2 w-full focus:outline-none focus:ring-1 focus:ring-yellow-400";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-white">Gestão de Obras</h1>
            <p className="text-[11px]" style={{ color: "hsl(0, 0%, 72%)" }}>Empreendimentos, contratos e materiais</p>
          </div>
        </div>
        {canEdit && (
          <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditingEmp(null); setFormEmp(EMPTY_EMP); setFormData({}); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[11px] font-semibold gap-1" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                <Plus className="w-3 h-3" /> {activeTab === "empreendimentos" ? "Novo Empreendimento" : activeTab === "contratos" ? "Novo Contrato" : "Novo Material"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingEmp ? "Editar Empreendimento" : activeTab === "empreendimentos" ? "Novo Empreendimento" : activeTab === "contratos" ? "Novo Contrato" : "Novo Material"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {activeTab === "empreendimentos" ? (
                  <>
                    <input className={inp} placeholder="Código (ex: OBR-001)" value={formEmp.codigo} onChange={e => setFormEmp(p => ({ ...p, codigo: e.target.value }))} />
                    <input className={inp} placeholder="Nome do Empreendimento *" value={formEmp.nome} onChange={e => setFormEmp(p => ({ ...p, nome: e.target.value }))} />
                    <Select value={formEmp.fase} onValueChange={v => setFormEmp(p => ({ ...p, fase: v }))}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Fase" /></SelectTrigger>
                      <SelectContent>{["Projeto", "Fundação", "Estrutura", "Acabamento", "Entregue"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input className={inp} type="number" placeholder="Unidades" value={formEmp.unidades} onChange={e => setFormEmp(p => ({ ...p, unidades: e.target.value }))} />
                      <input className={inp} type="number" placeholder="Vendidas" value={formEmp.vendidas} onChange={e => setFormEmp(p => ({ ...p, vendidas: e.target.value }))} />
                    </div>
                    <Select value={formEmp.status} onValueChange={v => setFormEmp(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="em andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <input className={inp} type="date" value={formEmp.previsao} onChange={e => setFormEmp(p => ({ ...p, previsao: e.target.value }))} />
                    <input className={inp} placeholder="Endereço" value={formEmp.endereco} onChange={e => setFormEmp(p => ({ ...p, endereco: e.target.value }))} />
                    <Button onClick={handleSaveEmp} className="w-full" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>{editingEmp ? "Salvar Alterações" : "Cadastrar"}</Button>
                  </>
                ) : activeTab === "contratos" ? (
                  <>
                    <input className={inp} placeholder="Número do contrato" value={formData.numero || ""} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} />
                    <input className={inp} placeholder="Fornecedor" value={formData.fornecedor || ""} onChange={e => setFormData(p => ({ ...p, fornecedor: e.target.value }))} />
                    <input className={inp} placeholder="Objeto" value={formData.objeto || ""} onChange={e => setFormData(p => ({ ...p, objeto: e.target.value }))} />
                    <input className={inp} type="number" placeholder="Valor" value={formData.valor || ""} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} />
                    <Select value={formData.status || "ativo"} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="concluído">Concluído</SelectItem></SelectContent>
                    </Select>
                    <input className={inp} type="date" value={formData.data_inicio || ""} onChange={e => setFormData(p => ({ ...p, data_inicio: e.target.value }))} />
                    <Button onClick={handleAddOther} className="w-full" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>Cadastrar</Button>
                  </>
                ) : (
                  <>
                    <input className={inp} placeholder="Código (ex: MAT-001)" value={formData.codigo || ""} onChange={e => setFormData(p => ({ ...p, codigo: e.target.value }))} />
                    <input className={inp} placeholder="Nome do material" value={formData.nome || ""} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} />
                    <input className={inp} placeholder="Canteiro/Local" value={formData.canteiro || ""} onChange={e => setFormData(p => ({ ...p, canteiro: e.target.value }))} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input className={inp} type="number" placeholder="Quantidade" value={formData.quantidade || ""} onChange={e => setFormData(p => ({ ...p, quantidade: e.target.value }))} />
                      <input className={inp} type="number" placeholder="Mínimo" value={formData.minimo || ""} onChange={e => setFormData(p => ({ ...p, minimo: e.target.value }))} />
                    </div>
                    <input className={inp} placeholder="Unidade (un, kg, m³, sacos)" value={formData.unidade || ""} onChange={e => setFormData(p => ({ ...p, unidade: e.target.value }))} />
                    <Button onClick={handleAddOther} className="w-full" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>Cadastrar</Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Modal confirmação delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="pbi-tile w-full max-w-sm space-y-4" style={{ borderLeft: "3px solid hsl(0, 72%, 51%)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "hsl(0, 72%, 51%)" }} />
              <p className="text-[13px] font-semibold text-foreground">Confirmar exclusão</p>
            </div>
            <p className="text-[12px] text-muted-foreground">Tem certeza que deseja excluir <strong className="text-foreground">"{deleteConfirm.nome}"</strong>? Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="h-8 px-4 rounded text-[12px] font-medium bg-secondary text-foreground">Cancelar</button>
              <button onClick={confirmDelete} className="h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ background: "hsl(0, 72%, 51%)" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: "Empreendimentos Ativos", value: String(empreendimentos.filter(e => e.status !== "concluído").length), icon: Building2 },
          { title: "Contratos Vigentes", value: String(contratos.filter(c => c.status === "ativo").length), icon: FileText },
          { title: "Unidades Totais", value: String(empreendimentos.reduce((s, e) => s + e.unidades, 0)), icon: TrendingUp },
          { title: "Unidades Vendidas", value: String(empreendimentos.reduce((s, e) => s + e.vendidas, 0)), icon: Users },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="pbi-tile">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.title}</p>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="pbi-tabs-scroll bg-card border border-border rounded-md">
        {([{ key: "empreendimentos" as TabKey, label: "Empreendimentos" }, { key: "contratos" as TabKey, label: "Contratos" }, { key: "materiais" as TabKey, label: "Materiais" }, { key: "clientes" as TabKey, label: "Clientes" }]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-4 py-1.5 rounded text-[11px] font-medium transition-colors"
            style={{ background: activeTab === tab.key ? "hsl(var(--pbi-yellow))" : "transparent", color: activeTab === tab.key ? "hsl(var(--pbi-dark))" : undefined }}>
            <span className={activeTab !== tab.key ? "text-muted-foreground" : ""}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="pbi-tile">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" /></div>
        ) : activeTab === "empreendimentos" ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-semibold text-foreground flex-1">Empreendimentos ({empFiltrados.length}/{empreendimentos.length})</p>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={searchEmp} onChange={e => setSearchEmp(e.target.value)} placeholder="Buscar nome, código..." className="h-7 pl-6 pr-6 text-[11px] rounded border border-border bg-secondary w-48 focus:outline-none" />
                {searchEmp && <button onClick={() => setSearchEmp("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground" /></button>}
              </div>
            </div>
            {empFiltrados.length === 0 ? <p className="text-[11px] text-muted-foreground py-4 text-center">{searchEmp ? "Nenhum resultado." : "Nenhum empreendimento cadastrado."}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-border">{["Código", "Empreendimento", "Fase", "Unid.", "Vendidas", "Previsão", "Status", ""].map(h => <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                  <tbody>
                    {empFiltrados.map((e) => {
                      const pct = e.unidades > 0 ? Math.round((e.vendidas / e.unidades) * 100) : 0;
                      const st = statusColors[e.status] || statusColors["planejamento"];
                      return (
                        <tr key={e.id} className="pbi-row-hover transition-colors border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium" style={{ color: "hsl(207, 89%, 48%)" }}>{e.codigo}</td>
                          <td className="py-1.5 px-2 font-medium text-foreground">{e.nome}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{e.fase}</td>
                          <td className="py-1.5 px-2 text-foreground">{e.unidades}</td>
                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <span>{e.vendidas}</span>
                              <div className="w-12 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: "hsl(207, 89%, 48%)" }} /></div>
                              <span className="text-[10px] text-muted-foreground">{pct}%</span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">{e.previsao ? new Date(e.previsao).toLocaleDateString("pt-BR") : "—"}</td>
                          <td className="py-1.5 px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{e.status}</span></td>
                          <td className="py-1.5 px-2">
                            {canEdit && (
                              <div className="flex gap-1">
                                <button onClick={() => openEditEmp(e)} className="p-1 rounded hover:bg-secondary"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                                <button onClick={() => setDeleteConfirm({ table: "empreendimentos", id: e.id, nome: e.nome })} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === "contratos" ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-semibold text-foreground flex-1">Contratos ({contFiltrados.length}/{contratos.length})</p>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={searchCont} onChange={e => setSearchCont(e.target.value)} placeholder="Buscar fornecedor..." className="h-7 pl-6 pr-6 text-[11px] rounded border border-border bg-secondary w-48 focus:outline-none" />
                {searchCont && <button onClick={() => setSearchCont("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground" /></button>}
              </div>
            </div>
            {contFiltrados.length === 0 ? <p className="text-[11px] text-muted-foreground py-4 text-center">{searchCont ? "Nenhum resultado." : "Nenhum contrato cadastrado."}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-border">{["Contrato", "Fornecedor", "Objeto", "Data", "Valor", "Status", ""].map(h => <th key={h} className={`py-2 px-2 font-medium text-muted-foreground ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {contFiltrados.map((c) => {
                      const st = statusColors[c.status] || statusColors["ativo"];
                      return (
                        <tr key={c.id} className="pbi-row-hover transition-colors border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium" style={{ color: "hsl(207, 89%, 48%)" }}>{c.numero}</td>
                          <td className="py-1.5 px-2 text-foreground">{c.fornecedor}</td>
                          <td className="py-1.5 px-2 max-w-[180px] truncate text-muted-foreground">{c.objeto}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{new Date(c.data_inicio).toLocaleDateString("pt-BR")}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-foreground">R$ {Number(c.valor).toLocaleString("pt-BR")}</td>
                          <td className="py-1.5 px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{c.status}</span></td>
                          <td className="py-1.5 px-2">{canEdit && <button onClick={() => setDeleteConfirm({ table: "contratos", id: c.id, nome: c.numero || c.fornecedor })} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} /></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === "materiais" ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-semibold text-foreground flex-1">
                Materiais ({matFiltrados.length}/{materiais.length})
                {materiais.filter(m => m.quantidade <= m.minimo).length > 0 && (
                  <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(0, 72%, 51%, 0.15)", color: "hsl(0, 72%, 51%)" }}>
                    {materiais.filter(m => m.quantidade <= m.minimo).length} crítico(s)
                  </span>
                )}
              </p>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={searchMat} onChange={e => setSearchMat(e.target.value)} placeholder="Buscar material..." className="h-7 pl-6 pr-6 text-[11px] rounded border border-border bg-secondary w-48 focus:outline-none" />
                {searchMat && <button onClick={() => setSearchMat("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground" /></button>}
              </div>
            </div>
            {matFiltrados.length === 0 ? <p className="text-[11px] text-muted-foreground py-4 text-center">{searchMat ? "Nenhum resultado." : "Nenhum material cadastrado."}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-border">{["Código", "Material", "Canteiro", "Quantidade", "Mínimo", "Status", ""].map(h => <th key={h} className={`py-2 px-2 font-medium text-muted-foreground ${h === "Quantidade" || h === "Mínimo" ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {matFiltrados.map((item) => {
                      const isOk = item.quantidade > item.minimo * 1.5;
                      const isLow = item.quantidade > item.minimo;
                      const st = isOk ? { label: "OK", color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.15)" } : isLow ? { label: "Baixo", color: "hsl(45, 100%, 51%)", bg: "hsl(45, 100%, 51%, 0.15)" } : { label: "Crítico", color: "hsl(0, 72%, 51%)", bg: "hsl(0, 72%, 51%, 0.15)" };
                      return (
                        <tr key={item.id} className="pbi-row-hover transition-colors border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium" style={{ color: "hsl(207, 89%, 48%)" }}>{item.codigo}</td>
                          <td className="py-1.5 px-2 text-foreground">{item.nome}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{item.canteiro}</td>
                          <td className="py-1.5 px-2 text-right text-foreground">{Number(item.quantidade).toLocaleString("pt-BR")} {item.unidade}</td>
                          <td className="py-1.5 px-2 text-right text-muted-foreground">{Number(item.minimo).toLocaleString("pt-BR")} {item.unidade}</td>
                          <td className="py-1.5 px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td className="py-1.5 px-2">{canEdit && <button onClick={() => setDeleteConfirm({ table: "materiais", id: item.id, nome: item.nome })} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} /></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === "clientes" ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">CRM — Gestão de Clientes</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Este módulo está em desenvolvimento. Em breve você poderá cadastrar e acompanhar clientes, leads e histórico de negociações diretamente aqui.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}