import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/auth-schema";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setIsRecoverySession(hash.get("type") === "recovery");
  }, []);

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Senha atualizada", description: "Agora você já pode entrar com a nova senha." });
    navigate("/auth", { replace: true });
  });

  return (
    <div className="bg-background flex items-center justify-center px-4" style={{ minHeight: "100dvh" }}>
      <Card className="w-full max-w-md erp-card-shadow">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>
            Defina uma nova senha para continuar no painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isRecoverySession ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground font-sans">
              Abra esta tela pelo link recebido no e-mail de recuperação.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input id="new-password" type="password" autoComplete="new-password" maxLength={72} {...form.register("password")} />
                {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" maxLength={72} {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword && <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                Salvar nova senha
                <KeyRound className="w-4 h-4" />
              </Button>
            </form>
          )}

          <div className="flex items-center gap-2 text-sm text-success font-sans">
            <CheckCircle2 className="w-4 h-4" />
            Fluxo seguro com validação de senha.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
