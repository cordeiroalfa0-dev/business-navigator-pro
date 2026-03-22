import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user, userRole, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="bg-background flex items-center justify-center px-4" style={{ minHeight: "100dvh" }}>
        <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // All users with a role can access the system
  if (!userRole) {
    return (
      <div className="bg-background flex items-center justify-center px-4" style={{ minHeight: "100dvh" }}>
        <Card className="w-full max-w-lg border-border erp-card-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Seu usuário existe, mas ainda não tem permissão para entrar no Sistema ERP San Remo. Solicite acesso ao administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} variant="outline" className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
