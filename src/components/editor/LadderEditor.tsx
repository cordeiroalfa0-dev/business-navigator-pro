import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  Download, 
  Upload,
  Zap,
  ArrowRight
} from 'lucide-react';
import { LadderRung, Contact, Coil } from '@/lib/simulation/plcSimulation';

interface LadderEditorProps {
  onProgramChange: (rungs: LadderRung[]) => void;
  availableInputs: string[];
  availableOutputs: string[];
}

export function LadderEditor({
  onProgramChange,
  availableInputs,
  availableOutputs
}: LadderEditorProps) {
  const [rungs, setRungs] = useState<LadderRung[]>([]);
  const [selectedRung, setSelectedRung] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Adicionar novo rung
  const addRung = () => {
    const newRung: LadderRung = {
      id: `rung_${Date.now()}`,
      contacts: [],
      comment: ''
    };
    
    const newRungs = [...rungs, newRung];
    setRungs(newRungs);
    onProgramChange(newRungs);
  };

  // Remover rung
  const removeRung = (index: number) => {
    const newRungs = rungs.filter((_, i) => i !== index);
    setRungs(newRungs);
    onProgramChange(newRungs);
  };

  // Adicionar contato a um rung
  const addContact = (rungIndex: number, type: 'NO' | 'NC') => {
    const newRungs = [...rungs];
    const rung = newRungs[rungIndex];
    
    if (rung.contacts.length < 5) { // Limite de 5 contatos por rung
      rung.contacts.push({
        type,
        address: availableInputs[0] || 'I0.0',
        position: rung.contacts.length
      });
      
      setRungs(newRungs);
      onProgramChange(newRungs);
    }
  };

  // Adicionar bobina a um rung
  const addCoil = (rungIndex: number, type: Coil['type']) => {
    const newRungs = [...rungs];
    newRungs[rungIndex].coil = {
      type,
      address: availableOutputs[0] || 'Q0.0',
      preset: type.startsWith('T') || type.startsWith('C') ? 1000 : undefined
    };
    
    setRungs(newRungs);
    onProgramChange(newRungs);
  };

  // Atualizar endereço de contato
  const updateContactAddress = (rungIndex: number, contactIndex: number, address: string) => {
    const newRungs = [...rungs];
    newRungs[rungIndex].contacts[contactIndex].address = address;
    setRungs(newRungs);
    onProgramChange(newRungs);
  };

  // Atualizar bobina
  const updateCoil = (rungIndex: number, field: string, value: any) => {
    const newRungs = [...rungs];
    if (newRungs[rungIndex].coil) {
      (newRungs[rungIndex].coil as any)[field] = value;
      setRungs(newRungs);
      onProgramChange(newRungs);
    }
  };

  // Renderizar ladder no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 800;
    canvas.height = Math.max(400, rungs.length * 80 + 100);

    // Limpar
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar cada rung
    rungs.forEach((rung, index) => {
      drawRung(ctx, rung, index, index === selectedRung);
    });
  }, [rungs, selectedRung]);

  // Desenhar um rung
  const drawRung = (
    ctx: CanvasRenderingContext2D,
    rung: LadderRung,
    index: number,
    selected: boolean
  ) => {
    const y = 50 + index * 80;
    const startX = 50;
    const spacing = 120;

    // Cor
    ctx.strokeStyle = selected ? '#22c55e' : '#60a5fa';
    ctx.fillStyle = selected ? '#22c55e' : '#60a5fa';
    ctx.lineWidth = 2;
    ctx.font = '12px monospace';

    // Linha esquerda (alimentação)
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(startX, y);
    ctx.stroke();

    // Desenhar contatos
    let currentX = startX;
    rung.contacts.forEach((contact, i) => {
      drawContact(ctx, contact, currentX, y);
      
      // Linha conectando ao próximo
      if (i < rung.contacts.length - 1 || rung.coil) {
        ctx.beginPath();
        ctx.moveTo(currentX + 40, y);
        ctx.lineTo(currentX + spacing, y);
        ctx.stroke();
      }
      
      currentX += spacing;
    });

    // Desenhar bobina
    if (rung.coil) {
      const coilX = currentX + (rung.contacts.length === 0 ? 0 : 0);
      drawCoil(ctx, rung.coil, coilX, y);
      currentX = coilX + 80;
    }

    // Linha direita (retorno)
    ctx.beginPath();
    ctx.moveTo(currentX, y);
    ctx.lineTo(780, y);
    ctx.stroke();

    // Número do rung
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${index}:`, 5, y + 5);

    // Comentário
    if (rung.comment) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(rung.comment, startX, y - 10);
      ctx.font = '12px monospace';
    }
  };

  // Desenhar contato
  const drawContact = (
    ctx: CanvasRenderingContext2D,
    contact: Contact,
    x: number,
    y: number
  ) => {
    ctx.strokeStyle = '#60a5fa';
    ctx.fillStyle = '#60a5fa';

    if (contact.type === 'NO') {
      // Contato normalmente aberto (—| |—)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 15, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 15, y - 10);
      ctx.lineTo(x + 15, y + 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 25, y - 10);
      ctx.lineTo(x + 25, y + 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 25, y);
      ctx.lineTo(x + 40, y);
      ctx.stroke();
    } else {
      // Contato normalmente fechado (—|/|—)
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 15, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 15, y - 10);
      ctx.lineTo(x + 15, y + 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 25, y - 10);
      ctx.lineTo(x + 25, y + 10);
      ctx.stroke();
      
      // Diagonal (barra)
      ctx.beginPath();
      ctx.moveTo(x + 12, y - 12);
      ctx.lineTo(x + 28, y + 12);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + 25, y);
      ctx.lineTo(x + 40, y);
      ctx.stroke();
    }

    // Label
    ctx.font = '10px monospace';
    ctx.fillText(contact.address, x, y + 25);
    ctx.font = '12px monospace';
  };

  // Desenhar bobina
  const drawCoil = (
    ctx: CanvasRenderingContext2D,
    coil: Coil,
    x: number,
    y: number
  ) => {
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';

    switch (coil.type) {
      case 'OUTPUT':
        // Bobina normal ( )
        ctx.beginPath();
        ctx.arc(x + 20, y, 15, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case 'SET':
        // Bobina SET (S)
        ctx.beginPath();
        ctx.arc(x + 20, y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('S', x + 16, y + 5);
        break;
        
      case 'RESET':
        // Bobina RESET (R)
        ctx.beginPath();
        ctx.arc(x + 20, y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('R', x + 15, y + 5);
        break;
        
      case 'TON':
        // Timer On-Delay
        ctx.strokeRect(x, y - 15, 40, 30);
        ctx.font = '10px monospace';
        ctx.fillText('TON', x + 8, y + 5);
        ctx.font = '12px monospace';
        break;
        
      case 'TOF':
        // Timer Off-Delay
        ctx.strokeRect(x, y - 15, 40, 30);
        ctx.font = '10px monospace';
        ctx.fillText('TOF', x + 8, y + 5);
        ctx.font = '12px monospace';
        break;
        
      case 'CTU':
        // Counter Up
        ctx.strokeRect(x, y - 15, 40, 30);
        ctx.font = '10px monospace';
        ctx.fillText('CTU', x + 8, y + 5);
        ctx.font = '12px monospace';
        break;
    }

    // Label
    ctx.font = '10px monospace';
    ctx.fillText(coil.address, x, y + 25);
    if (coil.preset) {
      ctx.fillText(`PT:${coil.preset}`, x, y + 38);
    }
    ctx.font = '12px monospace';
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Editor Ladder Logic
          </h3>
          
          <div className="flex gap-2">
            <Button onClick={addRung} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Novo Rung
            </Button>
          </div>
        </div>

        {/* Canvas de visualização */}
        <div className="border rounded-lg overflow-hidden bg-[#1a1a1a] mb-4">
          <canvas
            ref={canvasRef}
            className="w-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const rungIndex = Math.floor((y - 10) / 80);
              if (rungIndex >= 0 && rungIndex < rungs.length) {
                setSelectedRung(rungIndex);
              }
            }}
          />
        </div>

        {/* Editor de rung selecionado */}
        {selectedRung !== null && rungs[selectedRung] && (
          <Card className="p-4 border-primary">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">
                Rung {selectedRung} - Edição
              </h4>
              <Button
                onClick={() => removeRung(selectedRung)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Comentário */}
            <div className="mb-3">
              <Label>Comentário</Label>
              <Input
                value={rungs[selectedRung].comment || ''}
                onChange={(e) => {
                  const newRungs = [...rungs];
                  newRungs[selectedRung].comment = e.target.value;
                  setRungs(newRungs);
                  onProgramChange(newRungs);
                }}
                placeholder="Descrição do rung..."
              />
            </div>

            {/* Contatos */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Contatos (Entradas)</Label>
                <div className="flex gap-1">
                  <Button
                    onClick={() => addContact(selectedRung, 'NO')}
                    size="sm"
                    variant="outline"
                  >
                    + NA
                  </Button>
                  <Button
                    onClick={() => addContact(selectedRung, 'NC')}
                    size="sm"
                    variant="outline"
                  >
                    + NF
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {rungs[selectedRung].contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm w-8">
                      {contact.type === 'NO' ? '—| |—' : '—|/|—'}
                    </span>
                    <Select
                      value={contact.address}
                      onValueChange={(value) => 
                        updateContactAddress(selectedRung, idx, value)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInputs.map(addr => (
                          <SelectItem key={addr} value={addr}>
                            {addr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        const newRungs = [...rungs];
                        newRungs[selectedRung].contacts.splice(idx, 1);
                        setRungs(newRungs);
                        onProgramChange(newRungs);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bobina */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Bobina (Saída)</Label>
                {!rungs[selectedRung].coil && (
                  <div className="flex gap-1">
                    <Button
                      onClick={() => addCoil(selectedRung, 'OUTPUT')}
                      size="sm"
                      variant="outline"
                    >
                      + ( )
                    </Button>
                    <Button
                      onClick={() => addCoil(selectedRung, 'TON')}
                      size="sm"
                      variant="outline"
                    >
                      + TON
                    </Button>
                    <Button
                      onClick={() => addCoil(selectedRung, 'CTU')}
                      size="sm"
                      variant="outline"
                    >
                      + CTU
                    </Button>
                  </div>
                )}
              </div>

              {rungs[selectedRung].coil && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-16">
                      {rungs[selectedRung].coil?.type}
                    </span>
                    <Select
                      value={rungs[selectedRung].coil?.address}
                      onValueChange={(value) => 
                        updateCoil(selectedRung, 'address', value)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOutputs.map(addr => (
                          <SelectItem key={addr} value={addr}>
                            {addr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        const newRungs = [...rungs];
                        delete newRungs[selectedRung].coil;
                        setRungs(newRungs);
                        onProgramChange(newRungs);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {(rungs[selectedRung].coil?.type === 'TON' || 
                    rungs[selectedRung].coil?.type === 'TOF' ||
                    rungs[selectedRung].coil?.type === 'CTU') && (
                    <div>
                      <Label>Preset (ms para timer, count para contador)</Label>
                      <Input
                        type="number"
                        value={rungs[selectedRung].coil?.preset || 0}
                        onChange={(e) => 
                          updateCoil(selectedRung, 'preset', parseInt(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Dica quando vazio */}
        {rungs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Clique em "Novo Rung" para começar a programar</p>
          </div>
        )}
      </Card>
    </div>
  );
}
