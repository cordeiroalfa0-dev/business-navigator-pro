import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

// ── Lazy-loaded pages (code splitting — cada página vira chunk separado) ──
const Dashboard          = lazy(() => import("@/pages/Dashboard"));
const Metas              = lazy(() => import("@/pages/Metas"));
const ExecucaoObra       = lazy(() => import("@/pages/ExecucaoObra"));
const MeuEspaco          = lazy(() => import("@/pages/MeuEspaco"));
const RankingResponsaveis= lazy(() => import("@/pages/RankingResponsaveis"));
const MetasAvancadas     = lazy(() => import("@/pages/MetasAvancadas"));
const CadastroDados      = lazy(() => import("@/pages/CadastroDados"));
const Relatorios         = lazy(() => import("@/pages/Relatorios"));
const ImportacaoExcel    = lazy(() => import("@/pages/ImportacaoExcel"));
const Contabilidade      = lazy(() => import("@/pages/Contabilidade"));
const Pedidos            = lazy(() => import("@/pages/Pedidos"));
const GerenciarUsuarios  = lazy(() => import("@/pages/GerenciarUsuarios"));
const BackupRestore      = lazy(() => import("@/pages/BackupRestore"));
const ManualUsuario      = lazy(() => import("@/pages/ManualUsuario"));
const ManualAdmin        = lazy(() => import("@/pages/ManualAdmin"));
const Desenvolvimento    = lazy(() => import("@/pages/Desenvolvimento"));
const DiarioObra         = lazy(() => import("@/pages/DiarioObra"));
const Almoxarifado       = lazy(() => import("@/pages/Almoxarifado"));
const GerenciarModulos   = lazy(() => import("@/pages/GerenciarModulos"));
const AdminAudit         = lazy(() => import("@/pages/AdminAudit"));
const Auth               = lazy(() => import("@/pages/Auth"));
const ResetPassword      = lazy(() => import("@/pages/ResetPassword"));
const NotFound           = lazy(() => import("@/pages/NotFound"));

// ── QueryClient com configuração robusta ──────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 10, // 10 min — dado considerado fresco
      gcTime:             1000 * 60 * 20, // 20 min — mantém cache após unmount
      retry:              1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,          // evita refetch ao voltar aba
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Loading spinner reutilizável para o Suspense ─────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
  </div>
);

// ── App protegido ─────────────────────────────────────────────────────────
const ProtectedApp = () => (
  <ProtectedRoute>
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/metas"          element={<Metas />} />
          <Route path="/execucao"       element={<ExecucaoObra />} />
          <Route path="/meu-espaco"     element={<MeuEspaco />} />
          <Route path="/ranking"        element={<RankingResponsaveis />} />
          <Route path="/metas-avancadas"element={<MetasAvancadas />} />
          <Route path="/cadastro"       element={<CadastroDados />} />
          <Route path="/relatorios"     element={<Relatorios />} />
          <Route path="/importacao"     element={<ImportacaoExcel />} />
          <Route path="/contabilidade"  element={<Contabilidade />} />
          <Route path="/contabilidade/*"element={<Contabilidade />} />
          <Route path="/pedidos"        element={<Pedidos />} />
          <Route path="/pedidos/*"      element={<Pedidos />} />
          <Route path="/usuarios"       element={<GerenciarUsuarios />} />
          <Route path="/backup"         element={<BackupRestore />} />
          <Route path="/manual"         element={<ManualUsuario />} />
          <Route path="/manual-admin"   element={<ManualAdmin />} />
          <Route path="/desenvolvimento" element={<Desenvolvimento />} />
          <Route path="/diario-obra"     element={<DiarioObra />} />
          <Route path="/almoxarifado"    element={<Almoxarifado />} />
          <Route path="/modulos"         element={<GerenciarModulos />} />
          <Route path="/auditoria"       element={<AdminAudit />} />
          <Route path="*"               element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  </ProtectedRoute>
);

// ── Root ──────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth"           element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/*"              element={<ProtectedApp />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
