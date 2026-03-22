import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Zap, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SimulationControlPanelProps {
  isSimulating: boolean;
  isPaused: boolean;
  simulationSpeed: number;
  simState: any;
  onStart: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
}

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  isSimulating,
  isPaused,
  simulationSpeed,
  simState,
  onStart,
  onStop,
  onTogglePause,
  onSpeedChange,
}) => {
  return (
    <Card className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          {!isSimulating ? (
            <Button onClick={onStart} size="sm" className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" /> Iniciar Simulação
            </Button>
          ) : (
            <>
              <Button onClick={onTogglePause} size="sm" variant="outline">
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? 'Retomar' : 'Pausar'}
              </Button>
              <Button onClick={onStop} size="sm" variant="destructive">
                <Square className="w-4 h-4 mr-2" /> Parar
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-xs font-medium">Velocidade: {simulationSpeed}x</span>
          <Slider
            value={[simulationSpeed]}
            min={0.1}
            max={5}
            step={0.1}
            onValueChange={([v]) => onSpeedChange(v)}
            className="w-32"
          />
        </div>

        {isSimulating && simState && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>Potência: {simState.totalPower.toFixed(1)}W</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-500" />
              <span>Corrente: {simState.totalCurrent.toFixed(2)}A</span>
            </div>
            {simState.errors.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {simState.errors.length} Erros
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
