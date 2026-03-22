import { useState, useCallback, useRef } from 'react';
import { EditorState, SchematicComponent, Wire, Tool, ComponentType, Point } from '@/types/schematic';
import { snapToGrid } from '@/lib/componentShapes';
import { componentLabelsMap } from '@/lib/componentCategories';
import { createComponent, updateComponentTerminals, isToggleable } from '@/lib/componentHelpers';
import { useElectricalSimulation } from '@/hooks/useElectricalSimulation';

let idCounter = 0;
const genId = () => `item_${++idCounter}`;

const initialState: EditorState = {
  components: [],
  wires: [],
  selectedIds: [],
  activeTool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridSize: 20,
  snapToGrid: true,
  simulating: false,
  undoStack: [],
  redoStack: [],
};

export function useSchematicEditor() {
  const [state, setState] = useState<EditorState>(initialState);
  const wireInProgress = useRef<Point[] | null>(null);

  // ✅ NOVO: Usar o hook de simulação corrigido
  const simulation = useElectricalSimulation(
    state.components,
    state.wires,
    state.simulating
  );

  const pushUndo = useCallback(() => {
    setState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack.slice(-50), { components: prev.components, wires: prev.wires }],
      redoStack: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;
      const last = prev.undoStack[prev.undoStack.length - 1];
      return {
        ...prev,
        components: last.components,
        wires: last.wires,
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, { components: prev.components, wires: prev.wires }],
        selectedIds: [],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev;
      const last = prev.redoStack[prev.redoStack.length - 1];
      return {
        ...prev,
        components: last.components,
        wires: last.wires,
        redoStack: prev.redoStack.slice(0, -1),
        undoStack: [...prev.undoStack, { components: prev.components, wires: prev.wires }],
        selectedIds: [],
      };
    });
  }, []);

  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, activeTool: tool, selectedIds: [] }));
    wireInProgress.current = null;
  }, []);

  // ✅ CORRIGIDO: Usar createComponent para criar com terminais corretos
  const addComponent = useCallback((type: ComponentType, position: Point) => {
    
    pushUndo();
    const snapped = {
      x: snapToGrid(position.x, 20),
      y: snapToGrid(position.y, 20),
    };
    
    
    const label = componentLabelsMap[type] || type.replace(/_/g, ' ').toUpperCase();
    
    
    // ✅ NOVO: Usar createComponent do helper
    const comp = createComponent(type, snapped, label);
    
    
    setState(prev => {
      const newState = {
        ...prev,
        components: [...prev.components, comp],
        selectedIds: [comp.id],
      };
        totalComponentes: newState.components.length,
        componentes: newState.components.map(c => c.label)
      });
      return newState;
    });
  }, [pushUndo]);

  const selectComponent = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedIds: id ? [id] : [],
    }));
  }, []);

  // ✅ CORRIGIDO: Atualizar terminais ao mover componente
  const moveComponent = useCallback((id: string, position: Point) => {
    const snapped = {
      x: snapToGrid(position.x, 20),
      y: snapToGrid(position.y, 20),
    };
    setState(prev => ({
      ...prev,
      components: prev.components.map(c => {
        if (c.id === id) {
          const updated = { ...c, position: snapped };
          // ✅ NOVO: Atualizar posição dos terminais
          return updateComponentTerminals(updated);
        }
        return c;
      }),
    }));
  }, []);

  // ✅ CORRIGIDO: Atualizar terminais ao rotacionar
  const rotateSelected = useCallback(() => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.map(c => {
        if (prev.selectedIds.includes(c.id)) {
          const updated = { ...c, rotation: (c.rotation + 90) % 360 };
          // ✅ NOVO: Atualizar terminais após rotação
          return updateComponentTerminals(updated);
        }
        return c;
      }),
    }));
  }, [pushUndo]);

  const deleteSelected = useCallback(() => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => !prev.selectedIds.includes(c.id)),
      wires: prev.wires.filter(w => !prev.selectedIds.includes(w.id)),
      selectedIds: [],
    }));
  }, [pushUndo]);

  const addWirePoint = useCallback((point: Point) => {
    const snapped = {
      x: snapToGrid(point.x, 20),
      y: snapToGrid(point.y, 20),
    };
    if (!wireInProgress.current) {
      wireInProgress.current = [snapped];
    } else {
      wireInProgress.current = [...wireInProgress.current, snapped];
    }
  }, []);

  const finishWire = useCallback(() => {
    if (wireInProgress.current && wireInProgress.current.length >= 2) {
      pushUndo();
      const wire: Wire = {
        id: genId(),
        points: [...wireInProgress.current],
      };
      setState(prev => ({
        ...prev,
        wires: [...prev.wires, wire],
      }));
    }
    wireInProgress.current = null;
  }, [pushUndo]);

  const getWireInProgress = useCallback(() => wireInProgress.current, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.25, Math.min(3, zoom)) }));
  }, []);

  const setPan = useCallback((pan: Point) => {
    setState(prev => ({ ...prev, pan }));
  }, []);

  const deleteItem = useCallback((id: string) => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(w => w.id !== id),
      selectedIds: prev.selectedIds.filter(s => s !== id),
    }));
  }, [pushUndo]);

  const clearAll = useCallback(() => {
    pushUndo();
    setState(prev => ({ ...initialState, undoStack: prev.undoStack, redoStack: prev.redoStack }));
    wireInProgress.current = null;
  }, [pushUndo]);

  // ✅ CORRIGIDO: Simulação usando o novo motor
  const toggleSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      simulating: !prev.simulating,
      selectedIds: [], // Limpar seleção ao iniciar simulação
    }));
  }, []);

  // ✅ CORRIGIDO: Toggle de switches durante simulação
  const handleSimClick = useCallback((componentId: string) => {
    if (!state.simulating) return;
    
    const comp = state.components.find(c => c.id === componentId);
    if (!comp || !isToggleable(comp.type)) return;

    // Alternar estado do componente
    setState(prev => ({
      ...prev,
      components: prev.components.map(c => {
        if (c.id === componentId) {
          return {
            ...c,
            simState: c.simState === 'on' ? 'off' : 'on'
          };
        }
        return c;
      }),
    }));
  }, [state.simulating, state.components]);

  const updateComponentLabel = useCallback((id: string, label: string) => {
    pushUndo();
    setState(prev => ({
      ...prev,
      components: prev.components.map(c =>
        c.id === id ? { ...c, label } : c
      ),
    }));
  }, [pushUndo]);

  // ✅ CORRIGIDO: Duplicar mantendo terminais corretos
  const duplicateSelected = useCallback(() => {
    pushUndo();
    setState(prev => {
      const newComps = prev.components
        .filter(c => prev.selectedIds.includes(c.id))
        .map(c => {
          const offset = { x: c.position.x + 40, y: c.position.y + 40 };
          // ✅ NOVO: Criar novo componente com terminais corretos
          const newComp = createComponent(c.type, offset, c.label + ' (cópia)');
          newComp.rotation = c.rotation;
          return updateComponentTerminals(newComp);
        });
      
      return {
        ...prev,
        components: [...prev.components, ...newComps],
        selectedIds: newComps.map(c => c.id),
      };
    });
  }, [pushUndo]);

  const saveProject = useCallback(() => {
    const data = {
      components: state.components.map(c => ({ ...c, simState: undefined })),
      wires: state.wires.map(w => ({ ...w, energized: undefined })),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'esquema_eletrico.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.components, state.wires]);

  const loadProject = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.components && data.wires) {
        pushUndo();
        
        // ✅ NOVO: Garantir que componentes carregados tenham terminais
        const componentsWithTerminals = data.components.map((c: SchematicComponent) => {
          if (!c.terminals || c.terminals.length === 0) {
            // Se não tem terminais, recriar usando o helper
            return updateComponentTerminals(c);
          }
          return c;
        });
        
        setState(prev => ({
          ...prev,
          components: componentsWithTerminals,
          wires: data.wires,
          selectedIds: [],
          simulating: false,
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar projeto:', e);
    }
  }, [pushUndo]);

  // ✅ NOVO: Aplicar estado da simulação aos componentes e fios
  const componentsWithSimState = state.simulating && simulation.simState
    ? state.components.map(comp => {
        const simCompState = simulation.simState?.components.get(comp.id);
        return {
          ...comp,
          simState: simCompState?.status === 'on' ? ('on' as const) : ('off' as const)
        };
      })
    : state.components;

  const wiresWithEnergy = state.simulating && simulation.simState
    ? state.wires.map(wire => ({
        ...wire,
        energized: simulation.isWireEnergized(wire.id)
      }))
    : state.wires;

  return {
    state: {
      ...state,
      // ✅ NOVO: Retornar componentes e fios com estado de simulação aplicado
      components: componentsWithSimState,
      wires: wiresWithEnergy,
    },
    simulation, // ✅ NOVO: Expor dados da simulação
    setTool,
    addComponent,
    selectComponent,
    moveComponent,
    rotateSelected,
    deleteSelected,
    addWirePoint,
    finishWire,
    getWireInProgress,
    setZoom,
    setPan,
    deleteItem,
    clearAll,
    undo,
    redo,
    toggleSimulation,
    handleSimClick,
    updateComponentLabel,
    duplicateSelected,
    saveProject,
    loadProject,
  };
}