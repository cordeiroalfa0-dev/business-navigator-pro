import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Activity, 
  Cpu, 
  Settings, 
  Thermometer, 
  Droplets, 
  Lightbulb,
  Wind,
  Shield,
  Smartphone,
  Gauge,
  Play,
  Square,
  AlertCircle
} from 'lucide-react';

interface SimulationDashboardProps {
  simulating: boolean;
  simState: any;
  plcState?: any;
  onToggleSim?: () => void;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({
  simulating,
  simState,
  plcState,
  onToggleSim
}) => {
  const [telemetry, setTelemetry] = useState({
    cpu: 0,
    temp: 22,
    humidity: 45,
    pressure: 1013
  });

  // Simular variações na telemetria quando ativo
  useEffect(() => {
    if (!simulating) return;

    const interval = setInterval(() => {
      setTelemetry(prev => ({
        cpu: Math.random() * 15 + 2,
        temp: 24 + Math.sin(Date.now() / 5000) * 2,
        humidity: 60 + Math.cos(Date.now() / 7000) * 5,
        pressure: 1010 + Math.random() * 5
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [simulating]);

  if (!simulating) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-6 bg-background/40">
        <div className="relative">
          <Cpu className="w-24 h-24 opacity-10 animate-pulse" />
          <AlertCircle className="w-8 h-8 absolute bottom-0 right-0 text-yellow-500/50" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Sistema em Standby</h3>
          <p className="max-w-xs mx-auto text-sm opacity-70">
            A telemetria e o controle em tempo real requerem que a simulação esteja ativa.
          </p>
        </div>
        <Button onClick={onToggleSim} size="lg" className="gap-2 shadow-lg hover:scale-105 transition-transform">
          <Play className="w-5 h-5 fill-current" /> Iniciar Sistema
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto h-full bg-slate-950/50 custom-scrollbar">
      
      {/* Header com Status Rápido */}
      <div className="lg:col-span-4 flex items-center justify-between bg-background/60 p-4 rounded-xl border border-primary/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              CONSOLE DE SIMULAÇÃO <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-none">LIVE</Badge>
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Monitoramento Industrial & Automação</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onToggleSim} className="gap-2">
          <Square className="w-4 h-4 fill-current" /> Parar Simulação
        </Button>
      </div>

      {/* Métricas de Performance */}
      <Card className="p-5 border-primary/10 bg-card/40 backdrop-blur hover:border-primary/30 transition-colors">
        <h3 className="text-xs font-bold flex items-center gap-2 mb-6 text-primary uppercase tracking-tighter">
          <Settings className="w-4 h-4" /> Performance do Núcleo
        </h3>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-medium uppercase opacity-70">
              <span>Carga da CPU</span>
              <span>{telemetry.cpu.toFixed(1)}%</span>
            </div>
            <Progress value={telemetry.cpu * 4} className="h-1.5 bg-primary/10" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
              <p className="text-[9px] text-muted-foreground uppercase">Scan Time</p>
              <p className="text-lg font-mono font-bold text-blue-400">12ms</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-white/5">
              <p className="text-[9px] text-muted-foreground uppercase">Memória</p>
              <p className="text-lg font-mono font-bold text-purple-400">24%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Energia e Potência */}
      <Card className="p-5 border-yellow-500/10 bg-card/40 backdrop-blur hover:border-yellow-500/30 transition-colors">
        <h3 className="text-xs font-bold flex items-center gap-2 mb-6 text-yellow-500 uppercase tracking-tighter">
          <Zap className="w-4 h-4" /> Barramento Elétrico
        </h3>
        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Consumo Real</p>
              <p className="text-4xl font-black text-yellow-500">
                {simState?.totalPower?.toFixed(1) || '0.0'}<span className="text-lg font-normal ml-1 opacity-50">W</span>
              </p>
            </div>
            <Activity className="w-10 h-10 text-yellow-500/20" />
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex justify-between items-center">
            <span className="text-xs font-medium">Corrente de Linha:</span>
            <span className="font-mono font-bold text-blue-400">{simState?.totalCurrent?.toFixed(2) || '0.00'}A</span>
          </div>
        </div>
      </Card>

      {/* PLC IO Status */}
      <Card className="p-5 border-purple-500/10 bg-card/40 backdrop-blur lg:col-span-2 hover:border-purple-500/30 transition-colors">
        <h3 className="text-xs font-bold flex items-center gap-2 mb-6 text-purple-400 uppercase tracking-tighter">
          <Cpu className="w-4 h-4" /> Mapa de E/S do Controlador
        </h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Entradas (I0.0 - I0.7)</p>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => {
                const isActive = plcState?.inputs?.find((input: any) => input.address === `I0.${i}`)?.value || i < 2;
                return (
                  <div key={`in-${i}`} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-8 rounded border flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isActive ? 'bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-muted/30 border-white/5 text-muted-foreground'
                    }`}>
                      I{i}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Saídas (Q0.0 - Q0.7)</p>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => {
                const isActive = plcState?.outputs?.find((out: any) => out.address === `Q0.${i}`)?.value || i === 0;
                return (
                  <div key={`out-${i}`} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-8 rounded border flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isActive ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-muted/30 border-white/5 text-muted-foreground'
                    }`}>
                      Q{i}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Sensores Ambientais */}
      <Card className="p-5 border-cyan-500/10 bg-card/40 backdrop-blur lg:col-span-2 hover:border-cyan-500/30 transition-colors">
        <h3 className="text-xs font-bold flex items-center gap-2 mb-6 text-cyan-400 uppercase tracking-tighter">
          <Gauge className="w-4 h-4" /> Sensores de Campo
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10"><Thermometer className="w-4 h-4 text-red-400" /></div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Temperatura</p>
                <p className="text-xl font-bold">{telemetry.temp.toFixed(1)}°C</p>
              </div>
            </div>
            <Progress value={(telemetry.temp / 50) * 100} className="h-1 bg-white/5" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10"><Droplets className="w-4 h-4 text-blue-400" /></div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Umidade</p>
                <p className="text-xl font-bold">{telemetry.humidity.toFixed(1)}%</p>
              </div>
            </div>
            <Progress value={telemetry.humidity} className="h-1 bg-white/5" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10"><Gauge className="w-4 h-4 text-green-400" /></div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Pressão</p>
                <p className="text-xl font-bold">{telemetry.pressure.toFixed(0)} <span className="text-[10px] opacity-50">hPa</span></p>
              </div>
            </div>
            <Progress value={75} className="h-1 bg-white/5" />
          </div>
        </div>
      </Card>

      {/* Atuadores Industriais Avançados */}
      <Card className="p-5 border-red-500/10 bg-card/40 backdrop-blur lg:col-span-2 hover:border-red-500/30 transition-colors">
        <h3 className="text-xs font-bold flex items-center gap-2 mb-6 text-red-400 uppercase tracking-tighter">
          <Activity className="w-4 h-4" /> Atuadores Críticos
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center animate-spin-slow">
                <Settings className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold">Motor Trifásico M1</p>
                <p className="text-[10px] text-green-500 font-mono">NOMINAL - 1750 RPM</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-none">ATIVO</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Wind className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold">Cilindro Pneumático C1</p>
                <p className="text-[10px] text-blue-400 font-mono">POSIÇÃO: 100% (AVANÇADO)</p>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">HOLD</Badge>
          </div>
        </div>
      </Card>

      {/* Smart Home Automation */}
      <Card className="p-5 border-blue-500/10 bg-card/40 backdrop-blur lg:col-span-4 hover:border-blue-500/30 transition-colors">
        <h3 className="text-xs font-bold flex items-center gap-2 mb-6 text-blue-400 uppercase tracking-tighter">
          <Smartphone className="w-4 h-4" /> Centro de Automação Residencial
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Lightbulb, label: 'Iluminação', status: '3 Ativas', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { icon: Wind, label: 'Climatização', status: '24°C - AUTO', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
            { icon: Shield, label: 'Segurança', status: 'ARMADO', color: 'text-green-500', bg: 'bg-green-500/10' },
            { icon: Smartphone, label: 'App Sync', status: 'CONECTADO', color: 'text-purple-400', bg: 'bg-purple-400/10' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
              <div className={`p-3 rounded-full ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
