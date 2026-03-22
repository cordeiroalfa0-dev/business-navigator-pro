import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface MetaSnapshot {
  snapshot_date: string;
  percentual_concluido: number;
  status: string;
}

interface DashboardData {
  totalAtividades: number;
  atividadesPrevistas: number;
  atividadesNaoPrevistas: number;
  atividadesCompletas: number;
  atividadesAtrasadas: number;
  atividadesNaoIniciadas: number;
  percentualCompleto: number;
  percentualAtrasado: number;
  percentualNaoIniciado: number;
  dataAnalise: string;
  periodo: string;
  dataFinal?: string;
  snapshots: MetaSnapshot[];
}

const COLORS = {
  previstas: "#EF4444",
  naoPrevistas: "#FBBF24",
  completa: "#EF4444",
  atrasada: "#FBBF24",
  naoIniciada: "#E5E7EB",
  evolution: "#16A34A",
};

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

export function DashboardRelatorioV2({ data }: { data: DashboardData }) {
  const { toast } = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [comparacao, setComparacao] = useState({
    execucaoDecrescimo: 0,
    incompletasAcrescimo: 0,
    dataAnterior: "",
    melhorou: false,
  });

  useEffect(() => {
    if (!data.snapshots || data.snapshots.length < 2) return;
    const sorted = [...data.snapshots].sort(
      (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
    );
    const atual = sorted[sorted.length - 1];
    const anterior = sorted[Math.max(0, sorted.length - 8)];
    if (atual && anterior) {
      const delta = atual.percentual_concluido - anterior.percentual_concluido;
      const incompletasDelta =
        (100 - atual.percentual_concluido) - (100 - anterior.percentual_concluido);
      setComparacao({
        execucaoDecrescimo: Math.abs(Math.round(delta)),
        incompletasAcrescimo: Math.abs(Math.round(incompletasDelta)),
        dataAnterior: fmtDate(anterior.snapshot_date),
        melhorou: delta >= 0,
      });
    }
  }, [data.snapshots]);

  const percCompletas    = pct(data.atividadesCompletas,    data.totalAtividades);
  const percAtrasadas    = pct(data.atividadesAtrasadas,    data.totalAtividades);
  const percNaoIniciadas = pct(data.atividadesNaoIniciadas, data.totalAtividades);
  const percPrevistas    = pct(data.atividadesPrevistas,    data.totalAtividades);
  const percNaoPrevistas = 100 - percPrevistas;
  const obraOk           = percCompletas >= 80;

  const pieDataPrevistas = [
    { name: "Previstas",     value: data.atividadesPrevistas,    fill: COLORS.previstas },
    { name: "Não Previstas", value: data.atividadesNaoPrevistas, fill: COLORS.naoPrevistas },
  ];

  const pieDataRealizacao = [
    { name: "Completas",     value: data.atividadesCompletas,    fill: COLORS.completa },
    { name: "Atrasadas",     value: data.atividadesAtrasadas,    fill: COLORS.atrasada },
    { name: "Não Iniciadas", value: data.atividadesNaoIniciadas, fill: COLORS.naoIniciada },
  ];

  const evolutionData = (data.snapshots ?? []).slice(-30).map((s) => ({
    date: new Date(s.snapshot_date).toLocaleDateString("pt-BR", {
      month: "short", day: "numeric",
    }),
    execucao:  s.percentual_concluido,
    atrasadas: 100 - s.percentual_concluido,
  }));

  const exportarPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      toast({ title: "Gerando PDF…", description: "Aguarde alguns segundos." });
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#f5f5f0",
      });
      const imgData  = canvas.toDataURL("image/png");
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm", format: "a4",
      });
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 0;
      pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
      let remaining = imgHeight - pageH;
      while (remaining > 0) {
        y -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
        remaining -= pageH;
      }
      pdf.save(`relatorio-${data.dataAnalise ?? "obra"}.pdf`);
      toast({ title: "PDF exportado!", description: "O download foi iniciado." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao exportar", description: "Verifique o console.", variant: "destructive" });
    }
  };

  return (
    <div ref={dashboardRef} className="space-y-6 p-6 bg-[#f5f5f0] text-slate-900 rounded-xl border border-slate-200 shadow-sm max-w-[1200px] mx-auto font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-slate-300 pb-4">
        <div className="flex flex-col gap-1">
          <div className="bg-[#f97316] text-white px-4 py-2 rounded-sm font-bold text-xl uppercase tracking-wider">
            Relatório e Análise Semanal
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <span>Área Comum — Análise Cronograma</span>
            <span className="bg-slate-200 px-2 py-0.5 rounded">{data.periodo}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-300 pb-1 mb-1">
            Data de Análise: {data.dataAnalise}
          </div>
          <div className="text-2xl font-black text-[#3b82f6] tracking-tighter">SAN REMO</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border-l-4 border-[#f97316]">
            <h3 className="text-sm font-bold bg-[#A3A374] text-white px-2 py-1 inline-block mb-3">Geral</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total de Atividades</p>
                <p className="text-3xl font-black text-slate-800">{data.totalAtividades}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Previstas</p>
                  <p className="text-xl font-bold text-[#f97316]">{data.atividadesPrevistas}</p>
                  <p className="text-xs text-slate-500">{percPrevistas}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Não Previstas</p>
                  <p className="text-xl font-bold text-slate-600">{data.atividadesNaoPrevistas}</p>
                  <p className="text-xs text-slate-500">{percNaoPrevistas}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded border-l-4 border-[#9CA3AF]">
            <h3 className="text-sm font-bold bg-[#A3A374] text-white px-2 py-1 inline-block mb-3">Realizado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: "Completas",  value: data.atividadesCompletas,    perc: percCompletas,    color: "text-green-600" },
                { label: "Atrasadas",  value: data.atividadesAtrasadas,    perc: percAtrasadas,    color: "text-red-500" },
                { label: "Não Inic.",  value: data.atividadesNaoIniciadas, perc: percNaoIniciadas, color: "text-slate-400" },
              ].map(({ label, value, perc, color }) => (
                <div key={label} className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500">{perc}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Pies */}
        <div className="space-y-4">
          {[
            { title: "Previstas vs Não Previstas", pieData: pieDataPrevistas },
            { title: "Status de Realização",       pieData: pieDataRealizacao },
          ].map(({ title, pieData }) => (
            <div key={title} className="bg-white p-4 rounded">
              <p className="text-center text-xs font-bold text-slate-700 mb-2">{title}</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} atividades`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {/* Right: Análise */}
        <div className="bg-white p-4 rounded space-y-4">
          <div className="bg-[#DC2626] text-white p-3 rounded">
            <h3 className="font-bold text-sm">ANÁLISE GERAL ÁREA COMUM</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-bold text-sm text-blue-600 mb-2">STATUS ATUAL</h4>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-500">Semana anterior</p>
                  <p className="font-bold text-slate-700">{comparacao.dataAnterior || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Atual</p>
                  <p className="font-bold text-[#EF4444]">{data.dataAnalise}</p>
                </div>
                <div>
                  <p className="font-bold text-[#EF4444] text-lg">[{percCompletas}%]</p>
                  <p className="text-[10px] text-[#EF4444]">Concluída</p>
                </div>
                <div>
                  <p className={`font-bold text-lg ${comparacao.melhorou ? "text-green-600" : "text-red-600"}`}>
                    {comparacao.melhorou ? "+" : "-"}{comparacao.execucaoDecrescimo}%
                  </p>
                  <p className="text-[10px] text-slate-500">Evolução</p>
                </div>
              </div>
            </div>
            <div className="bg-[#DC2626] text-white p-3 rounded">
              <h4 className="font-bold text-sm">
                DATA FINAL — {data.dataFinal ?? "A DEFINIR"}
              </h4>
            </div>
            <div className="bg-slate-100 p-3 rounded text-xs text-slate-700">
              OBS: Data final sujeita a alterações conforme atualizações do cronograma.
            </div>
          </div>
        </div>
      </div>

      {/* Análise */}
      <div className="bg-white p-6 rounded space-y-4 border-t-4 border-slate-800">
        <h3 className="text-sm font-bold text-[#A3A374] uppercase">Análise</h3>
        <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
          <p className="text-xs text-slate-700">
            Para a obra ocorrer bem, a porcentagem completa deve ser superior a{" "}
            <span className="font-bold text-blue-600">80%</span>
          </p>
        </div>
        <div className={`p-3 rounded ${obraOk ? "bg-green-50" : "bg-red-50"}`}>
          <p className={`text-xs font-bold ${obraOk ? "text-green-700" : "text-[#DC2626]"}`}>
            AS ATIVIDADES DA OBRA {obraOk ? "ESTÃO OCORRENDO BEM" : "NÃO OCORRERAM BEM"}
          </p>
        </div>

        <div className="pt-4 border-t-2 border-slate-200">
          <h4 className="text-sm font-bold text-[#A3A374] uppercase mb-3">Comparação</h4>
          {comparacao.dataAnterior ? (
            <>
              <p className="text-xs text-slate-700 mb-3">Comparação em relação ao relatório de {comparacao.dataAnterior}</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  {comparacao.melhorou
                    ? <TrendingUp   className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    : <TrendingDown className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />}
                  <p className="text-xs">
                    A execução de <span className="font-bold text-[#DC2626]">atividades completas</span> teve um{" "}
                    <span className={`font-bold ${comparacao.melhorou ? "text-green-600" : "text-[#DC2626]"}`}>
                      {comparacao.melhorou ? "ACRÉSCIMO" : "DECRÉSCIMO"} DE {comparacao.execucaoDecrescimo}%
                    </span>
                    , representando uma{" "}
                    <span className={`font-bold underline ${comparacao.melhorou ? "text-green-600" : "text-[#DC2626]"}`}>
                      {comparacao.melhorou ? "MELHORA" : "PIORA"}
                    </span>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
                  <p className="text-xs">
                    As <span className="font-bold text-[#DC2626]">atividades incompletas</span> tiveram um{" "}
                    <span className="font-bold text-[#DC2626]">ACRÉSCIMO DE {comparacao.incompletasAcrescimo}%</span>.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 italic">Sem dados suficientes para comparação semanal.</p>
          )}
        </div>
      </div>

      {/* Evolução temporal */}
      {evolutionData.length > 1 && (
        <div className="bg-white p-6 rounded space-y-4 border-t-4 border-slate-800">
          <h3 className="text-sm font-bold text-[#A3A374] uppercase mb-4">Evolução Temporal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Evolução na Execução (%)", key: "execucao",  stroke: COLORS.evolution },
              { title: "Atividades Atrasadas (%)",  key: "atrasadas", stroke: "#EF4444" },
            ].map(({ title, key, stroke }) => (
              <div key={key}>
                <h4 className="text-xs font-bold text-slate-700 mb-3">{title}</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => [`${v}%`]} />
                    <Line type="monotone" dataKey={key} stroke={stroke} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex justify-end pt-2">
        <Button onClick={exportarPDF} className="gap-2">
          <Download className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>
    </div>
  );
}
