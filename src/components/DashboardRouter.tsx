/**
 * DashboardRouter
 * Detecta os módulos habilitados para o usuário e exibe:
 *   - admin / master → dashboard completa (passthrough)
 *   - normal com 1 módulo exclusivo → dashboard dedicada desse módulo
 *   - normal com múltiplos módulos → dashboard composta com cards de atalho
 *   - normal sem módulos → tela de acesso restrito amigável
 */
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Warehouse, Target, HardHat, DollarSign, Building2,
  FileText, Trophy, Zap, ClipboardPlus, FileSpreadsheet,
  Lock, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardAlmoxarifado from "./DashboardAlmoxarifado";
import DashboardMetas        from "./DashboardMetas";
import DashboardObras        from "./DashboardObras";
import DashboardFinanceiro   from "./DashboardFinanceiro";
import DashboardExecucao     from "./DashboardExecucao";

// Mapa módulo → configuração visual + componente dedicado (se existir)
const MODULE_CFG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  path: string;
  descricao: string;
  Dashboard?: React.ComponentType;
}> = {
  almoxarifado:    { label: "Almoxarifado",       icon: Warehouse,       color: "hsl(174, 62%, 47%)",  path: "/almoxarifado",    descricao: "Ativos REMO, fotos e transferências",     Dashboard: DashboardAlmoxarifado },
  metas:           { label: "Metas",              icon: Target,          color: "hsl(271, 60%, 55%)",  path: "/metas",           descricao: "OKRs, check-ins e indicadores",           Dashboard: DashboardMetas },
  execucao:        { label: "Execução de Obra",   icon: HardHat,         color: "hsl(207, 89%, 48%)",  path: "/execucao",        descricao: "Progresso físico por etapas",             Dashboard: DashboardExecucao },
  financeiro:      { label: "Financeiro",         icon: DollarSign,      color: "hsl(152, 60%, 38%)",  path: "/contabilidade",   descricao: "Faturamento, contas e fluxo de caixa",   Dashboard: DashboardFinanceiro },
  obras:           { label: "Obras",              icon: Building2,       color: "hsl(45, 100%, 45%)",  path: "/pedidos",         descricao: "Empreendimentos e contratos",             Dashboard: DashboardObras },
  relatorios:      { label: "Relatórios",         icon: FileText,        color: "hsl(28, 87%, 55%)",   path: "/relatorios",      descricao: "Exportação PDF e Excel" },
  ranking:         { label: "Ranking",            icon: Trophy,          color: "hsl(45, 100%, 45%)",  path: "/ranking",         descricao: "Pontuação por desempenho" },
  metas_avancadas: { label: "Metas Avançadas",    icon: Zap,             color: "hsl(174, 62%, 47%)",  path: "/metas-avancadas", descricao: "Dependências e predições" },
  cadastro:        { label: "Cadastro de Dados",  icon: ClipboardPlus,   color: "hsl(207, 89%, 48%)",  path: "/cadastro",        descricao: "Registro manual de dados" },
  importacao:      { label: "Importar Excel",     icon: FileSpreadsheet, color: "hsl(152, 60%, 38%)",  path: "/importacao",      descricao: "Importação em lote via planilha" },
};

// Card de acesso rápido para dashboard multi-módulo
function ModuleCard({ moduleKey }: { moduleKey: string }) {
  const cfg = MODULE_CFG[moduleKey];
  if (!cfg) return null;
  const navigate = useNavigate();
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => navigate(cfg.path)}
      className="group rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all text-left w-full"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}18` }}>
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cfg.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{cfg.descricao}</p>
      </div>
    </button>
  );
}

// Tela sem acesso
function SemAcesso({ nome }: { nome: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xl font-semibold text-foreground">Olá, {nome}!</p>
        <p className="text-muted-foreground mt-2 text-sm max-w-sm">
          Sua conta ainda não tem acesso a nenhum módulo do sistema.
          Solicite ao administrador que habilite os módulos necessários para você.
        </p>
      </div>
    </div>
  );
}

// Dashboard multi-módulo (vários módulos habilitados)
function DashboardMultiModulo({ modulos, nome }: { modulos: string[]; nome: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
        <LayoutDashboard className="w-7 h-7 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">Olá, <span className="text-primary">{nome}</span>!</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Você tem acesso a {modulos.length} módulo{modulos.length > 1 ? "s" : ""}. Selecione o que deseja acessar.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map(key => <ModuleCard key={key} moduleKey={key} />)}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function DashboardRouter({ children }: { children: React.ReactNode }) {
  const { userRole, profile, enabledModules, loading } = useAuth();

  // Admin e master → dashboard completa original
  if (loading || userRole !== "normal") {
    return <>{children}</>;
  }

  // Módulos habilitados para este usuário (exclui módulos que sempre existem sem chave específica)
  const modulosHabilitados = Object.entries(enabledModules)
    .filter(([key, enabled]) => enabled && MODULE_CFG[key])
    .map(([key]) => key);

  const nome = profile?.full_name ?? "Usuário";

  // Sem nenhum módulo
  if (modulosHabilitados.length === 0) {
    return <SemAcesso nome={nome} />;
  }

  // Exatamente 1 módulo com dashboard dedicada → renderiza ela direto
  if (modulosHabilitados.length === 1) {
    const unico = modulosHabilitados[0];
    const cfg = MODULE_CFG[unico];
    if (cfg?.Dashboard) {
      const Dash = cfg.Dashboard;
      return <Dash />;
    }
    // Módulo sem dashboard dedicada → card de acesso rápido
    return <DashboardMultiModulo modulos={modulosHabilitados} nome={nome} />;
  }

  // Múltiplos módulos — verifica se tem apenas dashboards sem componente dedicado
  // ou se 1 é primário e os outros são complementares
  const comDashboard = modulosHabilitados.filter(k => !!MODULE_CFG[k]?.Dashboard);

  // Se tem exatamente 1 módulo com dashboard dedicada e os outros são "utilitários"
  // (relatorios, ranking, importacao, cadastro) → mostra a dashboard do módulo principal
  const utilitarios = new Set(["relatorios", "ranking", "metas_avancadas", "cadastro", "importacao"]);
  const primarios = modulosHabilitados.filter(k => !utilitarios.has(k));

  if (primarios.length === 1 && MODULE_CFG[primarios[0]]?.Dashboard) {
    const Dash = MODULE_CFG[primarios[0]].Dashboard!;
    return <Dash />;
  }

  // Vários módulos primários → grade de acesso
  return <DashboardMultiModulo modulos={modulosHabilitados} nome={nome} />;
}
