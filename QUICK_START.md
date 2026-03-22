# 🚀 Guia de Instalação Rápida - Simulação Melhorada

## ⚡ O que foi melhorado?

Este projeto agora inclui um **sistema completo de simulação elétrica** que transforma seu CAD de circuitos em um simulador funcional e realista!

### Principais Melhorias:
- ✅ **Simulação em tempo real** com propagação de energia
- ✅ **Lâmpadas acendem** e variam brilho conforme tensão
- ✅ **Motores giram** quando energizados
- ✅ **Fios energizados** ficam laranja
- ✅ **Botoeiras e sensores interativos**
- ✅ **Medições elétricas** (V, I, P) em tempo real
- ✅ **Detecção de erros** (curto-circuito, sobrecorrente, etc)
- ✅ **Controle de velocidade** da simulação
- ✅ **Painel de estatísticas** completo

## 📦 Novos Arquivos Criados

```
src/
├── lib/
│   └── electricalSimulation.ts          # Engine de simulação elétrica
├── hooks/
│   └── useElectricalSimulation.ts       # Hook React para simulação
├── components/editor/
│   ├── SimulationControlPanel.tsx       # Painel de controle
│   └── ComponentPropertiesWithSim.tsx   # Propriedades expandidas
└── pages/
    └── IntegratedSchematicEditor.tsx    # Exemplo de integração

docs/
└── SIMULATION_IMPROVEMENTS.md           # Documentação completa
```

## 🔧 Instalação

### Opção 1: Substituir arquivo principal (Recomendado)

```bash
# 1. Substitua o arquivo Index.tsx atual
cp src/pages/IntegratedSchematicEditor.tsx src/pages/Index.tsx

# 2. Instale dependências (se necessário)
npm install

# 3. Execute o projeto
npm run dev
```

### Opção 2: Integração manual

Se preferir manter seu código atual e adicionar as funcionalidades:

1. **Adicione os novos arquivos:**
   - Copie `electricalSimulation.ts` para `src/lib/`
   - Copie `useElectricalSimulation.ts` para `src/hooks/`
   - Copie `SimulationControlPanel.tsx` para `src/components/editor/`
   - Copie `ComponentPropertiesWithSim.tsx` para `src/components/editor/`

2. **Integre no seu Index.tsx:**

```typescript
import { useElectricalSimulation } from '@/hooks/useElectricalSimulation';
import { SimulationControlPanel } from '@/components/editor/SimulationControlPanel';
import { ComponentPropertiesWithSim } from '@/components/editor/ComponentPropertiesWithSim';

// No seu componente:
const {
  simState,
  isSimulating,
  getComponentState,
  isWireEnergized,
  toggleSwitch,
  // ... outros métodos
} = useElectricalSimulation(components, wires, simulationActive);
```

3. **Aplique estados aos componentes:**

```typescript
const componentsWithSimState = components.map(comp => ({
  ...comp,
  simState: simState?.componentStates.get(comp.id)?.state
}));

const wiresWithEnergization = wires.map(wire => ({
  ...wire,
  energized: isWireEnergized(wire.id)
}));
```

## 🎮 Como Usar

### 1. Monte seu primeiro circuito

```
┌─────────────┐
│  Fonte DC   │
│   (24V)     │
└──────┬──────┘
       │
   ┌───┴───┐
   │ Bot. NA│  ← Botoeira Normalmente Aberta
   └───┬───┘
       │
   ┌───┴───┐
   │Lâmpada│
   └───┬───┘
       │
   ┌───┴───┐
   │ Terra │
   └───────┘
```

### 2. Passos básicos

1. **Adicionar componentes:**
   - Clique na paleta esquerda
   - Clique no canvas para posicionar
   - Use a ferramenta "Fio" para conectar

2. **Iniciar simulação:**
   - Botão "Iniciar Simulação" no painel direito
   - OU use o botão ⚡ na toolbar superior

3. **Interagir:**
   - Selecione uma botoeira
   - Use o switch no painel de propriedades
   - Veja a lâmpada acender!

4. **Monitorar:**
   - Acompanhe tensão, corrente e potência
   - Veja estatísticas gerais
   - Observe alertas de erro

### 3. Circuitos de exemplo

#### Circuito básico liga/desliga:
- Fonte DC + Botoeira NA + Lâmpada + Terra

#### Controle com contator:
- Fonte AC + Botoeira NA → Bobina Contator
- Contator NA + Lâmpada

#### Partida direta de motor:
- Fases L1, L2, L3
- Disjuntor tripolar
- Contator + Relé térmico
- Motor trifásico
- Terra

## 🎨 Recursos Visuais

### Cores dos Componentes:
- 🟢 **Verde**: Componente ligado
- ⚪ **Branco/Cinza**: Componente desligado  
- 🔴 **Vermelho**: Componente em falha
- 🟡 **Amarelo**: Fio normal
- 🟠 **Laranja**: Fio energizado

### Efeitos Especiais:
- Lâmpadas têm efeito de brilho (glow)
- Badge de status pulsa quando simulação ativa
- Barras de progresso para brilho e temporizadores
- Alertas coloridos por gravidade

## ⚙️ Configurações da Simulação

### Velocidade:
- **0.1x** - Câmera lenta (análise detalhada)
- **1x** - Velocidade normal (padrão)
- **2x** - 2x mais rápido
- **5x** - 5x mais rápido (debug rápido)

### Controles:
- **Play** - Iniciar/Retomar
- **Pause** - Pausar (mantém estado)
- **Stop** - Parar (reseta tudo)

## 🐛 Resolução de Problemas

### "Componentes não ligam"
✅ Verifique se há fonte de alimentação  
✅ Confira se os fios estão conectados corretamente  
✅ Veja se há tensão mínima necessária  
✅ Consulte o painel de erros  

### "Curto-circuito detectado"
⚠️ Duas fases conectadas diretamente  
⚠️ Use disjuntores/fusíveis de proteção  
⚠️ Revise as conexões  

### "Performance lenta"
🔧 Reduza a velocidade da simulação  
🔧 Simplifique circuitos muito complexos  
🔧 Feche outras abas do navegador  

## 📚 Documentação Completa

Leia `SIMULATION_IMPROVEMENTS.md` para:
- Detalhes técnicos da implementação
- Lista completa de componentes suportados
- API completa dos hooks
- Exemplos avançados
- Roadmap de features futuras

## 🎓 Tutorial Rápido (5 minutos)

1. **Abra o projeto:** `npm run dev`

2. **Crie circuito simples:**
   - Fonte DC → Botoeira NA → Lâmpada → Terra

3. **Conecte tudo com fios**

4. **Clique em "Iniciar Simulação"**

5. **Selecione a botoeira**

6. **Ative o switch no painel direito**

7. **🎉 Veja a lâmpada acender!**

## 🌟 Próximos Passos

Depois de dominar o básico:

1. ✅ Experimente motores trifásicos
2. ✅ Monte circuitos com contatores
3. ✅ Use temporizadores (TON, TOF)
4. ✅ Teste sensores e automação
5. ✅ Crie circuitos de partida de motor
6. ✅ Implemente intertravamento

## 💡 Dicas Pro

- Use **Ctrl+Z** para desfazer
- **Scroll** no canvas para zoom
- **Alt+Click** para pan (arrastar view)
- **R** para rotacionar componente selecionado
- **Delete** para apagar selecionado
- Salve projetos frequentemente!

## 🤝 Suporte

Problemas ou dúvidas?
- Leia a documentação completa em `SIMULATION_IMPROVEMENTS.md`
- Verifique o console do navegador (F12)
- Revise os exemplos em `IntegratedSchematicEditor.tsx`

## 🎊 Divirta-se Simulando!

Agora você tem um simulador elétrico completo nas mãos. 
Monte circuitos, aprenda conceitos elétricos e protipe suas ideias!

**Happy Simulating! ⚡🔌💡**
