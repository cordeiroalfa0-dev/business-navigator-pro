import { ComponentType } from '@/types/schematic';

/**
 * Sistema de componentes industriais avançados
 * Inspirado no CADe_SIMU com melhorias
 * 
 * Suporta:
 * - Motores de passo e servomotores
 * - Cilindros pneumáticos com sensores
 * - Atuadores lineares
 * - Visualização 3D
 * - Sensores industriais 3D
 */

export interface StepperMotor {
  id: string;
  type: 'nema_17' | 'nema_23' | 'nema_34';
  position: number; // Posição atual em steps
  targetPosition: number; // Posição alvo
  speed: number; // Steps por segundo
  acceleration: number;
  stepsPerRevolution: number; // 200, 400, etc
  microstepping: number; // 1, 2, 4, 8, 16, 32
  enabled: boolean;
  direction: 'CW' | 'CCW';
  homing: boolean;
  homePosition: number;
}

export interface ServoMotor {
  id: string;
  type: 'standard' | 'continuous';
  angle: number; // 0-180 para standard, velocidade para continuous
  targetAngle: number;
  speed: number; // graus por segundo
  torque: number; // kg.cm
  enabled: boolean;
}

export interface PneumaticCylinder {
  id: string;
  type: 'single_acting' | 'double_acting';
  bore: number; // Diâmetro em mm
  stroke: number; // Curso em mm
  position: number; // Posição atual (0 = retraído, stroke = estendido)
  extending: boolean;
  retracting: boolean;
  speed: number; // mm/s
  pressure: number; // bar
  // Sensores integrados
  sensorStart: boolean; // Sensor de recuo total
  sensorEnd: boolean; // Sensor de avanço total
  sensorMid?: boolean; // Sensor intermediário (opcional)
}

export interface LinearActuator {
  id: string;
  type: 'electric_screw' | 'electric_belt' | 'electric_rack';
  stroke: number; // Curso em mm
  position: number; // Posição atual
  targetPosition: number;
  speed: number; // mm/s
  maxSpeed: number;
  acceleration: number; // mm/s²
  force: number; // N (força)
  enabled: boolean;
  homing: boolean;
  homePosition: number;
  // Limites
  limitSwitchMin: boolean;
  limitSwitchMax: boolean;
}

export interface Industrial3DSensor {
  id: string;
  type: 'inductive_3d' | 'capacitive_3d' | 'optical_3d' | 'laser_distance' | 'ultrasonic';
  position: { x: number; y: number; z: number };
  orientation: { pitch: number; yaw: number; roll: number };
  range: number; // Alcance em mm
  detectionDistance?: number; // Distância medida atual
  triggered: boolean;
  // Configurações específicas
  sensitivity?: number; // 0-100
  hysteresis?: number; // mm
  outputType: 'NPN' | 'PNP' | '4-20mA' | '0-10V';
}

export interface Component3DState {
  meshVisible: boolean;
  wireframeVisible: boolean;
  boundingBoxVisible: boolean;
  animationEnabled: boolean;
  scale: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

/**
 * Simulador de Motor de Passo
 */
export class StepperMotorSimulator {
  private motor: StepperMotor;
  private lastUpdateTime: number = 0;

  constructor(config: Partial<StepperMotor>) {
    this.motor = {
      id: config.id || 'stepper_1',
      type: config.type || 'nema_17',
      position: 0,
      targetPosition: 0,
      speed: config.speed || 200, // 200 steps/s padrão
      acceleration: config.acceleration || 1000,
      stepsPerRevolution: 200,
      microstepping: 1,
      enabled: false,
      direction: 'CW',
      homing: false,
      homePosition: 0
    };
  }

  /**
   * Atualiza simulação do motor
   */
  public update(deltaTime: number): void {
    if (!this.motor.enabled) return;

    // Homing
    if (this.motor.homing) {
      this.performHoming(deltaTime);
      return;
    }

    // Movimento para posição alvo
    if (this.motor.position !== this.motor.targetPosition) {
      this.moveToTarget(deltaTime);
    }
  }

  /**
   * Move para posição alvo com perfil de aceleração
   */
  private moveToTarget(deltaTime: number): void {
    const diff = this.motor.targetPosition - this.motor.position;
    const direction = diff > 0 ? 1 : -1;
    
    // Calcular steps a mover neste frame
    const stepsToMove = Math.min(
      Math.abs(diff),
      this.motor.speed * deltaTime / 1000
    );

    this.motor.position += stepsToMove * direction;
    this.motor.direction = direction > 0 ? 'CW' : 'CCW';
  }

  /**
   * Realiza homing (busca posição inicial)
   */
  private performHoming(deltaTime: number): void {
    // Simula movimento até sensor de home
    // Em sistema real, esperaria sinal de limite
    
    const stepsToMove = this.motor.speed * deltaTime / 1000;
    this.motor.position -= stepsToMove;

    // Simula que chegou no home após certo tempo
    if (this.motor.position <= 0) {
      this.motor.position = 0;
      this.motor.homePosition = 0;
      this.motor.homing = false;
    }
  }

  /**
   * Comandos do motor
   */
  public moveTo(position: number): void {
    this.motor.targetPosition = position;
  }

  public moveRelative(steps: number): void {
    this.motor.targetPosition = this.motor.position + steps;
  }

  public startHoming(): void {
    this.motor.homing = true;
  }

  public enable(): void {
    this.motor.enabled = true;
  }

  public disable(): void {
    this.motor.enabled = false;
  }

  public getPosition(): number {
    return this.motor.position;
  }

  public getAngle(): number {
    return (this.motor.position % this.motor.stepsPerRevolution) * 
           (360 / this.motor.stepsPerRevolution);
  }

  public getState(): StepperMotor {
    return { ...this.motor };
  }
}

/**
 * Simulador de Cilindro Pneumático
 */
export class PneumaticCylinderSimulator {
  private cylinder: PneumaticCylinder;

  constructor(config: Partial<PneumaticCylinder>) {
    this.cylinder = {
      id: config.id || 'cylinder_1',
      type: config.type || 'double_acting',
      bore: config.bore || 40,
      stroke: config.stroke || 100,
      position: 0,
      extending: false,
      retracting: false,
      speed: config.speed || 500, // 500 mm/s
      pressure: config.pressure || 6, // 6 bar
      sensorStart: true,
      sensorEnd: false
    };
  }

  /**
   * Atualiza simulação do cilindro
   */
  public update(deltaTime: number): void {
    // Estendendo
    if (this.cylinder.extending && !this.cylinder.retracting) {
      const movement = this.cylinder.speed * deltaTime / 1000;
      this.cylinder.position = Math.min(
        this.cylinder.stroke,
        this.cylinder.position + movement
      );
    }

    // Retraindo
    if (this.cylinder.retracting && !this.cylinder.extending) {
      const movement = this.cylinder.speed * deltaTime / 1000;
      this.cylinder.position = Math.max(
        0,
        this.cylinder.position - movement
      );
    }

    // Atualizar sensores
    this.updateSensors();
  }

  /**
   * Atualiza estado dos sensores
   */
  private updateSensors(): void {
    // Sensor de início (retraído)
    this.cylinder.sensorStart = this.cylinder.position <= 1;
    
    // Sensor de fim (estendido)
    this.cylinder.sensorEnd = 
      this.cylinder.position >= this.cylinder.stroke - 1;
    
    // Sensor intermediário (se existir)
    if (this.cylinder.sensorMid !== undefined) {
      const midPosition = this.cylinder.stroke / 2;
      this.cylinder.sensorMid = 
        Math.abs(this.cylinder.position - midPosition) <= 5;
    }
  }

  /**
   * Comandos do cilindro
   */
  public extend(): void {
    this.cylinder.extending = true;
    this.cylinder.retracting = false;
  }

  public retract(): void {
    this.cylinder.retracting = true;
    this.cylinder.extending = false;
  }

  public stop(): void {
    this.cylinder.extending = false;
    this.cylinder.retracting = false;
  }

  public getSensorStart(): boolean {
    return this.cylinder.sensorStart;
  }

  public getSensorEnd(): boolean {
    return this.cylinder.sensorEnd;
  }

  public getPosition(): number {
    return this.cylinder.position;
  }

  public getState(): PneumaticCylinder {
    return { ...this.cylinder };
  }
}

/**
 * Simulador de Atuador Linear Elétrico
 */
export class LinearActuatorSimulator {
  private actuator: LinearActuator;

  constructor(config: Partial<LinearActuator>) {
    this.actuator = {
      id: config.id || 'actuator_1',
      type: config.type || 'electric_screw',
      stroke: config.stroke || 300,
      position: 0,
      targetPosition: 0,
      speed: 0,
      maxSpeed: config.maxSpeed || 100, // 100 mm/s
      acceleration: config.acceleration || 500, // 500 mm/s²
      force: config.force || 1000, // 1000 N
      enabled: false,
      homing: false,
      homePosition: 0,
      limitSwitchMin: true,
      limitSwitchMax: false
    };
  }

  /**
   * Atualiza simulação do atuador
   */
  public update(deltaTime: number): void {
    if (!this.actuator.enabled) return;

    if (this.actuator.homing) {
      this.performHoming(deltaTime);
      return;
    }

    this.moveToTarget(deltaTime);
    this.updateLimitSwitches();
  }

  /**
   * Move para posição alvo com perfil trapezoidal
   */
  private moveToTarget(deltaTime: number): void {
    const error = this.actuator.targetPosition - this.actuator.position;
    
    if (Math.abs(error) < 0.1) {
      this.actuator.speed = 0;
      return;
    }

    // Acelerar ou desacelerar
    const direction = error > 0 ? 1 : -1;
    const accel = this.actuator.acceleration * deltaTime / 1000;
    
    // Distância de desaceleração
    const stopDistance = (this.actuator.speed * this.actuator.speed) / 
                        (2 * this.actuator.acceleration);

    if (Math.abs(error) <= stopDistance) {
      // Desacelerar
      this.actuator.speed = Math.max(
        0,
        this.actuator.speed - accel
      );
    } else {
      // Acelerar até velocidade máxima
      this.actuator.speed = Math.min(
        this.actuator.maxSpeed,
        this.actuator.speed + accel
      );
    }

    // Aplicar movimento
    const movement = this.actuator.speed * direction * deltaTime / 1000;
    this.actuator.position = Math.max(
      0,
      Math.min(
        this.actuator.stroke,
        this.actuator.position + movement
      )
    );
  }

  /**
   * Realiza homing
   */
  private performHoming(deltaTime: number): void {
    // Move para posição mínima
    this.actuator.targetPosition = 0;
    this.moveToTarget(deltaTime);

    if (this.actuator.position <= 0.1 && this.actuator.speed <= 0.1) {
      this.actuator.position = 0;
      this.actuator.homePosition = 0;
      this.actuator.homing = false;
    }
  }

  /**
   * Atualiza chaves de limite
   */
  private updateLimitSwitches(): void {
    this.actuator.limitSwitchMin = this.actuator.position <= 1;
    this.actuator.limitSwitchMax = 
      this.actuator.position >= this.actuator.stroke - 1;
  }

  /**
   * Comandos do atuador
   */
  public moveTo(position: number): void {
    this.actuator.targetPosition = Math.max(
      0,
      Math.min(this.actuator.stroke, position)
    );
  }

  public startHoming(): void {
    this.actuator.homing = true;
  }

  public enable(): void {
    this.actuator.enabled = true;
  }

  public disable(): void {
    this.actuator.enabled = false;
  }

  public getPosition(): number {
    return this.actuator.position;
  }

  public getState(): LinearActuator {
    return { ...this.actuator };
  }
}

/**
 * Simulador de Sensor 3D Industrial
 */
export class Industrial3DSensorSimulator {
  private sensor: Industrial3DSensor;

  constructor(config: Partial<Industrial3DSensor>) {
    this.sensor = {
      id: config.id || 'sensor_3d_1',
      type: config.type || 'laser_distance',
      position: config.position || { x: 0, y: 0, z: 0 },
      orientation: config.orientation || { pitch: 0, yaw: 0, roll: 0 },
      range: config.range || 1000, // 1000mm = 1m
      triggered: false,
      sensitivity: 50,
      hysteresis: 2,
      outputType: 'PNP'
    };
  }

  /**
   * Atualiza leitura do sensor
   */
  public update(targetPosition?: { x: number; y: number; z: number }): void {
    if (!targetPosition) {
      this.sensor.detectionDistance = undefined;
      this.sensor.triggered = false;
      return;
    }

    // Calcular distância ao alvo
    const dx = targetPosition.x - this.sensor.position.x;
    const dy = targetPosition.y - this.sensor.position.y;
    const dz = targetPosition.z - this.sensor.position.z;
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this.sensor.detectionDistance = distance;

    // Verificar se está dentro do alcance
    const threshold = this.sensor.range * (this.sensor.sensitivity || 50) / 100;
    
    // Aplicar histerese
    if (this.sensor.triggered) {
      this.sensor.triggered = distance <= (threshold + (this.sensor.hysteresis || 0));
    } else {
      this.sensor.triggered = distance <= threshold;
    }
  }

  /**
   * Obtém valor analógico (para saída 4-20mA ou 0-10V)
   */
  public getAnalogValue(): number {
    if (!this.sensor.detectionDistance) return 0;

    // Normalizar distância para 0-1
    const normalized = Math.min(1, this.sensor.detectionDistance / this.sensor.range);

    if (this.sensor.outputType === '4-20mA') {
      return 4 + (normalized * 16); // 4-20mA
    } else if (this.sensor.outputType === '0-10V') {
      return normalized * 10; // 0-10V
    }

    return normalized;
  }

  public getState(): Industrial3DSensor {
    return { ...this.sensor };
  }
}

/**
 * Factory para criar componentes avançados
 */
export function createStepperMotor(config?: Partial<StepperMotor>): StepperMotorSimulator {
  return new StepperMotorSimulator(config || {});
}

export function createPneumaticCylinder(config?: Partial<PneumaticCylinder>): PneumaticCylinderSimulator {
  return new PneumaticCylinderSimulator(config || {});
}

export function createLinearActuator(config?: Partial<LinearActuator>): LinearActuatorSimulator {
  return new LinearActuatorSimulator(config || {});
}

export function create3DSensor(config?: Partial<Industrial3DSensor>): Industrial3DSensorSimulator {
  return new Industrial3DSensorSimulator(config || {});
}
