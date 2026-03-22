import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  // signUp removido do contexto público para segurança. Apenas admins criam usuários via Admin API ou Dashboard.
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        mapUser(session.user)
      }
      setIsLoading(false)
    }

    checkSession()

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapUser(session.user)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const mapUser = (supabaseUser: SupabaseUser) => {
    const email = supabaseUser.email || ''
    // Definir como admin se o email for o especificado ou se tiver metadado de admin
    const isAdmin = email === 'admin@sistema.com' || supabaseUser.user_metadata?.role === 'admin'
    
    setUser({
      id: supabaseUser.id,
      email: email,
      name: supabaseUser.user_metadata?.name || email.split('@')[0] || 'Usuário',
      role: isAdmin ? 'admin' : 'user'
    })
  }

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  // A função signUp foi removida daqui para evitar que qualquer usuário a invoque pelo console do navegador.
  // O cadastro de novos usuários deve ser feito via Supabase Dashboard ou uma Edge Function protegida.

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
