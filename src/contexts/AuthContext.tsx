/**
 * COMPATIBILIDADE LEGADA
 * Este arquivo existe apenas para não quebrar imports antigos.
 * Toda a lógica de autenticação está em src/hooks/useAuth.tsx
 * Migre os imports para: import { useAuth } from '@/hooks/useAuth'
 */
export { useAuth, AuthProvider } from '@/hooks/useAuth'
