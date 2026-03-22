import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import {
  BookOpen, ChevronDown, ChevronRight, Search, Shield, LayoutDashboard,
  Target, FileText, Users, HardDrive, FileSpreadsheet, Download,
  HardHat, Building2, Bell, Database, Link2,
} from "lucide-react";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: { title: string; body: string }[];
}

const sections: ManualSection[] = [
  {
    id: "visao-geral",
    title: "Visão Geral do Admin",
    icon: Shield,
    content: [
      {
        title: "Permissões do Administrador",
        body: `Como **Administrador**, você tem acesso total ao sistema ERP San Remo.\n\n**Exclusivo do Admin:**\n- Dashboard completo com dados financeiros\n- Criar, editar, excluir metas e vincular a obras\n- Gerar relatórios PDF e Excel com filtros de período\n- Importar dados via Excel\n- Cadastro de dados financeiros\n- Criar, editar e excluir usuários\n- Atribuir roles (Admin, Master, Normal)\n- Backup e restauração completa\n- Acesso ao Manual Admin (esta página)\n- Excluir empreendimentos, contratos, obras e registros financeiros`,
      },
      {
        title: "Níveis de Acesso",
        body: `O sistema possui quatro níveis:\n\n**Admin**\n- Acesso total — todos os módulos, backup, usuários\n- Único que pode excluir usuários e acessar este manual\n\n**Master**\n- Dashboard completo com financeiro\n- Criar e editar metas, relatórios, importação, cadastro\n- Criar e editar obras de execução\n- Não pode gerenciar usuários nem backup\n\n**Normal**\n- Dashboard resumido (sem financeiro, sem mapa de saúde)\n- Visualizar metas (sem editar) e Meu Espaço\n- Não pode criar, editar ou excluir nada\n\n**Almoxarife** (novo)\n- Acesso exclusivo ao módulo Almoxarifado\n- Gerencia ativos REMO, transferências, destinos e fotos\n- Não vê metas, financeiro, obras ou relatórios\n- Ideal para funcionários operacionais do estoque`,
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    content: [
      {
        title: "Filtro de Ano Funcional",
        body: `O filtro de ano no Dashboard agora é funcional.\n\n**Como funciona:**\n1. Clique no botão **"Ano: XXXX"** no topo\n2. Selecione o ano (2024, 2025, 2026, 2027)\n3. O gráfico de Faturamento vs Custos e o KPI de faturamento filtram automaticamente\n\nSe não houver dados no ano selecionado, o sistema informa quais anos têm dados disponíveis. O faturamento exibido no KPI é o total do ano selecionado.`,
      },
      {
        title: "Seções Metas de Obra vs Estratégicas",
        body: `O Dashboard agora separa metas em dois blocos:\n\n**Metas de Obra** (ícone de capacete 🏗️)\n- Metas com campo "Obra vinculada" preenchido\n- Representam atividades de engenharia ligadas à execução física\n- Exibe: atingidas, em risco, no prazo e % de conclusão\n\n**Metas Estratégicas** (ícone de alvo 🎯)\n- Metas sem vínculo com obra\n- Financeiras, comerciais, de RH, etc.\n- Mesmos indicadores independentes\n\nO "Resumo Geral" abaixo mostra a divisão total: Obra: X · Estratégicas: Y`,
      },
      {
        title: "Mapa de Saúde",
        body: `O Mapa de Saúde calcula dados reais do banco:\n\n**Como funciona:**\n- Busca todas as metas com o campo categoria\n- Para cada categoria (Engenharia, Projetos, Orçamentos, Contratos, Quantitativos, Materiais), calcula: atingidas ÷ total\n- Exibe % real, contagem "X/Y metas" e status (Ótimo/Regular/Atenção/Sem metas)\n\n**Para funcionar corretamente:**\nAs categorias do formulário de metas devem incluir as mesmas 6 categorias do mapa. Veja a seção "Categorias de Metas" para alinhar.`,
      },
    ],
  },
  {
    id: "metas",
    title: "Gestão de Metas",
    icon: Target,
    content: [
      {
        title: "Criando uma Meta",
        body: `1. Acesse **Metas** no menu lateral\n2. Clique em **"Nova Meta"**\n3. Preencha os campos obrigatórios:\n   - **Nome** da meta\n   - **Valor Atual / Objetivo** (ou deixe como qualitativa)\n   - **Categoria** — use uma das 6 do Mapa de Saúde quando for meta de obra\n4. Ative campos opcionais pelos toggles (Responsável, Prazo, Ciclo, etc.)\n5. **Obra vinculada** — se for meta de obra, selecione a obra correspondente\n6. Clique em **"Criar Meta"**`,
      },
      {
        title: "Vinculando Meta a uma Obra",
        body: `No formulário de nova meta (e na edição), existe o campo:\n\n**"Obra vinculada (opcional)"**\n\n- Mostra lista de obras cadastradas no módulo Execução de Obra\n- Formato: "Nome da obra · Etapa atual"\n- Selecionar = Meta de Obra (aparece no bloco correspondente do Dashboard)\n- Deixar em branco = Meta Estratégica\n\n**Para que a lista apareça:**\nObras precisam estar cadastradas em Execução de Obra. Se a lista estiver vazia, cadastre obras primeiro.`,
      },
      {
        title: "Editando uma Meta",
        body: `1. Passe o mouse sobre a meta e clique no **lápis** ✏️\n2. Edite qualquer campo, incluindo o vínculo com obra\n3. Clique em **"Salvar Alterações"**\n\n**Nota:** Alterar o valor atual gera check-in automático com registro na timeline.`,
      },
      {
        title: "Categorias de Metas",
        body: `As categorias base disponíveis incluem:\n- Engenharia, Projetos, Orçamentos, Contratos, Quantitativos, Materiais\n- Financeiro, Vendas, Operacional, Qualidade, RH\n\n**Para o Mapa de Saúde funcionar corretamente:**\nCadastre metas usando exatamente: Engenharia, Projetos, Orçamentos, Contratos, Quantitativos ou Materiais.\n\nPara categorias personalizadas:\n1. Selecione **"✨ Outra (personalizada)"**\n2. Digite o nome\n3. A nova categoria aparece automaticamente nos filtros`,
      },
      {
        title: "Badge de Obra no Card",
        body: `Metas vinculadas a obras exibem um badge azul 🏗️ com o nome da obra no card.\n\nIsso permite identificar rapidamente:\n- Quais metas são de execução física\n- A qual obra cada meta pertence\n- Sem precisar abrir o formulário de edição`,
      },
    ],
  },
  {
    id: "execucao",
    title: "Metas por Fase de Obra",
    icon: Target,
    topics: [
      {
        id: 8100,
        title: "Criar metas automáticas por fase",
        body: `Na página **Execução de Obra**, cada obra possui o botão **"+ Metas da Fase"**.\n\nAo clicar, aparece a lista de metas sugeridas para a fase atual da obra (ex: para Fundação aparecem: sondagem, estacas, concretagem...).\n\n**Fluxo completo:**\n1. Selecione/deselecione metas clicando nelas\n2. Informe o valor objetivo (m², unidades, kg) para cada uma selecionada\n3. Clique em **"Criar Metas Selecionadas"**\n4. Confirme no modal de revisão\n\nAs metas são criadas no módulo Metas com:\n- Obra vinculada (obra_id)\n- Fase/etapa preenchida\n- Responsável da obra\n- Prazo da obra\n- Categoria e prioridade da sugestão`,
      },
      {
        id: 8101,
        title: "Gerenciar sugestões por fase",
        body: `Clique em **"Gerenciar Sugestões"** no topo da página Execução de Obra.\n\n**Ações disponíveis:**\n- **Adicionar** nova sugestão: nome, descrição, unidade, objetivo padrão, prioridade, categoria\n- **Editar** sugestão existente clicando no lápis\n- **Ativar/Desativar** sugestões (toggle verde/cinza) sem perder os dados\n- **Excluir** permanentemente\n\nAs sugestões ficam salvas no banco (tabela metas_sugestoes_fase) e são compartilhadas entre todos os usuários admin/master.`,
      },
      {
        id: 8102,
        title: "Editar e excluir metas vinculadas à obra",
        body: `No card de cada obra, clique no badge roxo **"X metas ▼"** para expandir a lista.\n\nCada meta exibe: nome, barra de progresso, status e prioridade.\n\n**Para editar inline** (sem sair da tela):\n1. Clique no lápis da meta\n2. Edite nome, valor atual, objetivo, unidade ou prioridade\n3. O status é recalculado automaticamente\n4. Clique em "Salvar"\n\n**Para excluir:** Clique na lixeira. A meta é removida do banco e some do módulo Metas também.`,
      },
    ],
  },
  {
    title: "Execução de Obra",
    icon: HardHat,
    content: [
      {
        title: "Cadastrando uma Obra",
        body: `1. Acesse **Execução de Obra** no menu lateral\n2. Clique em **"Nova Obra"**\n3. Preencha:\n   - **Nome** da obra (obrigatório)\n   - **Etapa Atual** — Fundação, Estrutura, Alvenaria, Instalações, Acabamentos, Entregue\n   - **Progresso (%)** — slider de 0 a 100 com o percentual real\n   - **Responsável, Data de Início, Previsão de Entrega**\n   - **Observações** opcionais\n4. Clique em **"Salvar"**\n\nO progresso cadastrado alimenta o card "Progresso das Obras" no Dashboard.`,
      },
      {
        title: "Editando e Excluindo Obras",
        body: `**Editar:** Clique no ícone de lápis ✏️ no card da obra. O formulário abre pré-preenchido.\n\n**Excluir:** Clique no ícone de lixeira. Uma confirmação é exibida antes de remover.\n\n**Atenção:** Excluir uma obra remove o vínculo de todas as metas associadas (obra_id fica null nas metas). As metas continuam existindo, mas passam a ser tratadas como estratégicas.`,
      },
      {
        title: "Obras Atrasadas",
        body: `O sistema marca automaticamente obras com badge **"Atrasada"** quando:\n- A data prevista de entrega já passou\n- A etapa ainda não é "Entregue"\n\nO KPI **"Atrasadas"** no topo do módulo conta essas obras.\n\nO sistema também gera uma **notificação automática** para admins quando uma obra está atrasada (via Edge Function de alertas).`,
      },
    ],
  },
  {
    id: "alertas",
    title: "Alertas Automáticos",
    icon: Bell,
    content: [
      {
        title: "Como Funcionam os Alertas",
        body: `O sistema gera notificações automáticas para admins via Edge Function **alertas-prazo**.\n\n**Tipos de alerta gerados:**\n\n1. **Meta em risco** — Meta com status "em_risco" ou "atenção" e prazo futuro\n2. **Meta atrasada** — Meta com prazo vencido e não atingida\n3. **Obra atrasada** — Obra com data prevista vencida e não entregue\n\nTodos aparecem no **sino de notificações** (🔔) no topo do sistema.`,
      },
      {
        title: "Configurar Agendamento",
        body: `A Edge Function precisa ser agendada no Supabase para rodar automaticamente.\n\n**Via Supabase Dashboard:**\n1. Acesse seu projeto no supabase.com\n2. Vá em **Edge Functions** → **alertas-prazo**\n3. Configure o Schedule: \`0 8 * * *\` (todo dia às 08:00)\n\n**Via SQL (pg_cron):**\nSe o pg_cron estiver habilitado, execute:\n\n\`\`\`\nselect cron.schedule(\n  'alertas-prazo-diario',\n  '0 8 * * *',\n  $$ select public.gerar_alertas_prazo(); $$\n);\n\`\`\`\n\n**Teste manual:** Acesse a URL da Edge Function via GET para executar imediatamente.`,
      },
      {
        title: "Deduplicação de Alertas",
        body: `O sistema não cria alertas duplicados.\n\nAntes de criar uma notificação, verifica se já existe uma não lida para o mesmo item. Se já existir, não cria outra.\n\n**Para limpar alertas antigos:** Marque as notificações como lidas no sino 🔔. Após marcar como lida, o sistema pode criar novo alerta na próxima execução se o problema persistir.`,
      },
    ],
  },
  {
    id: "gestao-obras",
    title: "Gestão de Obras",
    icon: Building2,
    content: [
      {
        title: "Empreendimentos — Novo: Edição",
        body: `Empreendimentos agora têm **edição completa**.\n\n**Como editar:**\n1. Na tabela de empreendimentos, clique no ícone de lápis ✏️\n2. O formulário abre pré-preenchido com todos os dados\n3. Edite os campos necessários\n4. Clique em **"Salvar Alterações"**\n\nOs campos editáveis são: código, nome, fase, unidades, vendidas, status, previsão e endereço.`,
      },
      {
        title: "Busca nas Listagens",
        body: `Todas as 3 abas de Gestão de Obras têm **busca em tempo real**:\n\n- **Empreendimentos** — busca por nome, código ou endereço\n- **Contratos** — busca por fornecedor, número ou objeto\n- **Materiais** — busca por nome, código ou canteiro\n\nO contador ao lado do título mostra: "(filtrados/total)" quando a busca está ativa.\n\nClique no X para limpar a busca.`,
      },
      {
        title: "Confirmação de Exclusão",
        body: `Todas as exclusões em Gestão de Obras agora pedem confirmação:\n\n1. Clique no ícone de lixeira\n2. Um modal aparece com o nome do item a ser excluído\n3. Clique em **"Excluir"** para confirmar ou **"Cancelar"** para desistir\n\nIsso evita exclusões acidentais.`,
      },
      {
        title: "Estoque Crítico",
        body: `Na aba **Materiais**, o badge **"X crítico(s)"** aparece quando há materiais com quantidade ≤ mínimo.\n\n**Status de estoque:**\n- 🟢 OK — quantidade > 1,5× o mínimo\n- 🟡 Baixo — entre mínimo e 1,5× o mínimo\n- 🔴 Crítico — quantidade ≤ mínimo\n\nMateriais críticos também podem gerar alertas automáticos — veja a seção "Alertas Automáticos".`,
      },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: Database,
    content: [
      {
        title: "Busca e Confirmação de Exclusão",
        body: `O módulo Financeiro agora tem:\n\n**Busca em tempo real** em cada aba:\n- Faturamento — busca por número da NF, cliente ou observações\n- Contas a Pagar — busca por fornecedor, descrição ou categoria\n- Contas a Receber — busca por cliente, descrição ou categoria\n\nA busca **limpa automaticamente** ao trocar de aba.\n\n**Confirmação de exclusão** — Toda exclusão abre modal de confirmação antes de remover.`,
      },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileText,
    content: [
      {
        title: "Filtro de Período",
        body: `A barra de filtros tem:\n\n**Atalhos de período:**\n- Esta semana / Semana passada\n- Este mês / Mês passado\n- Últimos 30 dias / Últimos 90 dias / Este ano\n\n**Período customizado:** campos "De" e "Até"\n\nO botão selecionado fica amarelo. Ao editar manualmente as datas, o atalho deseleciona.`,
      },
      {
        title: "Relatório de Metas com Filtro",
        body: `O filtro de período agora funciona para metas.\n\n**Como filtra:** usa o campo **prazo** da meta. Metas cujo prazo está dentro do intervalo selecionado são incluídas.\n\nMetas sem prazo sempre aparecem (não têm como ser "fora do período").\n\n**Indicador de filtro ativo:** quando o filtro exclui metas, aparece um aviso:\n"Filtrado por período (X metas fora do intervalo)"\n\nO contador e o PDF/Excel exportam apenas as metas filtradas.`,
      },
    ],
  },
  {
    id: "usuarios",
    title: "Usuários",
    icon: Users,
    content: [
      {
        title: "Criando Usuários",
        body: `1. Acesse **Usuários** no menu lateral\n2. Clique em **"Novo Usuário"**\n3. Preencha: Nome, E-mail, Senha (mín. 6 caracteres), Role\n4. Clique em **"Criar Usuário"**\n\n**Roles disponíveis:** Admin, Master, Normal\n\n**Importante:** O nome completo do usuário aparece automaticamente como opção no campo "Responsável" do Cadastro de Dados — não precisa de manutenção manual.`,
      },
      {
        title: "Responsáveis Dinâmicos",
        body: `A lista de responsáveis no **Cadastro de Dados** é carregada dinamicamente da tabela de usuários.\n\nIsso significa:\n- Adicionar usuário → aparece automaticamente na lista\n- Remover usuário → some da lista\n- Zero manutenção manual no código\n\nSe não houver usuários cadastrados, o campo vira um input de texto livre.`,
      },
    ],
  },
  {
    id: "backup",
    title: "Backup e Restauração",
    icon: HardDrive,
    content: [
      {
        title: "Exportar Backup",
        body: `1. Acesse **Backup** no menu lateral\n2. Clique em **"Exportar Backup"**\n3. O ZIP baixado contém:\n   - **backup_completo.json** — Para restauração via sistema\n   - **backup_supabase.sql** — SQL compatível com Supabase\n   - **tabelas/*.csv** — Para abrir no Excel\n   - **tabelas/*.json** — Dados por tabela`,
      },
      {
        title: "Restaurar Backup",
        body: `Três modos de restauração:\n\n**1. Apenas Sistema** — Restaura perfis e permissões\n\n**2. Apenas Banco de Dados** — Restaura metas, ações, check-ins, relatórios, obras, execução\n\n**3. Tudo** — Restauração completa\n\n**Como restaurar:**\n1. Escolha o modo\n2. Selecione o arquivo ZIP ou JSON do backup\n3. Revise o resumo\n4. Confirme\n\n**⚠️ Sempre faça backup antes de restaurar!**`,
      },
    ],
  },
  {
    id: "migrations",
    title: "Banco de Dados",
    icon: Link2,
    content: [
      {
        title: "Migrations desta Versão",
        body: `Esta versão inclui as seguintes migrations que precisam ser executadas no Supabase:\n\n**20260317000000_execucao_obras.sql**\n- Cria a tabela execucao_obras com RLS\n\n**20260318000001_metas_obra_vinculo.sql**\n- Adiciona coluna obra_id em metas (vínculo opcional)\n\n**20260318000002_alertas_prazo_func.sql**\n- Cria função gerar_alertas_prazo() para alertas automáticos\n\n**Como rodar:**\n1. Acesse seu projeto no supabase.com\n2. Vá em **SQL Editor**\n3. Cole o conteúdo de cada migration e execute`,
      },
      {
        title: "Edge Functions",
        body: `Esta versão inclui a Edge Function:\n\n**alertas-prazo/index.ts**\n- Chama gerar_alertas_prazo() do banco\n- Retorna JSON com status da execução\n\n**Como fazer deploy:**\n1. Instale o Supabase CLI: npm install -g supabase\n2. supabase login\n3. supabase functions deploy alertas-prazo\n\n**Como agendar:**\nNo Dashboard do Supabase → Edge Functions → alertas-prazo → Schedule\nFrequência: 0 8 * * * (todo dia às 08:00)`,
      },
    ],
  },
  {
    id: "importacao",
    title: "Importação de Dados",
    icon: FileSpreadsheet,
    content: [
      {
        title: "Importação de Excel",
        body: `1. Acesse **Importar Excel** no menu lateral\n2. Clique em **"Selecionar Arquivo"** ou arraste\n3. Formatos aceitos: .xlsx, .xls\n4. Revise os dados na prévia\n5. Confirme a importação\n\n**Regras do arquivo:**\n- Primeira linha deve conter cabeçalhos\n- Remova linhas em branco\n- Verifique formatos de data (DD/MM/AAAA)\n- Valores numéricos sem formatação especial`,
      },
    ],
  },
  {
    id: "dicas",
    title: "Dicas e Suporte",
    icon: BookOpen,
    content: [
      {
        title: "Boas Práticas de Administração",
        body: `- **Backup semanal** — Exporte toda semana antes de grandes alterações\n- **Roles mínimos** — Atribua a permissão mínima necessária por usuário\n- **Categorias padronizadas** — Use as 6 categorias do Mapa de Saúde para metas de obra\n- **Obras cadastradas primeiro** — Antes de criar metas de obra, cadastre as obras em Execução de Obra\n- **Progresso atualizado** — Atualize o % real das obras semanalmente para o Dashboard refletir a realidade\n- **Alertas monitorados** — Verifique o sino 🔔 regularmente para ver metas em risco e obras atrasadas`,
      },
      {
        title: "Solução de Problemas",
        body: `**Mapa de Saúde mostra "—" em todas categorias:**\n- Verifique se há metas com as categorias: Engenharia, Projetos, Orçamentos, Contratos, Quantitativos, Materiais\n\n**Campo "Obra vinculada" vazio ao criar meta:**\n- Cadastre obras primeiro no módulo Execução de Obra\n\n**Dashboard de Metas de Obra mostra 0:**\n- Nenhuma meta tem obra_id vinculado\n- Edite as metas desejadas e selecione a obra no campo "Obra vinculada"\n\n**Alertas automáticos não aparecem:**\n- Verifique se a Edge Function está deployada\n- Verifique se o agendamento (cron) está ativo\n- Execute manualmente via URL da Edge Function para testar\n\n**Usuário não aparece na lista de responsáveis:**\n- O usuário precisa ter sido criado com nome completo em Gerenciar Usuários\n- O campo usa full_name da tabela profiles`,
      },
    ],
  },
  {
    id: "diario_obra",
    title: "Diário de Obra (RDO)",
    icon: "📋",
    content: [
      {
        title: "O que é o Diário de Obra?",
        body: `O Diário de Obra é o Relatório Diário de Obra (RDO) — documento oficial que registra todas as atividades, efetivo e condições de uma obra em cada dia.\n\n**Acesso:** Menu lateral → Diário de Obra\n\n**Perfis com acesso:** Admin, Master e Engenheiro (criação). Normal e Almoxarife (visualização).`,
      },
      {
        title: "Campos do RDO",
        body: `Cada RDO contém:\n\n- **Obra vinculada** — ligação com a Execução de Obra (opcional)\n- **Data** — dia do registro\n- **Clima** — manhã e tarde (Bom, Nublado, Chuvoso, Chuva Forte, Tempestade)\n- **Temperatura** — mínima e máxima do dia\n- **Efetivo** — funções, quantidades e horas trabalhadas\n- **Atividades do dia** — campo obrigatório\n- **Ocorrências** — acidentes, paralisações, problemas\n- **Equipamentos** — máquinas e ferramentas utilizadas\n- **Materiais** — insumos consumidos no dia\n- **Fotos** — até 5 imagens por RDO`,
      },
      {
        title: "Exportação do RDO",
        body: `Cada RDO pode ser exportado como arquivo TXT:\n\n1. Na lista, clique no ícone ⬇ do registro\n2. Ou abra o RDO e clique em "Exportar TXT"\n\nO arquivo gerado contém todas as informações formatadas no padrão de Relatório Diário de Obra, incluindo URLs das fotos.`,
      },
      {
        title: "Perfil Engenheiro",
        body: `O perfil **Engenheiro** foi criado especificamente para responsáveis de obra que precisam registrar RDOs.\n\n**Acesso do Engenheiro:**\n- Dashboard\n- Meu Espaço\n- Diário de Obra (criar e visualizar)\n- Execução de Obra (visualizar)\n- Manual\n\n**Como criar:** Usuários → Novo Usuário → Tipo: Engenheiro`,
      },
      {
        title: "Relatórios do Diário de Obra",
        body: `Os dados do RDO aparecem no módulo Relatórios:\n\n- **KPIs:** total de RDOs, trabalhadores, homem-hora e ocorrências\n- **Gráfico de clima:** distribuição do clima predominante\n- **Tabela completa** com todos os registros filtráveis por período\n\nNo Relatório Completo, o Diário de Obra é incluído automaticamente.`,
      },
      {
        title: "Ativar o módulo",
        body: `O módulo Diário de Obra precisa ser ativado:\n\n1. Menu Admin → Módulos\n2. Encontre "Diário de Obra"\n3. Ative para os usuários desejados\n\nApós ativação, o item "Diário de Obra" aparece no menu lateral.`,
      },
    ],
  },
];
export default function ManualAdmin() {
  const { isAdmin, loading } = useAuth();
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(["visao-geral"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<{ sectionId: string; topicIndex: number } | null>({ sectionId: "visao-geral", topicIndex: 0 });

  if (!loading && !isAdmin) return <AccessDenied requiredRole="Administrador" />;

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
      // Code block inline
      line = line.replace(/`(.*?)`/g, '<code class="text-[11px] px-1 rounded" style="background:hsl(var(--pbi-dark));color:hsl(var(--pbi-yellow))">$1</code>');
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
          <Shield className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground">Manual do Administrador</h1>
              <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{ background: "hsl(var(--pbi-yellow) / 0.15)", color: "hsl(var(--pbi-yellow))" }}>Admin</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Documentação completa para administradores do ERP San Remo</p>
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
              <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--pbi-text-primary))" }}>Índice — Admin</p>
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
