import React from "react";
import { 
  GitBranch, FileText, ListChecks, Layers, MessageCircle, Pencil 
} from "lucide-react";
import { Meta, AcaoMeta, CheckIn } from "./types";
import { formatVal, isQualitativa } from "./utils";
import { prioridadeConfig, statusConfig } from "./constants";

interface MetaCardProps {
  meta: Meta;
  acoes: AcaoMeta[];
  checkins: CheckIn[];
  childMetas: Meta[];
  onCheckin: (id: string) => void;
  onEdit: (meta: Meta) => void;
}

export const MetaCard: React.FC<MetaCardProps> = ({ 
  meta, acoes, checkins, childMetas, onCheckin, onEdit 
}) => {
  const qual = isQualitativa(meta);
  const pct = qual ? 0 : Math.min(Math.round((meta.objetivo > 0 ? meta.atual / meta.objetivo : 0) * 100), 100);
  const pCfg = prioridadeConfig[meta.prioridade];
  const sCfg = statusConfig[meta.status];
  const metaAcoes = acoes.filter((a) => a.meta_id === meta.id);
  const metaCheckins = checkins.filter(c => c.meta_id === meta.id);

  return (
    <div className="group p-3 rounded-sm border transition-all hover:shadow-sm" style={{ background: "hsl(var(--pbi-surface))", borderColor: "hsl(var(--pbi-border))" }}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          {meta.parent_id && <GitBranch className="w-3 h-3 text-muted-foreground" />}
          {qual && <FileText className="w-3 h-3 text-muted-foreground" />}
          <span className="text-[12px] font-medium text-foreground">{meta.nome}</span>
          {qual && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">📝 Qualitativa</span>}
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
          {meta.ciclo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{meta.ciclo}</span>}
          {metaAcoes.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <ListChecks className="w-3 h-3 inline mr-0.5" />{metaAcoes.filter((a) => a.concluida).length}/{metaAcoes.length}
            </span>
          )}
          {childMetas.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <Layers className="w-3 h-3 inline mr-0.5" />{childMetas.length} sub
            </span>
          )}
          {metaCheckins.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              <MessageCircle className="w-3 h-3 inline mr-0.5" />{metaCheckins.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {meta.responsavel && <span className="text-[10px] text-muted-foreground hidden sm:inline">{meta.responsavel}</span>}
          {!qual && <span className="text-[11px] text-muted-foreground">{formatVal(meta.atual, meta.unidade)} / {formatVal(meta.objetivo, meta.unidade)}</span>}
          {!qual && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${meta.cor}18`, color: meta.cor }}>{pct}%</span>}
          <button onClick={() => onCheckin(meta.id)} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Check-in"><MessageCircle className="w-3 h-3" /></button>
          <button onClick={() => onEdit(meta)} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Editar"><Pencil className="w-3 h-3" /></button>
        </div>
      </div>
      {!qual && (
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
          <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.cor }} />
        </div>
      )}
    </div>
  );
};
