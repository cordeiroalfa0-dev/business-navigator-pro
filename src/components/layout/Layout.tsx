import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Plus, List, BarChart3, ShieldCheck, ArrowRightLeft, Send, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Painel' },
    { path: '/adicionar', icon: Plus, label: 'Novo Item' },
    { path: '/lista', icon: List, label: 'Inventário' },
    { path: '/relatorios', icon: BarChart3, label: 'Análise' },
    { path: '/enviar', icon: Send, label: 'Enviar' },
    { path: '/historico-envios', icon: ArrowRightLeft, label: 'Histórico' },
    ...(user?.role === 'admin' ? [
      { path: '/admin', icon: ShieldCheck, label: 'Admin' }
    ] : []),
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <div className="min-h-screen bg-grafite-950 text-grafite-100 flex flex-col selection:bg-ciano-500/30">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-ciano-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-ciano-800/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Bar / Header */}
      <header className="sticky top-0 z-50 bg-grafite-950/80 backdrop-blur-md border-b border-grafite-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-10 md:h-14 flex items-center">
              <img 
                src="/logo-sanremo.png" 
                alt="San Remo Construtora" 
                className="h-full w-auto object-contain brightness-0 invert" 
              />
            </div>
            <div className="border-l border-grafite-800 pl-4 ml-1 hidden sm:block">
              <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase text-white leading-none">SAN REMO</h1>
              <p className="text-[8px] md:text-[10px] font-bold text-ciano-500 tracking-[0.2em] md:tracking-[0.3em] uppercase leading-none mt-1">GERENCIAMENTO DE MATERIAIS</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-grafite-900/50 p-1.5 rounded-2xl border border-grafite-800">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 text-[10px] uppercase tracking-wider
                  ${isActive(path)
                    ? 'bg-ciano-600 text-white shadow-lg'
                    : 'text-grafite-400 hover:text-white hover:bg-grafite-800'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-grafite-900/50 rounded-xl border border-grafite-800">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-ciano-600/20 flex items-center justify-center text-[10px] font-black text-ciano-500 border border-ciano-600/30">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-white uppercase">{user?.name}</p>
                <p className="text-[8px] text-grafite-500 font-bold">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 md:p-2.5 hover:bg-grafite-800 rounded-xl transition-colors text-grafite-500 hover:text-red-500 group"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={toggleMenu}
              className="lg:hidden p-2.5 bg-grafite-900 border border-grafite-800 rounded-xl text-grafite-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-grafite-950 border-b border-grafite-800 animate-in slide-in-from-top duration-300">
            <div className="px-4 py-6 space-y-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest
                    ${isActive(path)
                      ? 'bg-ciano-600 text-white shadow-lg'
                      : 'bg-grafite-900/50 text-grafite-400 border border-grafite-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-grafite-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ciano-600/20 flex items-center justify-center text-xs font-black text-ciano-500 border border-ciano-600/30">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{user?.name}</p>
                    <p className="text-[9px] text-grafite-500 font-bold">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"
                >
                  <LogOut size={20} />
                </button>
              </div>
              <div className="pt-6 text-center">
                <p className="text-[9px] font-black text-grafite-600 uppercase tracking-[0.3em] mb-1">Sistema San Remo</p>
                <p className="text-[10px] font-black text-ciano-500 uppercase tracking-widest">Dev Emerson 2026</p>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 w-full py-8 md:py-12 relative z-10">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="py-12 md:py-16 border-t border-grafite-900/50 bg-grafite-950/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="h-8 brightness-0 invert opacity-30 grayscale">
                <img src="/logo-sanremo.png" alt="San Remo" className="h-full w-auto" />
              </div>
              <p className="text-[10px] font-black text-grafite-600 uppercase tracking-[0.4em]">
                San Remo Construtora © 2026
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-8 text-[10px] font-black text-grafite-500 uppercase tracking-widest">
                <span className="hover:text-ciano-500 cursor-pointer transition-colors">Suporte</span>
                <span className="hover:text-ciano-500 cursor-pointer transition-colors">Privacidade</span>
                <span className="hover:text-ciano-500 cursor-pointer transition-colors">Termos</span>
              </div>
              <div className="h-[1px] w-12 bg-grafite-800"></div>
              <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                Desenvolvido por <span className="text-ciano-500">Dev Emerson 2026</span>
              </p>
            </div>

            <div className="hidden md:flex flex-col items-end gap-1">
              <p className="text-[9px] font-black text-grafite-600 uppercase tracking-widest">Versão do Sistema</p>
              <p className="text-[10px] font-black text-white uppercase">v2.4.0-stable</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
