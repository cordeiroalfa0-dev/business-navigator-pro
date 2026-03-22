import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    }
  }

  return (
    <div className="min-h-screen bg-grafite-950 text-grafite-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-ciano-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-ciano-800/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] left-[50%] w-[35%] h-[35%] bg-ciano-900/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Container Principal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-ciano-600 rounded-3xl flex items-center justify-center shadow-glow-ciano animate-pulse">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white mb-2">SAN REMO</h1>
          <p className="text-[11px] font-bold text-ciano-500 tracking-[0.3em] uppercase">SISTEMA DE GERENCIAMENTO DE MATERIAS </p>
          <p className="text-grafite-500 font-bold uppercase tracking-widest text-[9px] mt-4">Gerenciamento Inteligente de Ativos</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card do Formulário */}
          <div className="glass-card p-10 rounded-4xl border border-grafite-800/50 backdrop-blur-xl">
            {/* Erro */}
            {error && (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Campo Email */}
            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-ciano-500" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-grafite-950/50 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white placeholder:text-grafite-600 focus:border-ciano-500/50 focus:ring-0 transition-all font-medium"
                required
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-3 mb-8">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-ciano-500" />
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-grafite-950/50 border-2 border-grafite-800 rounded-2xl px-6 py-4 text-white placeholder:text-grafite-600 focus:border-ciano-500/50 focus:ring-0 transition-all font-medium pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-grafite-600 hover:text-ciano-500 transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Botão Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-ciano-600 hover:bg-ciano-500 disabled:bg-grafite-800 disabled:text-grafite-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-lg shadow-ciano-900/30 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  Acessar Sistema
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>


        </form>

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[9px] font-medium text-grafite-600 uppercase tracking-widest">
            © 2026 San Remo Construtora. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
