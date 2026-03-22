import { Meta } from "./types";

export const formatVal = (v: number, unit: string) => {
  if (unit === "texto") return "";
  if (unit === "R$") return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (unit === "%") return `${v}%`;
  return `${v} ${unit}`;
};

export const isQualitativa = (meta: Meta) => meta.unidade === "texto" || meta.tipo_meta === "qualitativa";

export const getStatusColor = (status: Meta["status"]) => {
  const colors = {
    no_prazo: "hsl(152, 60%, 38%)",
    atencao: "hsl(42, 65%, 56%)",
    em_risco: "hsl(0, 72%, 51%)",
    atingida: "hsl(207, 89%, 48%)",
  };
  return colors[status] || "hsl(0, 0%, 50%)";
};

// Calcula % com proteção contra objetivo = 0
export const calcPct = (atual: number, objetivo: number): number => {
  if (!objetivo || objetivo === 0) return 0;
  return Math.min(Math.round((atual / objetivo) * 100), 100);
};

export const calculateStatus = (atual: number, objetivo: number, isQual: boolean): Meta["status"] => {
  if (isQual) return "no_prazo";
  const pct = objetivo > 0 ? (atual / objetivo) * 100 : 0;
  if (pct >= 100) return "atingida";
  if (pct < 30) return "em_risco";
  if (pct < 60) return "atencao";
  return "no_prazo";
};
