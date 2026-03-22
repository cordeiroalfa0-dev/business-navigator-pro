import { SchematicComponent, ComponentType } from '@/types/schematic';

/**
 * Sistema de simulação de PLCs (Programmable Logic Controllers)
 * Suporta: Siemens S7-1200, S7-1500, Arduino, LOGO!
 * 
 * Inspirado no CADe_SIMU mas com melhorias significativas
 */

export type PLCType = 's7_1200' | 's7_1500' | 'arduino_uno' | 'logo_siemens';

export interface PLCInput {
  id: string;
  address: string; // Ex: I0.0, I0.1
  value: boolean;
  type: 'digital' | 'analog';
  analogValue?: number; // 0-10V ou 4-20mA
}

export interface PLCOutput {
  id: string;
  address: string; // Ex: Q0.0, Q0.1
  value: boolean;
  type: 'digital' | 'analog';
  analogValue?: number;
  pwmValue?: number; // 0-255 para Arduino
}

export interface PLCMemory {
  M: boolean[]; // Memórias (M0.0 - M7.7)
  T: number[];  // Timers (TON, TOF, TP)
  C: number[];  // Contadores
  DB: any[];    // Data Blocks (S7)
}

export interface PLCProgram {
  language: 'ladder' | 'fbd' | 'arduino_c' | 'sfc';
  code: string;
  rungs?: LadderRung[]; // Para Ladder
  blocks?: FBDBlock[];  // Para FBD
}

export interface LadderRung {
  id: string;
  contacts: Contact[];
  coil?: Coil;
  comment?: string;
}

export interface Contact {
  type: 'NO' | 'NC' | 'POS' | 'NEG'; // Normalmente Aberto, Fechado, Positivo, Negativo
  address: string;
  position: number;
}

export interface Coil {
  type: 'OUTPUT' | 'SET' | 'RESET' | 'TON' | 'TOF' | 'CTU' | 'CTD';
  address: string;
  preset?: number; // Para timers e contadores
}

export interface FBDBlock {
  type: 'AND' | 'OR' | 'NOT' | 'XOR' | 'TON' | 'TOF' | 'CTU' | 'SR' | 'RS' | 'MOVE' | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'CMP';
  inputs: string[];
  outputs: string[];
  parameters?: Record<string, any>;
}

export interface PLCState {
  plcType: PLCType;
  isRunning: boolean;
  cycleTime: number; // ms
  scanCycle: number; // contador de ciclos
  inputs: Map<string, PLCInput>;
  outputs: Map<string, PLCOutput>;
  memory: PLCMemory;
  program: PLCProgram;
  errors: string[];
  watchdog: number; // tempo máximo de ciclo
}

export class PLCSimulator {
  private state: PLCState;
  private cycleInterval?: NodeJS.Timeout;
  
  constructor(type: PLCType) {
    this.state = this.initializePLC(type);
  }

  /**
   * Inicializa PLC com configuração padrão
   */
  private initializePLC(type: PLCType): PLCState {
    const configs = {
      's7_1200': {
        inputs: 8,  // 8 DI
        outputs: 8, // 8 DO
        cycleTime: 10,
        memory: { M: 256, T: 16, C: 16, DB: 10 }
      },
      's7_1500': {
        inputs: 16,
        outputs: 16,
        cycleTime: 5,
        memory: { M: 512, T: 32, C: 32, DB: 50 }
      },
      'arduino_uno': {
        inputs: 14, // Pinos digitais
        outputs: 14,
        cycleTime: 20, // ~50Hz
        memory: { M: 64, T: 8, C: 8, DB: 0 }
      },
      'logo_siemens': {
        inputs: 8,
        outputs: 4,
        cycleTime: 50,
        memory: { M: 32, T: 8, C: 8, DB: 0 }
      }
    };

    const config = configs[type];
    const inputs = new Map<string, PLCInput>();
    const outputs = new Map<string, PLCOutput>();

    // Criar entradas digitais
    for (let i = 0; i < config.inputs; i++) {
      const address = type === 'arduino_uno' ? `D${i}` : `I0.${i}`;
      inputs.set(address, {
        id: address,
        address,
        value: false,
        type: 'digital'
      });
    }

    // Criar saídas digitais
    for (let i = 0; i < config.outputs; i++) {
      const address = type === 'arduino_uno' ? `D${i}` : `Q0.${i}`;
      outputs.set(address, {
        id: address,
        address,
        value: false,
        type: 'digital'
      });
    }

    return {
      plcType: type,
      isRunning: false,
      cycleTime: config.cycleTime,
      scanCycle: 0,
      inputs,
      outputs,
      memory: {
        M: new Array(config.memory.M).fill(false),
        T: new Array(config.memory.T).fill(0),
        C: new Array(config.memory.C).fill(0),
        DB: new Array(config.memory.DB).fill(null)
      },
      program: {
        language: 'ladder',
        code: '',
        rungs: []
      },
      errors: [],
      watchdog: 1000
    };
  }

  /**
   * Carrega programa Ladder no PLC
   */
  public loadLadderProgram(rungs: LadderRung[]): void {
    this.state.program = {
      language: 'ladder',
      code: this.compileLadderToCode(rungs),
      rungs
    };
  }

  /**
   * Carrega programa em Arduino C
   */
  public loadArduinoCode(code: string): void {
    if (this.state.plcType !== 'arduino_uno') {
      this.state.errors.push('Arduino C code only for Arduino UNO');
      return;
    }

    this.state.program = {
      language: 'arduino_c',
      code
    };
  }

  /**
   * Compila Ladder para código executável
   */
  private compileLadderToCode(rungs: LadderRung[]): string {
    let code = '// Auto-generated Ladder Logic\n\n';
    
    rungs.forEach((rung, idx) => {
      code += `// Rung ${idx + 1}: ${rung.comment || ''}\n`;
      
      // Construir expressão booleana
      let expression = '';
      rung.contacts.forEach((contact, i) => {
        if (i > 0) expression += ' && ';
        
        const value = contact.type === 'NO' ? 
          `get("${contact.address}")` : 
          `!get("${contact.address}")`;
        
        expression += value;
      });

      // Aplicar à bobina
      if (rung.coil) {
        switch (rung.coil.type) {
          case 'OUTPUT':
            code += `set("${rung.coil.address}", ${expression});\n`;
            break;
          case 'SET':
            code += `if (${expression}) set("${rung.coil.address}", true);\n`;
            break;
          case 'RESET':
            code += `if (${expression}) set("${rung.coil.address}", false);\n`;
            break;
          case 'TON':
            code += `timer_ton("${rung.coil.address}", ${expression}, ${rung.coil.preset});\n`;
            break;
        }
      }
      
      code += '\n';
    });

    return code;
  }

  /**
   * Inicia execução do PLC
   */
  public start(): void {
    if (this.state.isRunning) return;
    
    this.state.isRunning = true;
    this.state.scanCycle = 0;
    this.state.errors = [];

    // Ciclo de scan do PLC
    this.cycleInterval = setInterval(() => {
      try {
        this.executeScanCycle();
        this.state.scanCycle++;
      } catch (error) {
        this.state.errors.push(`Scan cycle error: ${error}`);
        this.stop();
      }
    }, this.state.cycleTime);
  }

  /**
   * Para execução do PLC
   */
  public stop(): void {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = undefined;
    }
    this.state.isRunning = false;
    
    // Reset todas as saídas
    this.state.outputs.forEach(output => {
      output.value = false;
      output.analogValue = 0;
    });
  }

  /**
   * Executa um ciclo de scan do PLC
   */
  private executeScanCycle(): void {
    const startTime = Date.now();

    // 1. Ler todas as entradas físicas
    this.readInputs();

    // 2. Executar programa do usuário
    this.executeProgram();

    // 3. Atualizar timers e contadores
    this.updateTimersAndCounters();

    // 4. Escrever saídas físicas
    this.writeOutputs();

    // 5. Verificar watchdog
    const cycleTime = Date.now() - startTime;
    if (cycleTime > this.state.watchdog) {
      this.state.errors.push(`Watchdog exceeded: ${cycleTime}ms`);
    }
  }

  /**
   * Lê estado das entradas físicas
   */
  private readInputs(): void {
    // Em simulação, as entradas são controladas externamente
    // Aqui apenas validamos
    this.state.inputs.forEach(input => {
      // Validação de limites para analógicas
      if (input.type === 'analog' && input.analogValue !== undefined) {
        input.analogValue = Math.max(0, Math.min(10, input.analogValue));
      }
    });
  }

  /**
   * Executa o programa do usuário
   */
  private executeProgram(): void {
    if (!this.state.program.rungs || this.state.program.rungs.length === 0) {
      return;
    }

    // Executar cada rung do ladder
    this.state.program.rungs.forEach(rung => {
      this.executeRung(rung);
    });
  }

  /**
   * Executa um rung do ladder
   */
  private executeRung(rung: LadderRung): void {
    // Avaliar condição (série de contatos)
    let condition = true;
    
    for (const contact of rung.contacts) {
      const value = this.getValue(contact.address);
      
      switch (contact.type) {
        case 'NO': // Normalmente Aberto
          condition = condition && value;
          break;
        case 'NC': // Normalmente Fechado
          condition = condition && !value;
          break;
        case 'POS': // Borda de subida
          // TODO: implementar detecção de borda
          break;
        case 'NEG': // Borda de descida
          // TODO: implementar detecção de borda
          break;
      }

      if (!condition) break; // Short-circuit
    }

    // Executar bobina
    if (rung.coil) {
      this.executeCoil(rung.coil, condition);
    }
  }

  /**
   * Executa uma bobina
   */
  private executeCoil(coil: Coil, condition: boolean): void {
    switch (coil.type) {
      case 'OUTPUT':
        this.setValue(coil.address, condition);
        break;
        
      case 'SET':
        if (condition) {
          this.setValue(coil.address, true);
        }
        break;
        
      case 'RESET':
        if (condition) {
          this.setValue(coil.address, false);
        }
        break;
        
      case 'TON':
        this.executeTON(coil.address, condition, coil.preset || 1000);
        break;
        
      case 'TOF':
        this.executeTOF(coil.address, condition, coil.preset || 1000);
        break;
        
      case 'CTU':
        this.executeCTU(coil.address, condition, coil.preset || 10);
        break;
    }
  }

  /**
   * Timer On-Delay
   */
  private executeTON(address: string, input: boolean, preset: number): void {
    const idx = this.getTimerIndex(address);
    if (idx === -1) return;

    if (input) {
      this.state.memory.T[idx] += this.state.cycleTime;
      if (this.state.memory.T[idx] >= preset) {
        this.setValue(address, true);
      }
    } else {
      this.state.memory.T[idx] = 0;
      this.setValue(address, false);
    }
  }

  /**
   * Timer Off-Delay
   */
  private executeTOF(address: string, input: boolean, preset: number): void {
    const idx = this.getTimerIndex(address);
    if (idx === -1) return;

    if (!input) {
      this.state.memory.T[idx] += this.state.cycleTime;
      if (this.state.memory.T[idx] >= preset) {
        this.setValue(address, false);
      }
    } else {
      this.state.memory.T[idx] = 0;
      this.setValue(address, true);
    }
  }

  /**
   * Count Up
   */
  private executeCTU(address: string, input: boolean, preset: number): void {
    const idx = this.getCounterIndex(address);
    if (idx === -1) return;

    // Detectar borda de subida
    const prevValue = this.getValue(`${address}_prev`);
    if (input && !prevValue) {
      this.state.memory.C[idx]++;
    }
    this.setValue(`${address}_prev`, input);

    // Verificar se atingiu preset
    if (this.state.memory.C[idx] >= preset) {
      this.setValue(address, true);
    }
  }

  /**
   * Obtém valor de um endereço
   */
  private getValue(address: string): boolean {
    // Input
    if (address.startsWith('I') || address.startsWith('D')) {
      const input = this.state.inputs.get(address);
      return input?.value || false;
    }
    
    // Output
    if (address.startsWith('Q')) {
      const output = this.state.outputs.get(address);
      return output?.value || false;
    }
    
    // Memory
    if (address.startsWith('M')) {
      const idx = this.getMemoryIndex(address);
      return this.state.memory.M[idx] || false;
    }

    return false;
  }

  /**
   * Define valor de um endereço
   */
  private setValue(address: string, value: boolean): void {
    // Output
    if (address.startsWith('Q') || address.startsWith('D')) {
      const output = this.state.outputs.get(address);
      if (output) {
        output.value = value;
      }
    }
    
    // Memory
    if (address.startsWith('M')) {
      const idx = this.getMemoryIndex(address);
      this.state.memory.M[idx] = value;
    }
  }

  /**
   * Atualiza timers e contadores
   */
  private updateTimersAndCounters(): void {
    // Timers já são atualizados durante execução
  }

  /**
   * Escreve saídas físicas
   */
  private writeOutputs(): void {
    // Em simulação, as saídas são lidas externamente
  }

  /**
   * Métodos auxiliares de índice
   */
  private getMemoryIndex(address: string): number {
    const match = address.match(/M(\d+)\.(\d+)/);
    if (!match) return 0;
    return parseInt(match[1]) * 8 + parseInt(match[2]);
  }

  private getTimerIndex(address: string): number {
    const match = address.match(/T(\d+)/);
    return match ? parseInt(match[1]) : -1;
  }

  private getCounterIndex(address: string): number {
    const match = address.match(/C(\d+)/);
    return match ? parseInt(match[1]) : -1;
  }

  /**
   * API Pública
   */

  public setInput(address: string, value: boolean): void {
    const input = this.state.inputs.get(address);
    if (input) {
      input.value = value;
    }
  }

  public getOutput(address: string): boolean {
    const output = this.state.outputs.get(address);
    return output?.value || false;
  }

  public getState(): PLCState {
    return { ...this.state };
  }

  public reset(): void {
    this.stop();
    this.state = this.initializePLC(this.state.plcType);
  }
}

/**
 * Factory para criar PLCs
 */
export function createPLC(type: PLCType): PLCSimulator {
  return new PLCSimulator(type);
}
