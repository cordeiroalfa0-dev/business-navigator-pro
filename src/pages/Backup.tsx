import React, { useState, useRef } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { backupService, BackupData } from '../services/backupService';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const Backup: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
