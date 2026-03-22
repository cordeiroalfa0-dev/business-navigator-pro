import {
  SchematicComponent,
  ComponentType,
  Point,
  Terminal,
} from "@/types/schematic";

/**
 * Gera ID único
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Define os terminais de cada tipo de componente baseado em sua posição
 */
export function getComponentTerminalPositions(
  type: ComponentType,
  position: Point,
  rotation: number = 0,
): Point[] {
  const { x, y } = position;
  let terminals: Point[] = [];

  // Aplicar rotação
  const rotatePoint = (px: number, py: number): Point => {
    if (rotation === 0) return { x: px, y: py };
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: x + (px - x) * cos - (py - y) * sin,
      y: y + (px - x) * sin + (py - y) * cos,
    };
  };

  switch (type) {
    // FONTES - 2 terminais
    case "fonte_ac":
    case "fonte_dc":
      terminals = [rotatePoint(x - 20, y), rotatePoint(x + 20, y)];
      break;

    // FASES E NEUTRO - 1 terminal (ponto de saída)
    case "fase_l1":
    case "fase_l2":
    case "fase_l3":
    case "neutro":
    case "terra":
      terminals = [{ x, y }];
      break;

    // PROTEÇÃO - 2 terminais (entrada/saída)
    case "disjuntor_monopolar":
    case "disjuntor_bipolar":
    case "disjuntor_tripolar":
    case "fusivel":
    case "rele_termico":
    case "disjuntor_motor":
      terminals = [rotatePoint(x - 25, y), rotatePoint(x + 25, y)];
      break;

    // PASSIVOS - 2 terminais
    case "resistor":
    case "capacitor":
    case "indutor":
      terminals = [rotatePoint(x - 20, y), rotatePoint(x + 20, y)];
      break;

    // CONTATOS E BOTOEIRAS - 2 terminais
    case "contato_na":
    case "contato_nf":
    case "botoeira_na":
    case "botoeira_nf":
    case "botoeira_emergencia":
    case "chave_fim_curso":
    case "chave_pressao":
    case "chave_nivel":
    case "chave_fluxo":
      terminals = [rotatePoint(x - 25, y), rotatePoint(x + 25, y)];
      break;

    // SELETORAS - múltiplos terminais
    case "chave_seletora":
      terminals = [
        rotatePoint(x - 25, y),
        rotatePoint(x + 25, y - 10),
        rotatePoint(x + 25, y + 10),
      ];
      break;

    // SENSORES - 2 terminais
    case "sensor_indutivo":
    case "sensor_capacitivo":
    case "sensor_optico":
    case "sensor_temperatura":
      terminals = [rotatePoint(x - 15, y), rotatePoint(x + 15, y)];
      break;

    // BOBINAS - 2 terminais
    case "bobina_contator":
    case "bobina_rele":
      terminals = [rotatePoint(x - 15, y), rotatePoint(x + 15, y)];
      break;

    // CONTATOS DE CONTATOR/RELÉ - 2 terminais (potência)
    case "contator_na":
    case "contator_nf":
    case "rele_na":
    case "rele_nf":
      terminals = [rotatePoint(x - 25, y), rotatePoint(x + 25, y)];
      break;

    // TEMPORIZADORES - bobina tem 2 terminais
    case "temporizador_ton":
    case "temporizador_tof":
    case "temporizador_tp":
      terminals = [rotatePoint(x - 15, y + 10), rotatePoint(x + 15, y + 10)];
      break;

    // CONTATOS DE TEMPORIZADOR
    case "contato_temp_na":
    case "contato_temp_nf":
      terminals = [rotatePoint(x - 25, y), rotatePoint(x + 25, y)];
      break;

    // LÂMPADAS - 2 terminais
    case "lampada":
    case "lampada_verde":
    case "lampada_vermelha":
    case "lampada_amarela":
      terminals = [rotatePoint(x - 15, y), rotatePoint(x + 15, y)];
      break;

    // MOTORES - 2 terminais (simplificado)
    case "motor_mono":
    case "motor_dc":
      terminals = [rotatePoint(x - 20, y), rotatePoint(x + 20, y)];
      break;

    case "motor_tri":
      // Motor trifásico: 3 terminais
      terminals = [
        rotatePoint(x - 20, y - 10),
        rotatePoint(x - 20, y),
        rotatePoint(x - 20, y + 10),
      ];
      break;

    // ATUADORES - 2 terminais
    case "sirene":
    case "buzzer":
    case "solenoide":
    case "ventilador":
      terminals = [rotatePoint(x - 15, y), rotatePoint(x + 15, y)];
      break;

    // TRANSFORMADORES - 4 terminais (primário e secundário)
    case "transformador":
    case "transformador_ct":
      terminals = [
        rotatePoint(x - 25, y - 10),
        rotatePoint(x - 25, y + 10),
        rotatePoint(x + 25, y - 10),
        rotatePoint(x + 25, y + 10),
      ];
      break;

    // CLP
    case "clp_entrada":
    case "clp_saida":
      terminals = [rotatePoint(x - 20, y), rotatePoint(x + 20, y)];
      break;

    // CONECTORES - ponto único de junção
    case "borne":
    case "juncao":
    case "conector":
      terminals = [{ x, y }];
      break;

    default:
      // Padrão: 2 terminais nas laterais
      terminals = [rotatePoint(x - 20, y), rotatePoint(x + 20, y)];
  }

  return terminals;
}

/**
 * Cria um array de terminais com IDs únicos
 */
export function createTerminals(positions: Point[]): Terminal[] {
  return positions.map((pos, index) => ({
    id: `t${index}`,
    position: pos,
    connected: false,
  }));
}

/**
 * Cria um novo componente com terminais corretos
 */
export function createComponent(
  type: ComponentType,
  position: Point,
  label?: string,
  rotation: number = 0,
): SchematicComponent {
  const terminalPositions = getComponentTerminalPositions(
    type,
    position,
    rotation,
  );
  const terminals = createTerminals(terminalPositions);

  return {
    id: generateId(),
    type,
    position,
    rotation,
    label: label || type.toUpperCase(),
    terminals,
    properties: {},
    simState: getDefaultSimState(type),
  };
}

/**
 * Retorna o estado de simulação padrão para cada tipo
 */
function getDefaultSimState(type: ComponentType): "on" | "off" | undefined {
  // Contatos NF começam fechados (conduzem)
  const normallyClosed = [
    "contato_nf",
    "botoeira_nf",
    "contator_nf",
    "rele_nf",
    "contato_temp_nf",
  ];

  if (normallyClosed.includes(type)) return "on";

  // TODOS os outros começam sem estado definido (undefined)
  // O estado só é definido durante a simulação
  return undefined;
}

/**
 * Atualiza os terminais de um componente após mudança de posição/rotação
 */
export function updateComponentTerminals(
  component: SchematicComponent,
): SchematicComponent {
  const terminalPositions = getComponentTerminalPositions(
    component.type,
    component.position,
    component.rotation,
  );

  return {
    ...component,
    terminals: component.terminals.map((terminal, index) => ({
      ...terminal,
      position: terminalPositions[index] || terminal.position,
    })),
  };
}

/**
 * Verifica se um componente é alternável (toggle) durante simulação
 */
export function isToggleable(type: ComponentType): boolean {
  return [
    "contato_na",
    "contato_nf",
    "botoeira_na",
    "botoeira_nf",
    "chave_fim_curso",
    "chave_pressao",
    "chave_nivel",
    "chave_fluxo",
    "sensor_indutivo",
    "sensor_capacitivo",
    "sensor_optico",
    "disjuntor_monopolar",
    "disjuntor_bipolar",
    "disjuntor_tripolar",
  ].includes(type);
}
