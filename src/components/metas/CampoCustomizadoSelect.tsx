import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TipoCampo, useMetaCampos } from "@/hooks/useMetaCampos";

interface CampoCustomizadoSelectProps {
  tipo: TipoCampo;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Se true, mostra opção "Selecione..." vazia no topo */
  emptyOption?: boolean;
  /** Texto do label adicional para unidades */
  labelInput?: string;
  /** Se true, esconde o select e mostra só o botão "+" de adicionar */
  hideSelect?: boolean;
}

const inputStyle: React.CSSProperties = {
  background: "hsl(var(--pbi-dark))",
  color: "hsl(var(--pbi-text-primary))",
};

export const CampoCustomizadoSelect: React.FC<CampoCustomizadoSelectProps> = ({
  tipo,
  value,
  onChange,
  options,
  placeholder,
  className = "",
  style,
  emptyOption = false,
  labelInput,
  hideSelect = false,
}) => {
  const { adicionarCampo, removerCampo, customPorTipo } = useMetaCampos();
  const [showAdd, setShowAdd] = useState(false);
  const [novoValor, setNovoValor] = useState("");
  const [novoLabel, setNovoLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const customItems = customPorTipo(tipo);

  const handleAdd = async () => {
    if (!novoValor.trim()) return;
    setSaving(true);
    const ok = await adicionarCampo(tipo, novoValor, novoLabel || undefined);
    if (ok) {
      onChange(novoValor.trim());
      setNovoValor("");
      setNovoLabel("");
      setShowAdd(false);
    }
    setSaving(false);
  };

  const handleRemove = async (id: string, valor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (value === valor) onChange("");
    await removerCampo(id, valor);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {!hideSelect && (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 h-8 rounded text-[12px] px-2 border-none outline-none ${className}`}
            style={style || inputStyle}
          >
            {emptyOption && <option value="">Selecione...</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          title={`Adicionar ${tipo}`}
          onClick={() => setShowAdd((v) => !v)}
          className="h-8 w-8 flex items-center justify-center rounded hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}
        >
          <Plus size={14} />
        </button>
      </div>

      {showAdd && (
        <div
          className="rounded p-3 space-y-2 border border-white/10"
          style={{ background: "hsl(var(--pbi-dark))" }}
        >
          <p className="text-[11px] font-medium" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
            Novo {tipo}
          </p>

          <div className="flex gap-2">
            <Input
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={placeholder || `Ex: ${tipo === "categoria" ? "Marketing" : tipo === "ciclo" ? "Q1 2027" : tipo === "unidade" ? "km" : "Demolição"}`}
              className="h-7 text-[11px] border-none flex-1"
              style={inputStyle}
              maxLength={50}
              autoFocus
            />
            {tipo === "unidade" && (
              <Input
                value={novoLabel}
                onChange={(e) => setNovoLabel(e.target.value)}
                placeholder="Label (ex: Quilômetros)"
                className="h-7 text-[11px] border-none flex-1"
                style={inputStyle}
                maxLength={60}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving || !novoValor.trim()}
              className="h-6 text-[11px] px-3"
              style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}
            >
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAdd(false); setNovoValor(""); setNovoLabel(""); }}
              className="h-6 text-[11px] px-3"
              style={{ color: "hsl(var(--pbi-text-secondary))" }}
            >
              Cancelar
            </Button>
          </div>

          {/* Lista dos customizados com botão de remover */}
          {customItems.length > 0 && (
            <div className="pt-1 border-t border-white/10">
              <p className="text-[10px] mb-1.5" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                Seus {tipo}s personalizados:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {customItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                    style={{ background: "hsl(var(--pbi-yellow) / 0.15)", color: "hsl(var(--pbi-text-primary))" }}
                  >
                    {item.label || item.valor}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, item.valor, e)}
                      className="hover:opacity-70 transition-opacity"
                      title="Remover"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
