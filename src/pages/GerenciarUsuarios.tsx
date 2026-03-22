import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users, Plus, Trash2, ShieldCheck, Shield, User, RefreshCw,
  Search, Pencil, LayoutGrid, Loader2, Target, HardHat, FileText,
  Trophy, Zap, ClipboardPlus, FileSpreadsheet, Warehouse,
  DollarSign, Building2, Info, Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface UserEntry {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface ModuleDef {
  key: string;
  label: string;
  descricao: string;
  icon: React.ElementType;
  secao: string;
  defaultEnabled: boolean;
}

const MODULE_DEFS: ModuleDef[] = [
  { key: "metas",           label: "Metas",              descricao: "OKRs, check-ins e kanban",             icon: Target,          secao: "Visão Geral", defaultEnabled: true  },
  { key: "execucao",        label: "Execução de Obra",   descricao: "Progresso físico por etapas",           icon: HardHat,         secao: "Visão Geral", defaultEnabled: true  },
  { key: "relatorios",      label: "Relatórios",         descricao: "Exportação PDF e Excel",                icon: FileText,        secao: "Visão Geral", defaultEnabled: true  },
  { key: "ranking",         label: "Ranking de Equipe",  descricao: "Pontuação por desempenho",              icon: Trophy,          secao: "Análise",     defaultEnabled: true  },
  { key: "metas_avancadas", label: "Metas Avançadas",    descricao: "Dependências e predições",              icon: Zap,             secao: "Análise",     defaultEnabled: true  },
  { key: "cadastro",        label: "Cadastro de Dados",  descricao: "Registro manual de dados",              icon: ClipboardPlus,   secao: "Dados",       defaultEnabled: true  },
  { key: "importacao",      label: "Importar Excel",     descricao: "Importação em lote via planilha",       icon: FileSpreadsheet, secao: "Dados",       defaultEnabled: true  },
  { key: "almoxarifado",    label: "Almoxarifado",       descricao: "Ativos REMO, fotos e transferências",   icon: Warehouse,       secao: "Dados",       defaultEnabled: false },
  { key: "financeiro",      label: "Financeiro",         descricao: "Faturamento, contas e impostos",        icon: DollarSign,      secao: "Módulos",     defaultEnabled: false },
  { key: "obras",           label: "Obras",              descricao: "Empreendimentos, contratos e materiais", icon: Building2,      secao: "Módulos",     defaultEnabled: false },
];

const SECAO_ORDER = ["Visão Geral", "Análise", "Dados", "Módulos"];

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  admin:  { label: "Admin",         color: "hsl(0, 72%, 51%)",   bg: "hsl(0, 72%, 51%, 0.15)",   icon: ShieldCheck },
  master: { label: "Master",        color: "hsl(45, 100%, 51%)", bg: "hsl(45, 100%, 51%, 0.15)", icon: Shield },
  normal: { label: "Normal",        color: "hsl(207, 89%, 48%)", bg: "hsl(207, 89%, 48%, 0.15)", icon: User },
  none:   { label: "Sem Permissão", color: "hsl(220, 15%, 55%)", bg: "hsl(220, 15%, 55%, 0.15)", icon: User },
};

// ── Componente ─────────────────────────────────────────────────────────────
export default function GerenciarUsuarios() {
  const { toast }                       = useToast();
  const { user, isAdmin, loading }      = useAuth();

  const [users, setUsers]               = useState<UserEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [creating, setCreating]         = useState(false);
  const [searchTerm, setSearchTerm]     = useState("");
  const [form, setForm]                 = useState({ full_name: "", email: "", password: "", role: "normal" });
  const [editingRole, setEditingRole]   = useState<{ userId: string; role: string; name: string } | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // ── Painel de módulos ──────────────────────────────────────────────────
  const [modulesUser, setModulesUser]       = useState<UserEntry | null>(null);
  const [modulesMap, setModulesMap]         = useState<Record<string, boolean>>({});
  const [globalMap, setGlobalMap]           = useState<Record<string, boolean>>({});
  const [loadingModules, setLoadingModules] = useState(false);
  const [savingModule, setSavingModule]     = useState<string | null>(null);

  // ── Fetch usuários ────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("list-users", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      setUsers(res.data.users || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar usuários", description: err.message, variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  const stableFetch = useCallback(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useRealtimeTable("profiles", stableFetch);
  useRealtimeTable("user_roles", stableFetch);

  // ── Fetch módulos do usuário ──────────────────────────────────────────
  const fetchModulesForUser = async (targetUser: UserEntry) => {
    setLoadingModules(true);
    setModulesUser(targetUser);

    const { data: globalData } = await supabase.from("app_modules").select("key, enabled");
    const gMap: Record<string, boolean> = {};
    for (const mod of MODULE_DEFS) gMap[mod.key] = mod.defaultEnabled;
    for (const row of globalData ?? []) gMap[row.key] = !!row.enabled;
    setGlobalMap(gMap);

    const { data: userPerms } = await supabase
      .from("user_module_permissions")
      .select("module_key, enabled")
      .eq("user_id", targetUser.id);

    const uMap: Record<string, boolean> = { ...gMap };
    for (const row of userPerms ?? []) uMap[row.module_key] = !!row.enabled;
    setModulesMap(uMap);

    setLoadingModules(false);
  };

  // ── Toggle módulo ──────────────────────────────────────────────────────
  const handleModuleToggle = async (key: string, novoValor: boolean) => {
    if (!modulesUser) return;
    setSavingModule(key);
    setModulesMap(prev => ({ ...prev, [key]: novoValor }));

    const { error } = await supabase
      .from("user_module_permissions")
      .upsert(
        { user_id: modulesUser.id, module_key: key, enabled: novoValor, updated_by: user?.id },
        { onConflict: "user_id,module_key" }
      );

    if (error) {
      setModulesMap(prev => ({ ...prev, [key]: !novoValor }));
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
    setSavingModule(null);
  };

  // ── Reset para padrão global ───────────────────────────────────────────
  const handleResetToGlobal = async () => {
    if (!modulesUser) return;
    const { error } = await supabase
      .from("user_module_permissions")
      .delete()
      .eq("user_id", modulesUser.id);

    if (error) {
      toast({ title: "Erro ao resetar", description: error.message, variant: "destructive" });
    } else {
      setModulesMap({ ...globalMap });
      toast({ title: "Resetado para o padrão global" });
    }
  };

  // ── CRUD ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" }); return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: form, headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data.error) throw new Error(res.data.error);
      toast({ title: "Usuário criado!", description: `${form.full_name} (${form.role})` });
      setForm({ full_name: "", email: "", password: "", role: "normal" });
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao criar", description: err.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("delete-user", {
        body: { user_id: deleteConfirm.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data.error) throw new Error(res.data.error);
      toast({ title: "Usuário excluído", description: deleteConfirm.name });
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    setUpdatingRole(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("update-user-role", {
        body: { user_id: editingRole.userId, role: editingRole.role },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "Permissão atualizada!" });
      setEditingRole(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao alterar permissão", description: err.message, variant: "destructive" });
    } finally { setUpdatingRole(false); }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counts = {
    admin:  users.filter(u => u.role === "admin").length,
    master: users.filter(u => u.role === "master").length,
    normal: users.filter(u => u.role === "normal").length,
  };

  // Conta módulos ativos de um usuário para exibir no card
  const countModulosAtivos = (userId: string) => {
    // Aproximação baseada nos defaults — sem carregar do banco por usuário
    return null; // carregamos ao abrir o painel
  };

  if (!loading && !isAdmin) return <AccessDenied requiredRole="Administrador" />;

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-white">Gerenciar Usuários</h1>
            <p className="text-[11px]" style={{ color: "hsl(0, 0%, 72%)" }}>
              Crie usuários, defina permissões e controle acesso por módulo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}
            className="h-7 text-[11px] border-none gap-1 bg-secondary text-foreground hover:bg-secondary/80">
            <RefreshCw className={`w-3 h-3 ${loadingUsers ? "animate-spin" : ""}`} /> Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[11px] font-semibold gap-1"
                style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                <Plus className="w-3 h-3" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-[14px]">Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Nome Completo *</Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Nome completo" className="h-8 text-[12px] pbi-input-bg border-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">E-mail *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@empresa.com" className="h-8 text-[12px] pbi-input-bg border-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Senha *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres" className="h-8 text-[12px] pbi-input-bg border-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Tipo de Usuário *</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger className="h-8 text-[12px] pbi-input-bg border-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — acesso total</SelectItem>
                      <SelectItem value="master">Master — gerencia módulos</SelectItem>
                      <SelectItem value="normal">Normal — acesso básico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full h-8 text-[12px] font-semibold"
                  style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                  {creating ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {(["admin", "master", "normal"] as const).map(role => {
          const cfg  = ROLE_CFG[role];
          const Icon = cfg.icon;
          return (
            <div key={role} className="pbi-tile">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{cfg.label}</p>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: cfg.color }}>{counts[role]}</p>
              <p className="text-[10px] mt-1 text-muted-foreground">usuários</p>
            </div>
          );
        })}
      </div>

      {/* ── Busca ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-md p-2 px-3 bg-card border border-border">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="bg-transparent border-none outline-none text-[12px] flex-1 text-foreground placeholder:text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground shrink-0">{filtered.length} usuário{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Cards de usuários ────────────────────────────────────────────── */}
      {loadingUsers ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando usuários...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[12px] text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(u => {
            const cfg    = ROLE_CFG[u.role] || ROLE_CFG.none;
            const Icon   = cfg.icon;
            const isSelf = u.id === user?.id;

            return (
              <div key={u.id} className="pbi-tile flex flex-col gap-3">
                {/* Cabeçalho do card */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {u.full_name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Nome + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[13px] font-semibold text-foreground truncate">{u.full_name}</p>
                      {isSelf && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: "hsl(45, 100%, 51%, 0.15)", color: "hsl(var(--pbi-yellow))" }}>
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>

                  {/* Badge role */}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </span>
                </div>

                {/* Data de criação */}
                <p className="text-[10px] text-muted-foreground">
                  Criado em {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </p>

                {/* ── Botões de ação ─────────────────────────────────────── */}
                {!isSelf && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {/* MÓDULOS — botão principal, bem visível */}
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-1.5 h-8 text-[11px] font-semibold"
                      onClick={() => fetchModulesForUser(u)}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Módulos
                    </Button>

                    {/* Alterar role */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-[11px]"
                      onClick={() => setEditingRole({ userId: u.id, role: u.role === "none" ? "normal" : u.role, name: u.full_name })}
                      title="Alterar permissão"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Permissão
                    </Button>

                    {/* Excluir */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm({ id: u.id, name: u.full_name })}
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog alterar role ──────────────────────────────────────────── */}
      <Dialog open={!!editingRole} onOpenChange={open => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Alterar Permissão</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-3 mt-2">
              <p className="text-[12px] text-muted-foreground">
                Usuário: <strong className="text-foreground">{editingRole.name}</strong>
              </p>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Novo Tipo</Label>
                <Select value={editingRole.role} onValueChange={v => setEditingRole({ ...editingRole, role: v })}>
                  <SelectTrigger className="h-8 text-[12px] pbi-input-bg border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — acesso total</SelectItem>
                    <SelectItem value="master">Master — gerencia módulos</SelectItem>
                    <SelectItem value="normal">Normal — acesso básico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateRole} disabled={updatingRole} className="w-full h-8 text-[12px] font-semibold"
                style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                {updatingRole ? "Salvando..." : "Salvar Permissão"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog confirmar exclusão ────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Excluir usuário?</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground mt-2">
            Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirm?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 h-8 text-[12px]" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete}
              className="flex-1 h-8 text-[12px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sheet de módulos por usuário ─────────────────────────────────── */}
      <Sheet open={!!modulesUser} onOpenChange={open => { if (!open) setModulesUser(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Acesso por módulo
            </SheetTitle>
          </SheetHeader>

          {/* Info do usuário */}
          {modulesUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: ROLE_CFG[modulesUser.role]?.bg, color: ROLE_CFG[modulesUser.role]?.color }}>
                {modulesUser.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{modulesUser.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{modulesUser.email}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                style={{ background: ROLE_CFG[modulesUser.role]?.bg, color: ROLE_CFG[modulesUser.role]?.color }}>
                {ROLE_CFG[modulesUser.role]?.label}
              </span>
            </div>
          )}

          {modulesUser?.role === "admin" && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground mb-4">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
              Administradores têm acesso irrestrito a todos os módulos independente dos toggles abaixo.
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              Módulos com fundo cinza estão <strong>desativados globalmente</strong> e não podem ser ativados individualmente.
            </p>
          </div>

          {loadingModules ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando módulos...
            </div>
          ) : (
            <div className="space-y-5">
              {SECAO_ORDER.map(secao => {
                const mods = MODULE_DEFS.filter(m => m.secao === secao);
                return (
                  <div key={secao}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{secao}</p>
                    <div className="space-y-2">
                      {mods.map(mod => {
                        const Icon        = mod.icon;
                        const globalAtivo = globalMap[mod.key] ?? mod.defaultEnabled;
                        const userAtivo   = modulesMap[mod.key] ?? globalAtivo;
                        const saving      = savingModule === mod.key;
                        const bloqueado   = !globalAtivo;

                        return (
                          <div key={mod.key}
                            className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                              bloqueado
                                ? "border-border/30 bg-muted/10 opacity-40"
                                : userAtivo
                                  ? "border-primary/20 bg-primary/5"
                                  : "border-border/50 bg-muted/20"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                              userAtivo && !bloqueado ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium">{mod.label}</p>
                                {bloqueado && (
                                  <span className="text-[10px] text-muted-foreground italic">(global off)</span>
                                )}
                                {!bloqueado && userAtivo && (
                                  <span className="text-[10px] text-primary font-medium">● ativo</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">{mod.descricao}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                              <Switch
                                checked={!bloqueado && userAtivo}
                                disabled={saving || bloqueado || modulesUser?.role === "admin"}
                                onCheckedChange={val => handleModuleToggle(mod.key, val)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão reset */}
          <div className="mt-6 pt-4 border-t border-border flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={handleResetToGlobal}>
              <RefreshCw className="w-3 h-3" /> Resetar para padrão global
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
