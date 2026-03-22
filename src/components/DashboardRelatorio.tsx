import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface DashboardRelatorioProps {
  data: {
    totalAtividades: number;
    atividadesPrevistas: number;
    atividadesNaoPrevistas: number;
    atividadesCompletas: number;
    atividadesAtrasadas: number;
    atividadesNaoIniciadas: number;
    evolucaoDados: any[];
    atrasadasDados: any[];
    dataAnalise: string;
    periodo: string;
    comparacao: {
      execucaoDecrescimo: number;
      incompletasAcrescimo: number;
      dataAnterior: string;
    };
  };
}

const COLORS = ["#f97316", "#fbbf24", "#ef4444", "#22c55e", "#3b82f6"];

export const DashboardRelatorio: React.FC<DashboardRelatorioProps> = ({ data }) => {
  const percPrevistas = Math.round((data.atividadesPrevistas / data.totalAtividades) * 100) || 0;
  const percNaoPrevistas = 100 - percPrevistas;

  const percCompletas = Math.round((data.atividadesCompletas / data.totalAtividades) * 100) || 0;
  const percAtrasadas = Math.round((data.atividadesAtrasadas / data.totalAtividades) * 100) || 0;
  const percNaoIniciadas = 100 - percCompletas - percAtrasadas;

  const statusObra = percCompletas >= 80 ? "BEM" : "NÃO OCORRERAM BEM";
  const statusColor = percCompletas >= 80 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";

  const pieData1 = [
    { name: "Previstas", value: data.atividadesPrevistas },
    { name: "Não Previstas", value: data.atividadesNaoPrevistas },
  ];

  const pieData2 = [
    { name: "Completas", value: data.atividadesCompletas },
    { name: "Atrasadas", value: data.atividadesAtrasadas },
    { name: "Não Iniciadas", value: data.atividadesNaoIniciadas },
  ];

  return (
    <div className="space-y-6 p-6 bg-[#f5f5f0] text-slate-900 rounded-xl border border-slate-200 shadow-sm max-w-[1200px] mx-auto font-sans">
      {/* Header Estilo Imagem */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-slate-300 pb-4">
        <div className="flex flex-col gap-1">
          <div className="bg-[#f97316] text-white px-4 py-2 rounded-sm font-bold text-xl uppercase tracking-wider">
            Relatório e Análise Semanal
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <span>Área Comum - Análise Cronograma</span>
            <span className="bg-slate-200 px-2 py-0.5 rounded">{data.periodo}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-300 pb-1 mb-1">Data de Análise: {data.dataAnalise}</div>
          <div className="text-2xl font-black text-[#3b82f6] tracking-tighter">SAN REMO</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Geral e Realizado */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seção Geral */}
            <div className="space-y-4">
              <div className="inline-block bg-[#a3a375] text-white px-3 py-1 text-sm font-bold rounded-sm">Geral</div>
              <div className="space-y-4">
                <div className="border-l-4 border-[#f97316] pl-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total de Atividades</div>
                  <div className="text-2xl font-black text-slate-800">{data.totalAtividades}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Atividades Previstas</div>
                    <div className="text-lg font-bold text-[#f97316]">{data.atividadesPrevistas}</div>
                    <div className="text-xs font-semibold text-slate-500">{percPrevistas}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Não Previstas</div>
                    <div className="text-lg font-bold text-slate-600">{data.atividadesNaoPrevistas}</div>
                    <div className="text-xs font-semibold text-slate-500">{percNaoPrevistas}%</div>
                  </div>
                </div>
              </div>

              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData1} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      <Cell fill="#f97316" />
                      <Cell fill="#fbbf24" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seção Realizado */}
            <div className="space-y-4">
              <div className="inline-block bg-[#a3a375] text-white px-3 py-1 text-sm font-bold rounded-sm">Realizado</div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Completas</div>
                    <div className="text-md font-bold text-green-600">{data.atividadesCompletas}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{percCompletas}%</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Atrasadas</div>
                    <div className="text-md font-bold text-red-500">{data.atividadesAtrasadas}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{percAtrasadas}%</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Não Inic.</div>
                    <div className="text-md font-bold text-slate-400">{data.atividadesNaoIniciadas}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{percNaoIniciadas}%</div>
                  </div>
                </div>
              </div>

              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData2} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#cbd5e1" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Análise Geral e Status */}
        <div className="space-y-6 border-l-2 border-slate-300 pl-6">
          <div className="bg-slate-900 text-white text-center py-2 font-bold text-sm uppercase">Análise Geral Área Comum</div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] font-bold text-[#f97316] uppercase underline underline-offset-4 mb-3">Status Atual</div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-center">
                  <div className="text-[9px] font-bold text-slate-400">{data.comparacao.dataAnterior}</div>
                  <div className="text-md font-bold text-slate-600">[{Math.round(percCompletas - data.comparacao.execucaoDecrescimo)}%]</div>
                  <div className="text-[8px] font-bold text-[#f97316]">Concluída</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-slate-400">{data.dataAnalise}</div>
                  <div className="text-md font-bold text-[#f97316]">[{percCompletas}%]</div>
                  <div className="text-[8px] font-bold text-[#f97316]">Concluída</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-bold text-slate-400">Evolução</div>
                  <div className={`text-md font-bold ${data.comparacao.execucaoDecrescimo < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    [{Math.abs(data.comparacao.execucaoDecrescimo)}%]
                  </div>
                  <div className="text-[8px] font-bold text-[#f97316]">Status</div>
                </div>
              </div>
            </div>

            <div className="bg-red-700 text-white text-center py-2 font-bold text-sm uppercase">Data Final - 20/10/2025</div>
            
            <div className="text-[10px] text-slate-500 italic leading-tight">
              OBS: Data final adiantada devido à alterações e atualizações no cronograma.
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Análise e Comparação */}
      <div className="space-y-4 pt-4 border-t-2 border-slate-300">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-black text-[#a3a375] uppercase tracking-tighter">Análise</div>
          <div className="text-xs font-bold text-slate-600">
            PARA A OBRA OCORRER BEM FOI CONSIDERADO QUE A PORCENTAGEM COMPLETA DEVE SER SUPERIOR A <span className="text-[#3b82f6]">80%</span>
          </div>
          <div className={`text-sm font-black px-3 py-1 rounded-sm inline-block w-fit ${statusColor}`}>
            AS ATIVIDADES DA OBRA {statusObra}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <div className="space-y-4">
            <div className="text-lg font-black text-[#a3a375] uppercase tracking-tighter">Comparação</div>
            <div className="text-xs font-bold text-slate-500">Comparação em relação ao relatório da semana ({data.comparacao.dataAnterior})</div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="shrink-0 mt-1"><TrendingUp className="w-4 h-4 text-slate-400" /></div>
                <p className="text-slate-700">
                  A execução de <span className="text-[#f97316] font-bold underline">atividades completas</span> comparadas a semana do dia {data.dataAnalise} teve um 
                  <span className="text-red-600 font-bold"> {data.comparacao.execucaoDecrescimo < 0 ? 'ACRÉSCIMO' : 'DECRÉSCIMO'} DE {Math.abs(data.comparacao.execucaoDecrescimo)}%</span>, 
                  representando assim, uma <span className="text-red-600 font-bold underline">{data.comparacao.execucaoDecrescimo < 0 ? 'MELHORA' : 'PIORA'}</span> na execução.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="shrink-0 mt-1"><AlertCircle className="w-4 h-4 text-slate-400" /></div>
                <p className="text-slate-700">
                  As <span className="text-red-500 font-bold underline">atividades incompletas</span> comparadas a semana anterior tiveram um 
                  <span className="text-red-600 font-bold"> ACRÉSCIMO DE {data.comparacao.incompletasAcrescimo}%</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase text-center mb-4">Evolução na Execução</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.evolucaoDados}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="data" hide />
                    <YAxis domain={[0, 100]} fontSize={10} tickFormatter={(v) => `${v}%`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase text-center mb-4">Atividades atrasadas</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.atrasadasDados}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="data" hide />
                    <YAxis domain={[0, 100]} fontSize={10} tickFormatter={(v) => `${v}%`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
