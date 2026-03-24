import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Database, ShieldCheck, ArrowRight, Heart, CheckCircle2, XCircle, Loader2, RefreshCw, Clock, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Admin: React.FC = () => {
  const { user } = useAuth();

  const [lastHeartbeat, setLastHeartbeat]     = useState<string | null>(null);
  const [heartbeatCount, setHeartbeatCount]   = useState<number>(0);
  const [lastMessage, setLastMessage]         = useState<string | null>(null);
  const [recentHeartbeats, setRecentHeartbeats] = useState<{created_at: string; message: string | null; source: string | null}[]>([]);
  const [loadingStatus, setLoadingStatus]     = useState(true);
  const [testing, setTesting]                 = useState(false);
  const [testResult, setTestResult]           = useState<'ok' | 'error' | null>(null);
  const [testMsg, setTestMsg]                 = useState<string>('');

  // Converte UTC para horário de Brasília (UTC-3)
  const toBrasilia = (utcStr: string) => {
    const date = new Date(utcStr);
    return new Date(date.getTime() - 3 * 60 * 60 * 1000);
  };

  const formatBrasilia = (utcStr: string, fmt: string) =>
    format(toBrasilia(utcStr), fmt, { locale: ptBR });

  const formatDistBrasilia = (utcStr: string) =>
    formatDistanceToNow(new Date(utcStr), { addSuffix: true, locale: ptBR });

  const fetchHeartbeatStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const { data: recent } = await supabase
        .from('system_heartbeats')
        .select('created_at, message, source')
        .order('created_at', { ascending: false })
        .limit(3);

      const { count } = await supabase
        .from('system_heartbeats')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const list = recent ?? [];
      setRecentHeartbeats(list);
      setLastHeartbeat(list[0]?.created_at ?? null);
      setLastMessage(list[0]?.message ?? null);
      setHeartbeatCount(count ?? 0);
    } catch {}
    setLoadingStatus(false);
  }, []);

  useEffect(() => { fetchHeartbeatStatus(); }, [fetchHeartbeatStatus]);

  const handleTestKeepAlive = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/keep-alive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: '{}',
        }
      );
      const json = await res.json();
      if (json.success) {
        setTestResult('ok');
        setTestMsg(json.message ?? 'Heartbeat registrado!');
        await fetchHeartbeatStatus();
      } else {
        setTestResult('error');
        setTestMsg(json.error ?? 'Erro desconhecido');
      }
    } catch (e: any) {
      setTestResult('error');
      setTestMsg(e.message ?? 'Falha na conexão');
    }
    setTesting(false);
  };

  const horasSinceLastBeat = lastHeartbeat
    ? (Date.now() - new Date(lastHeartbeat).getTime()) / (1000 * 60 * 60)
    : null;

  const statusColor =
    horasSinceLastBeat === null ? 'text-grafite-400' :
    horasSinceLastBeat < 49    ? 'text-green-400' :
    horasSinceLastBeat < 120   ? 'text-amber-400' :
                                  'text-red-400';

  const statusLabel =
    horasSinceLastBeat === null  ? 'Sem registro' :
    horasSinceLastBeat < 49      ? 'Ativo' :
    horasSinceLastBeat < 120     ? 'Atenção' :
                                    'Em risco';

  const StatusIcon =
    horasSinceLastBeat === null  ? AlertTriangle :
    horasSinceLastBeat < 49      ? CheckCircle2 :
    horasSinceLastBeat < 120     ? AlertTriangle :
                                    XCircle;

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

      {/* Keep-Alive Monitor */}
      <div className="bg-grafite-900/30 border border-grafite-800/60 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Keep-Alive — Supabase</h4>
              <p className="text-xs text-grafite-500 mt-0.5">Monitoramento do sistema anti-pause</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHeartbeatStatus}
              disabled={loadingStatus}
              className="p-2 rounded-xl bg-grafite-800/60 text-grafite-400 hover:text-white hover:bg-grafite-700 transition-all"
              title="Atualizar status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleTestKeepAlive}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {testing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Zap className="w-3.5 h-3.5" />}
              Testar agora
            </button>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-grafite-900/40 border border-grafite-800/40 rounded-2xl p-4">
            <p className="text-xs text-grafite-500 uppercase tracking-wider mb-2">Status</p>
            {loadingStatus ? (
              <div className="flex items-center gap-2 text-grafite-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
              </div>
            ) : (
              <div className={`flex items-center gap-2 font-bold ${statusColor}`}>
                <StatusIcon className="w-4 h-4" />
                {statusLabel}
              </div>
            )}
          </div>

          <div className="bg-grafite-900/40 border border-grafite-800/40 rounded-2xl p-4">
            <p className="text-xs text-grafite-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Último heartbeat
            </p>
            {loadingStatus ? (
              <div className="h-4 bg-grafite-800/40 rounded animate-pulse w-3/4" />
            ) : lastHeartbeat ? (
              <div>
                <p className="text-white text-sm font-semibold">
                  {formatDistBrasilia(lastHeartbeat)}
                </p>
                <p className="text-grafite-500 text-[11px] mt-0.5">
                  {formatBrasilia(lastHeartbeat, "dd/MM/yyyy 'às' HH:mm")} (Brasília)
                </p>
              </div>
            ) : (
              <p className="text-grafite-500 text-sm">Nenhum registro</p>
            )}
          </div>

          <div className="bg-grafite-900/40 border border-grafite-800/40 rounded-2xl p-4">
            <p className="text-xs text-grafite-500 uppercase tracking-wider mb-2">Últimos 7 dias</p>
            {loadingStatus ? (
              <div className="h-4 bg-grafite-800/40 rounded animate-pulse w-1/2" />
            ) : (
              <div>
                <p className="text-white text-2xl font-bold">{heartbeatCount}</p>
                <p className="text-grafite-500 text-[11px]">execuções registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* Últimos 3 heartbeats */}
        {!loadingStatus && recentHeartbeats.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-grafite-500 uppercase tracking-wider">Últimas execuções (horário de Brasília)</p>
            {recentHeartbeats.map((hb, i) => (
              <div key={hb.created_at} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
                i === 0
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-grafite-900/40 border-grafite-800/40'
              }`}>
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-blue-400' : 'bg-grafite-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className={`text-xs font-semibold ${i === 0 ? 'text-blue-200' : 'text-grafite-400'}`}>
                      {formatBrasilia(hb.created_at, "dd/MM/yyyy 'às' HH:mm")}
                      <span className="ml-2 font-normal opacity-60">
                        ({formatDistBrasilia(hb.created_at)})
                      </span>
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      hb.source === 'cron'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {hb.source === 'cron' ? 'automático' : 'manual'}
                    </span>
                  </div>
                  {hb.message && (
                    <p className="text-[11px] text-grafite-500 italic mt-0.5 truncate">"{hb.message}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultado do teste */}
        {testResult && (
          <div className={`flex items-start gap-3 rounded-xl p-4 border ${
            testResult === 'ok'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {testResult === 'ok'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5">
                {testResult === 'ok' ? 'Heartbeat enviado com sucesso!' : 'Erro ao disparar keep-alive'}
              </p>
              <p className="text-xs opacity-80">{testMsg}</p>
            </div>
          </div>
        )}

        <p className="text-[11px] text-grafite-600 leading-relaxed">
          O sistema envia automaticamente um heartbeat a cada 2 dias às 20h (horário de Brasília) via pg_cron, evitando que o Supabase pause o projeto por inatividade. Use "Testar agora" para disparar manualmente e verificar se a função está respondendo.
        </p>
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
