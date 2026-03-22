/**
 * ===================================================================
 * CONTROLADOR CENTRAL DE AUTOMAÇÃO RESIDENCIAL
 * ===================================================================
 * 
 * Sistema de orquestração de todos os módulos
 * Gerencia cenas, rotinas, integrações e dashboard
 */

import { EventEmitter } from 'events';
import { HomeAutomationModule, Scene, Schedule, UserPreferences } from './homeAutomationCLP';

export class HomeAutomationController extends EventEmitter {
  private modules: Map<string, HomeAutomationModule> = new Map();
  private scenes: Map<string, Scene> = new Map();
  private schedules: Map<string, Schedule> = new Map();
  private routines: Map<string, Routine> = new Map();
  private userPreferences: UserPreferences | null = null;
  private isRunning: boolean = false;
  private dashboardData: DashboardData;

  constructor() {
    super();
    this.dashboardData = this.initializeDashboard();
  }

  /**
   * Adiciona um módulo ao sistema
   */
  public addModule(module: HomeAutomationModule): void {
    const config = module.getState().config;
    this.modules.set(config.id, module);
    
    // Inscrever em eventos do módulo
    module.on('updated', (state) => this.onModuleUpdated(config.id, state));
    module.on('error', (error) => this.onModuleError(config.id, error));
    
    this.emit('module_added', { moduleId: config.id, name: config.name });
    console.log(`✅ Módulo adicionado: ${config.name}`);
  }

  /**
   * Remove um módulo
   */
  public removeModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (module) {
      module.stop();
      this.modules.delete(moduleId);
      this.emit('module_removed', { moduleId });
    }
  }

  /**
   * Inicia o sistema completo
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Iniciar todos os módulos
    this.modules.forEach(module => {
      module.start();
    });
    
    // Iniciar processamento de cenas e rotinas
    this.startSceneProcessor();
    this.startScheduleProcessor();
    this.startRoutineProcessor();
    
    // Iniciar dashboard
    this.startDashboardUpdates();
    
    this.emit('system_started');
    console.log('🏠 Sistema de Automação Residencial Iniciado!');
  }

  /**
   * Para o sistema
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Parar todos os módulos
    this.modules.forEach(module => {
      module.stop();
    });
    
    // Parar processadores
    if (this.sceneProcessorInterval) {
      clearInterval(this.sceneProcessorInterval);
    }
    if (this.scheduleProcessorInterval) {
      clearInterval(this.scheduleProcessorInterval);
    }
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
    }
    
    this.emit('system_stopped');
    console.log('🏠 Sistema de Automação Parado');
  }

  /**
   * Cria uma cena
   */
  public createScene(scene: Scene): void {
    this.scenes.set(scene.id, scene);
    this.emit('scene_created', { sceneId: scene.id, name: scene.name });
  }

  /**
   * Ativa uma cena
   */
  public async activateScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene || !scene.enabled) {
      throw new Error(`Scene ${sceneId} not found or disabled`);
    }

    console.log(`🎬 Ativando cena: ${scene.name}`);
    
    // Verificar condições
    if (scene.conditions) {
      const conditionsMet = this.checkConditions(scene.conditions);
      if (!conditionsMet) {
        console.log(`⚠️ Condições não atendidas para cena ${scene.name}`);
        return;
      }
    }

    // Executar ações
    for (const action of scene.actions) {
      const module = this.modules.get(action.moduleId);
      if (!module) continue;

      // Aplicar delay se especificado
      if (action.delay) {
        await this.sleep(action.delay);
      }

      // Executar ação com transição se especificada
      module.setOutput(action.outputId, action.value, action.transition);
    }

    this.emit('scene_activated', { sceneId, name: scene.name });
  }

  /**
   * Cria uma agenda
   */
  public createSchedule(schedule: Schedule): void {
    this.schedules.set(schedule.id, schedule);
    this.emit('schedule_created', { scheduleId: schedule.id });
  }

  /**
   * Cria uma rotina
   */
  public createRoutine(routine: Routine): void {
    this.routines.set(routine.id, routine);
    this.emit('routine_created', { routineId: routine.id });
  }

  /**
   * Define preferências do usuário
   */
  public setUserPreferences(prefs: UserPreferences): void {
    this.userPreferences = prefs;
    
    // Aplicar preferências aos módulos
    this.applyUserPreferences();
    
    this.emit('preferences_updated', prefs);
  }

  /**
   * Obtém dashboard com dados de todos os módulos
   */
  public getDashboard(): DashboardData {
    this.updateDashboard();
    return this.dashboardData;
  }

  /**
   * Obtém estado completo do sistema
   */
  public getSystemState(): SystemState {
    return {
      running: this.isRunning,
      modules: Array.from(this.modules.values()).map(m => m.getState()),
      scenes: Array.from(this.scenes.values()),
      schedules: Array.from(this.schedules.values()),
      routines: Array.from(this.routines.values()),
      preferences: this.userPreferences,
      dashboard: this.dashboardData
    };
  }

  /**
   * Processamento de cenas com triggers
   */
  private sceneProcessorInterval?: NodeJS.Timeout;
  
  private startSceneProcessor(): void {
    this.sceneProcessorInterval = setInterval(() => {
      this.scenes.forEach(scene => {
        if (!scene.enabled || !scene.triggers) return;
        
        scene.triggers.forEach(trigger => {
          if (this.checkTrigger(trigger)) {
            this.activateScene(scene.id);
          }
        });
      });
    }, 1000);
  }

  /**
   * Processamento de agendas
   */
  private scheduleProcessorInterval?: NodeJS.Timeout;
  
  private startScheduleProcessor(): void {
    this.scheduleProcessorInterval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      this.schedules.forEach(schedule => {
        if (!schedule.enabled) return;
        
        // Verificar dia e hora
        if (schedule.days.includes(currentDay) && schedule.time === currentTime) {
          this.activateScene(schedule.sceneId);
          
          if (!schedule.repeat) {
            schedule.enabled = false;
          }
        }
      });
    }, 60000); // Verificar a cada minuto
  }

  /**
   * Processamento de rotinas inteligentes
   */
  private startRoutineProcessor(): void {
    setInterval(() => {
      this.routines.forEach(routine => {
        if (!routine.enabled) return;
        
        // Executar lógica da rotina
        this.executeRoutine(routine);
      });
    }, 5000);
  }

  /**
   * Executa uma rotina
   */
  private executeRoutine(routine: Routine): void {
    switch (routine.type) {
      case 'wake_up':
        this.executeWakeUpRoutine(routine);
        break;
      case 'good_night':
        this.executeGoodNightRoutine(routine);
        break;
      case 'leaving_home':
        this.executeLeavingHomeRoutine(routine);
        break;
      case 'arriving_home':
        this.executeArrivingHomeRoutine(routine);
        break;
      case 'energy_saving':
        this.executeEnergySavingRoutine(routine);
        break;
    }
  }

  private executeWakeUpRoutine(routine: Routine): void {
    const now = new Date();
    const wakeTime = this.userPreferences?.wakeUpTime || '07:00';
    const [hours, minutes] = wakeTime.split(':').map(Number);
    
    if (now.getHours() === hours && now.getMinutes() === minutes) {
      // Acender luzes gradualmente
      this.activateScene('wake_up_scene');
      // Subir persianas
      // Ligar aquecedor se frio
      // Iniciar playlist
      
      this.emit('routine_executed', { routineId: routine.id, type: 'wake_up' });
    }
  }

  private executeGoodNightRoutine(routine: Routine): void {
    const now = new Date();
    const sleepTime = this.userPreferences?.sleepTime || '23:00';
    const [hours, minutes] = sleepTime.split(':').map(Number);
    
    if (now.getHours() === hours && now.getMinutes() === minutes) {
      // Apagar luzes
      this.activateScene('good_night_scene');
      // Descer persianas
      // Armar alarme
      // Ajustar temperatura
      
      this.emit('routine_executed', { routineId: routine.id, type: 'good_night' });
    }
  }

  private executeLeavingHomeRoutine(routine: Routine): void {
    // Detectar saída por geofencing ou sensores
    // Desligar luzes, AC
    // Armar alarme
    // Fechar persianas
  }

  private executeArrivingHomeRoutine(routine: Routine): void {
    // Detectar chegada
    // Ligar luzes de entrada
    // Ajustar temperatura
    // Desarmar alarme
  }

  private executeEnergySavingRoutine(routine: Routine): void {
    // Monitorar consumo
    // Desligar cargas não essenciais
    // Usar bateria durante pico
  }

  /**
   * Verifica condições de uma cena
   */
  private checkConditions(conditions: any[]): boolean {
    return conditions.every(condition => {
      const module = this.modules.get(condition.moduleId);
      if (!module) return false;
      
      const value = module.getInput(condition.inputId) || module.getOutput(condition.outputId);
      
      switch (condition.operator) {
        case '>': return value > condition.value;
        case '<': return value < condition.value;
        case '=': return value === condition.value;
        case '!=': return value !== condition.value;
        case '>=': return value >= condition.value;
        case '<=': return value <= condition.value;
        default: return false;
      }
    });
  }

  /**
   * Verifica trigger de uma cena
   */
  private checkTrigger(trigger: any): boolean {
    const now = new Date();
    
    switch (trigger.type) {
      case 'time':
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return currentTime === trigger.config.time;
        
      case 'sunrise':
        // Calcular horário do nascer do sol
        // Simplificado: 06:00
        return now.getHours() === 6 && now.getMinutes() === 0;
        
      case 'sunset':
        // Calcular horário do pôr do sol
        // Simplificado: 18:00
        return now.getHours() === 18 && now.getMinutes() === 0;
        
      case 'sensor':
        const module = this.modules.get(trigger.config.moduleId);
        if (!module) return false;
        const value = module.getInput(trigger.config.inputId);
        return value === trigger.config.value;
        
      default:
        return false;
    }
  }

  /**
   * Aplica preferências do usuário aos módulos
   */
  private applyUserPreferences(): void {
    if (!this.userPreferences) return;
    
    // Aplicar temperatura de conforto ao módulo de climatização
    const climateModule = Array.from(this.modules.values()).find(
      m => m.getState().config.category === 'climate'
    );
    
    if (climateModule) {
      climateModule.setParameter('target_temp', this.userPreferences.comfortTemperature);
    }
    
    // Aplicar preferência de iluminação
    const lightingModule = Array.from(this.modules.values()).find(
      m => m.getState().config.category === 'lighting'
    );
    
    if (lightingModule) {
      // Configurar temperatura de cor baseada em preferência
    }
  }

  /**
   * Atualiza dashboard
   */
  private dashboardInterval?: NodeJS.Timeout;
  
  private startDashboardUpdates(): void {
    this.dashboardInterval = setInterval(() => {
      this.updateDashboard();
      this.emit('dashboard_updated', this.dashboardData);
    }, 1000);
  }

  private updateDashboard(): void {
    // Agregar dados de todos os módulos
    let totalPower = 0;
    let activeDevices = 0;
    let criticalAlerts = 0;
    
    this.modules.forEach(module => {
      const state = module.getState();
      
      // Contar dispositivos ativos
      state.outputs.forEach(output => {
        if (output.value) activeDevices++;
      });
      
      // Somar consumo de energia
      totalPower += state.config.powerConsumption;
      
      // Contar erros
      if (state.statistics.errors > 0) criticalAlerts++;
    });
    
    this.dashboardData.summary = {
      totalModules: this.modules.size,
      activeDevices,
      totalPower,
      criticalAlerts,
      systemHealth: criticalAlerts === 0 ? 'healthy' : 'warning'
    };
    
    this.dashboardData.lastUpdate = Date.now();
  }

  private initializeDashboard(): DashboardData {
    return {
      summary: {
        totalModules: 0,
        activeDevices: 0,
        totalPower: 0,
        criticalAlerts: 0,
        systemHealth: 'healthy'
      },
      quickActions: [
        { id: 'all_lights_off', name: 'Apagar Todas as Luzes', icon: 'lightbulb-off' },
        { id: 'arm_security', name: 'Armar Segurança', icon: 'shield' },
        { id: 'eco_mode', name: 'Modo Econômico', icon: 'leaf' },
        { id: 'comfort_mode', name: 'Modo Conforto', icon: 'home' }
      ],
      favoriteScenes: [],
      recentEvents: [],
      lastUpdate: Date.now()
    };
  }

  /**
   * Eventos dos módulos
   */
  private onModuleUpdated(moduleId: string, state: any): void {
    // Processar atualização
    this.emit('module_state_changed', { moduleId, state });
  }

  private onModuleError(moduleId: string, error: any): void {
    console.error(`❌ Erro no módulo ${moduleId}:`, error);
    
    this.dashboardData.recentEvents.unshift({
      timestamp: Date.now(),
      type: 'error',
      moduleId,
      message: error.message || 'Erro desconhecido'
    });
    
    // Manter apenas últimos 50 eventos
    this.dashboardData.recentEvents = this.dashboardData.recentEvents.slice(0, 50);
    
    this.emit('module_error', { moduleId, error });
  }

  /**
   * Utilitários
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * API de Integração com Assistentes de Voz
   */
  public processVoiceCommand(command: string): VoiceResponse {
    const cmd = command.toLowerCase();
    
    // Comandos de iluminação
    if (cmd.includes('acender') || cmd.includes('ligar') && cmd.includes('luz')) {
      return {
        success: true,
        message: 'Ligando luzes',
        action: () => this.activateScene('lights_on')
      };
    }
    
    if (cmd.includes('apagar') && cmd.includes('luz')) {
      return {
        success: true,
        message: 'Apagando luzes',
        action: () => this.activateScene('lights_off')
      };
    }
    
    // Comandos de segurança
    if (cmd.includes('armar') && cmd.includes('alarme')) {
      return {
        success: true,
        message: 'Armando sistema de segurança',
        action: () => {
          const securityModule = Array.from(this.modules.values()).find(
            m => m.getState().config.category === 'security'
          );
          if (securityModule && 'armAlarm' in securityModule) {
            (securityModule as any).armAlarm('away');
          }
        }
      };
    }
    
    // Comandos de temperatura
    if (cmd.includes('temperatura')) {
      const match = cmd.match(/(\d+)\s*graus?/);
      if (match) {
        const temp = parseInt(match[1]);
        return {
          success: true,
          message: `Ajustando temperatura para ${temp}°C`,
          action: () => {
            const climateModule = Array.from(this.modules.values()).find(
              m => m.getState().config.category === 'climate'
            );
            if (climateModule && 'setTargetTemperature' in climateModule) {
              (climateModule as any).setTargetTemperature(temp);
            }
          }
        };
      }
    }
    
    // Comandos de cena
    if (cmd.includes('ativar') || cmd.includes('cena')) {
      // Procurar cena por nome
      const scene = Array.from(this.scenes.values()).find(
        s => cmd.includes(s.name.toLowerCase())
      );
      
      if (scene) {
        return {
          success: true,
          message: `Ativando cena ${scene.name}`,
          action: () => this.activateScene(scene.id)
        };
      }
    }
    
    return {
      success: false,
      message: 'Comando não reconhecido',
      action: () => {}
    };
  }
}

// ===================================================================
// INTERFACES
// ===================================================================

export interface Routine {
  id: string;
  name: string;
  type: 'wake_up' | 'good_night' | 'leaving_home' | 'arriving_home' | 'energy_saving' | 'custom';
  enabled: boolean;
  triggers: any[];
  actions: any[];
}

export interface DashboardData {
  summary: {
    totalModules: number;
    activeDevices: number;
    totalPower: number;
    criticalAlerts: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  quickActions: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  favoriteScenes: Scene[];
  recentEvents: Array<{
    timestamp: number;
    type: string;
    moduleId: string;
    message: string;
  }>;
  lastUpdate: number;
}

export interface SystemState {
  running: boolean;
  modules: any[];
  scenes: Scene[];
  schedules: Schedule[];
  routines: Routine[];
  preferences: UserPreferences | null;
  dashboard: DashboardData;
}

export interface VoiceResponse {
  success: boolean;
  message: string;
  action: () => void;
}

// ===================================================================
// CENAS PRÉ-DEFINIDAS
// ===================================================================

export function createDefaultScenes(): Scene[] {
  return [
    {
      id: 'good_morning',
      name: 'Bom Dia',
      icon: 'sun-rise',
      description: 'Rotina matinal: acende luzes, sobe persianas, liga cafeteira',
      actions: [
        { moduleId: 'lighting_001', outputId: 'main_light', value: 60, transition: 3000 },
        { moduleId: 'shades_001', outputId: 'living_room', value: 100, transition: 5000 },
        { moduleId: 'appliances_001', outputId: 'coffee_maker', value: true }
      ],
      triggers: [
        { type: 'time', config: { time: '07:00' } }
      ],
      enabled: true,
      priority: 1
    },
    {
      id: 'movie_time',
      name: 'Cinema em Casa',
      icon: 'film',
      description: 'Escurece ambiente, liga TV e sistema de som',
      actions: [
        { moduleId: 'lighting_001', outputId: 'main_light', value: 0, transition: 2000 },
        { moduleId: 'lighting_001', outputId: 'accent_light', value: 20, transition: 2000 },
        { moduleId: 'multimedia_001', outputId: 'tv', value: true },
        { moduleId: 'multimedia_001', outputId: 'soundbar', value: true }
      ],
      enabled: true,
      priority: 2
    },
    {
      id: 'romantic_dinner',
      name: 'Jantar Romântico',
      icon: 'heart',
      description: 'Iluminação suave, música ambiente',
      actions: [
        { moduleId: 'lighting_001', outputId: 'main_light', value: 30, transition: 5000 },
        { moduleId: 'lighting_001', outputId: 'rgb_strip', value: { r: 255, g: 100, b: 100 }, transition: 3000 },
        { moduleId: 'multimedia_001', outputId: 'spotify', value: 'romantic_playlist' }
      ],
      enabled: true,
      priority: 3
    },
    {
      id: 'away_mode',
      name: 'Modo Ausência',
      icon: 'home-off',
      description: 'Simula presença, arma segurança, economiza energia',
      actions: [
        { moduleId: 'security_001', outputId: 'arm_alarm', value: 'away' },
        { moduleId: 'climate_001', outputId: 'ac_power', value: false },
        { moduleId: 'lighting_001', outputId: 'simulate_presence', value: true }
      ],
      triggers: [
        { type: 'geofence', config: { radius: 1000, leaving: true } }
      ],
      enabled: true,
      priority: 1
    }
  ];
}

export { HomeAutomationController };
