import { useState, useEffect, useCallback, useRef } from 'react';
import { SchematicComponent, Wire } from '@/types/schematic';
import { ElectricalSimulation, SimulationState } from '@/lib/simulation/electricalSimulation';

export function useElectricalSimulation(
  components: SchematicComponent[],
  wires: Wire[],
  isActive: boolean
) {
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [speed, setSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  
  // Manter referência do motor de simulação
  const engineRef = useRef<ElectricalSimulation | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar/reinicializar o motor quando componentes ou wires mudarem
  useEffect(() => {
    if (components.length > 0 || wires.length > 0) {
      console.log('🔧 Inicializando motor de simulação:', {
        componentes: components.length,
        fios: wires.length,
        componentesComTerminais: components.filter(c => c.terminals?.length > 0).length
      });
      
      engineRef.current = new ElectricalSimulation(components, wires);
      
      // Executar primeiro step imediatamente se ativo
      if (isActive && engineRef.current) {
        const initialState = engineRef.current.step();
        setSimState(initialState);
        console.log('⚡ Estado inicial da simulação:', {
          componentesEnergizados: Array.from(initialState.components.values()).filter(c => c.status === 'on').length,
          fiosEnergizados: initialState.energizedWires.size
        });
      }
    } else {
      engineRef.current = null;
      setSimState(null);
    }
  }, [components, wires, isActive]);

  // Função de step que usa a instância existente
  const runStep = useCallback(() => {
    if (!engineRef.current) {
      console.warn('⚠️ Motor de simulação não inicializado');
      return;
    }

    try {
      const newState = engineRef.current.step();
      setSimState(newState);
      
      // Log apenas se houver erros
      if (newState.errors.length > 0) {
        console.error('❌ Erros na simulação:', newState.errors);
      }
    } catch (error) {
      console.error('💥 Erro ao executar step:', error);
      setSimState(prev => prev ? {
        ...prev,
        errors: [...prev.errors, `Erro: ${error}`]
      } : null);
    }
  }, []);

  // Gerenciar o timer da simulação
  useEffect(() => {
    // Limpar timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Iniciar novo timer se ativo e não pausado
    if (isActive && !isPaused && engineRef.current) {
      console.log(`▶️ Iniciando simulação (velocidade: ${speed}x)`);
      timerRef.current = setInterval(runStep, 100 / speed);
    } else if (isPaused && isActive) {
      console.log('⏸️ Simulação pausada');
    } else if (!isActive) {
      console.log('⏹️ Simulação parada');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused, speed, runStep]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    console.log(`⚙️ Velocidade alterada: ${speed}x → ${newSpeed}x`);
    setSpeed(newSpeed);
  }, [speed]);

  const reset = useCallback(() => {
    console.log('🔄 Resetando simulação');
    if (components.length > 0 || wires.length > 0) {
      engineRef.current = new ElectricalSimulation(components, wires);
      const initialState = engineRef.current.step();
      setSimState(initialState);
    }
  }, [components, wires]);

  return {
    simState,
    isPaused,
    simulationSpeed: speed,
    togglePause,
    changeSpeed,
    reset,
    getComponentState: (id: string) => simState?.components.get(id),
    isWireEnergized: (id: string) => simState?.energizedWires.has(id) || false,
    getErrors: () => simState?.errors || [],
    isReady: () => engineRef.current !== null && simState !== null,
  };
}
