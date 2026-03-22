import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccessDenied({ requiredRole = "admin" }: { requiredRole?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "hsl(0, 72%, 51%, 0.15)" }}>
        <ShieldAlert className="w-8 h-8" style={{ color: "hsl(0, 72%, 51%)" }} />
      </div>
      <h2 className="text-base font-semibold" style={{ color: "hsl(var(--pbi-text-primary))" }}>
        Acesso Restrito
      </h2>
      <p className="text-[12px] text-center max-w-md" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
        Esta funcionalidade é exclusiva para usuários <strong style={{ color: "hsl(var(--pbi-yellow))" }}>{requiredRole}</strong>. 
        Contate o administrador do sistema para solicitar acesso.
      </p>
      <Link
        to="/"
        className="mt-2 px-4 py-2 rounded text-[12px] font-semibold"
        style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
