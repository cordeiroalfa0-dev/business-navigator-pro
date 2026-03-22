import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72, "Senha muito longa"),
});

export const bootstrapAdminSchema = z.object({
  fullName: z.string().trim().min(2, "Nome obrigatório").max(120, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(72, "Senha muito longa"),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(72, "Senha muito longa"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type BootstrapAdminFormValues = z.infer<typeof bootstrapAdminSchema>;
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
