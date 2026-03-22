import React from 'react';
import { SchematicComponent } from '@/types/schematic';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Zap, Activity, Info } from 'lucide-react';

interface ComponentPropertiesWithSimProps {
  component: SchematicComponent;
  simState: any;
  onUpdateLabel: (id: string, label: string) => void;
  onToggleState: (id: string, state: boolean) => void;
}

export const ComponentPropertiesWithSim: React.FC<ComponentPropertiesWithSimProps> = ({
  component,
  simState,
  onUpdateLabel,
  onToggleState,
}) => {
  const isSwitchable = ['contato_na', 'contato_nf', 'botoeira_na', 'botoeira_nf'].includes(component.type);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Info className="w-4 h-4" /> Propriedades
        </h3>
        <Badge variant={simState?.status === 'on' ? 'default' : 'secondary'}>
          {simState?.status === 'on' ? 'Ligado' : 'Desligado'}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Identificação (TAG)</Label>
        <Input
          value={component.label}
          onChange={(e) => onUpdateLabel(component.id, e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {isSwitchable && (
        <div className="flex items-center justify-between py-2 border-t border-b">
          <Label className="text-xs">Estado Manual</Label>
          <Switch
            checked={component.properties.state === 'closed'}
            onCheckedChange={(checked) => onToggleState(component.id, checked)}
          />
        </div>
      )}

      {simState && (
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
            Medições em Tempo Real
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted rounded-md">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                <Zap className="w-3 h-3" /> Tensão
              </div>
              <div className="text-sm font-mono">{simState.voltage.toFixed(1)}V</div>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                <Activity className="w-3 h-3" /> Corrente
              </div>
              <div className="text-sm font-mono">{simState.current.toFixed(2)}A</div>
            </div>
          </div>
          
          {component.type.startsWith('lampada') && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Brilho</span>
                <span>{simState.brightness}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-300" 
                  style={{ width: `${simState.brightness}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
