import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Database, ShieldCheck, ArrowRight } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const adminModules = [
    {
      title: 'Gerenciar Usuários',
      description: 'Visualize, adicione e gerencie os usuários que têm acesso ao sistema.',
      icon: UserPlus,
      path: '/usuarios',
      color: 'bg-ciano-600',
      textColor: 'text-ciano-500'
    },
    {
      title: 'Backup e Restauração',
      description: 'Realize cópias de segurança dos dados ou restaure o sistema a partir de um arquivo.',
      icon: Database,
      path: '/backup',
      color: 'bg-amber-500',
      textColor: 'text-amber-500'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ciano-600 rounded-xl flex items-center justify-center shadow-glow-ciano">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            Painel Administrativo
          </h2>
        </div>
        <p className="text-grafite-400 font-medium uppercase text-xs tracking-[0.2em] ml-1">
          Gerenciamento centralizado de usuários e dados do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {adminModules.map((module) => (
          <Link
            key={module.path}
            to={module.path}
            className="group relative bg-grafite-900/40 border border-grafite-800 rounded-[2.5rem] p-10 flex flex-col gap-8 hover:border-grafite-700 transition-all duration-500 overflow-hidden"
          >
            {/* Background Decorativo */}
            <div className={`absolute -right-12 -top-12 w-48 h-48 ${module.color}/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`w-16 h-16 ${module.color}/10 rounded-2xl flex items-center justify-center ${module.textColor} group-hover:scale-110 transition-transform duration-500`}>
                <module.icon size={32} />
              </div>
              <div className="p-3 bg-grafite-800/50 rounded-full text-grafite-500 group-hover:text-white group-hover:bg-ciano-600 transition-all duration-300">
                <ArrowRight size={20} />
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <h3 className="text-2xl font-bold text-white group-hover:text-ciano-400 transition-colors">
                {module.title}
              </h3>
              <p className="text-grafite-400 text-sm leading-relaxed">
                {module.description}
              </p>
            </div>

            <div className="pt-4 mt-auto relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-grafite-500 group-hover:text-ciano-500 transition-colors">
                Acessar Módulo
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-grafite-900/20 border border-grafite-800/50 rounded-3xl p-8 flex items-start gap-6">
        <div className="w-12 h-12 bg-grafite-800 rounded-2xl flex items-center justify-center text-grafite-400 shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider">Acesso Restrito</h4>
          <p className="text-xs text-grafite-500 leading-relaxed max-w-2xl">
            Esta área é exclusiva para administradores do sistema. Todas as ações realizadas aqui, especialmente restaurações de backup e criação de novos usuários, são registradas para fins de auditoria e segurança.
          </p>
        </div>
      </div>
    </div>
  );
};
