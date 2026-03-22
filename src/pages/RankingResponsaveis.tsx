import { useState } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ResponsavelPerformance {
  id: string;
  user_name: string;
  user_email: string;
  total_metas: number;
  metas_no_prazo: number;
  metas_atrasadas: number;
  metas_concluidas: number;
  taxa_sucesso: number;
  pontos_gamificacao: number;
}

export default function RankingResponsaveis() {
  const { isAdmin, userRole, loading: authLoading } = useAuth();
  const canView = isAdmin || userRole === "master";
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7));

  const { data: ranking, loading, refresh: fetchRanking } = useSupabaseQuery<ResponsavelPerformance>({
    table: "responsavel_performance",
    order: { column: "taxa_sucesso", ascending: false },
    filter: (q) => q.eq("mes_ano", mesAno),
    enabled: canView,
    errorMessage: "Erro ao carregar ranking",
  });

  useRealtimeTable("responsavel_performance", fetchRanking);

  const getTrophyColor = (posicao: number) => {
    switch (posicao) {
      case 0:
        return "text-yellow-500";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-orange-600";
      default:
        return "text-slate-500";
    }
  };

  const chartData = ranking.map((r) => ({
    name: r.user_name.split(" ")[0],
    "Taxa Sucesso": r.taxa_sucesso,
    "Metas Atrasadas": (r.metas_atrasadas / r.total_metas) * 100,
  }));

  const pontuacaoData = ranking.slice(0, 5).map((r) => ({
    name: r.user_name,
    pontos: r.pontos_gamificacao,
  }));

  if (!authLoading && !canView) return <AccessDenied requiredRole="Admin ou Master" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Trophy className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Ranking de Desempenho</h1>
          <p className="text-xs text-slate-500">Gamificação e análise de performance dos responsáveis</p>
        </div>
      </div>

      {/* Filtro de Mês */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {ranking.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ranking.slice(0, 3).map((responsavel, index) => (
                <Card key={responsavel.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                  <CardContent className="pt-6 text-center space-y-3">
                    <Trophy className={`w-8 h-8 mx-auto ${getTrophyColor(index)}`} />
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">
                        {index === 0 ? "🥇 1º Lugar" : index === 1 ? "🥈 2º Lugar" : "🥉 3º Lugar"}
                      </p>
                      <p className="text-lg font-bold mt-1">{responsavel.user_name}</p>
                      <p className="text-xs text-slate-400">{responsavel.user_email}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                      <div>
                        <p className="text-2xl font-bold text-green-400">{Math.round(responsavel.taxa_sucesso)}%</p>
                        <p className="text-[10px] text-slate-400">Taxa Sucesso</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-400">{responsavel.pontos_gamificacao}</p>
                        <p className="text-[10px] text-slate-400">Pontos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taxa de Sucesso */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Taxa de Sucesso vs Atrasos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Taxa Sucesso" fill="#10b981" />
                    <Bar dataKey="Metas Atrasadas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pontuação Top 5 */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" /> Top 5 Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pontuacaoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="pontos" fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Completa */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm">Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Responsável</th>
                      <th className="text-center py-3 px-4">Total Metas</th>
                      <th className="text-center py-3 px-4">No Prazo</th>
                      <th className="text-center py-3 px-4">Atrasadas</th>
                      <th className="text-center py-3 px-4">Concluídas</th>
                      <th className="text-center py-3 px-4">Taxa Sucesso</th>
                      <th className="text-center py-3 px-4">Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((responsavel, index) => (
                      <tr key={responsavel.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold">
                          {index < 3 ? (index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉") : index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{responsavel.user_name}</p>
                            <p className="text-[10px] text-slate-500">{responsavel.user_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{responsavel.total_metas}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-600">{responsavel.metas_no_prazo}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-red-600">{responsavel.metas_atrasadas}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-blue-600">{responsavel.metas_concluidas}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold ${responsavel.taxa_sucesso >= 80 ? "text-green-400" : responsavel.taxa_sucesso >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                            {Math.round(responsavel.taxa_sucesso)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-purple-400">
                          {responsavel.pontos_gamificacao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
