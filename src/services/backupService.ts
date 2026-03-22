import { supabase } from './supabase';

export interface BackupData {
  materiais: any[];
  fotos: any[];
  envios: any[];
  timestamp: string;
  version: string;
}

export const backupService = {
  async exportData(): Promise<BackupData> {
    const { data: materiais, error: mError } = await supabase.from('materiais').select('*');
    if (mError) throw mError;

    const { data: fotos, error: fError } = await supabase.from('fotos').select('*');
    if (fError) throw fError;

    const { data: envios, error: eError } = await supabase.from('envios').select('*');
    if (eError) throw eError;

    return {
      materiais: materiais || [],
      fotos: fotos || [],
      envios: envios || [],
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  },

  async importData(data: BackupData): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar estrutura básica
      if (!data.materiais || !Array.isArray(data.materiais)) {
        throw new Error('Formato de backup inválido: materiais ausentes.');
      }

      // 2. Importar Materiais (Upsert para evitar duplicados se o ID já existir)
      if (data.materiais.length > 0) {
        const { error: mError } = await supabase.from('materiais').upsert(data.materiais);
        if (mError) throw mError;
      }

      // 3. Importar Fotos
      if (data.fotos && data.fotos.length > 0) {
        const { error: fError } = await supabase.from('fotos').upsert(data.fotos);
        if (fError) throw fError;
      }

      // 4. Importar Envios
      if (data.envios && data.envios.length > 0) {
        const { error: eError } = await supabase.from('envios').upsert(data.envios);
        if (eError) throw eError;
      }

      return { success: true, message: 'Dados restaurados com sucesso!' };
    } catch (error: any) {
      console.error('Erro na restauração:', error);
      return { success: false, message: error.message || 'Erro ao restaurar dados.' };
    }
  },

  downloadBackup(data: BackupData) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `backup-sanremo-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
