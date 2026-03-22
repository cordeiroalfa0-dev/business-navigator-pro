# Melhorias na Simulação de Funcionamento - CAD Elétrico

## 🎯 Visão Geral das Melhorias

Este documento descreve as melhorias implementadas no sistema de simulação do CAD de circuitos elétricos, transformando-o em um simulador completo e realista de funcionamento de circuitos.

## ⚡ Novas Funcionalidades

### 1. Engine de Simulação Elétrica Completa (`electricalSimulation.ts`)

#### Características Principais:
- **Propagação de energia real**: A energia flui através do circuito seguindo as conexões
- **Análise de circuito**: Usa algoritmo BFS (Breadth-First Search) para mapear o circuito
- **Cálculos elétricos realistas**: 
  - Lei de Ohm (I = V/R)
  - Cálculo de potência (P = V × I)
  - Queda de tensão em componentes
  - Resistências específicas por tipo de componente

#### Funcionalidades Implementadas:

**a) Construção do Grafo do Circuito**
- Mapeia todas as conexões entre componentes
- Identifica terminais e junções
- Conecta automaticamente terminais internos (relés, contatores)

**b) Identificação de Fontes**
- Detecta fontes AC/DC
- Identifica fases L1, L2, L3
- Determina tensões de operação

**c) Propagação de Energia**
- Algoritmo BFS para propagar energia do source para loads
- Calcula tensão em cada nó do circuito
- Marca fios energizados
- Considera impedância de componentes

**d) Cálculo de Estado dos Componentes**
```typescript
- Lâmpadas: Brilho proporcional à tensão
- Motores: Estado de rotação
- Relés/Contatores: Estado da bobina
- Sensores: Detecção de objetos
- Chaves: Estado aberto/fechado
```

**e) Detecção de Erros**
- ⚠️ Curto-circuito (fases conectadas diretamente)
- ⚠️ Sobrecorrente (proteção de disjuntores)
- ⚠️ Falta de aterramento
- ⚠️ Desequilíbrio de fases

**f) Temporizadores**
- TON (Timer On-Delay)
- TOF (Timer Off-Delay)  
- TP (Timer Pulse)
- Contagem de tempo decorrido

### 2. Hook React de Simulação (`useElectricalSimulation.ts`)

Gerencia o ciclo de vida da simulação com:

#### Controles:
- `startSimulation()` - Inicia simulação
- `stopSimulation()` - Para e reseta
- `togglePause()` - Pausa/resume
- `changeSpeed(speed)` - Ajusta velocidade (0.1x a 10x)

#### Interações:
- `toggleSwitch(id, state)` - Aciona botoeiras/chaves
- `triggerSensor(id, triggered)` - Simula detecção de sensores
- Atualização em tempo real

#### Consultas:
- `getComponentState(id)` - Estado detalhado do componente
- `isWireEnergized(id)` - Verifica se fio está energizado
- `getMeasurements(id)` - Medições V, I, P
- `getErrors()` - Lista de erros/alertas

### 3. Painel de Controle (`SimulationControlPanel.tsx`)

Interface completa de controle com:

#### Seções:

**a) Controles Principais**
- Botões Play/Pause/Stop
- Slider de velocidade da simulação
- Status visual (pulsante quando ativo)

**b) Estatísticas do Circuito**
```
- Total de componentes
- Componentes ativos
- Fios energizados  
- Componentes em falha
```

**c) Medições Elétricas**
```
- Potência total (W)
- Corrente total (mA)
- Eficiência do circuito (%)
```

**d) Alertas e Erros**
- Lista de problemas detectados
- Código de cores por gravidade
- Mensagens descritivas

### 4. Propriedades Expandidas (`ComponentPropertiesWithSim.tsx`)

Painel lateral mostrando:

#### Informações Básicas:
- Identificação do componente
- Estado atual (Ligado/Desligado/Falha)
- Posição e rotação

#### Medições em Tempo Real:
- Tensão (V)
- Corrente (mA)
- Potência (W)

#### Estados Específicos:

**Lâmpadas:**
- Barra de brilho (0-100%)
- Indicador visual de intensidade

**Motores:**
- Status girando/parado
- Badge colorido

**Contatores/Relés:**
- Estado da bobina
- Energizada/Desenergizada

**Temporizadores:**
- Tempo decorrido
- Status ativo/inativo

#### Controles Interativos:
- Switches para acionar botoeiras
- Toggles para sensores
- Feedback visual imediato

## 🔧 Como Usar

### Integração no Projeto

1. **Importar o simulador no editor:**

```typescript
import { useElectricalSimulation } from '@/hooks/useElectricalSimulation';
import { SimulationControlPanel } from '@/components/editor/SimulationControlPanel';
import { ComponentPropertiesWithSim } from '@/components/editor/ComponentPropertiesWithSim';
```

2. **Adicionar ao componente principal:**

```typescript
const {
  simState,
  isSimulating,
  isPaused,
  simulationSpeed,
  togglePause,
  changeSpeed,
  toggleSwitch,
  triggerSensor,
  getComponentState,
  isWireEnergized,
  getErrors,
} = useElectricalSimulation(components, wires, simulationActive);
```

3. **Renderizar painéis:**

```tsx
<SimulationControlPanel
  isSimulating={isSimulating}
  isPaused={isPaused}
  simulationSpeed={simulationSpeed}
  simState={simState}
  onStart={() => setSimulationActive(true)}
  onStop={() => setSimulationActive(false)}
  onTogglePause={togglePause}
  onSpeedChange={changeSpeed}
/>
```

### Fluxo de Uso

1. **Monte o Circuito:**
   - Adicione componentes da paleta
   - Conecte com fios
   - Adicione pelo menos uma fonte de alimentação

2. **Inicie a Simulação:**
   - Clique em "Iniciar Simulação"
   - Observe lâmpadas acendendo
   - Veja fios energizados em laranja

3. **Interaja com Componentes:**
   - Selecione uma botoeira
   - Use o switch no painel de propriedades
   - Veja o efeito em tempo real

4. **Monitore o Sistema:**
   - Acompanhe estatísticas
   - Observe medições elétricas
   - Atenção para alertas

5. **Ajuste Velocidade:**
   - Use o slider (0.1x a 5x)
   - Pause para análise detalhada
   - Resume quando pronto

## 📊 Componentes Suportados

### Totalmente Simulados:
- ✅ Fontes de alimentação (AC, DC, fases)
- ✅ Lâmpadas (com brilho variável)
- ✅ Motores (mono, tri, DC)
- ✅ Contatores e relés
- ✅ Botoeiras e chaves
- ✅ Sensores (indutivo, capacitivo, óptico)
- ✅ Disjuntores e fusíveis
- ✅ Resistores e passivos
- ✅ Temporizadores

### Funcionalidades por Tipo:

#### Proteção:
- Disjuntores detectam sobrecorrente
- Fusíveis queimam em falha
- Relés térmicos protegem motores

#### Controle:
- Botoeiras NA/NF
- Contatores acionados por bobina
- Sensores detectam objetos
- Temporizadores contam tempo

#### Saídas:
- Lâmpadas variam brilho
- Motores indicam rotação
- Sirenes e buzzers ativam

## 🎨 Melhorias Visuais

### Indicadores Visuais:
- 🔴 **Vermelho**: Componente em falha
- 🟢 **Verde**: Componente ligado
- ⚪ **Cinza**: Componente desligado
- 🟡 **Amarelo**: Fio energizado
- 🟠 **Laranja**: Fio com alta corrente

### Animações:
- Pulsação em componentes ativos
- Brilho em lâmpadas acesas
- Badge animado no status
- Transições suaves

## 🚀 Próximas Melhorias Sugeridas

### Curto Prazo:
- [ ] Osciloscópio virtual
- [ ] Multímetro interativo
- [ ] Exportar dados de simulação (CSV)
- [ ] Gráficos de corrente/tensão

### Médio Prazo:
- [ ] Simulação CA (corrente alternada)
- [ ] Análise de harmônicos
- [ ] Simulação térmica
- [ ] Validação de normas (NBR, IEC)

### Longo Prazo:
- [ ] Integração com PLCs virtuais
- [ ] Simulação de automação industrial
- [ ] Biblioteca de circuitos prontos
- [ ] Modo tutorial interativo

## 🐛 Troubleshooting

### Simulação não inicia:
- Verifique se há fonte de alimentação
- Confira se os componentes estão conectados
- Veja console do navegador para erros

### Componentes não ligam:
- Verifique tensão mínima
- Confira continuidade do circuito
- Veja painel de erros

### Performance lenta:
- Reduza velocidade da simulação
- Simplifique circuito complexo
- Verifique loops infinitos

## 📚 Referências Técnicas

### Algoritmos Utilizados:
- BFS (Breadth-First Search) para propagação
- Lei de Ohm para cálculos
- Análise nodal simplificada
- Detecção de ciclos

### Padrões de Código:
- React Hooks para estado
- TypeScript para type safety
- Map/Set para performance
- Callbacks para otimização

## 🤝 Contribuindo

Para adicionar novos componentes:

1. Adicionar tipo em `schematic.ts`
2. Implementar lógica em `electricalSimulation.ts`
3. Adicionar desenho em `componentShapes.ts`
4. Documentar comportamento

## 📄 Licença

Parte do projeto CAD de Simulação Elétrica.

---

**Desenvolvido com ⚡ para educação e prototipagem de circuitos elétricos**
