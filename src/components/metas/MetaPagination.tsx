interface MetaPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MetaPagination({ page, totalPages, totalItems, onPrev, onNext }: MetaPaginationProps) {
  if (totalPages <= 1) return null;

  const btnStyle = {
    background: "hsl(var(--pbi-dark))",
    color: "hsl(var(--pbi-text-primary))",
    border: "1px solid hsl(var(--pbi-border))",
  };

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <button onClick={onPrev} disabled={page === 0}
        className="px-3 py-1.5 rounded text-[11px] font-medium disabled:opacity-40 transition-all"
        style={btnStyle}>
        ← Anterior
      </button>
      <span className="text-[11px] text-muted-foreground">
        Página {page + 1} de {totalPages} · {totalItems} metas
      </span>
      <button onClick={onNext} disabled={page === totalPages - 1}
        className="px-3 py-1.5 rounded text-[11px] font-medium disabled:opacity-40 transition-all"
        style={btnStyle}>
        Próxima →
      </button>
    </div>
  );
}
