import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { HelpChat } from "@/components/HelpChat";
import {
  LayoutDashboard, Target, ClipboardPlus, FileText, FileSpreadsheet,
  DollarSign, Building2, Users, ChevronDown, ChevronRight, Menu, X,
  Search, LogOut, BarChart3, HardDrive, BookOpen, Sun, Moon, Contrast,
  HardHat, User, Trophy, Zap, Code2, Warehouse, Settings2, ClipboardList, BookMarked,
  ShieldCheck, Shield, EyeOff,
} from "lucide-react";
import logoSanRemo from "@/assets/logo-san-remo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminNotifications } from "@/components/AdminNotifications";

// ── Tipos ─────────────────────────────────────────────────────────────────
interface ModuleItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: { label: string; path: string }[];
  section: string;
  moduleKey?: string;
}

// ── Definição dos módulos ─────────────────────────────────────────────────
const modules: ModuleItem[] = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/",               section: "principal" },
  { label: "Meu Espaço",       icon: User,            path: "/meu-espaco",     section: "principal" },
  { label: "Metas",            icon: Target,          path: "/metas",          section: "principal", moduleKey: "metas" },
  { label: "Execução de Obra", icon: HardHat,         path: "/execucao",       section: "principal", moduleKey: "execucao" },
  { label: "Relatórios",       icon: FileText,        path: "/relatorios",     section: "principal", moduleKey: "relatorios" },
  { label: "Ranking de Equipe",icon: Trophy,          path: "/ranking",        section: "principal", moduleKey: "ranking" },
  { label: "Metas Avançadas",  icon: Zap,             path: "/metas-avancadas",section: "principal", moduleKey: "metas_avancadas" },
  { label: "Cadastro de Dados",icon: ClipboardPlus,   path: "/cadastro",       section: "principal", moduleKey: "cadastro" },
  { label: "Importar Excel",   icon: FileSpreadsheet, path: "/importacao",     section: "principal", moduleKey: "importacao" },
  { label: "Almoxarifado",     icon: Warehouse,       path: "/almoxarifado",   section: "principal", moduleKey: "almoxarifado" },
  { label: "Diário de Obra",   icon: BookMarked,      path: "/diario-obra",    section: "principal", moduleKey: "diario_obra" },
  {
    label: "Financeiro", icon: DollarSign, path: "/contabilidade",
    section: "principal", moduleKey: "financeiro",
    children: [
      { label: "Faturamento",            path: "/contabilidade/faturamento" },
      { label: "Contas a Pagar",         path: "/contabilidade/pagamentos" },
      { label: "Contas a Receber",       path: "/contabilidade/bancario" },
      { label: "Impostos",               path: "/contabilidade/impostos" },
      { label: "Relatórios Financeiros", path: "/contabilidade/relatorios" },
    ],
  },
  {
    label: "Obras", icon: Building2, path: "/pedidos",
    section: "principal", moduleKey: "obras",
    children: [
      { label: "Empreendimentos", path: "/pedidos/vendas" },
      { label: "Contratos",       path: "/pedidos/compras" },
      { label: "Materiais",       path: "/pedidos/estoque" },
      { label: "Clientes",        path: "/pedidos/crm" },
    ],
  },
  { label: "Manual",        icon: BookOpen,       path: "/manual",         section: "principal" },
  // ── Admin ──
  { label: "Usuários",       icon: Users,          path: "/usuarios",       section: "admin" },
  { label: "Módulos",        icon: Settings2,      path: "/modulos",        section: "admin" },
  { label: "Backup",         icon: HardDrive,      path: "/backup",         section: "admin" },
  { label: "Auditoria",      icon: ClipboardList,  path: "/auditoria",      section: "admin" },
  { label: "Manual Admin",   icon: BookOpen,       path: "/manual-admin",   section: "admin" },
  { label: "Desenvolvimento",icon: Code2,          path: "/desenvolvimento", section: "admin" },
];

// ── FIX: engenheiro adicionado ao ROLE_CFG ────────────────────────────────
const ROLE_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: "Admin",      icon: ShieldCheck, color: "text-red-400"    },
  master:     { label: "Master",     icon: Shield,      color: "text-amber-400"  },
  normal:     { label: "Normal",     icon: User,        color: "text-sky-400"    },
  almoxarife: { label: "Almoxarife", icon: Warehouse,   color: "text-teal-400"   },
  engenheiro: { label: "Engenheiro", icon: HardHat,     color: "text-orange-400" },
};

// ── Componente ─────────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchOpen, setSearchOpen]       = useState(false);
  const location  = useLocation();
  const { profile, user, userRole, isAdmin, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // ── Busca — navega para o módulo mais relevante ──────────────────────────
  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const match = modules.find(m =>
      m.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
    );
    if (match) {
      navigate(match.path);
      setSearchQuery("");
      setSearchOpen(false);
      setMobileOpen(false);
    }
  }, [searchQuery, navigate]);

  // ── Carregar permissões — usa user.id para evitar re-render desnecessário ──
  const userId = user?.id;

  const loadModules = useCallback(async () => {
    if (!userId) return;
    const [{ data: globalData }, { data: userPerms }] = await Promise.all([
      supabase.from("app_modules").select("key, enabled"),
      supabase.from("user_module_permissions").select("module_key, enabled").eq("user_id", userId),
    ]);

    const globalMap: Record<string, boolean> = {};
    for (const row of globalData ?? []) globalMap[row.key] = !!row.enabled;

    const merged: Record<string, boolean> = { ...globalMap };
    for (const row of userPerms ?? []) {
      if (globalMap[row.module_key] !== false) merged[row.module_key] = !!row.enabled;
    }
    setEnabledModules(merged);
    setModulesLoaded(true);
  }, [userId]);

  useEffect(() => {
    loadModules();

    const ch1 = supabase
      .channel("menu_app_modules")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_modules" }, loadModules)
      .subscribe();

    const ch2 = supabase
      .channel("menu_user_module_permissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_module_permissions" }, loadModules)
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [loadModules]);

  // ── Auto-expandir seção da rota ativa ──────────────────────────────────
  useEffect(() => {
    const active = modules.find(m =>
      m.children?.some(c => location.pathname.startsWith(c.path)) ||
      location.pathname === m.path
    );
    if (active?.children) {
      setExpandedSections(prev =>
        prev.includes(active.label) ? prev : [...prev, active.label]
      );
    }
  }, [location.pathname]);

  // ── Visibilidade do módulo ─────────────────────────────────────────────
  const isVisible = useCallback((mod: ModuleItem): boolean => {
    // Almoxarife vê apenas: dashboard, meu espaço, almoxarifado e manual
    if (userRole === "almoxarife") {
      return mod.path === "/" ||
             mod.path === "/meu-espaco" ||
             mod.path === "/almoxarifado" ||
             mod.path === "/manual";
    }
    // Engenheiro vê: dashboard, meu espaço, diário de obra, execução e manual
    if (userRole === "engenheiro") {
      return mod.path === "/" ||
             mod.path === "/meu-espaco" ||
             mod.path === "/diario-obra" ||
             mod.path === "/execucao" ||
             mod.path === "/manual";
    }
    if (mod.section === "admin") return isAdmin;
    if (mod.path === "/" || mod.path === "/meu-espaco" || mod.path === "/manual") return true;
    if (isAdmin) return true;
    if (mod.moduleKey) return enabledModules[mod.moduleKey] === true;
    return true;
  }, [isAdmin, userRole, enabledModules]);

  const isModuleDisabled = (mod: ModuleItem): boolean =>
    isAdmin && !!mod.moduleKey && modulesLoaded && enabledModules[mod.moduleKey] === false;

  const toggleSection = (label: string) =>
    setExpandedSections(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );

  const isActive = useCallback((path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/")),
  [location.pathname]);

  const visibleModules = useMemo(() => modules.filter(isVisible), [isVisible]);
  const principalMods  = useMemo(() => visibleModules.filter(m => m.section === "principal"), [visibleModules]);
  const adminMods      = useMemo(() => visibleModules.filter(m => m.section === "admin"), [visibleModules]);

  const currentPage = useMemo(() =>
    visibleModules.find(m => isActive(m.path))?.label ||
    modules.find(m => isActive(m.path))?.label ||
    "Dashboard",
  [visibleModules, isActive]);

  // ── FIX: fallback seguro para roleInfo ────────────────────────────────
  const roleInfo = userRole ? (ROLE_CFG[userRole] ?? null) : null;

  // ── Item de menu reutilizável ──────────────────────────────────────────
  const MenuItem = ({ mod }: { mod: ModuleItem }) => {
    const Icon       = mod.icon;
    const active     = isActive(mod.path);
    const expanded   = expandedSections.includes(mod.label);
    const hasChildren = !!mod.children?.length;
    const disabled   = isModuleDisabled(mod);

    return (
      <div>
        <div
          className={`
            flex items-center gap-2 px-3 py-[7px] rounded-md cursor-pointer
            transition-all duration-150 text-[12.5px] font-medium
            ${active && !hasChildren
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-l-2 border-transparent"
            }
            ${disabled ? "opacity-50" : ""}
          `}
          onClick={() => hasChildren ? toggleSection(mod.label) : undefined}
          title={disabled ? `${mod.label} (desativado para usuários)` : undefined}
        >
          {hasChildren ? (
            <>
              <Icon className="w-[15px] h-[15px] shrink-0" />
              <span className="flex-1 truncate">{mod.label}</span>
              {expanded
                ? <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                : <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
              }
            </>
          ) : (
            <Link to={mod.path} className="flex items-center gap-2 w-full" onClick={() => setMobileOpen(false)}>
              <Icon className="w-[15px] h-[15px] shrink-0" />
              <span className="flex-1 truncate">{mod.label}</span>
              {disabled && <EyeOff className="w-3 h-3 shrink-0 opacity-50" />}
            </Link>
          )}
        </div>

        {hasChildren && expanded && (
          <div className="ml-4 mt-px space-y-px border-l border-sidebar-border pl-3 mb-1">
            {mod.children!.map(child => (
              <Link
                key={child.path}
                to={child.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-2 px-3 py-[6px] rounded text-[12px] transition-colors
                  ${isActive(child.path)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                  }
                `}
              >
                <div className="w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Sidebar ────────────────────────────────────────────────────────────
  const SidebarNav = () => (
    <div className="flex flex-col h-full bg-sidebar">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-sidebar-border shrink-0">
        <img src={logoSanRemo} alt="San Remo" className="w-8 h-8 object-contain" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold tracking-tight leading-tight"
             style={{ color: "hsl(42, 65%, 56%)" }}>
            San Remo
          </p>
          <p className="text-[9px] text-sidebar-muted tracking-widest uppercase leading-tight">
            Construtora
          </p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="space-y-px">
          {principalMods.map(mod => <MenuItem key={mod.path} mod={mod} />)}
        </div>

        {adminMods.length > 0 && (
          <>
            <div className="mx-3 my-3 border-t border-sidebar-border opacity-40" />
            <p className="text-[9px] uppercase tracking-widest font-bold px-3 pb-1 text-red-400/70">
              Administração
            </p>
            <div className="space-y-px">
              {adminMods.map(mod => <MenuItem key={mod.path} mod={mod} />)}
            </div>
          </>
        )}
      </nav>

      {/* Footer do usuário */}
      <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-[10px] font-bold text-sidebar-primary-foreground shrink-0">
            {profile?.full_name?.slice(0, 2).toUpperCase() || "SR"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-sidebar-accent-foreground truncate leading-tight">
              {profile?.full_name || "Usuário"}
            </p>
            {roleInfo && (
              <div className={`flex items-center gap-1 ${roleInfo.color}`}>
                <roleInfo.icon className="w-2.5 h-2.5" />
                <span className="text-[10px] font-semibold">{roleInfo.label}</span>
              </div>
            )}
          </div>
          <button onClick={signOut} className="p-1.5 rounded hover:bg-sidebar-accent transition-colors group" title="Sair">
            <LogOut className="w-3.5 h-3.5 text-sidebar-muted group-hover:text-sidebar-foreground transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Layout principal ────────────────────────────────────────────────────
  return (
    <div className="flex overflow-hidden bg-background" style={{ height: "100dvh" }}>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 lg:hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 text-sidebar-foreground z-10 p-1 rounded hover:bg-sidebar-accent"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarNav />
      </aside>

      {/* Sidebar desktop */}
      {sidebarOpen && (
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border">
          <SidebarNav />
        </aside>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-11 pbi-header flex items-center px-3 gap-2 shrink-0 z-30">

          <button
            onClick={() => {
              if (window.innerWidth < 1024) setMobileOpen(true);
              else setSidebarOpen(v => !v);
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <Menu className="w-4 h-4 text-white/70" />
          </button>

          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-semibold text-white">{currentPage}</span>
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded px-2.5 py-1.5 max-w-xs">
            <Search className="w-3.5 h-3.5 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Pesquisar módulo..."
              className="bg-transparent border-none outline-none text-[12px] flex-1 text-white placeholder:text-white/40 w-32"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5">
            {([
              { value: "light",  icon: Sun,      label: "Claro",  color: "text-yellow-300" },
              { value: "medium", icon: Contrast, label: "Médio",  color: "text-blue-300"   },
              { value: "dark",   icon: Moon,     label: "Escuro", color: "text-slate-300"  },
            ] as const).map(({ value, icon: Icon, label, color }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={`Tema ${label}`}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                  transition-all duration-200
                  ${theme === value
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80 hover:bg-white/10"
                  }
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${theme === value ? color : ""}`} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <AdminNotifications />

          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground ml-1">
            {profile?.full_name?.slice(0, 2).toUpperCase() || "SR"}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pbi-canvas p-2 sm:p-4 lg:p-5">
          {children}
        </main>
      </div>

      <HelpChat />
    </div>
  );
}