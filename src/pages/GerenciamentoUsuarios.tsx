import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User, Trash2, Shield, UserPlus, Loader2, AlertCircle, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export const GerenciamentoUsuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Se a lista vier vazia, pode ser que o trigger não tenha populado a tabela ainda
      // ou que o usuário precise sincronizar os usuários existentes.
      setProfiles(data || []);
      if (!data || data.length === 0) {
        console.log('Nenhum perfil encontrado na tabela profiles.');
      }
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      // Se o erro for de RLS ou tabela inexistente, informamos claramente
      if (err.code === '42P01') {
        setError('A tabela de perfis não foi encontrada. Por favor, execute o script SQL de configuração.');
      } else if (err.code === '42501') {
        setError('Você não tem permissão para visualizar os perfis. Verifique as políticas de RLS.');
      } else {
        setError(`Erro ao carregar usuários: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDeleteUser = async (id: string, email: string) => {
    if (email === 'admin@sistema.com') {
      alert('O administrador principal não pode ser excluído.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
      return;
    }

    try {
      // Nota: No Supabase, deletar da tabela 'profiles' não deleta o usuário do Auth
      // a menos que haja um trigger ou que usemos a Admin API.
      // Como estamos no frontend, vamos tentar deletar do profiles.
      // O ideal é que o admin use o dashboard do Supabase para deletar usuários permanentemente,
      // ou que tenhamos uma Edge Function para isso.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchProfiles();
      alert('Usuário removido da lista de acesso.');
    } catch (err: any) {
      alert('Erro ao excluir usuário: ' + err.message);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-4">
          <Link to="/admin" className="flex items-center gap-2 text-grafite-500 hover:text-ciano-500 transition-colors text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft size={14} />
            Voltar para Admin
          </Link>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Gerenciamento de Usuários
            </h2>
            <p className="text-grafite-400 font-medium uppercase text-[10px] tracking-[0.2em]">
              Visualize e gerencie os acessos ao sistema
            </p>
            <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider leading-relaxed">
                IMPORTANTE: Para que os usuários apareçam aqui, você DEVE executar o script <code className="bg-amber-500/20 px-1 rounded">USER_MANAGEMENT_SETUP.sql</code> no SQL Editor do seu Supabase.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/cadastro"
          className="flex items-center gap-2 px-6 py-3 bg-ciano-600 hover:bg-ciano-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-glow-ciano"
        >
          <UserPlus size={18} />
          Novo Usuário
        </Link>
      </div>

      <div className="bg-grafite-900/50 border border-grafite-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-grafite-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-grafite-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-grafite-950 border border-grafite-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-ciano-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-ciano-500" size={40} />
            <p className="text-grafite-400 font-medium uppercase text-[10px] tracking-widest">Carregando usuários...</p>
          </div>
        ) : error ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="text-red-500" size={40} />
            <p className="text-white font-bold">{error}</p>
            <p className="text-grafite-400 text-sm max-w-md">
              Certifique-se de executar o script SQL fornecido para criar a tabela de perfis.
            </p>
            <button 
              onClick={fetchProfiles}
              className="mt-4 px-6 py-2 bg-grafite-800 hover:bg-grafite-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-grafite-950/50">
                  <th className="px-6 py-4 text-[10px] font-black text-grafite-500 uppercase tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black text-grafite-500 uppercase tracking-widest">E-mail</th>
                  <th className="px-6 py-4 text-[10px] font-black text-grafite-500 uppercase tracking-widest">Nível</th>
                  <th className="px-6 py-4 text-[10px] font-black text-grafite-500 uppercase tracking-widest">Cadastro</th>
                  <th className="px-6 py-4 text-[10px] font-black text-grafite-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grafite-800/50">
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-grafite-800 rounded-xl flex items-center justify-center text-grafite-400 group-hover:bg-ciano-600/20 group-hover:text-ciano-500 transition-all">
                            <User size={20} />
                          </div>
                          <span className="text-white font-bold text-sm">{profile.name || 'Sem nome'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-grafite-400 text-sm">{profile.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          profile.role === 'admin' 
                            ? 'bg-ciano-500/10 text-ciano-500 border border-ciano-500/20' 
                            : 'bg-grafite-800 text-grafite-400 border border-grafite-700'
                        }`}>
                          {profile.role === 'admin' && <Shield size={12} />}
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-grafite-500 text-xs">
                        {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(profile.id, profile.email)}
                          className="p-2 text-grafite-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-grafite-500 text-sm">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
