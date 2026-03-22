# 📚 Biblioteca de Circuitos de Exemplo

Copie e cole estes exemplos para testar rapidamente a simulação!

## 🔰 Nível Iniciante

### 1. Circuito Básico - Liga/Desliga

**O que faz:** Lâmpada controlada por botoeira  
**Aprenda:** Conexões básicas, botoeiras NA

```json
{
  "components": [
    {
      "id": "fonte_1",
      "type": "fonte_dc",
      "position": { "x": 100, "y": 100 },
      "rotation": 0,
      "label": "24V DC",
      "terminals": [
        { "id": "t1", "position": { "x": 0, "y": -40 }, "connected": false },
        { "id": "t2", "position": { "x": 0, "y": 40 }, "connected": false }
      ],
      "properties": {}
    },
    {
      "id": "bot_1",
      "type": "botoeira_na",
      "position": { "x": 100, "y": 200 },
      "rotation": 0,
      "label": "S1 - Liga",
      "terminals": [
        { "id": "t1", "position": { "x": 0, "y": -40 }, "connected": false },
        { "id": "t2", "position": { "x": 0, "y": 40 }, "connected": false }
      ],
      "properties": { "closed": "false" }
    },
    {
      "id": "lamp_1",
      "type": "lampada",
      "position": { "x": 100, "y": 300 },
      "rotation": 0,
      "label": "H1",
      "terminals": [
        { "id": "t1", "position": { "x": 0, "y": -40 }, "connected": false },
        { "id": "t2", "position": { "x": 0, "y": 40 }, "connected": false }
      ],
      "properties": {}
    },
    {
      "id": "terra_1",
      "type": "terra",
      "position": { "x": 100, "y": 400 },
      "rotation": 0,
      "label": "GND",
      "terminals": [
        { "id": "t1", "position": { "x": 0, "y": -40 }, "connected": false }
      ],
      "properties": {}
    }
  ],
  "wires": [
    {
      "id": "wire_1",
      "points": [
        { "x": 100, "y": 140 },
        { "x": 100, "y": 160 }
      ],
      "startTerminalId": "fonte_1_t2",
      "endTerminalId": "bot_1_t1"
    },
    {
      "id": "wire_2",
      "points": [
        { "x": 100, "y": 240 },
        { "x": 100, "y": 260 }
      ],
      "startTerminalId": "bot_1_t2",
      "endTerminalId": "lamp_1_t1"
    },
    {
      "id": "wire_3",
      "points": [
        { "x": 100, "y": 340 },
        { "x": 100, "y": 360 }
      ],
      "startTerminalId": "lamp_1_t2",
      "endTerminalId": "terra_1_t1"
    }
  ],
  "version": "1.0"
}
```

**Como usar:**
1. Salve em arquivo `circuito_basico.json`
2. Use botão "Carregar" no editor
3. Inicie simulação
4. Selecione S1 e ative o switch

---

### 2. Semáforo Simples

**O que faz:** Três lâmpadas (vermelho, amarelo, verde)  
**Aprenda:** Múltiplas saídas, controle independente

**Componentes necessários:**
- 1x Fonte DC (24V)
- 3x Botoeiras NA (S1, S2, S3)
- 1x Lâmpada Vermelha
- 1x Lâmpada Amarela
- 1x Lâmpada Verde
- 1x Terra

**Circuito:**
```
        Fonte DC (24V)
             |
      -------+-------+-------
      |      |       |
     S1     S2      S3    (Botoeiras)
      |      |       |
     Red   Yellow  Green  (Lâmpadas)
      |      |       |
      -------+-------+-------
             |
           Terra
```

**Operação:**
- Pressione S1 → Vermelho acende
- Pressione S2 → Amarelo acende
- Pressione S3 → Verde acende

---

## 🎓 Nível Intermediário

### 3. Motor com Contator

**O que faz:** Partida direta de motor monofásico  
**Aprenda:** Contatores, bobinas, contatos auxiliares

**Componentes:**
- Fase L1 (220V)
- Neutro
- Terra
- Disjuntor monopolar (Q1)
- Botoeira NA (S1 - Liga)
- Botoeira NF (S2 - Desliga)
- Bobina Contator (K1)
- Contato NA do contator (K1)
- Motor monofásico (M1)

**Circuito de Comando:**
```
L1 → Q1 → S2(NF) → S1(NA) → K1(bobina) → N
                      |
                      +---→ K1(contato auxiliar NA) ---+
                                                       |
                                                    (selo)
```

**Circuito de Força:**
```
L1 → K1(contato NA) → M1 → N
                      |
                      +→ Terra
```

**Operação:**
1. Pressione S1 → K1 energiza → contato fecha → motor liga
2. Contato auxiliar K1 mantém bobina energizada (selo)
3. Pressione S2 → abre circuito → K1 desenergiza → motor para

---

### 4. Sensor com Sinalização

**O que faz:** Sensor aciona lâmpada quando detecta objeto  
**Aprenda:** Sensores, automação básica

**Componentes:**
- Fonte DC 24V
- Sensor Indutivo (B1)
- Lâmpada Verde (sinal OK)
- Lâmpada Vermelha (objeto detectado)
- Terra

**Circuito:**
```
     Fonte 24V
         |
    +----+----+
    |         |
   B1(NO)    |
    |         |
  Verde     Verm
    |         |
  Terra     Terra
```

**Operação:**
- Sem objeto: Lâmpada verde acesa
- Com objeto: Sensor fecha → Verde apaga → Vermelha acende

---

## 🏆 Nível Avançado

### 5. Partida Estrela-Triângulo

**O que faz:** Partida suave de motor trifásico  
**Aprenda:** Circuitos industriais, temporizadores, intertravamento

**Componentes:**
- Fases L1, L2, L3
- Neutro
- Terra
- Disjuntor tripolar (Q1)
- Botão Liga (S1 - NA)
- Botão Desliga (S2 - NF)
- 3x Contatores (K1-principal, K2-estrela, K3-triângulo)
- Relé térmico (F1)
- Temporizador TON (K4)
- Motor trifásico (M1)
- Lâmpadas sinalizadoras

**Sequência:**
1. Pressiona S1
2. K1 e K2 energizam (configuração estrela)
3. Motor parte com corrente reduzida
4. Após tempo T, K4 ativa
5. K2 desliga, K3 liga (configuração triângulo)
6. Motor opera em potência máxima

---

### 6. Esteira Transportadora Automática

**O que faz:** Sistema completo de automação industrial  
**Aprenda:** Lógica de automação, sensores múltiplos

**Componentes:**
- Fonte 24V
- 2x Sensores ópticos (início e fim da esteira)
- 1x Sensor indutivo (detector de metal)
- Motor DC (esteira)
- Solenoide (desviador)
- 3x Lâmpadas (verde=ok, amarelo=processando, vermelho=metal)
- Buzzer (alarme)

**Lógica:**
```
Se sensor início detecta:
  → Liga motor
  → Liga luz amarela
  
Se sensor fim detecta:
  → Para motor
  → Apaga luz amarela
  → Liga luz verde (3s)
  
Se sensor metal detecta:
  → Aciona solenoide (desvia peça)
  → Liga luz vermelha
  → Toca buzzer
  → Conta peças metálicas
```

---

## 🔧 Circuitos de Teste e Debug

### 7. Teste de Componentes

Circuito para testar cada tipo de componente individualmente:

```
Fonte → Componente a testar → Terra
```

Use para:
- Verificar consumo de corrente
- Testar brilho de lâmpadas
- Validar sensores
- Calibrar temporizadores

---

### 8. Medidor Virtual

**O que faz:** Demonstra medições elétricas em diferentes pontos

**Setup:**
- Fonte DC 24V
- Resistor 100Ω (R1)
- Resistor 220Ω (R2)
- Lâmpada
- Terra

**Pontos de medição:**
1. Antes de R1: 24V
2. Entre R1 e R2: ~16V
3. Antes da lâmpada: ~12V
4. Corrente calculada em cada ponto

---

## 💡 Dicas para Criar Seus Circuitos

### Boas Práticas:

1. **Sempre use proteção:**
   - Adicione disjuntores
   - Use fusíveis
   - Relés térmicos para motores

2. **Aterramento adequado:**
   - Motores devem ter terra
   - Carcaças metálicas aterradas

3. **Sinalização clara:**
   - Verde: Sistema OK
   - Amarelo: Em operação
   - Vermelho: Alarme/Erro

4. **Intertravamento:**
   - Contatores estrela/triângulo não podem atuar juntos
   - Use contatos NF para segurança

5. **Documentação:**
   - Nomeie componentes claramente (S1, K1, M1)
   - Use labels descritivos

### Checklist antes de simular:

- [ ] Há pelo menos uma fonte de alimentação?
- [ ] Todos os componentes estão conectados?
- [ ] Terra está presente onde necessário?
- [ ] Proteções estão dimensionadas?
- [ ] Não há curto-circuito óbvio?

---

## 📖 Como Importar Exemplos

1. **Via arquivo JSON:**
   ```bash
   - Clique em "Carregar" na toolbar
   - Selecione o arquivo .json
   - Circuito é carregado automaticamente
   ```

2. **Copiar/Colar:**
   ```bash
   - Copie o JSON acima
   - Cole em editor de texto
   - Salve como .json
   - Carregue no editor
   ```

3. **Recriar manualmente:**
   ```bash
   - Use como referência visual
   - Monte componente por componente
   - Conecte conforme diagrama
   ```

---

## 🎯 Desafios

Teste seus conhecimentos recriando estes circuitos:

### Fácil:
- [ ] Lâmpada com 2 botoeiras (uma liga, outra desliga)
- [ ] Três lâmpadas em série
- [ ] Duas lâmpadas em paralelo

### Médio:
- [ ] Motor com reversão (2 contatores)
- [ ] Sequencial de lâmpadas (3 tempos)
- [ ] Sensor com contagem (use display imaginário)

### Difícil:
- [ ] Partida compensadora de motor
- [ ] Sistema de duas esteiras sincronizadas
- [ ] Controle de nível com 3 sensores

---

## 🚀 Próximos Passos

Depois de dominar os exemplos:

1. **Modifique os circuitos:**
   - Adicione mais saídas
   - Mude tempos de temporizadores
   - Troque tipos de sensores

2. **Combine conceitos:**
   - Motor + sensor + temporização
   - Múltiplos motores coordenados
   - Sistema completo de automação

3. **Crie projetos reais:**
   - Controle de acesso
   - Estacionamento automatizado
   - Linha de produção
   - Sistema de irrigação

---

## 📚 Recursos Adicionais

- `SIMULATION_IMPROVEMENTS.md` - Documentação técnica completa
- `QUICK_START.md` - Guia de início rápido
- Console do navegador - Para debug e logs

**Boas simulações! ⚡🔧**
