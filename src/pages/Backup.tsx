import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Heart, RefreshCw, Zap, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { backupService, BackupData } from '../services/backupService';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Backup: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Keep-Alive Monitor ──────────────────────────────────────────────────
  const [lastHeartbeat, setLastHeartbeat]       = useState<string | null>(null);
  const [heartbeatCount, setHeartbeatCount]     = useState<number>(0);
  const [recentHeartbeats, setRecentHeartbeats] = useState<{created_at: string; message: string | null; source: string | null}[]>([]);
  const [loadingHB, setLoadingHB]               = useState(true);
  const [testing, setTesting]                   = useState(false);
  const [testResult, setTestResult]             = useState<'ok' | 'error' | null>(null);
  const [testMsg, setTestMsg]                   = useState('');

  const toBrasilia = (utcStr: string) => new Date(new Date(utcStr).getTime() - 3 * 60 * 60 * 1000);
  const fmtBrasilia = (utcStr: string) => format(toBrasilia(utcStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const fmtDist = (utcStr: string) => formatDistanceToNow(new Date(utcStr), { addSuffix: true, locale: ptBR });

  const fetchHB = useCallback(async () => {
    setLoadingHB(true);
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
      setHeartbeatCount(count ?? 0);
    } catch {}
    setLoadingHB(false);
  }, []);

  useEffect(() => { fetchHB(); }, [fetchHB]);

  const handleTestHB = async () => {
    setTesting(true); setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/keep-alive`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: '{}' }
      );
      const json = await res.json();
      if (json.success) { setTestResult('ok'); setTestMsg(json.message ?? 'Heartbeat registrado!'); await fetchHB(); }
      else { setTestResult('error'); setTestMsg(json.error ?? 'Erro desconhecido'); }
    } catch (e: any) { setTestResult('error'); setTestMsg(e.message ?? 'Falha na conexão'); }
    setTesting(false);
  };

  const hrsAgo = lastHeartbeat ? (Date.now() - new Date(lastHeartbeat).getTime()) / 3600000 : null;
  const hbStatus = hrsAgo === null ? 'sem registro' : hrsAgo < 49 ? 'ativo' : hrsAgo < 120 ? 'atenção' : 'em risco';
  const hbColor  = hrsAgo === null ? 'text-grafite-400' : hrsAgo < 49 ? 'text-green-400' : hrsAgo < 120 ? 'text-amber-400' : 'text-red-400';
  const HbIcon   = hrsAgo === null || hrsAgo >= 120 ? XCircle : hrsAgo < 49 ? CheckCircle2 : AlertCircle;

  const handleExport = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const data = await backupService.exportData();
      backupService.downloadBackup(data);
      setStatus({ type: 'success', message: 'Backup exportado com sucesso!' });
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Erro ao exportar backup: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data: BackupData = JSON.parse(content);
        
        const result = await backupService.importData(data);
        if (result.success) {
          setStatus({ type: 'success', message: result.message });
        } else {
          setStatus({ type: 'error', message: result.message });
        }
      } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro ao processar arquivo: ' + error.message });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
        <Link to="/admin" className="flex items-center gap-2 text-grafite-500 hover:text-ciano-500 transition-colors text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft size={14} />
          Voltar para Admin
        </Link>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Backup e Restauração
          </h2>
          <p className="text-grafite-400 font-medium uppercase text-[10px] tracking-[0.2em]">
            Gerencie a segurança dos seus dados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-grafite-900/50 border border-grafite-800 rounded-3xl p-8 flex flex-col items-center text-center gap-6 hover:border-ciano-500/30 transition-colors group">
          <div className="w-16 h-16 bg-ciano-600/10 rounded-2xl flex items-center justify-center text-ciano-500 group-hover:scale-110 transition-transform">
            <Download size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Exportar Dados</h3>
            <p className="text-grafite-400 text-sm">
              Baixe uma cópia completa de todos os materiais, fotos e registros de envios em formato JSON.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full py-4 bg-ciano-600 hover:bg-ciano-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-glow-ciano"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {loading ? 'Processando...' : 'Baixar Backup'}
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-grafite-900/50 border border-grafite-800 rounded-3xl p-8 flex flex-col items-center text-center gap-6 hover:border-ciano-500/30 transition-colors group">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Restaurar Backup</h3>
            <p className="text-grafite-400 text-sm">
              Selecione um arquivo de backup (.json) para restaurar os dados no sistema. Isso atualizará os registros existentes.
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={loading}
            className="w-full py-4 bg-grafite-800 hover:bg-grafite-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 border border-grafite-700"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {loading ? 'Processando...' : 'Upload de Arquivo'}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`p-6 rounded-2xl border flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          status.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <div className="flex-1">
            <p className="font-bold text-sm uppercase tracking-wider mb-1">
              {status.type === 'success' ? 'Sucesso' : 'Erro'}
            </p>
            <p className="text-sm opacity-90">{status.message}</p>
          </div>
        </div>
      )}

      {/* Keep-Alive Monitor */}
      <div className="bg-grafite-900/30 border border-grafite-800/60 rounded-3xl p-8 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">Keep-Alive — Supabase</h4>
              <p className="text-xs text-grafite-500 mt-0.5">Sistema anti-pause · executa às 20h de Brasília a cada 2 dias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchHB} disabled={loadingHB}
              className="p-2 rounded-xl bg-grafite-800/60 text-grafite-400 hover:text-white hover:bg-grafite-700 transition-all" title="Atualizar">
              <RefreshCw className={`w-4 h-4 ${loadingHB ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleTestHB} disabled={testing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all disabled:opacity-50">
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Testar agora
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-grafite-900/40 border border-grafite-800/40 rounded-2xl p-4">
            <p className="text-xs text-grafite-500 uppercase tracking-wider mb-2">Status</p>
            {loadingHB ? <div className="h-4 bg-grafite-800/40 rounded animate-pulse w-2/3" /> : (
              <div className={`flex items-center gap-2 font-bold capitalize ${hbColor}`}>
                <HbIcon className="w-4 h-4" />{hbStatus}
              </div>
            )}
          </div>
          <div className="bg-grafite-900/40 border border-grafite-800/40 rounded-2xl p-4">
            <p className="text-xs text-grafite-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Último heartbeat
            </p>
            {loadingHB ? <div className="h-4 bg-grafite-800/40 rounded animate-pulse w-3/4" /> :
              lastHeartbeat ? (
                <div>
                  <p className="text-white text-sm font-semibold">{fmtDist(lastHeartbeat)}</p>
                  <p className="text-grafite-500 text-[11px] mt-0.5">{fmtBrasilia(lastHeartbeat)} (Brasília)</p>
                </div>
              ) : <p className="text-grafite-500 text-sm">Nenhum registro</p>
            }
          </div>
          <div className="bg-grafite-900/40 border border-grafite-800/40 rounded-2xl p-4">
            <p className="text-xs text-grafite-500 uppercase tracking-wider mb-2">Últimos 7 dias</p>
            {loadingHB ? <div className="h-4 bg-grafite-800/40 rounded animate-pulse w-1/2" /> : (
              <div>
                <p className="text-white text-2xl font-bold">{heartbeatCount}</p>
                <p className="text-grafite-500 text-[11px]">execuções registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* Histórico últimas 3 execuções */}
        {!loadingHB && recentHeartbeats.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-grafite-500 uppercase tracking-wider">Últimas execuções (horário de Brasília)</p>
            {recentHeartbeats.map((hb, i) => (
              <div key={hb.created_at} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
                i === 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-grafite-900/40 border-grafite-800/40'
              }`}>
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-blue-400' : 'bg-grafite-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className={`text-xs font-semibold ${i === 0 ? 'text-blue-200' : 'text-grafite-400'}`}>
                      {fmtBrasilia(hb.created_at)}
                      <span className="ml-2 font-normal opacity-60">({fmtDist(hb.created_at)})</span>
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                      hb.source === 'cron'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {hb.source === 'cron' ? 'automático' : 'manual'}
                    </span>
                  </div>
                  {hb.message && <p className="text-[11px] text-grafite-500 italic mt-0.5 truncate">"{hb.message}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resultado do teste */}
        {testResult && (
          <div className={`flex items-start gap-3 rounded-xl p-4 border ${
            testResult === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {testResult === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5">
                {testResult === 'ok' ? 'Heartbeat enviado com sucesso!' : 'Erro ao disparar keep-alive'}
              </p>
              <p className="text-xs opacity-80">{testMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Warning Box */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex items-start gap-4">
        <Database className="text-amber-500 shrink-0" size={24} />
        <div>
          <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-2">Informações Importantes</h4>
          <ul className="text-xs text-grafite-400 space-y-2 list-disc ml-4">
            <li>O backup inclui dados das tabelas de materiais, fotos e histórico de envios.</li>
            <li>A restauração utiliza o ID dos registros para identificar duplicatas.</li>
            <li>Arquivos de imagem físicos (Storage) não são incluídos no JSON, apenas seus links e referências.</li>
            <li>Recomenda-se fazer um backup antes de realizar qualquer importação em massa.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
