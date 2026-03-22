import { Filter } from "lucide-react";
import { Pencil, Eye } from "lucide-react";

interface MetaFiltersProps {
  categorias: string[];
  ciclos: string[];
  filtroCategoria: string;
  filtroPrioridade: string;
  filtroCiclo: string;
  onCategoria: (v: string) => void;
  onPrioridade: (v: string) => void;
  onCiclo: (v: string) => void;
  canEditMetas: boolean;
  userRole: string | null;
  children?: React.ReactNode;
}

const roleLabel = (role: string | null) =>
  role === "admin" ? "Administrador" : role === "master" ? "Editor Premium" : "Visualizador";
const roleColor = (role: string | null) =>
  role === "admin" ? "hsl(0, 72%, 51%)" : role === "master" ? "hsl(42, 65%, 56%)" : "hsl(207, 89%, 48%)";

export function MetaFilters({
  categorias, ciclos, filtroCategoria, filtroPrioridade, filtroCiclo,
  onCategoria, onPrioridade, onCiclo, canEditMetas, userRole, children,
}: MetaFiltersProps) {
  const color = roleColor(userRole);

  return (
    <div className="pbi-filter-bar rounded-sm px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span className="font-medium">Filtros</span>
      </div>
      <div className="h-4 w-px bg-border hidden sm:block" />

      <select value={filtroCategoria} onChange={(e) => onCategoria(e.target.value)}
        className="px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground border-none outline-none cursor-pointer">
        <option value="Todas">Todas Categorias</option>
        {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={filtroPrioridade} onChange={(e) => onPrioridade(e.target.value)}
        className="px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground border-none outline-none cursor-pointer">
        <option value="Todas">Todas Prioridades</option>
        <option value="alta">Alta</option>
        <option value="media">Média</option>
        <option value="baixa">Baixa</option>
      </select>

      <select value={filtroCiclo} onChange={(e) => onCiclo(e.target.value)}
        className="px-3 py-1.5 rounded bg-secondary text-[12px] font-medium text-foreground border-none outline-none cursor-pointer">
        <option value="Todos">Todos Ciclos</option>
        {ciclos.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <div className="flex-1" />

      <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
        style={{ background: `${color}18`, color }}>
        {canEditMetas ? <Pencil className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
        {roleLabel(userRole)}
      </span>

      {children}
    </div>
  );
}
