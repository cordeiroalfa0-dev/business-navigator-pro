import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, CreditCard, FileText, TrendingUp, Trash2, Pencil, Search, AlertTriangle, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Faturamento = {
  id: string; numero: string; cliente: string; valor: number; status: string;
  data_emissao: string; data_vencimento: string; observacoes: string; created_by: string; created_at: string;
};
type ContaPagar = {
  id: string; fornecedor: string; descricao: string; valor: number; status: string;
  data_emissao: string; data_vencimento: string; categoria: string; created_by: string; created_at: string;
};
type ContaReceber = {
  id: string; cliente: string; descricao: string; valor: number; status: string;
  data_emissao: string; data_vencimento: string; categoria: string; created_by: string; created_at: string;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pago: { label: "Pago", color: "hsl(152, 60%, 38%)", bg: "hsl(152, 60%, 38%, 0.15)" },
  pendente: { label: "Pendente", color: "hsl(42, 65%, 56%)", bg: "hsl(45, 100%, 51%, 0.15)" },
  atrasado: { label: "Atrasado", color: "hsl(0, 72%, 51%)", bg: "hsl(0, 72%, 51%, 0.15)" },
  cancelado: { label: "Cancelado", color: "hsl(220, 15%, 55%)", bg: "hsl(220, 15%, 55%, 0.15)" },
};

type TabKey = "faturamento" | "pagar" | "receber" | "impostos" | "relatorios";

export default function Contabilidade() {
  const { theme } = useTheme();
  const { user, userRole } = useAuth();
  const location = useLocation();
  const canEdit = userRole === "admin" || userRole === "master";

  const routeTabMap: Record<string, TabKey> = {
    "/contabilidade/faturamento": "faturamento",
    "/contabilidade/pagamentos": "pagar",
    "/contabilidade/bancario": "receber",
    "/contabilidade/impostos": "impostos",
    "/contabilidade/relatorios": "relatorios",
  };
  const [activeTab, setActiveTab] = useState<TabKey>(routeTabMap[location.pathname] || "faturamento");

  // Sync tab when route changes (sidebar clicks)
  useEffect(() => {
    const mapped = routeTabMap[location.pathname];
    if (mapped) setActiveTab(mapped);
  }, [location.pathname]);
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  // Busca e confirmação de delete
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ table: string; id: string; nome: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, cp, cr] = await Promise.all([
        supabase.from("faturamento").select("*").order("created_at", { ascending: false }),
        supabase.from("contas_pagar").select("*").order("created_at", { ascending: false }),
        supabase.from("contas_receber").select("*").order("created_at", { ascending: false }),
      ]);
      if (f.data) setFaturamentos(f.data as any);
      if (cp.data) setContasPagar(cp.data as any);
      if (cr.data) setContasReceber(cr.data as any);
    } catch (err: any) {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useRealtimeTable("faturamento", loadData);
  useRealtimeTable("contas_pagar", loadData);
  useRealtimeTable("contas_receber", loadData);

  const handleAdd = async () => {
    if (!user) return;
    try {
      if (activeTab === "faturamento") {
        const { error } = await supabase.from("faturamento").insert({
          numero: formData.numero || "",
          cliente: formData.cliente || "",
          valor: parseFloat(formData.valor || "0"),
          status: formData.status || "pendente",
          data_emissao: formData.data_emissao || new Date().toISOString().split("T")[0],
          data_vencimento: formData.data_vencimento || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          observacoes: formData.observacoes || "",
          created_by: user.id,
        } as any);
        if (error) throw error;
      } else if (activeTab === "pagar") {
        const { error } = await supabase.from("contas_pagar").insert({
          fornecedor: formData.fornecedor || "",
          descricao: formData.descricao || "",
          valor: parseFloat(formData.valor || "0"),
          status: formData.status || "pendente",
          data_emissao: formData.data_emissao || new Date().toISOString().split("T")[0],
          data_vencimento: formData.data_vencimento || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          categoria: formData.categoria || "outros",
          created_by: user.id,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contas_receber").insert({
          cliente: formData.cliente || "",
          descricao: formData.descricao || "",
          valor: parseFloat(formData.valor || "0"),
          status: formData.status || "pendente",
          data_emissao: formData.data_emissao || new Date().toISOString().split("T")[0],
          data_vencimento: formData.data_vencimento || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          categoria: formData.categoria || "outros",
          created_by: user.id,
        } as any);
        if (error) throw error;
      }
      toast.success("Registro adicionado!");
      setFormData({});
      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    try {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Removido!");
      loadData();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao remover");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Limpar busca ao trocar de aba
  const handleTabChange = (tab: TabKey) => { setActiveTab(tab); setSearchTerm(""); };

  // Filtros de busca por aba
  const fatFiltrados = faturamentos.filter(f => !searchTerm || [f.numero, f.cliente, f.observacoes].some(v => (v || "").toLowerCase().includes(searchTerm.toLowerCase())));
  const pagarFiltrados = contasPagar.filter(c => !searchTerm || [c.fornecedor, c.descricao, c.categoria].some(v => (v || "").toLowerCase().includes(searchTerm.toLowerCase())));
  const receberFiltrados = contasReceber.filter(c => !searchTerm || [c.cliente, c.descricao, c.categoria].some(v => (v || "").toLowerCase().includes(searchTerm.toLowerCase())));

  // KPI calculations
  const totalFaturamento = faturamentos.reduce((s, f) => s + Number(f.valor), 0);
  const totalReceber = contasReceber.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
  const totalPagar = contasPagar.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
  const notasEmitidas = faturamentos.length;

  const summaryCards = [
    { title: "Faturamento Total", value: `R$ ${(totalFaturamento / 1000).toFixed(0)}k`, icon: DollarSign },
    { title: "A Receber", value: `R$ ${(totalReceber / 1000).toFixed(0)}k`, icon: CreditCard },
    { title: "A Pagar", value: `R$ ${(totalPagar / 1000).toFixed(0)}k`, icon: TrendingUp },
    { title: "Notas Emitidas", value: String(notasEmitidas), icon: FileText },
  ];

  // Fluxo chart from real data
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const fluxoMap: Record<string, { entrada: number; saida: number }> = {};
  faturamentos.forEach(f => {
    const m = monthNames[new Date(f.data_emissao).getMonth()];
    if (!fluxoMap[m]) fluxoMap[m] = { entrada: 0, saida: 0 };
    fluxoMap[m].entrada += Number(f.valor) / 1000;
  });
  contasPagar.forEach(c => {
    const m = monthNames[new Date(c.data_emissao).getMonth()];
    if (!fluxoMap[m]) fluxoMap[m] = { entrada: 0, saida: 0 };
    fluxoMap[m].saida += Number(c.valor) / 1000;
  });
  const fluxoData = monthNames.filter(m => fluxoMap[m]).map(m => ({ month: m, ...fluxoMap[m] }));

  const gridColor = theme === "dark" ? "hsl(0, 0%, 25%)" : "hsl(0, 0%, 85%)";
  const axisColor = theme === "dark" ? "hsl(0, 0%, 55%)" : "hsl(0, 0%, 50%)";
  const tooltipStyle = {
    background: theme === "dark" ? "hsl(215, 42%, 14%)" : "#fff",
    border: `1px solid ${theme === "dark" ? "hsl(0, 0%, 30%)" : "hsl(0, 0%, 85%)"}`,
    borderRadius: "6px", fontSize: "11px",
    color: theme === "dark" ? "#e8e8e8" : "#222",
  };

  const tabLabels: { key: TabKey; label: string }[] = [
    { key: "faturamento", label: "Faturamento" },
    { key: "pagar", label: "Contas a Pagar" },
    { key: "receber", label: "Contas a Receber" },
    { key: "impostos", label: "Impostos" },
    { key: "relatorios", label: "Relatórios Financeiros" },
  ];

  const formTitle = activeTab === "faturamento" ? "Nova Nota Fiscal" : activeTab === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber";

  return (
    <div className="space-y-4">
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-white">Financeiro</h1>
            <p className="text-[11px]" style={{ color: "hsl(0, 0%, 72%)" }}>Faturamento, contas a pagar e a receber</p>
          </div>
        </div>
        {canEdit && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[11px] font-semibold gap-1" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                <Plus className="w-3 h-3" /> {formTitle}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{formTitle}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {activeTab === "faturamento" ? (
                  <>
                    <Input placeholder="Número da NF" value={formData.numero || ""} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} />
                    <Input placeholder="Cliente" value={formData.cliente || ""} onChange={e => setFormData(p => ({ ...p, cliente: e.target.value }))} />
                    <Input type="number" placeholder="Valor" value={formData.valor || ""} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} />
                    <Input type="date" value={formData.data_emissao || ""} onChange={e => setFormData(p => ({ ...p, data_emissao: e.target.value }))} />
                    <Input type="date" value={formData.data_vencimento || ""} onChange={e => setFormData(p => ({ ...p, data_vencimento: e.target.value }))} />
                    <Select value={formData.status || "pendente"} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : activeTab === "pagar" ? (
                  <>
                    <Input placeholder="Fornecedor" value={formData.fornecedor || ""} onChange={e => setFormData(p => ({ ...p, fornecedor: e.target.value }))} />
                    <Input placeholder="Descrição" value={formData.descricao || ""} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} />
                    <Input type="number" placeholder="Valor" value={formData.valor || ""} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} />
                    <Input type="date" value={formData.data_vencimento || ""} onChange={e => setFormData(p => ({ ...p, data_vencimento: e.target.value }))} />
                    <Select value={formData.status || "pendente"} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Input placeholder="Cliente" value={formData.cliente || ""} onChange={e => setFormData(p => ({ ...p, cliente: e.target.value }))} />
                    <Input placeholder="Descrição" value={formData.descricao || ""} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} />
                    <Input type="number" placeholder="Valor" value={formData.valor || ""} onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} />
                    <Input type="date" value={formData.data_vencimento || ""} onChange={e => setFormData(p => ({ ...p, data_vencimento: e.target.value }))} />
                    <Select value={formData.status || "pendente"} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago (Recebido)</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Button onClick={handleAdd} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => {
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

      {/* Fluxo chart */}
      {fluxoData.length > 0 && (
        <div className="pbi-tile">
          <p className="text-[11px] font-semibold mb-3 text-foreground">Fluxo de Caixa (R$ mil)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={fluxoData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="entrada" stroke="hsl(152, 60%, 38%)" fill="hsl(152, 60%, 38%)" fillOpacity={0.2} />
              <Area type="monotone" dataKey="saida" stroke="hsl(0, 72%, 51%)" fill="hsl(0, 72%, 51%)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modal confirmação delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="pbi-tile w-full max-w-sm space-y-4" style={{ borderLeft: "3px solid hsl(0, 72%, 51%)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "hsl(0, 72%, 51%)" }} />
              <p className="text-[13px] font-semibold text-foreground">Confirmar exclusão</p>
            </div>
            <p className="text-[12px] text-muted-foreground">Tem certeza que deseja excluir <strong className="text-foreground">"{deleteConfirm.nome}"</strong>?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="h-8 px-4 rounded text-[12px] font-medium bg-secondary text-foreground">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm.table, deleteConfirm.id)} className="h-8 px-4 rounded text-[12px] font-semibold text-white" style={{ background: "hsl(0, 72%, 51%)" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="pbi-tabs-scroll bg-card border border-border rounded-md">
        {tabLabels.map((tab) => (
          <button key={tab.key} onClick={() => handleTabChange(tab.key)}
            className="px-4 py-1.5 rounded text-[11px] font-medium transition-colors"
            style={{ background: activeTab === tab.key ? "hsl(var(--pbi-yellow))" : "transparent", color: activeTab === tab.key ? "hsl(var(--pbi-dark))" : undefined }}>
            <span className={activeTab !== tab.key ? "text-muted-foreground" : ""}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="pbi-tile">
        {/* Barra de busca */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-semibold text-foreground flex-1">
            {activeTab === "faturamento" ? `Notas Fiscais (${fatFiltrados.length}/${faturamentos.length})` : activeTab === "pagar" ? `Contas a Pagar (${pagarFiltrados.length}/${contasPagar.length})` : activeTab === "receber" ? `Contas a Receber (${receberFiltrados.length}/${contasReceber.length})` : activeTab === "impostos" ? "Impostos" : "Relatórios Financeiros"}
          </p>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="h-7 pl-6 pr-6 text-[11px] rounded border border-border bg-secondary w-48 focus:outline-none" />
            {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground" /></button>}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-4 border-muted border-t-primary animate-spin" /></div>
        ) : activeTab === "faturamento" ? (
          <>
            {fatFiltrados.length === 0 ? <p className="text-[11px] text-muted-foreground py-4 text-center">{searchTerm ? "Nenhum resultado." : "Nenhuma nota fiscal cadastrada."}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-border">{["Número", "Cliente", "Emissão", "Vencimento", "Valor", "Status", ""].map(h => <th key={h} className={`py-2 px-2 font-medium text-muted-foreground ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {fatFiltrados.map((inv) => {
                      const st = statusConfig[inv.status] || statusConfig.pendente;
                      return (
                        <tr key={inv.id} className="pbi-row-hover transition-colors border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium" style={{ color: "hsl(207, 89%, 48%)" }}>{inv.numero}</td>
                          <td className="py-1.5 px-2 text-foreground">{inv.cliente}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{new Date(inv.data_emissao).toLocaleDateString("pt-BR")}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{new Date(inv.data_vencimento).toLocaleDateString("pt-BR")}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-foreground">R$ {Number(inv.valor).toLocaleString("pt-BR")}</td>
                          <td className="py-1.5 px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td className="py-1.5 px-2">{canEdit && <button onClick={() => setDeleteConfirm({ table: "faturamento", id: inv.id, nome: inv.numero || inv.cliente })} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} /></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === "pagar" ? (
          <>
            {pagarFiltrados.length === 0 ? <p className="text-[11px] text-muted-foreground py-4 text-center">{searchTerm ? "Nenhum resultado." : "Nenhuma conta a pagar cadastrada."}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-border">{["Fornecedor", "Descrição", "Vencimento", "Valor", "Status", ""].map(h => <th key={h} className={`py-2 px-2 font-medium text-muted-foreground ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {pagarFiltrados.map((c) => {
                      const st = statusConfig[c.status] || statusConfig.pendente;
                      return (
                        <tr key={c.id} className="pbi-row-hover transition-colors border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium text-foreground">{c.fornecedor}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{c.descricao}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{new Date(c.data_vencimento).toLocaleDateString("pt-BR")}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-foreground">R$ {Number(c.valor).toLocaleString("pt-BR")}</td>
                          <td className="py-1.5 px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td className="py-1.5 px-2">{canEdit && <button onClick={() => setDeleteConfirm({ table: "contas_pagar", id: c.id, nome: c.fornecedor })} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} /></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === "impostos" ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Módulo de Impostos</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Este módulo está em desenvolvimento. Em breve você poderá gerenciar ISS, ICMS, PIS/COFINS e demais tributos diretamente aqui.
            </p>
          </div>
        ) : activeTab === "relatorios" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Total Faturado", value: `R$ ${faturamentos.reduce((s, f) => s + Number(f.valor || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-green-400" },
                { label: "Total a Pagar", value: `R$ ${contasPagar.reduce((s, c) => s + Number(c.valor || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-red-400" },
                { label: "Total a Receber", value: `R$ ${contasReceber.reduce((s, c) => s + Number(c.valor || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-blue-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="erp-card p-4 rounded-lg border border-border text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="erp-card p-4 rounded-lg border border-border">
              <p className="text-[11px] font-semibold text-foreground mb-2">Resumo por Status — Contas a Pagar</p>
              {["pendente", "pago", "vencido"].map(s => {
                const count = contasPagar.filter(c => c.status === s).length;
                const total = contasPagar.reduce((acc, c) => c.status === s ? acc + Number(c.valor || 0) : acc, 0);
                const st = statusConfig[s] || statusConfig.pendente;
                return (
                  <div key={s} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <span className="text-muted-foreground">{count} registros</span>
                    <span className="font-medium text-foreground">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {receberFiltrados.length === 0 ? <p className="text-[11px] text-muted-foreground py-4 text-center">{searchTerm ? "Nenhum resultado." : "Nenhuma conta a receber cadastrada."}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-border">{["Cliente", "Descrição", "Vencimento", "Valor", "Status", ""].map(h => <th key={h} className={`py-2 px-2 font-medium text-muted-foreground ${h === "Valor" ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {receberFiltrados.map((c) => {
                      const st = statusConfig[c.status] || statusConfig.pendente;
                      return (
                        <tr key={c.id} className="pbi-row-hover transition-colors border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium text-foreground">{c.cliente}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{c.descricao}</td>
                          <td className="py-1.5 px-2 text-muted-foreground">{new Date(c.data_vencimento).toLocaleDateString("pt-BR")}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-foreground">R$ {Number(c.valor).toLocaleString("pt-BR")}</td>
                          <td className="py-1.5 px-2"><span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td className="py-1.5 px-2">{canEdit && <button onClick={() => setDeleteConfirm({ table: "contas_receber", id: c.id, nome: c.cliente })} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3" style={{ color: "hsl(0, 72%, 51%)" }} /></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
