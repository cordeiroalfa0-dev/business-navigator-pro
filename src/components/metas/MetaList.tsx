import React from "react";
import { Meta, AcaoMeta, CheckIn } from "./types";
import { MetaCard } from "./MetaCard";

interface MetaListProps {
  metas: Meta[];
  acoes: AcaoMeta[];
  checkins: CheckIn[];
  onCheckin: (id: string) => void;
  onEdit: (meta: Meta) => void;
}

export const MetaList: React.FC<MetaListProps> = ({ 
  metas, acoes, checkins, onCheckin, onEdit 
}) => {
  const getChildMetas = (parentId: string) => metas.filter(m => m.parent_id === parentId);

  if (metas.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Nenhuma meta encontrada com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {metas.map((meta) => (
        <MetaCard 
          key={meta.id} 
          meta={meta} 
          acoes={acoes} 
          checkins={checkins} 
          childMetas={getChildMetas(meta.id)} 
          onCheckin={onCheckin} 
          onEdit={onEdit} 
        />
      ))}
    </div>
  );
};
