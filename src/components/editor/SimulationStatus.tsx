import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Activity, AlertCircle } from 'lucide-react';

interface SimulationStatusProps {
  simState: {
    totalPower: number;
    totalCurrent: number;
    components: Map<string, any>;
    energizedWires: Set<string>;
    errors: string[];
  } | null;
}

export function SimulationStatus({ simState }: SimulationStatusProps) {
  if (!simState) return null;

  const activeComponents = Array.from(simState.components.values()).filter(
    c => c.status === 'on'
  ).length;

  return (
    <Card className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur border-primary/20 p-4 min-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-green-500 animate-pulse" />
        <h3 className="text-sm font-bold text-white">STATUS DA SIMULAÇÃO</h3>
      </div>
      
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Potência Total:</span>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Zap className="w-3 h-3 mr-1" />
            {simState.totalPower.toFixed(1)} W
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Corrente Total:</span>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            {simState.totalCurrent.toFixed(2)} A
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Componentes Ativos:</span>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            {activeComponents} / {simState.components.size}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Fios Energizados:</span>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
            {simState.energizedWires.size}
          </Badge>
        </div>
      </div>

      {simState.errors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
            <AlertCircle className="w-3 h-3" />
            <span className="font-bold">ERROS:</span>
          </div>
          <div className="space-y-1">
            {simState.errors.map((error, idx) => (
              <div key={idx} className="text-xs text-red-400/80">
                • {error}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-slate-700 text-[10px] text-slate-500 text-center">
        Clique em chaves/botões para alternar
      </div>
    </Card>
  );
}

