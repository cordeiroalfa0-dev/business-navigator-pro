import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';

import { supabase } from '../services/supabase';

export const Cadastro: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Bloqueio rigoroso: apenas administradores podem acessar esta página
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar o usuário no Auth
      // Os metadados (name e role) são essenciais para que o trigger no banco de dados
      // crie o perfil corretamente na tabela 'profiles'.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      setSuccess(true);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
      setTimeout(() => {
        navigate('/usuarios');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
        <Link to="/admin" className="flex items-center gap-2 text-grafite-500 hover:text-ciano-500 transition-colors text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft size={14} />
          Voltar para Admin
        </Link>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Novo Usuário
          </h2>
          <p className="text-grafite-400 font-medium uppercase text-[10px] tracking-[0.2em]">
            Cadastre novos administradores no sistema
          </p>
        </div>
      </div>

      <div className="bg-grafite-900/50 border border-grafite-800 rounded-3xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">
                Nome Completo
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-grafite-500 group-focus-within:text-ciano-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-grafite-950 border border-grafite-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-ciano-500 focus:ring-1 focus:ring-ciano-500 outline-none transition-all"
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">
                E-mail
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-grafite-500 group-focus-within:text-ciano-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-grafite-950 border border-grafite-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-ciano-500 focus:ring-1 focus:ring-ciano-500 outline-none transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            {/* Nível de Acesso */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">
                Nível de Acesso
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    formData.role === 'user'
                      ? 'bg-grafite-800 border-ciano-500 text-white'
                      : 'bg-grafite-950 border-grafite-800 text-grafite-500 hover:border-grafite-700'
                  }`}
                >
                  Usuário Comum
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    formData.role === 'admin'
                      ? 'bg-ciano-600/20 border-ciano-500 text-ciano-500'
                      : 'bg-grafite-950 border-grafite-800 text-grafite-500 hover:border-grafite-700'
                  }`}
                >
                  Administrador
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Senha */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">
                  Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-grafite-500 group-focus-within:text-ciano-500 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-grafite-950 border border-grafite-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-ciano-500 focus:ring-1 focus:ring-ciano-500 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-grafite-500 uppercase tracking-widest ml-1">
                  Confirmar Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-grafite-500 group-focus-within:text-ciano-500 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-grafite-950 border border-grafite-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-ciano-500 focus:ring-1 focus:ring-ciano-500 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 text-sm">
              <CheckCircle2 size={18} />
              Usuário cadastrado com sucesso! O acesso já está liberado.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-ciano-600 hover:bg-ciano-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-glow-ciano"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
          </button>
        </form>
      </div>
    </div>
  );
};
