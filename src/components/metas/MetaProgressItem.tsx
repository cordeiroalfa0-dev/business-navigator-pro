import { GitBranch, FileText, ListChecks, Layers, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Meta, AcaoMeta, CheckIn } from "./types";
import { prioridadeConfig, statusConfig } from "./constants";
import { isQualitativa, formatVal } from "./utils";

interface MetaProgressItemProps {
  meta: Meta;
  acoes: AcaoMeta[];
  checkins: CheckIn[];
  childCount: number;
  obrasDisponiveis: { id: string; nome: string }[];
  canEditMetas: boolean;
  onCheckin: (metaId: string) => void;
  onEdit: (meta: Meta) => void;
  onAddAcao: (metaId: string) => void;
  onRemove: (metaId: string) => void;
}

export function MetaProgressItem({
  meta, acoes, checkins, childCount, obrasDisponiveis,
  canEditMetas, onCheckin, onEdit, onAddAcao, onRemove,
}: MetaProgressItemProps) {
  const qual = isQualitativa(meta);
  const pct = qual ? 0 : Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
  const pCfg = prioridadeConfig[meta.prioridade];
  const sCfg = statusConfig[meta.status];
  const obra = obrasDisponiveis.find((o) => o.id === (meta as any).obra_id);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          {meta.parent_id && <GitBranch className="w-3 h-3 text-muted-foreground" />}
          {qual && <FileText className="w-3 h-3 text-muted-foreground" />}
          <span className="text-[12px] font-medium text-foreground">{meta.nome}</span>
          {qual && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">Qualitativa</span>}
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
          {meta.ciclo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{meta.ciclo}</span>}
          {obra && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"
              style={{ background: "hsl(207, 89%, 48%, 0.15)", color: "hsl(207, 89%, 48%)" }}>
              🏗️ {obra.nome}
            </span>
          )}
          {acoes.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <ListChecks className="w-3 h-3 inline mr-0.5" />{acoes.filter((a) => a.concluida).length}/{acoes.length}
            </span>
          )}
          {childCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <Layers className="w-3 h-3 inline mr-0.5" />{childCount} sub
            </span>
          )}
          {checkins.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <MessageCircle className="w-3 h-3 inline mr-0.5" />{checkins.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {meta.responsavel && <span className="text-[10px] text-muted-foreground hidden sm:inline">{meta.responsavel}</span>}
          {!qual && <span className="text-[11px] text-muted-foreground">{formatVal(meta.atual, meta.unidade)} / {formatVal(meta.objetivo, meta.unidade)}</span>}
          {!qual && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${meta.cor}18`, color: meta.cor }}>{pct}%</span>}
          <button onClick={() => onCheckin(meta.id)} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Check-in">
            <MessageCircle className="w-3 h-3" />
          </button>
          {canEditMetas && (
            <>
              <button onClick={() => onEdit(meta)} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Editar">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => onAddAcao(meta.id)} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Ação">
                <ListChecks className="w-3 h-3" />
              </button>
              <button onClick={() => onRemove(meta.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {!qual && (
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.cor }} />
        </div>
      )}
    </div>
  );
}
