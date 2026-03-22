import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Acao {
  id: string;
  titulo: string;
  descricao: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  prioridade: "baixa" | "media" | "alta" | "critica";
  responsavel_nome: string;
  data_vencimento: string;
  percentual_completo: number;
}

interface MetaAcoesKanbanProps {
  metaId: string;
}

const statusLabels = {
  todo: "A Fazer",
  in_progress: "Fazendo",
  done: "Feito",
  blocked: "Bloqueado",
};

const statusColors = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
  blocked: "bg-red-500",
};

const prioridadeColors = {
  baixa: "bg-blue-100 text-blue-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-orange-100 text-orange-800",
  critica: "bg-red-100 text-red-800",
};

export function MetaAcoesKanban({ metaId }: MetaAcoesKanbanProps) {
  const { toast } = useToast();
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAcao, setShowNewAcao] = useState(false);
  const [novaAcao, setNovaAcao] = useState({
    titulo: "",
    descricao: "",
    responsavel_nome: "",
    data_vencimento: "",
    prioridade: "media" as const,
  });

  useEffect(() => {
    fetchAcoes();
  }, [metaId]);

  const fetchAcoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meta_acoes_kanban")
      .select("*")
      .eq("meta_id", metaId)
      .order("ordem", { ascending: true });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setAcoes(data || []);
    }
    setLoading(false);
  };

  const adicionarAcao = async () => {
    if (!novaAcao.titulo.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("meta_acoes_kanban").insert({
      meta_id: metaId,
      ...novaAcao,
      status: "todo",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Ação criada!" });
      setNovaAcao({ titulo: "", descricao: "", responsavel_nome: "", data_vencimento: "", prioridade: "media" });
      setShowNewAcao(false);
      fetchAcoes();
    }
  };

  const atualizarStatus = async (acaoId: string, novoStatus: Acao["status"]) => {
    const { error } = await supabase
      .from("meta_acoes_kanban")
      .update({ status: novoStatus })
      .eq("id", acaoId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchAcoes();
    }
  };

  const deletarAcao = async (acaoId: string) => {
    const { error } = await supabase
      .from("meta_acoes_kanban")
      .delete()
      .eq("id", acaoId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchAcoes();
    }
  };

  const acoesAgrupadas = {
    todo: acoes.filter(a => a.status === "todo"),
    in_progress: acoes.filter(a => a.status === "in_progress"),
    done: acoes.filter(a => a.status === "done"),
    blocked: acoes.filter(a => a.status === "blocked"),
  };

  const AcaoCard = ({ acao }: { acao: Acao }) => (
    <Card className="bg-slate-800 border-slate-700 cursor-move hover:shadow-lg transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm flex-1">{acao.titulo}</h4>
          <button
            onClick={() => deletarAcao(acao.id)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {acao.descricao && (
          <p className="text-xs text-slate-400">{acao.descricao}</p>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge className={`text-[10px] ${prioridadeColors[acao.prioridade]}`}>
            {acao.prioridade}
          </Badge>
        </div>

        {acao.responsavel_nome && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <User className="w-3 h-3" /> {acao.responsavel_nome}
          </div>
        )}

        {acao.data_vencimento && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" /> {new Date(acao.data_vencimento).toLocaleDateString("pt-BR")}
          </div>
        )}

        {acao.percentual_completo > 0 && (
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${acao.percentual_completo}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) return <div className="text-center py-8 text-slate-400">Carregando ações...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Ações da Meta (Kanban)</h3>
        <Button onClick={() => setShowNewAcao(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Nova Ação
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(acoesAgrupadas) as Array<keyof typeof acoesAgrupadas>).map((status) => (
          <div key={status} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
              <h4 className="font-semibold text-sm">{statusLabels[status]}</h4>
              <span className="ml-auto text-xs text-slate-500">{acoesAgrupadas[status].length}</span>
            </div>

            <div className="space-y-2">
              {acoesAgrupadas[status].map((acao) => (
                <div
                  key={acao.id}
                  draggable
                  onDragEnd={() => {
                    const nextStatus = {
                      todo: "in_progress",
                      in_progress: "done",
                      done: "blocked",
                      blocked: "todo",
                    }[status] as Acao["status"];
                    atualizarStatus(acao.id, nextStatus);
                  }}
                  className="group"
                >
                  <AcaoCard acao={acao} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Ação */}
      <Dialog open={showNewAcao} onOpenChange={setShowNewAcao}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Nova Ação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Título</label>
              <Input
                placeholder="Ex: Pintar parede"
                value={novaAcao.titulo}
                onChange={(e) => setNovaAcao({ ...novaAcao, titulo: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Descrição</label>
              <Input
                placeholder="Detalhes da ação"
                value={novaAcao.descricao}
                onChange={(e) => setNovaAcao({ ...novaAcao, descricao: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Responsável</label>
              <Input
                placeholder="Nome do responsável"
                value={novaAcao.responsavel_nome}
                onChange={(e) => setNovaAcao({ ...novaAcao, responsavel_nome: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Data de Vencimento</label>
              <Input
                type="date"
                value={novaAcao.data_vencimento}
                onChange={(e) => setNovaAcao({ ...novaAcao, data_vencimento: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowNewAcao(false)}>
                Cancelar
              </Button>
              <Button onClick={adicionarAcao}>Criar Ação</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
