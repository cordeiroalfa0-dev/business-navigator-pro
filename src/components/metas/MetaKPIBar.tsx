import { Target, TrendingUp, Award, AlertTriangle, MessageCircle } from "lucide-react";
import { Meta, CheckIn } from "./types";

interface MetaKPIBarProps {
  metas: Meta[];
  checkins: CheckIn[];
}

const PBITile = ({ children }: { children: React.ReactNode }) => (
  <div className="pbi-tile">{children}</div>
);

export function MetaKPIBar({ metas, checkins }: MetaKPIBarProps) {
  const quantMetas = metas.filter((m) => m.unidade !== "texto");
  const totalProgress = quantMetas.length > 0
    ? quantMetas.reduce((acc, m) => acc + (m.objetivo > 0 ? m.atual / m.objetivo : 0) * 100, 0) / quantMetas.length
    : 0;
  const metasAtingidas = quantMetas.filter((m) => m.atual >= m.objetivo).length;
  const metasEmRisco = metas.filter((m) => m.status === "em_risco" || (m.unidade !== "texto" && m.objetivo > 0 && m.atual / m.objetivo < 0.3)).length;

  const kpis = [
    { label: "Total Metas",    value: metas.length,                      color: "hsl(207, 89%, 48%)", icon: Target },
    { label: "Progresso Médio",value: `${Math.round(totalProgress)}%`,   color: "hsl(152, 60%, 38%)", icon: TrendingUp },
    { label: "Atingidas",      value: `${metasAtingidas}/${metas.length}`,color: "hsl(42, 65%, 56%)", icon: Award },
    { label: "Em Risco",       value: metasEmRisco,                       color: "hsl(0, 72%, 51%)",   icon: AlertTriangle },
    { label: "Check-ins",      value: checkins.length,                    color: "hsl(174, 62%, 47%)", icon: MessageCircle },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <PBITile key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded" style={{ backgroundColor: `${kpi.color}1F` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
            </div>
          </PBITile>
        );
      })}
    </div>
  );
}
