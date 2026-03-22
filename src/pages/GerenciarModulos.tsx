import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Target, HardHat, FileText, Trophy, Zap,
  ClipboardPlus, FileSpreadsheet, Warehouse, DollarSign,
  Building2, Loader2, Settings2,
  Info,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ── Mapa de todos os módulos controláveis ────────────────────────────────
interface ModuleDef {
  key: string;
  label: string;
  descricao: string;
  icon: React.ElementType;
  secao: string;
  defaultEnabled: boolean;
  bloqueado?: boolean; // módulos que não podem ser desativados
}

const MODULE_DEFS: ModuleDef[] = [
  // Visão Geral
  {
    key: "metas",
    label: "Metas",
    descricao: "OKRs, check-ins, kanban de ações e análise preditiva de prazo.",
    icon: Target,
    secao: "Visão Geral",
    defaultEnabled: true,
  },
  {
    key: "execucao",
    label: "Execução de Obra",
    descricao: "Progresso físico por etapas: fundação, estrutura, acabamento.",
    icon: HardHat,
    secao: "Visão Geral",
    defaultEnabled: true,
  },
  {
    key: "relatorios",
    label: "Relatórios",
    descricao: "Exportação de dados em PDF e Excel com filtros de período.",
    icon: FileText,
    secao: "Visão Geral",
    defaultEnabled: true,
  },
  // Análise
  {
    key: "ranking",
    label: "Ranking de Equipe",
    descricao: "Pontuação e gamificação por desempenho em metas por responsável.",
    icon: Trophy,
    secao: "Análise",
    defaultEnabled: true,
  },
  {
    key: "metas_avancadas",
    label: "Metas Avançadas",
    descricao: "Dependências entre metas, predições e visualizações analíticas.",
    icon: Zap,
    secao: "Análise",
    defaultEnabled: true,
  },
  // Dados
  {
    key: "cadastro",
    label: "Cadastro de Dados",
    descricao: "Registro manual de dados cadastrais e operacionais.",
    icon: ClipboardPlus,
    secao: "Dados",
    defaultEnabled: true,
  },
  {
    key: "importacao",
    label: "Importar Excel",
    descricao: "Importação em lote via planilha Excel para qualquer tabela.",
    icon: FileSpreadsheet,
    secao: "Dados",
    defaultEnabled: true,
  },
  {
    key: "almoxarifado",
    label: "Almoxarifado",
    descricao: "Controle de ativos com código REMO, fotos e transferências entre destinos.",
    icon: Warehouse,
    secao: "Dados",
    defaultEnabled: false,
  },
  // Módulos
  {
    key: "financeiro",
    label: "Financeiro",
    descricao: "Faturamento, contas a pagar/receber, impostos e relatórios financeiros.",
    icon: DollarSign,
    secao: "Módulos",
    defaultEnabled: false,
  },
  {
    key: "obras",
    label: "Obras",
    descricao: "Empreendimentos, contratos, materiais e gestão de clientes.",
    icon: Building2,
    secao: "Módulos",
    defaultEnabled: false,
  },
];

const SECAO_ORDER = ["Visão Geral", "Análise", "Dados", "Módulos"];

// ── Componente ────────────────────────────────────────────────────────────
export default function GerenciarModulos() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [estados, setEstados] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  if (!isAdmin) return <Navigate to="/" replace />;

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchEstados = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("app_modules").select("key, enabled");
    if (error) {
      toast({ title: "Erro ao carregar módulos", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const map: Record<string, boolean> = {};
    // Parte dos defaults
    for (const mod of MODULE_DEFS) map[mod.key] = mod.defaultEnabled;
    // Sobrescreve com o que está no banco
    for (const row of data ?? []) map[row.key] = !!row.enabled;
    setEstados(map);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchEstados(); }, [fetchEstados]);
  useRealtimeTable("app_modules", fetchEstados);

  // ── Toggle ─────────────────────────────────────────────────────────────
  const handleToggle = async (key: string, novoValor: boolean) => {
    setSalvando(key);

    // Otimista
    setEstados(prev => ({ ...prev, [key]: novoValor }));

    const { error } = await supabase
      .from("app_modules")
      .upsert({ key, enabled: novoValor, label: MODULE_DEFS.find(m => m.key === key)?.label ?? key },
        { onConflict: "key" });

    if (error) {
      // Reverte
      setEstados(prev => ({ ...prev, [key]: !novoValor }));
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: novoValor ? "Módulo ativado" : "Módulo desativado",
        description: MODULE_DEFS.find(m => m.key === key)?.label,
      });
    }
    setSalvando(null);
  };

  const ativos = Object.values(estados).filter(Boolean).length;
  const total  = MODULE_DEFS.length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Gestão de Módulos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ative ou desative módulos do sistema para todos os usuários.
            Administradores sempre enxergam todos os módulos.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-semibold">{ativos}/{total}</p>
          <p className="text-xs text-muted-foreground">módulos ativos</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Módulos desativados ficam <strong className="text-foreground">invisíveis no menu</strong> para usuários normais e masters.
          Se um usuário tentar acessar a URL diretamente, verá a tela de acesso negado.
          O admin sempre vê tudo.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="space-y-8">
          {SECAO_ORDER.map(secao => {
            const mods = MODULE_DEFS.filter(m => m.secao === secao);
            return (
              <div key={secao}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {secao}
                </p>
                <div className="space-y-2">
                  {mods.map(mod => {
                    const Icon   = mod.icon;
                    const ativo  = estados[mod.key] ?? mod.defaultEnabled;
                    const saving = salvando === mod.key;

                    return (
                      <div
                        key={mod.key}
                        className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                          ativo ? "border-border bg-card" : "border-border/50 bg-muted/20 opacity-60"
                        }`}
                      >
                        {/* Ícone */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{mod.label}</p>
                            {ativo ? (
                              <Badge variant="outline" className="text-[10px] h-4 border-green-500/40 text-green-600 bg-green-500/10">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {mod.descricao}
                          </p>
                        </div>

                        {/* Toggle */}
                        <div className="shrink-0 flex items-center gap-2">
                          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                          <Switch
                            checked={ativo}
                            disabled={saving}
                            onCheckedChange={val => handleToggle(mod.key, val)}
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
    </div>
  );
}
