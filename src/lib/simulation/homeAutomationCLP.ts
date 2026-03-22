/**
 * ===================================================================
 * SISTEMA CLP MODULAR PARA AUTOMAÇÃO RESIDENCIAL COMPLETO
 * ===================================================================
 * 
 * Sistema profissional de automação residencial baseado em CLP modular
 * Integrado ao simulador elétrico para testes e prototipagem
 * 
 * Características:
 * - Arquitetura totalmente modular (hot-swap)
 * - 15+ módulos especializados
 * - Comunicação: BACnet, Modbus, KNX, Z-Wave, Zigbee
 * - Machine Learning para padrões
 * - Integração com assistentes de voz
 * - Dashboard web em tempo real
 * - Backup na nuvem
 * - Sistema de cenas e rotinas
 * - Controle de consumo energético
 * - Segurança com múltiplos níveis
 */

import { EventEmitter } from 'events';

// ===================================================================
// TIPOS E INTERFACES BASE
// ===================================================================

export type ModuleCategory = 
  | 'lighting'           // Iluminação inteligente
  | 'climate'            // Climatização (AC, aquecedores)
  | 'security'           // Segurança (câmeras, alarmes)
  | 'energy'             // Gestão de energia
  | 'irrigation'         // Irrigação automática
  | 'multimedia'         // Áudio/vídeo distribuído
  | 'access'             // Controle de acesso
  | 'appliances'         // Eletrodomésticos inteligentes
  | 'shades'             // Cortinas/persianas motorizadas
  | 'pool'               // Automação de piscina
  | 'water'              // Gestão de água/aquecimento
  | 'ventilation'        // Ventilação/exaustão
  | 'monitoring'         // Monitoramento ambiental
  | 'communication'      // Comunicação/interfones
  | 'network';           // Rede/Gateway IoT

export type ModuleStatus = 'active' | 'standby' | 'error' | 'offline' | 'updating';

export interface ModuleConfig {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  version: string;
  manufacturer: string;
  inputs: ModuleIO[];
  outputs: ModuleIO[];
  parameters: ModuleParameter[];
  protocols: Protocol[];
  powerConsumption: number; // Watts
  updateInterval: number;   // ms
}

export interface ModuleIO {
  id: string;
  name: string;
  type: 'digital' | 'analog' | 'pwm' | 'serial' | 'i2c' | 'spi' | 'wireless';
  direction: 'input' | 'output';
  address: string;
  range?: { min: number; max: number };
  unit?: string;
  currentValue?: any;
}

export interface ModuleParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'enum' | 'color' | 'time' | 'schedule';
  value: any;
  min?: number;
  max?: number;
  options?: string[];
  description: string;
  userEditable: boolean;
}

export interface Protocol {
  name: 'modbus' | 'bacnet' | 'knx' | 'zwave' | 'zigbee' | 'mqtt' | 'http' | 'websocket';
  address: string;
  enabled: boolean;
}

export interface Scene {
  id: string;
  name: string;
  icon: string;
  description: string;
  actions: SceneAction[];
  triggers?: SceneTrigger[];
  conditions?: SceneCondition[];
  enabled: boolean;
  priority: number;
}

export interface SceneAction {
  moduleId: string;
  outputId: string;
  value: any;
  delay?: number;        // ms de atraso
  transition?: number;   // ms de transição suave
}

export interface SceneTrigger {
  type: 'time' | 'sunrise' | 'sunset' | 'sensor' | 'manual' | 'voice' | 'geofence';
  config: any;
}

export interface SceneCondition {
  moduleId: string;
  inputId: string;
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  value: any;
}

export interface Schedule {
  id: string;
  name: string;
  enabled: boolean;
  days: number[];        // 0=dom, 1=seg, ..., 6=sab
  time: string;          // "HH:MM"
  sceneId: string;
  repeat: boolean;
}

export interface EnergyData {
  timestamp: number;
  voltage: number;
  current: number;
  power: number;
  powerFactor: number;
  energy: number;        // kWh acumulado
  cost: number;          // R$
}

export interface SecurityEvent {
  timestamp: number;
  type: 'motion' | 'door_open' | 'window_open' | 'alarm' | 'camera_motion' | 'fire' | 'water_leak' | 'gas_leak';
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  resolved: boolean;
}

export interface UserPreferences {
  userId: string;
  comfortTemperature: number;
  lightingPreference: 'warm' | 'cool' | 'natural';
  wakeUpTime: string;
  sleepTime: string;
  presenceDetectionEnabled: boolean;
  voiceAssistant: 'alexa' | 'google' | 'siri' | 'none';
  notificationsEnabled: boolean;
  learningEnabled: boolean;
}

// ===================================================================
// CLASSE BASE DO MÓDULO
// ===================================================================

export abstract class HomeAutomationModule extends EventEmitter {
  protected config: ModuleConfig;
  protected status: ModuleStatus = 'standby';
  protected lastUpdate: number = 0;
  protected updateTimer?: NodeJS.Timeout;
  protected inputValues: Map<string, any> = new Map();
  protected outputValues: Map<string, any> = new Map();
  protected parameterValues: Map<string, any> = new Map();
  protected statistics: ModuleStatistics = {
    uptime: 0,
    cycles: 0,
    errors: 0,
    lastError: null
  };

  constructor(config: ModuleConfig) {
    super();
    this.config = config;
    this.initializeParameters();
  }

  private initializeParameters(): void {
    this.config.parameters.forEach(param => {
      this.parameterValues.set(param.id, param.value);
    });
  }

  /**
   * Inicia o módulo
   */
  public start(): void {
    if (this.status === 'active') return;
    
    this.status = 'active';
    this.onStart();
    
    // Ciclo de atualização
    this.updateTimer = setInterval(() => {
      try {
        this.update();
        this.statistics.cycles++;
        this.emit('updated', this.getState());
      } catch (error) {
        this.statistics.errors++;
        this.statistics.lastError = error.message;
        this.emit('error', error);
      }
    }, this.config.updateInterval);
    
    this.emit('started', { moduleId: this.config.id });
  }

  /**
   * Para o módulo
   */
  public stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
    
    this.status = 'standby';
    this.onStop();
    this.emit('stopped', { moduleId: this.config.id });
  }

  /**
   * Define valor de entrada
   */
  public setInput(inputId: string, value: any): void {
    const input = this.config.inputs.find(i => i.id === inputId);
    if (!input) {
      throw new Error(`Input ${inputId} not found in module ${this.config.id}`);
    }

    // Validar range para entradas analógicas
    if (input.type === 'analog' && input.range) {
      value = Math.max(input.range.min, Math.min(input.range.max, value));
    }

    this.inputValues.set(inputId, value);
    this.onInputChanged(inputId, value);
    this.emit('input_changed', { inputId, value });
  }

  /**
   * Obtém valor de entrada
   */
  public getInput(inputId: string): any {
    return this.inputValues.get(inputId);
  }

  /**
   * Define valor de saída
   */
  public setOutput(outputId: string, value: any, transition?: number): void {
    const output = this.config.outputs.find(o => o.id === outputId);
    if (!output) {
      throw new Error(`Output ${outputId} not found in module ${this.config.id}`);
    }

    if (transition && transition > 0) {
      // Transição suave (para dimmer, RGB, etc)
      this.smoothTransition(outputId, value, transition);
    } else {
      this.outputValues.set(outputId, value);
      output.currentValue = value;
      this.onOutputChanged(outputId, value);
      this.emit('output_changed', { outputId, value });
    }
  }

  /**
   * Transição suave de valor
   */
  private smoothTransition(outputId: string, targetValue: any, duration: number): void {
    const currentValue = this.outputValues.get(outputId) || 0;
    const steps = Math.ceil(duration / 50); // 50ms por step
    const increment = (targetValue - currentValue) / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const newValue = currentValue + (increment * step);
      
      if (step >= steps) {
        clearInterval(interval);
        this.setOutput(outputId, targetValue);
      } else {
        this.outputValues.set(outputId, newValue);
        this.emit('output_changed', { outputId, value: newValue });
      }
    }, 50);
  }

  /**
   * Obtém valor de saída
   */
  public getOutput(outputId: string): any {
    return this.outputValues.get(outputId);
  }

  /**
   * Define parâmetro
   */
  public setParameter(parameterId: string, value: any): void {
    const param = this.config.parameters.find(p => p.id === parameterId);
    if (!param) {
      throw new Error(`Parameter ${parameterId} not found`);
    }

    if (!param.userEditable) {
      throw new Error(`Parameter ${parameterId} is not user editable`);
    }

    this.parameterValues.set(parameterId, value);
    this.onParameterChanged(parameterId, value);
    this.emit('parameter_changed', { parameterId, value });
  }

  /**
   * Obtém parâmetro
   */
  public getParameter(parameterId: string): any {
    return this.parameterValues.get(parameterId);
  }

  /**
   * Obtém estado completo do módulo
   */
  public getState(): ModuleState {
    return {
      config: this.config,
      status: this.status,
      inputs: Array.from(this.inputValues.entries()).map(([id, value]) => ({ id, value })),
      outputs: Array.from(this.outputValues.entries()).map(([id, value]) => ({ id, value })),
      parameters: Array.from(this.parameterValues.entries()).map(([id, value]) => ({ id, value })),
      statistics: this.statistics,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Métodos abstratos que devem ser implementados pelos módulos específicos
   */
  protected abstract onStart(): void;
  protected abstract onStop(): void;
  protected abstract update(): void;
  protected abstract onInputChanged(inputId: string, value: any): void;
  protected abstract onOutputChanged(outputId: string, value: any): void;
  protected abstract onParameterChanged(parameterId: string, value: any): void;
}

export interface ModuleState {
  config: ModuleConfig;
  status: ModuleStatus;
  inputs: Array<{ id: string; value: any }>;
  outputs: Array<{ id: string; value: any }>;
  parameters: Array<{ id: string; value: any }>;
  statistics: ModuleStatistics;
  lastUpdate: number;
}

export interface ModuleStatistics {
  uptime: number;
  cycles: number;
  errors: number;
  lastError: string | null;
}

// ===================================================================
// MÓDULO 1: ILUMINAÇÃO INTELIGENTE
// ===================================================================

export class SmartLightingModule extends HomeAutomationModule {
  private brightnessLevels: Map<string, number> = new Map();
  private colorTemperatures: Map<string, number> = new Map();
  private rgbColors: Map<string, { r: number; g: number; b: number }> = new Map();
  private occupancyDetected: boolean = false;
  private ambientLight: number = 0;
  private circadianRhythm: boolean = true;

  constructor() {
    super({
      id: 'lighting_001',
      name: 'Sistema de Iluminação Inteligente',
      category: 'lighting',
      description: 'Controle completo de iluminação com dimmer, RGB, temperatura de cor e automação',
      version: '2.0.0',
      manufacturer: 'SmartHome Pro',
      inputs: [
        {
          id: 'motion_sensor',
          name: 'Sensor de Presença',
          type: 'digital',
          direction: 'input',
          address: 'DI_01'
        },
        {
          id: 'ambient_light',
          name: 'Sensor de Luminosidade',
          type: 'analog',
          direction: 'input',
          address: 'AI_01',
          range: { min: 0, max: 1000 },
          unit: 'lux'
        },
        {
          id: 'manual_switch',
          name: 'Interruptor Manual',
          type: 'digital',
          direction: 'input',
          address: 'DI_02'
        }
      ],
      outputs: [
        {
          id: 'main_light',
          name: 'Luz Principal',
          type: 'pwm',
          direction: 'output',
          address: 'PWM_01',
          range: { min: 0, max: 100 },
          unit: '%'
        },
        {
          id: 'accent_light',
          name: 'Luz de Destaque',
          type: 'pwm',
          direction: 'output',
          address: 'PWM_02',
          range: { min: 0, max: 100 },
          unit: '%'
        },
        {
          id: 'rgb_strip',
          name: 'Fita RGB',
          type: 'pwm',
          direction: 'output',
          address: 'RGB_01'
        }
      ],
      parameters: [
        {
          id: 'auto_mode',
          name: 'Modo Automático',
          type: 'boolean',
          value: true,
          description: 'Ativa/desativa automação por presença',
          userEditable: true
        },
        {
          id: 'default_brightness',
          name: 'Brilho Padrão',
          type: 'number',
          value: 80,
          min: 0,
          max: 100,
          description: 'Brilho padrão quando luz é ligada (%)',
          userEditable: true
        },
        {
          id: 'fade_time',
          name: 'Tempo de Transição',
          type: 'number',
          value: 1000,
          min: 0,
          max: 5000,
          description: 'Tempo de fade in/out (ms)',
          userEditable: true
        },
        {
          id: 'auto_off_delay',
          name: 'Desligamento Automático',
          type: 'number',
          value: 300,
          min: 0,
          max: 3600,
          description: 'Tempo para desligar sem presença (segundos)',
          userEditable: true
        },
        {
          id: 'circadian_enabled',
          name: 'Ritmo Circadiano',
          type: 'boolean',
          value: true,
          description: 'Ajusta temperatura de cor conforme hora do dia',
          userEditable: true
        },
        {
          id: 'lux_threshold',
          name: 'Limite de Luminosidade',
          type: 'number',
          value: 300,
          min: 0,
          max: 1000,
          description: 'Luminosidade mínima para não acender (lux)',
          userEditable: true
        }
      ],
      protocols: [
        { name: 'modbus', address: '192.168.1.10:502', enabled: true },
        { name: 'mqtt', address: 'mqtt://broker.local:1883', enabled: true }
      ],
      powerConsumption: 150,
      updateInterval: 100
    });
  }

  protected onStart(): void {
    console.log('🔆 Sistema de Iluminação Iniciado');
    
    // Inicializar valores
    this.brightnessLevels.set('main_light', 0);
    this.brightnessLevels.set('accent_light', 0);
    
    // Aplicar ritmo circadiano se habilitado
    if (this.getParameter('circadian_enabled')) {
      this.updateCircadianLighting();
    }
  }

  protected onStop(): void {
    console.log('🔆 Sistema de Iluminação Parado');
    
    // Desligar todas as luzes suavemente
    this.setOutput('main_light', 0, 1000);
    this.setOutput('accent_light', 0, 1000);
  }

  protected update(): void {
    this.lastUpdate = Date.now();
    
    // Ler sensores
    this.occupancyDetected = this.getInput('motion_sensor') || false;
    this.ambientLight = this.getInput('ambient_light') || 0;
    const manualSwitch = this.getInput('manual_switch') || false;

    // Modo automático
    if (this.getParameter('auto_mode')) {
      this.handleAutomaticLighting();
    }

    // Interruptor manual sobrepõe automação
    if (manualSwitch) {
      this.handleManualSwitch();
    }

    // Atualizar ritmo circadiano
    if (this.getParameter('circadian_enabled')) {
      this.updateCircadianLighting();
    }
  }

  /**
   * Lógica de iluminação automática
   */
  private handleAutomaticLighting(): void {
    const luxThreshold = this.getParameter('lux_threshold');
    
    // Se há presença e está escuro
    if (this.occupancyDetected && this.ambientLight < luxThreshold) {
      const brightness = this.getParameter('default_brightness');
      const fadeTime = this.getParameter('fade_time');
      
      this.setOutput('main_light', brightness, fadeTime);
      
      // Resetar timer de auto-off
      this.resetAutoOffTimer();
    }
  }

  /**
   * Timer para desligamento automático
   */
  private autoOffTimer?: NodeJS.Timeout;
  
  private resetAutoOffTimer(): void {
    if (this.autoOffTimer) {
      clearTimeout(this.autoOffTimer);
    }

    const delay = this.getParameter('auto_off_delay') * 1000;
    
    this.autoOffTimer = setTimeout(() => {
      if (!this.occupancyDetected) {
        const fadeTime = this.getParameter('fade_time');
        this.setOutput('main_light', 0, fadeTime);
        this.setOutput('accent_light', 0, fadeTime);
      }
    }, delay);
  }

  /**
   * Interruptor manual
   */
  private handleManualSwitch(): void {
    const currentBrightness = this.getOutput('main_light') || 0;
    const fadeTime = this.getParameter('fade_time');
    
    if (currentBrightness > 0) {
      // Desligar
      this.setOutput('main_light', 0, fadeTime);
    } else {
      // Ligar com brilho padrão
      const brightness = this.getParameter('default_brightness');
      this.setOutput('main_light', brightness, fadeTime);
    }
  }

  /**
   * Ajusta temperatura de cor baseado na hora do dia (ritmo circadiano)
   */
  private updateCircadianLighting(): void {
    const now = new Date();
    const hour = now.getHours();
    
    let colorTemp: number;
    
    if (hour >= 6 && hour < 9) {
      // Manhã: luz mais fria (5000-6500K) para despertar
      colorTemp = 6000;
    } else if (hour >= 9 && hour < 18) {
      // Dia: luz neutra (4000-5000K)
      colorTemp = 4500;
    } else if (hour >= 18 && hour < 21) {
      // Tarde: luz morna (3000-4000K)
      colorTemp = 3500;
    } else {
      // Noite: luz quente (2700-3000K) para relaxar
      colorTemp = 2700;
    }
    
    this.colorTemperatures.set('main_light', colorTemp);
    
    // Converter temperatura de cor para RGB (simplificado)
    const rgb = this.colorTempToRGB(colorTemp);
    this.rgbColors.set('main_light', rgb);
  }

  /**
   * Converte temperatura de cor (Kelvin) para RGB
   */
  private colorTempToRGB(kelvin: number): { r: number; g: number; b: number } {
    const temp = kelvin / 100;
    let r, g, b;

    // Vermelho
    if (temp <= 66) {
      r = 255;
    } else {
      r = temp - 60;
      r = 329.698727446 * Math.pow(r, -0.1332047592);
      r = Math.max(0, Math.min(255, r));
    }

    // Verde
    if (temp <= 66) {
      g = temp;
      g = 99.4708025861 * Math.log(g) - 161.1195681661;
    } else {
      g = temp - 60;
      g = 288.1221695283 * Math.pow(g, -0.0755148492);
    }
    g = Math.max(0, Math.min(255, g));

    // Azul
    if (temp >= 66) {
      b = 255;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
      b = Math.max(0, Math.min(255, b));
    }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }

  /**
   * API pública adicional
   */
  public setBrightness(lightId: string, brightness: number, transition?: number): void {
    this.setOutput(lightId, brightness, transition || this.getParameter('fade_time'));
  }

  public setRGBColor(r: number, g: number, b: number, transition?: number): void {
    this.rgbColors.set('rgb_strip', { r, g, b });
    this.setOutput('rgb_strip', { r, g, b }, transition);
    this.emit('rgb_changed', { r, g, b });
  }

  public toggleLight(lightId: string): void {
    const current = this.getOutput(lightId) || 0;
    const target = current > 0 ? 0 : this.getParameter('default_brightness');
    this.setOutput(lightId, target, this.getParameter('fade_time'));
  }

  protected onInputChanged(inputId: string, value: any): void {
    console.log(`🔆 Input changed: ${inputId} = ${value}`);
  }

  protected onOutputChanged(outputId: string, value: any): void {
    console.log(`🔆 Output changed: ${outputId} = ${value}`);
  }

  protected onParameterChanged(parameterId: string, value: any): void {
    console.log(`🔆 Parameter changed: ${parameterId} = ${value}`);
  }
}

// ===================================================================
// MÓDULO 2: CLIMATIZAÇÃO INTELIGENTE
// ===================================================================

export class SmartClimateModule extends HomeAutomationModule {
  private currentTemperature: number = 22;
  private currentHumidity: number = 50;
  private targetTemperature: number = 22;
  private hvacMode: 'off' | 'cool' | 'heat' | 'auto' | 'fan' = 'auto';
  private fanSpeed: 'low' | 'medium' | 'high' | 'auto' = 'auto';
  private occupancyDetected: boolean = false;
  private windowsOpen: boolean = false;
  private learningMode: boolean = true;
  private comfortHistory: Array<{ hour: number; temp: number; day: number }> = [];

  constructor() {
    super({
      id: 'climate_001',
      name: 'Sistema de Climatização Inteligente',
      category: 'climate',
      description: 'Controle inteligente de ar-condicionado, aquecedores e ventilação com aprendizado de padrões',
      version: '2.0.0',
      manufacturer: 'SmartHome Pro',
      inputs: [
        {
          id: 'temp_sensor',
          name: 'Sensor de Temperatura',
          type: 'analog',
          direction: 'input',
          address: 'AI_10',
          range: { min: -10, max: 50 },
          unit: '°C'
        },
        {
          id: 'humidity_sensor',
          name: 'Sensor de Umidade',
          type: 'analog',
          direction: 'input',
          address: 'AI_11',
          range: { min: 0, max: 100 },
          unit: '%'
        },
        {
          id: 'presence_sensor',
          name: 'Sensor de Presença',
          type: 'digital',
          direction: 'input',
          address: 'DI_10'
        },
        {
          id: 'window_sensor',
          name: 'Sensor de Janela',
          type: 'digital',
          direction: 'input',
          address: 'DI_11'
        }
      ],
      outputs: [
        {
          id: 'ac_power',
          name: 'Liga/Desliga AC',
          type: 'digital',
          direction: 'output',
          address: 'DO_10'
        },
        {
          id: 'ac_temp',
          name: 'Temperatura AC',
          type: 'analog',
          direction: 'output',
          address: 'AO_10',
          range: { min: 16, max: 30 },
          unit: '°C'
        },
        {
          id: 'ac_mode',
          name: 'Modo AC',
          type: 'analog',
          direction: 'output',
          address: 'AO_11'
        },
        {
          id: 'fan_speed',
          name: 'Velocidade Ventilador',
          type: 'analog',
          direction: 'output',
          address: 'AO_12',
          range: { min: 0, max: 100 },
          unit: '%'
        }
      ],
      parameters: [
        {
          id: 'target_temp',
          name: 'Temperatura Alvo',
          type: 'number',
          value: 22,
          min: 16,
          max: 30,
          description: 'Temperatura desejada (°C)',
          userEditable: true
        },
        {
          id: 'temp_tolerance',
          name: 'Tolerância de Temperatura',
          type: 'number',
          value: 1,
          min: 0.5,
          max: 3,
          description: 'Variação aceita da temperatura (±°C)',
          userEditable: true
        },
        {
          id: 'eco_mode',
          name: 'Modo Econômico',
          type: 'boolean',
          value: true,
          description: 'Economiza energia ajustando temperatura',
          userEditable: true
        },
        {
          id: 'learning_enabled',
          name: 'Aprendizado Ativado',
          type: 'boolean',
          value: true,
          description: 'Aprende padrões de conforto do usuário',
          userEditable: true
        },
        {
          id: 'auto_off_windows',
          name: 'Desligar com Janelas Abertas',
          type: 'boolean',
          value: true,
          description: 'Desliga AC se janela abrir',
          userEditable: true
        },
        {
          id: 'night_mode_temp',
          name: 'Temperatura Noturna',
          type: 'number',
          value: 24,
          min: 18,
          max: 28,
          description: 'Temperatura para período noturno (°C)',
          userEditable: true
        }
      ],
      protocols: [
        { name: 'modbus', address: '192.168.1.11:502', enabled: true },
        { name: 'mqtt', address: 'mqtt://broker.local:1883', enabled: true },
        { name: 'bacnet', address: '192.168.1.11:47808', enabled: true }
      ],
      powerConsumption: 2000,
      updateInterval: 1000
    });
  }

  protected onStart(): void {
    console.log('❄️ Sistema de Climatização Iniciado');
    this.loadComfortHistory();
  }

  protected onStop(): void {
    console.log('❄️ Sistema de Climatização Parado');
    this.setOutput('ac_power', false);
  }

  protected update(): void {
    this.lastUpdate = Date.now();
    
    // Ler sensores
    this.currentTemperature = this.getInput('temp_sensor') || 22;
    this.currentHumidity = this.getInput('humidity_sensor') || 50;
    this.occupancyDetected = this.getInput('presence_sensor') || false;
    this.windowsOpen = this.getInput('window_sensor') || false;

    // Desligar se janelas abertas
    if (this.windowsOpen && this.getParameter('auto_off_windows')) {
      this.setOutput('ac_power', false);
      return;
    }

    // Modo econômico: só funciona com presença
    if (this.getParameter('eco_mode') && !this.occupancyDetected) {
      this.setOutput('ac_power', false);
      return;
    }

    // Controle de temperatura
    this.controlTemperature();

    // Aprendizado de padrões
    if (this.getParameter('learning_enabled')) {
      this.learnComfortPatterns();
    }

    // Ajuste noturno
    this.applyNightMode();
  }

  /**
   * Controle PID de temperatura
   */
  private controlTemperature(): void {
    const target = this.getParameter('target_temp');
    const tolerance = this.getParameter('temp_tolerance');
    const error = target - this.currentTemperature;

    if (Math.abs(error) <= tolerance) {
      // Dentro da faixa de conforto
      this.setOutput('ac_power', false);
      return;
    }

    // Ligar AC
    this.setOutput('ac_power', true);

    // Definir modo
    if (error > 0) {
      // Precisa aquecer
      this.hvacMode = 'heat';
      this.setOutput('ac_mode', 1);
    } else {
      // Precisa resfriar
      this.hvacMode = 'cool';
      this.setOutput('ac_mode', 0);
    }

    // Ajustar velocidade do ventilador baseado no erro
    const fanSpeed = Math.min(100, Math.abs(error) * 30);
    this.setOutput('fan_speed', fanSpeed);

    // Definir temperatura do AC
    this.setOutput('ac_temp', target);
  }

  /**
   * Aprende padrões de conforto do usuário
   */
  private learnComfortPatterns(): void {
    if (!this.occupancyDetected) return;

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Registrar preferência atual
    this.comfortHistory.push({
      hour,
      temp: this.targetTemperature,
      day
    });

    // Manter apenas últimos 30 dias
    if (this.comfortHistory.length > 30 * 24) {
      this.comfortHistory.shift();
    }

    // Calcular temperatura média preferida para esta hora/dia
    const similar = this.comfortHistory.filter(
      h => h.hour === hour && h.day === day
    );

    if (similar.length >= 5) {
      const avgTemp = similar.reduce((sum, h) => sum + h.temp, 0) / similar.length;
      
      // Ajustar gradualmente para temperatura aprendida
      const learned = Math.round(avgTemp * 10) / 10;
      if (Math.abs(learned - this.getParameter('target_temp')) > 0.5) {
        this.setParameter('target_temp', learned);
        this.emit('learned_preference', { hour, day, temperature: learned });
      }
    }
  }

  /**
   * Aplica modo noturno
   */
  private applyNightMode(): void {
    const now = new Date();
    const hour = now.getHours();

    // Modo noturno: 22h às 6h
    if (hour >= 22 || hour < 6) {
      const nightTemp = this.getParameter('night_mode_temp');
      if (this.getParameter('target_temp') !== nightTemp) {
        this.setParameter('target_temp', nightTemp);
        this.emit('night_mode_activated', { temperature: nightTemp });
      }
    }
  }

  /**
   * Carrega histórico de conforto (simulado - em produção viria de BD)
   */
  private loadComfortHistory(): void {
    // Simular alguns dados históricos
    for (let i = 0; i < 100; i++) {
      this.comfortHistory.push({
        hour: Math.floor(Math.random() * 24),
        temp: 20 + Math.random() * 6,
        day: Math.floor(Math.random() * 7)
      });
    }
  }

  /**
   * API pública adicional
   */
  public setTargetTemperature(temp: number): void {
    this.setParameter('target_temp', temp);
    this.targetTemperature = temp;
  }

  public setMode(mode: 'off' | 'cool' | 'heat' | 'auto' | 'fan'): void {
    this.hvacMode = mode;
    
    if (mode === 'off') {
      this.setOutput('ac_power', false);
    } else {
      this.setOutput('ac_power', true);
      const modeMap = { cool: 0, heat: 1, auto: 2, fan: 3 };
      this.setOutput('ac_mode', modeMap[mode] || 2);
    }
  }

  public setFanSpeed(speed: 'low' | 'medium' | 'high' | 'auto'): void {
    this.fanSpeed = speed;
    const speedMap = { low: 33, medium: 66, high: 100, auto: 50 };
    this.setOutput('fan_speed', speedMap[speed]);
  }

  public getCurrentConditions(): { temp: number; humidity: number; mode: string } {
    return {
      temp: this.currentTemperature,
      humidity: this.currentHumidity,
      mode: this.hvacMode
    };
  }

  protected onInputChanged(inputId: string, value: any): void {
    console.log(`❄️ Input changed: ${inputId} = ${value}`);
    
    // Notificar mudanças importantes
    if (inputId === 'window_sensor' && value) {
      this.emit('window_opened', { message: 'Janela aberta - AC desligado' });
    }
  }

  protected onOutputChanged(outputId: string, value: any): void {
    console.log(`❄️ Output changed: ${outputId} = ${value}`);
  }

  protected onParameterChanged(parameterId: string, value: any): void {
    console.log(`❄️ Parameter changed: ${parameterId} = ${value}`);
  }
}

// ===================================================================
// Continua no próximo arquivo...
// ===================================================================

export { SmartLightingModule, SmartClimateModule };
