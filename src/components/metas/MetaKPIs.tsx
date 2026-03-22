import React from "react";
import { Target, TrendingUp, Award, AlertTriangle, MessageCircle } from "lucide-react";
import { Meta, CheckIn } from "./types";

interface MetaKPIsProps {
  metas: Meta[];
  checkins: CheckIn[];
  totalProgress: number;
  metasAtingidas: number;
  metasEmRisco: number;
}

const PBITile = ({ children, color, label, value, icon: Icon }: { children?: React.ReactNode; color: string; label: string; value: string | number; icon: any }) => (
  <div className="pbi-tile">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded" style={{ backgroundColor: `${color}1F` }}>
        <Icon className="w-4 h-4" style={{ color: color }} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold" style={{ color: color }}>{value}</p>
      </div>
    </div>
    {children}
  </div>
);

export const MetaKPIs: React.FC<MetaKPIsProps> = ({ metas, checkins, totalProgress, metasAtingidas, metasEmRisco }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <PBITile label="Total Metas" value={metas.length} color="hsl(207, 89%, 48%)" icon={Target} />
      <PBITile label="Progresso Médio" value={`${Math.round(totalProgress)}%`} color="hsl(152, 60%, 38%)" icon={TrendingUp} />
      <PBITile label="Atingidas" value={`${metasAtingidas}/${metas.length}`} color="hsl(42, 65%, 56%)" icon={Award} />
      <PBITile label="Em Risco" value={metasEmRisco} color="hsl(0, 72%, 51%)" icon={AlertTriangle} />
      <PBITile label="Check-ins" value={checkins.length} color="hsl(174, 62%, 47%)" icon={MessageCircle} />
    </div>
  );
};
