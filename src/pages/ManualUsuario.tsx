import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  BookOpen, ChevronDown, ChevronRight, Search, Shield, LayoutDashboard,
  Target, FileText, Download, HardHat, Building2, DollarSign,
} from "lucide-react";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: { title: string; body: string }[];
}

const sections: ManualSection[] = [
  {
    id: "intro",
    title: "Introdução ao Sistema",
    icon: BookOpen,
    content: [
      {
        title: "Sobre o ERP San Remo",
        body: `O ERP San Remo é a plataforma de gestão da **San Remo Construtora**. Centraliza informações de obras, metas, financeiro, contratos e materiais em dashboards no estilo Power BI.\n\n**Módulos disponíveis:**\n- **Dashboard** — Indicadores gerais da empresa com filtro por ano\n- **Metas** — Acompanhamento de OKRs e metas vinculadas a obras\n- **Execução de Obra** — Progresso físico por etapa (Fundação, Estrutura...)\n- **Gestão de Obras** — Empreendimentos, contratos e estoque\n- **Financeiro** — Faturamento, contas a pagar e a receber\n- **Relatórios** — Exportação em PDF e Excel com filtro de período\n- **Manual** — Esta documentação`,
      },
      {
        title: "Requisitos do Sistema",
        body: `**Navegadores compatíveis:**\n- Google Chrome 90+ (recomendado)\n- Mozilla Firefox 88+\n- Microsoft Edge 90+\n- Safari 14+\n\n**Requisitos mínimos:**\n- Conexão de internet estável\n- Resolução mínima: 1024×768\n- JavaScript habilitado`,
      },
    ],
  },
  {
    id: "login",
    title: "Login e Acesso",
    icon: Shield,
    content: [
      {
        title: "Como fazer login",
        body: `1. Acesse a página de login\n2. Informe seu **e-mail** e **senha** cadastrados\n3. Clique em **"Entrar no Sistema"**\n\nAs credenciais são fornecidas pelo administrador do sistema.`,
      },
      {
        title: "Recuperação de Senha",
        body: `1. Na tela de login, clique em **"Esqueceu a senha?"**\n2. Informe o e-mail da sua conta\n3. Verifique sua caixa de entrada (e spam)\n4. Siga o link recebido para definir nova senha`,
      },
      {
        title: "Seu Nível de Acesso (Usuário Normal)",
        body: `Como **usuário normal** você pode:\n- Visualizar o Dashboard com indicadores gerais\n- Acompanhar o progresso das metas\n- Visualizar Execução de Obra, Gestão de Obras e Financeiro\n- Consultar este manual\n\n**Não disponível no seu perfil:**\n- Criar, editar ou excluir metas\n- Cadastrar obras ou empreendimentos\n- Gerar relatórios ou importar dados\n- Gerenciar usuários ou fazer backup`,
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    content: [
      {
        title: "Visão Geral",
        body: `O Dashboard é a tela principal. Exibe indicadores da empresa de forma visual e atualizada.\n\n**O que você verá:**\n- KPIs: Faturamento do ano, Obras Ativas, Unidades Vendidas, Contratos\n- Resumo de Metas & OKRs (total, atingidas, em risco, no prazo)\n- Seções separadas: **Metas de Obra** vs **Metas Estratégicas**\n- Gráfico de Faturamento vs Custos filtrado pelo ano\n- Mapa de Saúde por categoria (Engenharia, Projetos, Orçamentos...)\n- Progresso das Obras em execução\n\n**Nota:** Dados financeiros detalhados e mapa de saúde são visíveis apenas para admin e master.`,
      },
      {
        title: "Filtro de Ano",
        body: `Na barra de filtros do Dashboard existe o seletor de **Ano**.\n\n**Como usar:**\n1. Clique no botão **"Ano: XXXX"** no topo do Dashboard\n2. Selecione o ano desejado (2024, 2025, 2026, 2027)\n3. O gráfico de Faturamento vs Custos e o KPI de faturamento atualizam automaticamente\n\nSe não houver dados financeiros no ano selecionado, o sistema informa quais anos têm dados disponíveis.`,
      },
      {
        title: "Metas de Obra vs Metas Estratégicas",
        body: `O Dashboard separa as metas em dois blocos distintos:\n\n**Metas de Obra**\n- Metas vinculadas a uma obra específica do módulo Execução de Obra\n- Representam atividades de engenharia diretamente ligadas à execução física\n- Ex: "Concluir fundação do Bloco A", "Instalar hidráulica do 3º andar"\n\n**Metas Estratégicas**\n- Metas sem vínculo com obra — financeiras, comerciais, administrativas\n- Ex: "Atingir R$ 2M de faturamento", "Contratar 3 engenheiros"\n\nCada bloco mostra atingidas, em risco, no prazo e % de conclusão independente.`,
      },
      {
        title: "Mapa de Saúde",
        body: `O Mapa de Saúde mostra o percentual de metas atingidas por categoria:\n\n- **Engenharia, Projetos, Orçamentos, Contratos, Quantitativos, Materiais**\n\nO percentual é calculado com dados reais: metas atingidas ÷ total de metas da categoria.\n\nSe uma categoria mostra **"—"**, significa que nenhuma meta foi cadastrada com essa categoria ainda.\n\n**Para aparecer no mapa:** ao criar uma meta, selecione uma das categorias acima no campo Categoria.`,
      },
    ],
  },
  {
    id: "metas",
    title: "Metas",
    icon: Target,
    content: [
      {
        title: "Visualizando Metas",
        body: `1. Acesse **Metas** no menu lateral\n2. Use os filtros de categoria, ciclo, status e busca\n3. Cada meta exibe: nome, categoria, responsável, progresso, prioridade e status\n\n**Badges no card da meta:**\n- Status colorido (Atingida, No Prazo, Atenção, Em Risco)\n- Prioridade (Alta, Média, Baixa)\n- Ciclo\n- Badge azul 🏗️ com nome da obra — se a meta estiver vinculada a uma obra\n\n**Nota:** Para criar ou editar metas é necessário ser admin ou master.`,
      },
      {
        title: "Metas Vinculadas a Obras",
        body: `Uma meta pode ser vinculada a uma obra de execução.\n\n**O que significa o vínculo:**\n- A meta aparece no bloco "Metas de Obra" no Dashboard\n- Um badge azul 🏗️ com o nome da obra aparece no card da meta\n- Permite conectar atividades de engenharia ao progresso físico da obra\n\n**Como identificar:**\n- Card sem badge = Meta Estratégica\n- Card com badge 🏗️ = Meta de Obra vinculada`,
      },
      {
        title: "Abas do Módulo de Metas",
        body: `O módulo tem várias abas:\n\n- **Editor** — Lista de metas com filtros e edição\n- **Ações** — Planos e tarefas vinculados a cada meta\n- **Timeline** — Histórico de check-ins e atualizações\n- **Analytics** — Gráficos de progresso por categoria\n- **Ranking** — Desempenho por responsável`,
      },
    ],
  },
  {
    id: "execucao",
    title: "Execução de Obra",
    icon: HardHat,
    content: [
      {
        title: "O que é a Execução de Obra",
        body: `O módulo de **Execução de Obra** acompanha o progresso físico real das obras por etapa.\n\n**Diferente dos Empreendimentos** (que é um cadastro comercial), a Execução de Obra é o controle detalhado de andamento:\n- Etapa atual: Fundação, Estrutura, Alvenaria, Instalações, Acabamentos, Entregue\n- Percentual real de conclusão (0 a 100%)\n- Responsável e datas de início/previsão\n- Indicador de obras atrasadas (data prevista < hoje)\n\nO progresso cadastrado aqui alimenta o card **"Progresso das Obras"** no Dashboard.`,
      },
      {
        title: "Visualizando Obras",
        body: `Cada card de obra exibe:\n- Nome e etapa atual (badge colorido)\n- Barra de progresso com % real\n- Badge **"Atrasada"** se a data prevista já passou\n- Badge **"Concluída"** se a etapa for "Entregue"\n- Responsável e datas\n- Observações\n\n**Nota:** Criar e editar obras exige permissão de admin ou master.`,
      },
      {
        title: "Gráficos do Módulo",
        body: `O módulo exibe dois gráficos:\n\n**Obras por Etapa** — Quantas obras estão em cada fase\n\n**Progresso Médio por Etapa** — Média de conclusão das obras em cada etapa\n\nAmbos atualizam automaticamente ao cadastrar ou editar obras.`,
      },
    ],
  },
  {
    id: "gestao",
    title: "Gestão de Obras",
    icon: Building2,
    content: [
      {
        title: "Empreendimentos",
        body: `A aba **Empreendimentos** lista os projetos imobiliários da construtora.\n\nInformações exibidas:\n- Código, nome, fase e status\n- Unidades totais e vendidas (com barra de progresso)\n- Previsão de entrega\n\nUse a **busca** no topo da tabela para filtrar por nome, código ou endereço.\n\n**Nota:** Criar, editar e excluir empreendimentos exige admin ou master.`,
      },
      {
        title: "Contratos",
        body: `A aba **Contratos** lista os contratos com fornecedores.\n\nInformações: número, fornecedor, objeto, data, valor e status.\n\nUse a **busca** para filtrar por fornecedor, número ou objeto do contrato.`,
      },
      {
        title: "Materiais (Estoque)",
        body: `A aba **Materiais** controla o estoque por canteiro.\n\n**Status de estoque:**\n- 🟢 **OK** — Quantidade > 1,5× o mínimo\n- 🟡 **Baixo** — Quantidade entre mínimo e 1,5× o mínimo\n- 🔴 **Crítico** — Quantidade ≤ mínimo\n\nO badge **"X crítico(s)"** aparece no título quando há materiais em nível crítico.\n\nUse a **busca** para filtrar por nome, código ou canteiro.`,
      },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: DollarSign,
    content: [
      {
        title: "Visão Geral do Financeiro",
        body: `O módulo Financeiro tem 3 abas:\n\n- **Faturamento** — Notas fiscais emitidas\n- **Contas a Pagar** — Obrigações com fornecedores\n- **Contas a Receber** — Valores a receber de clientes\n\nEm cada aba existe uma **barra de busca** para filtrar registros por cliente, fornecedor ou descrição. A busca limpa automaticamente ao trocar de aba.`,
      },
      {
        title: "Status dos Registros",
        body: `Cada lançamento financeiro tem um status:\n\n- 🟢 **Pago / Recebido** — Liquidado\n- 🟡 **Pendente** — Aguardando pagamento\n- 🔴 **Atrasado** — Vencido e não pago\n- ⚫ **Cancelado** — Anulado\n\nO gráfico de **Fluxo de Caixa** (Entrada vs Saída por mês) aparece acima das tabelas.`,
      },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileText,
    content: [
      {
        title: "Gerando Relatórios",
        body: `1. Acesse **Relatórios** no menu lateral\n2. Selecione o tipo (Geral, Vendas, Custos ou Metas)\n3. Aplique o período desejado\n4. Exporte em **PDF** ou **Excel**\n\n**Nota:** Gerar relatórios exige permissão de admin ou master.`,
      },
      {
        title: "Filtro de Período",
        body: `A barra de filtros tem dois modos:\n\n**Período rápido** — Botões de atalho:\n- Esta semana, Semana passada\n- Este mês, Mês passado\n- Últimos 30 dias, Últimos 90 dias, Este ano\n\n**Período customizado** — Campos "De" e "Até" para qualquer intervalo\n\nO botão selecionado fica destacado em amarelo. Ao digitar manualmente nas datas, o botão rápido deseleciona automaticamente.\n\n**Para o Relatório de Metas:** o filtro usa o campo **prazo** das metas. Metas sem prazo sempre aparecem.`,
      },
      {
        title: "Formatos de Exportação",
        body: `**PDF Profissional:**\n- Cabeçalho com logo San Remo\n- KPIs em destaque\n- Tabela detalhada\n- Resumo por categoria\n- Rodapé com data e usuário\n\n**Excel (4 abas):**\n- Resumo — KPIs e totais\n- Detalhamento — Registros individuais\n- Por Categoria — Agrupamento e médias\n- Mensal (financeiro) ou Ranking (metas)`,
      },
    ],
  },
  {
    id: "navegacao",
    title: "Navegação e Dicas",
    icon: BookOpen,
    content: [
      {
        title: "Menu Lateral",
        body: `O menu lateral organiza os módulos em seções:\n\n**Visão Geral:**\n- Dashboard, Metas, Execução de Obra, Relatórios\n\n**Dados:**\n- Cadastro de Dados, Importar Excel\n\n**Financeiro:**\n- Faturamento, Contas a Pagar, Contas a Receber\n\n**Obras:**\n- Empreendimentos, Contratos, Materiais\n\n**Ajuda:**\n- Manual (esta página)\n\nClique no ícone ☰ no topo para recolher/expandir o menu.`,
      },
      {
        title: "Dicas de Uso",
        body: `- **Tema:** Use o ícone 🌙/☀️ para alternar entre modo claro e escuro\n- **Responsivo:** Funciona em celular, tablet e desktop\n- **Busca:** Cada listagem tem campo de busca — use-o para filtrar rapidamente\n- **Confirmação:** Excluir qualquer registro abre uma confirmação antes de remover\n- **Tempo real:** Metas e cadastros atualizam automaticamente via Supabase Realtime`,
      },
      {
        title: "Problemas Comuns",
        body: `**Não consigo fazer login:**\n- Verifique e-mail e senha (maiúsculas importam)\n- Use "Esqueceu a senha?" para redefinir\n- Contate o administrador se persistir\n\n**Os dados não aparecem:**\n- Verifique sua conexão de internet\n- Atualize a página (F5)\n- Verifique se o período/filtro está correto\n\n**Uma categoria não aparece no Mapa de Saúde:**\n- Verifique se há metas cadastradas com essa categoria exata\n- As categorias do mapa são: Engenharia, Projetos, Orçamentos, Contratos, Quantitativos, Materiais\n\n**Suporte:** Contate o administrador informando a tela e o erro encontrado.`,
      },
    ],
  },
];

export default function ManualUsuario() {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(["intro"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<{ sectionId: string; topicIndex: number } | null>({ sectionId: "intro", topicIndex: 0 });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const filteredSections = searchTerm
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.content.some((t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.body.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : sections;

  const currentTopic = selectedTopic
    ? sections.find((s) => s.id === selectedTopic.sectionId)?.content[selectedTopic.topicIndex]
    : null;
  const currentSection = selectedTopic ? sections.find((s) => s.id === selectedTopic.sectionId) : null;

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[hsl(var(--pbi-yellow))] font-semibold">$1</strong>');
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-4 text-[12px] leading-relaxed" style={{ color: "hsl(var(--pbi-text-primary))" }} dangerouslySetInnerHTML={{ __html: line.slice(2) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-4 text-[12px] leading-relaxed list-decimal" style={{ color: "hsl(var(--pbi-text-primary))" }} dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, "") }} />;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="text-[12px] leading-relaxed" style={{ color: "hsl(var(--pbi-text-primary))" }} dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  const allTopics = sections.flatMap((s) => s.content.map((_, i) => ({ sectionId: s.id, topicIndex: i })));
  const currentIdx = allTopics.findIndex((t) => t.sectionId === selectedTopic?.sectionId && t.topicIndex === selectedTopic?.topicIndex);

  const goTo = (idx: number) => {
    const t = allTopics[idx];
    if (t) {
      setSelectedTopic(t);
      if (!expandedSections.includes(t.sectionId)) setExpandedSections((p) => [...p, t.sectionId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-foreground">Manual do Usuário</h1>
            <p className="text-[11px] text-muted-foreground">Guia completo de uso do sistema ERP San Remo</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 h-7 px-3 rounded text-[11px] font-medium" style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
          <Download className="w-3 h-3" /> Imprimir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2" style={{ background: "hsl(var(--pbi-surface))", borderRadius: "6px", padding: "8px 12px", border: "1px solid hsl(var(--pbi-border))" }}>
            <Search className="w-3.5 h-3.5" style={{ color: "hsl(var(--pbi-text-secondary))" }} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar no manual..." className="bg-transparent border-none outline-none text-[12px] flex-1" style={{ color: "hsl(var(--pbi-text-primary))" }} />
          </div>
          <div className="pbi-tile p-0 overflow-hidden">
            <div className="px-3 py-2" style={{ borderBottom: "1px solid hsl(var(--pbi-border))" }}>
              <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--pbi-text-primary))" }}>Índice</p>
            </div>
            <div className="py-1">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                const expanded = expandedSections.includes(section.id);
                return (
                  <div key={section.id}>
                    <button onClick={() => toggleSection(section.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"}`} style={{ color: "hsl(var(--pbi-text-primary))" }}>
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--pbi-yellow))" }} />
                      <span className="flex-1 text-left">{section.title}</span>
                      {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {expanded && (
                      <div className="pb-1">
                        {section.content.map((topic, idx) => {
                          const isSelected = selectedTopic?.sectionId === section.id && selectedTopic?.topicIndex === idx;
                          return (
                            <button key={idx} onClick={() => setSelectedTopic({ sectionId: section.id, topicIndex: idx })} className="w-full text-left px-3 pl-9 py-1.5 text-[11px] transition-colors"
                              style={{ color: isSelected ? "hsl(var(--pbi-yellow))" : "hsl(var(--pbi-text-secondary))", background: isSelected ? "hsl(var(--pbi-yellow) / 0.08)" : "transparent" }}>
                              {topic.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="lg:col-span-3">
          {currentTopic && currentSection ? (
            <div className="pbi-tile">
              <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid hsl(var(--pbi-border))" }}>
                <currentSection.icon className="w-4 h-4" style={{ color: "hsl(var(--pbi-yellow))" }} />
                <span className="text-[11px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>{currentSection.title}</span>
                <span style={{ color: "hsl(var(--pbi-text-secondary))" }}>/</span>
                <span className="text-[11px] font-medium" style={{ color: "hsl(var(--pbi-text-primary))" }}>{currentTopic.title}</span>
              </div>
              <h2 className="text-[16px] font-bold mb-4" style={{ color: "hsl(var(--pbi-yellow))" }}>{currentTopic.title}</h2>
              <div className="space-y-1">{renderMarkdown(currentTopic.body)}</div>
              <div className="flex justify-between mt-8 pt-4" style={{ borderTop: "1px solid hsl(var(--pbi-border))" }}>
                <button onClick={() => goTo(currentIdx - 1)} disabled={currentIdx <= 0} className="text-[11px] px-3 py-1.5 rounded transition-colors disabled:opacity-30"
                  style={{ background: "hsl(var(--pbi-surface))", color: "hsl(var(--pbi-text-secondary))", border: "1px solid hsl(var(--pbi-border))" }}>
                  ← Anterior
                </button>
                <span className="text-[10px] text-muted-foreground self-center">{currentIdx + 1} / {allTopics.length}</span>
                <button onClick={() => goTo(currentIdx + 1)} disabled={currentIdx >= allTopics.length - 1} className="text-[11px] px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-30"
                  style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                  Próximo →
                </button>
              </div>
            </div>
          ) : (
            <div className="pbi-tile flex items-center justify-center py-20">
              <div className="text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--pbi-text-secondary))" }} />
                <p className="text-[13px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>Selecione um tópico no índice</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
