import { SchematicComponent, Wire, ComponentType, Point } from '@/types/schematic';

export interface ComponentState {
  id: string;
  voltage: number;
  current: number;
  power: number;
  status: 'on' | 'off' | 'fault';
  brightness?: number; // Para lâmpadas
  rotation?: number;   // Para motores
  active?: boolean;    // Para bobinas/relés
}

export interface SimulationState {
  components: Map<string, ComponentState>;
  energizedWires: Set<string>;
  errors: string[];
  totalPower: number;
  totalCurrent: number;
}

/**
 * Verifica se um ponto está próximo o suficiente de outro
 */
function isNearPoint(p1: Point, p2: Point, threshold = 15): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
}

/**
 * Retorna os pontos de conexão (terminais) de um componente em coordenadas globais
 */
function getComponentTerminalsGlobal(comp: SchematicComponent): Point[] {
  if (!comp.terminals || comp.terminals.length === 0) {
    return [];
  }
  
  // Os terminais já estão em coordenadas globais conforme o hook useSchematicEditor
  return comp.terminals.map(t => t.position);
}

/**
 * Verifica se um componente pode conduzir corrente no estado atual
 */
function isComponentConducting(comp: SchematicComponent): boolean {
  const alwaysConductive = [
    'fonte_ac', 'fonte_dc', 'fase_l1', 'fase_l2', 'fase_l3',
    'neutro', 'terra', 'borne', 'juncao', 'fusivel', 'conector',
    'lampada', 'lampada_verde', 'lampada_vermelha', 'lampada_amarela',
    'motor_mono', 'motor_tri', 'motor_dc',
    'bobina_contator', 'bobina_rele', 'resistor', 'capacitor', 'indutor',
    'sirene', 'buzzer', 'solenoide', 'ventilador',
    'transformador', 'transformador_ct',
    'clp_entrada', 'clp_saida'
  ];
  
  if (alwaysConductive.includes(comp.type)) {
    return true;
  }
  
  if (comp.type.startsWith('disjuntor') || comp.type === 'rele_termico' || comp.type === 'disjuntor_motor') {
    return true;
  }
  
  const closedTypes = ['contato_na', 'botoeira_na', 'contator_na', 'rele_na', 'contato_temp_na'];
  const openTypes = ['contato_nf', 'botoeira_nf', 'contator_nf', 'rele_nf', 'contato_temp_nf'];
  
  if (closedTypes.includes(comp.type)) {
    return comp.simState === 'on';
  }
  
  if (openTypes.includes(comp.type)) {
    return comp.simState !== 'on';
  }
  
  if (comp.type.startsWith('sensor') || comp.type.startsWith('chave_')) {
    return comp.simState === 'on';
  }
  
  return false;
}

function getSourceVoltage(comp: SchematicComponent): number {
  switch (comp.type) {
    case 'fonte_dc': return 24;
    case 'fonte_ac': return 127;
    case 'fase_l1':
    case 'fase_l2':
    case 'fase_l3': return 220;
    default: return 0;
  }
}

export class ElectricalSimulation {
  private components: SchematicComponent[];
  private wires: Wire[];
  
  constructor(components: SchematicComponent[], wires: Wire[]) {
    this.components = components;
    this.wires = wires;
  }

  public step(): SimulationState {
    const simState: SimulationState = {
      components: new Map(),
      energizedWires: new Set(),
      errors: [],
      totalPower: 0,
      totalCurrent: 0
    };

    const sources = this.components.filter(c => 
      ['fonte_ac', 'fonte_dc', 'fase_l1', 'fase_l2', 'fase_l3'].includes(c.type)
    );

    if (sources.length === 0) {
      simState.errors.push('Nenhuma fonte de energia encontrada');
      return simState;
    }

    const graph = new Map<string, Set<string>>();
    const nodeVoltages = new Map<string, number>();
    
    // 1. Criar nós para todos os terminais
    this.components.forEach(comp => {
      const terminals = getComponentTerminalsGlobal(comp);
      terminals.forEach((_, idx) => {
        const nodeId = `${comp.id}:${idx}`;
        graph.set(nodeId, new Set());
      });
    });

    // 2. Conectar nós através dos fios (qualquer ponto do fio pode conectar)
    this.wires.forEach(wire => {
      const connectedNodes: string[] = [];
      
      this.components.forEach(comp => {
        const terminals = getComponentTerminalsGlobal(comp);
        terminals.forEach((terminal, idx) => {
          // Verificar se algum ponto do fio está perto do terminal
          const isConnected = wire.points.some(wp => isNearPoint(wp, terminal));
          if (isConnected) {
            connectedNodes.push(`${comp.id}:${idx}`);
          }
        });
      });

      // Conectar todos os terminais que este fio toca entre si
      for (let i = 0; i < connectedNodes.length; i++) {
        for (let j = i + 1; j < connectedNodes.length; j++) {
          graph.get(connectedNodes[i])?.add(connectedNodes[j]);
          graph.get(connectedNodes[j])?.add(connectedNodes[i]);
        }
      }
    });

    // 3. Conectar fios que se cruzam/encostam
    this.wires.forEach((w1, i) => {
      this.wires.forEach((w2, j) => {
        if (i >= j) return;
        const touch = w1.points.some(p1 => w2.points.some(p2 => isNearPoint(p1, p2)));
        if (touch) {
          // Se os fios se tocam, todos os terminais conectados a w1 agora se conectam aos de w2
          const terms1: string[] = [];
          const terms2: string[] = [];
          
          this.components.forEach(comp => {
            const terminals = getComponentTerminalsGlobal(comp);
            terminals.forEach((terminal, idx) => {
              const nodeId = `${comp.id}:${idx}`;
              if (w1.points.some(p => isNearPoint(p, terminal))) terms1.push(nodeId);
              if (w2.points.some(p => isNearPoint(p, terminal))) terms2.push(nodeId);
            });
          });

          terms1.forEach(t1 => {
            terms2.forEach(t2 => {
              graph.get(t1)?.add(t2);
              graph.get(t2)?.add(t1);
            });
          });
        }
      });
    });

    // 4. Conectar terminais dentro de componentes condutores
    this.components.forEach(comp => {
      if (isComponentConducting(comp)) {
        const terminals = getComponentTerminalsGlobal(comp);
        if (terminals.length >= 2) {
          // Conecta todos os terminais do componente (simplificado)
          for (let i = 0; i < terminals.length; i++) {
            for (let j = i + 1; j < terminals.length; j++) {
              const n1 = `${comp.id}:${i}`;
              const n2 = `${comp.id}:${j}`;
              graph.get(n1)?.add(n2);
              graph.get(n2)?.add(n1);
            }
          }
        }
      }
    });

    // 5. Propagação de tensão (BFS)
    const queue: string[] = [];
    const visited = new Set<string>();

    sources.forEach(source => {
      const voltage = getSourceVoltage(source);
      const terminals = getComponentTerminalsGlobal(source);
      terminals.forEach((_, idx) => {
        const nodeId = `${source.id}:${idx}`;
        nodeVoltages.set(nodeId, voltage);
        queue.push(nodeId);
      });
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      
      const v = nodeVoltages.get(current) || 0;
      graph.get(current)?.forEach(neighbor => {
        if (!nodeVoltages.has(neighbor)) {
          nodeVoltages.set(neighbor, v);
          queue.push(neighbor);
        }
      });
    }

    // 6. Marcar fios energizados
    this.wires.forEach(wire => {
      const isEnergized = this.components.some(comp => {
        const terminals = getComponentTerminalsGlobal(comp);
        return terminals.some((t, idx) => {
          return nodeVoltages.has(`${comp.id}:${idx}`) && wire.points.some(wp => isNearPoint(wp, t));
        });
      });
      if (isEnergized) simState.energizedWires.add(wire.id);
    });

    // 7. Estado final dos componentes
    this.components.forEach(comp => {
      const terminals = getComponentTerminalsGlobal(comp);
      const voltages = terminals.map((_, idx) => nodeVoltages.get(`${comp.id}:${idx}`) || 0);
      const maxV = Math.max(0, ...voltages);
      
      // Simplificação: se tem tensão em qualquer terminal, está "on"
      // Para cargas reais, precisaríamos de um caminho para o neutro/terra
      const isOn = maxV > 0;
      
      simState.components.set(comp.id, {
        id: comp.id,
        voltage: maxV,
        current: isOn ? 0.5 : 0,
        power: isOn ? maxV * 0.5 : 0,
        status: isOn ? 'on' : 'off',
        brightness: comp.type.includes('lampada') ? (isOn ? 100 : 0) : undefined,
        rotation: comp.type.includes('motor') ? (isOn ? 1800 : 0) : undefined,
        active: (comp.type.includes('bobina') || comp.type.includes('temporizador')) ? isOn : undefined
      });
    });

    return simState;
  }
}
