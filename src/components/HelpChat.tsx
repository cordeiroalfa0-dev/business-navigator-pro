import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Search, ArrowLeft, HelpCircle, Target, Building2,
  DollarSign, Users, BarChart3, Upload, HardDrive,
  ChevronRight, Lock, User, LayoutDashboard, Zap,
  Trophy, ClipboardPlus, BookOpen, Lightbulb,
  AlertTriangle, FileText, Bell, Paperclip, LogOut,
  HelpCircle as HelpIcon, Warehouse, BookMarked,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Mapa: módulo do sistema → categoria(s) da central de ajuda que ele desbloqueia
const MODULE_TO_CATEGORIES: Record<string, string[]> = {
  metas:           ["Metas"],
  metas_avancadas: ["Metas Avançadas"],
  execucao:        ["Execução de Obra"],
  relatorios:      ["Relatórios"],
  financeiro:      ["Financeiro"],
  obras:           ["Obras e Projetos"],
  importacao:      ["Importação de Dados"],
  cadastro:        ["Cadastro de Dados"],
  almoxarifado:    ["Almoxarifado"],
  diario_obra:     ["Diário de Obra"],
  ranking:         ["Relatórios"],
};

const UNIVERSAL_CATEGORIES = new Set([
  "Acesso e Login",
  "Dashboard",
  "Meu Espaço",
  "Notificações",
  "Problemas e Soluções",
  "Manuais do Sistema",
  "Gerenciar Usuários",
  "Backup e Restauração",
]);

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
type UserRole = "admin" | "master" | "normal" | "engenheiro" | null;

interface Step {
  text: string;
  roles?: Array<"admin" | "master" | "normal" | "engenheiro">;
}

interface HelpTopic {
  id: number;
  category: string;
  categoryIcon: React.ElementType;
  icon: string;
  keywords: string[];
  question: string;
  visibleTo: Array<"admin" | "master" | "normal" | "engenheiro">;
  steps: Step[];
  tip?: string;
  restrictedMessage?: string;
  answer?: string;
}

// ─────────────────────────────────────────────────────────────
// BASE DE CONHECIMENTO
// ─────────────────────────────────────────────────────────────
const allTopics: HelpTopic[] = [

  // ── ACESSO E LOGIN ───────────────────────────────────────
  {
    id: 1, category: "Acesso e Login", categoryIcon: Lock, icon: "🔐",
    keywords: ["login", "entrar", "senha", "acesso", "autenticação", "logar", "primeiro acesso"],
    question: "Como fazer login no sistema?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse a URL do sistema no seu navegador" },
      { text: "Na tela de login, digite seu e-mail corporativo" },
      { text: "Digite sua senha no campo correspondente" },
      { text: "Clique em 'Entrar'" },
      { text: "Você será redirecionado automaticamente ao Dashboard" },
    ],
    tip: "Caso não tenha acesso, contate seu administrador para criar sua conta.",
  },
  {
    id: 2, category: "Acesso e Login", categoryIcon: Lock, icon: "🔐",
    keywords: ["esqueci", "senha", "resetar", "redefinir", "reset", "recuperar senha", "não lembro"],
    question: "Esqueci minha senha, o que faço?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Na tela de login, clique em 'Esqueci minha senha'" },
      { text: "Digite o seu e-mail cadastrado no campo" },
      { text: "Clique em 'Enviar link de recuperação'" },
      { text: "Acesse seu e-mail e clique no link recebido" },
      { text: "Na nova tela, digite e confirme sua nova senha" },
      { text: "Clique em 'Redefinir' para concluir" },
    ],
    tip: "O link de recuperação expira em 1 hora. Verifique também a caixa de spam.",
  },
  {
    id: 3, category: "Acesso e Login", categoryIcon: Lock, icon: "🔐",
    keywords: ["logout", "sair", "deslogar", "encerrar sessão", "trocar usuário"],
    question: "Como sair do sistema (logout)?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "No canto superior direito, clique no ícone do seu perfil ou nome" },
      { text: "Selecione a opção 'Sair' ou 'Logout'" },
      { text: "Você será redirecionado à tela de login" },
    ],
    tip: "Sempre faça logout ao usar computadores compartilhados.",
  },

  // ── DASHBOARD ────────────────────────────────────────────
  {
    id: 4, category: "Dashboard", categoryIcon: LayoutDashboard, icon: "📊",
    keywords: ["dashboard", "início", "home", "painel", "resumo", "indicadores", "kpi", "tela inicial"],
    question: "O que é o Dashboard e como usar?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse o menu lateral e clique em 'Dashboard'" },
      { text: "Visualize os KPIs principais: metas no prazo, em risco e atingidas" },
      { text: "Veja o gráfico de evolução de atividades ao longo do tempo" },
      { text: "Confira o resumo de obras e pendências do dia" },
      { text: "Use os filtros de período para ajustar o intervalo de análise", roles: ["admin", "master"] },
      { text: "Clique em qualquer card para acessar o módulo correspondente" },
    ],
    tip: "O Dashboard atualiza automaticamente a cada acesso.",
  },

  // ── MEU ESPAÇO ───────────────────────────────────────────
  {
    id: 5, category: "Meu Espaço", categoryIcon: User, icon: "👤",
    keywords: ["meu espaço", "perfil", "minhas metas", "minhas tarefas", "pessoal", "meu painel"],
    question: "Como usar o Meu Espaço?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Meu Espaço' no menu lateral" },
      { text: "Veja todas as metas e tarefas atribuídas ao seu usuário" },
      { text: "Filtre por status: No Prazo, Atenção, Em Risco ou Atingida" },
      { text: "Faça check-ins diretamente nesta tela clicando no ícone (✓)" },
      { text: "Acompanhe seu ranking pessoal de desempenho" },
    ],
    tip: "Use Meu Espaço como ponto de partida diário para ver suas responsabilidades.",
  },

  // ── METAS ────────────────────────────────────────────────
  {
    id: 6, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["criar", "nova", "meta", "adicionar", "cadastrar meta", "nova meta"],
    question: "Como criar uma nova meta?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Metas' no menu lateral" },
      { text: "Clique em '+ Nova Meta' no canto superior direito" },
      { text: "Etapa 1 — Básico: defina nome, tipo (Quantitativa ou Qualitativa) e prioridade" },
      { text: "Se quantitativa: informe valor atual, objetivo e unidade (R$, %, dias...)" },
      { text: "Etapa 2 — Gestão: informe responsável, ciclo (ex: Q2 2026) e datas" },
      { text: "Etapa 2 — Defina aprovador e departamento", roles: ["admin", "master"] },
      { text: "Etapa 3 — Detalhes: adicione descrição, riscos e observações se necessário" },
      { text: "Clique em 'Salvar Meta' para concluir" },
    ],
    tip: "Metas quantitativas têm barra de progresso automática. Qualitativas usam check-in de texto.",
  },
  {
    id: 7, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["editar", "alterar", "modificar", "atualizar meta", "mudar meta"],
    question: "Como editar uma meta existente?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Metas' no menu lateral" },
      { text: "Localize a meta na lista" },
      { text: "Clique no ícone de lápis (✏️) no cartão da meta" },
      { text: "O formulário abrirá com os dados já preenchidos" },
      { text: "Reatribua o responsável ou mude o aprovador conforme necessário", roles: ["admin", "master"] },
      { text: "Clique em 'Salvar Meta' para confirmar" },
    ],
    tip: "Usuários normais só podem editar metas onde são o responsável.",
  },
  {
    id: 8, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["check-in", "checkin", "progresso", "atualizar valor", "avançar meta", "registrar progresso"],
    question: "Como registrar progresso (check-in) em uma meta?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Metas' e localize a meta desejada" },
      { text: "Clique no ícone de check-in (✓) no cartão" },
      { text: "Informe o novo valor atual da meta" },
      { text: "Selecione o nível de confiança: No Prazo, Atenção ou Em Risco" },
      { text: "Adicione um comentário explicando o progresso (recomendado)" },
      { text: "Anexe imagens como evidência se necessário" },
      { text: "Clique em 'Registrar Check-in'" },
    ],
    tip: "Faça check-ins regularmente conforme a frequência definida na meta.",
  },
  {
    id: 9, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["excluir meta", "deletar meta", "remover meta", "apagar meta"],
    question: "Como excluir uma meta?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "Apenas administradores e masters podem excluir metas. Solicite ao seu administrador.",
    steps: [
      { text: "Acesse 'Metas' no menu lateral" },
      { text: "Localize a meta que deseja excluir" },
      { text: "Clique nos três pontos (⋯) no cartão" },
      { text: "Selecione 'Excluir'" },
      { text: "Confirme a exclusão na janela que aparece" },
    ],
    tip: "A exclusão é permanente. Considere apenas arquivar a meta para preservar o histórico.",
  },
  {
    id: 10, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["submeta", "meta filha", "hierarquia", "meta pai", "vincular meta"],
    question: "Como criar uma submeta (meta filha)?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Crie ou edite uma meta normalmente" },
      { text: "Na etapa 2 do formulário, ative o campo 'Meta Pai'" },
      { text: "Selecione a meta principal à qual esta submeta pertence" },
      { text: "Complete os demais campos e salve" },
      { text: "A submeta aparecerá vinculada à meta pai na lista" },
    ],
    tip: "Use submetas para decompor grandes objetivos em entregas menores e rastreáveis.",
  },
  {
    id: 11, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["kanban", "ações", "plano de ação", "tarefa meta", "atividade da meta"],
    question: "Como usar o Plano de Ações (Kanban)?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Metas' e clique na meta desejada" },
      { text: "Selecione a aba 'Plano de Ação'" },
      { text: "Clique em '+ Adicionar Ação' para criar uma nova tarefa" },
      { text: "Defina descrição, responsável e prazo da ação" },
      { text: "Arraste os cards entre as colunas: A Fazer → Em Andamento → Concluído" },
      { text: "Marque ações como concluídas clicando no checkbox" },
    ],
    tip: "Cada ação concluída contribui para o progresso geral da meta.",
  },
  {
    id: 12, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["status meta", "em risco", "atenção", "no prazo", "atingida", "cor meta", "significado status"],
    question: "O que significam os status das metas?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "✅ No Prazo (verde): progresso acima de 60% do esperado" },
      { text: "⚠️ Atenção (amarelo): progresso entre 30% e 60% — requer acompanhamento" },
      { text: "🔴 Em Risco (vermelho): progresso abaixo de 30% — ação imediata necessária" },
      { text: "🏆 Atingida (azul): objetivo 100% alcançado" },
      { text: "Para alterar manualmente: edite a meta e ajuste o campo 'Status'" },
    ],
    tip: "O status é calculado automaticamente com base no progresso atual vs objetivo.",
  },
  {
    id: 13, category: "Metas", categoryIcon: Target, icon: "🎯",
    keywords: ["filtrar meta", "buscar meta", "pesquisar meta", "filtro categoria", "filtro prioridade"],
    question: "Como filtrar e buscar metas?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Metas' no menu lateral" },
      { text: "Use o campo de busca para pesquisar pelo nome da meta" },
      { text: "Use o filtro 'Categoria' para ver apenas uma área (Financeiro, Obras...)" },
      { text: "Use o filtro 'Prioridade' para focar em Alta, Média ou Baixa" },
      { text: "Combine os filtros para uma visão mais refinada" },
      { text: "Clique em 'Limpar Filtros' para ver todas as metas novamente" },
    ],
  },
  {
    id: 14, category: "Metas", categoryIcon: Paperclip, icon: "📎",
    keywords: ["anexar", "imagem", "arquivo", "foto", "evidência", "upload meta", "documento meta"],
    question: "Como anexar imagens ou arquivos em uma meta?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Metas' e clique na meta desejada" },
      { text: "Clique no ícone de anexo (📎) ou na aba 'Arquivos'" },
      { text: "Clique em 'Selecionar Arquivo' ou arraste o arquivo para a área indicada" },
      { text: "Formatos aceitos: JPG, PNG, PDF (máx. 10 MB por arquivo)" },
      { text: "Aguarde o upload completar — o arquivo aparecerá na lista" },
      { text: "Você também pode anexar imagens diretamente no check-in" },
    ],
    tip: "Use fotos como evidências de progresso físico em obras.",
  },

  // ── EXECUÇÃO DE OBRA ────────────────────────────────────
  {
    id: 15, category: "Execução de Obra", categoryIcon: Building2, icon: "🏗️",
    keywords: ["obra", "execução", "atividade obra", "construção", "etapa obra", "fase obra", "diário obra"],
    question: "Como registrar atividades de execução de obra?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Execução de Obra' no menu lateral" },
      { text: "Selecione o empreendimento desejado" },
      { text: "Clique em '+ Nova Atividade'" },
      { text: "Informe: descrição, etapa (Fundação, Estrutura...), responsável e data" },
      { text: "Defina se a atividade era prevista ou não prevista" },
      { text: "Marque o status: Não Iniciada, Em Andamento ou Completa" },
      { text: "Adicione fotos ou documentos como evidência" },
      { text: "Salve a atividade" },
    ],
    tip: "Atividades 'não previstas' são destacadas nos relatórios para análise de desvios.",
  },
  {
    id: 16, category: "Execução de Obra", categoryIcon: Building2, icon: "🏗️",
    keywords: ["relatório obra", "diário obra", "exportar obra", "pdf obra", "evolução obra", "análise semanal"],
    question: "Como gerar relatório de execução de obra?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "A geração de relatórios de obra é restrita a administradores e masters.",
    steps: [
      { text: "Acesse 'Execução de Obra'" },
      { text: "Clique em 'Gerar Relatório' ou acesse a aba 'Relatório'" },
      { text: "Selecione o período: semana, mês ou personalizado" },
      { text: "Escolha o empreendimento" },
      { text: "Clique em 'Exportar PDF' para baixar o relatório" },
    ],
    tip: "O relatório inclui comparação com o período anterior e gráficos de evolução automaticamente.",
  },

  // ── RELATÓRIOS ───────────────────────────────────────────
  {
    id: 17, category: "Relatórios", categoryIcon: BarChart3, icon: "📈",
    keywords: ["relatório", "exportar", "pdf", "gráfico", "análise", "desempenho", "gerar relatório"],
    question: "Como gerar e exportar relatórios?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "A geração de relatórios completos é restrita a administradores e masters.",
    steps: [
      { text: "Acesse 'Relatórios' no menu lateral" },
      { text: "Escolha o tipo: Metas, Obras, Financeiro ou Geral" },
      { text: "Defina o período de análise com os filtros de data" },
      { text: "Selecione filtros adicionais (responsável, departamento, categoria)" },
      { text: "Visualize os gráficos e tabelas na tela" },
      { text: "Clique em 'Exportar PDF' ou 'Exportar Excel' para baixar" },
    ],
    tip: "O Dashboard V2 oferece uma visão gerencial completa ideal para apresentações.",
  },
  {
    id: 18, category: "Relatórios", categoryIcon: BarChart3, icon: "📈",
    keywords: ["relatório financeiro", "financeiro exportar", "contabilidade relatório", "dre", "balanço"],
    question: "Como acessar os Relatórios Financeiros?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "Os Relatórios Financeiros são acessíveis apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Financeiro' no menu lateral" },
      { text: "Clique em 'Relatórios Financeiros'" },
      { text: "Escolha o tipo: DRE, Fluxo de Caixa, Contas a Pagar/Receber" },
      { text: "Selecione o período de competência" },
      { text: "Filtre por empreendimento ou categoria se necessário" },
      { text: "Clique em 'Exportar' para baixar em PDF ou Excel" },
    ],
    tip: "Use os relatórios financeiros para acompanhar a saúde financeira de cada obra.",
  },
  {
    id: 19, category: "Relatórios", categoryIcon: Trophy, icon: "🏆",
    keywords: ["ranking", "equipe", "desempenho", "melhor responsável", "pontuação", "classificação"],
    question: "Como visualizar o Ranking da Equipe?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Ranking de Equipe' no menu lateral (seção Análise)" },
      { text: "Veja a classificação dos responsáveis por desempenho em metas" },
      { text: "Filtre por período, ciclo ou departamento" },
      { text: "Clique em um responsável para ver o detalhamento das suas metas" },
    ],
    tip: "O ranking é calculado automaticamente com base nos check-ins e progressos registrados.",
  },

  // ── FINANCEIRO ───────────────────────────────────────────
  {
    id: 20, category: "Financeiro", categoryIcon: DollarSign, icon: "💰",
    keywords: ["faturamento", "nota fiscal", "receita", "fatura", "emitir fatura"],
    question: "Como registrar um faturamento?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O módulo Financeiro é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Financeiro' → 'Faturamento' no menu lateral" },
      { text: "Clique em '+ Novo Faturamento'" },
      { text: "Informe: cliente, valor, data de emissão e vencimento" },
      { text: "Vincule ao empreendimento correspondente" },
      { text: "Anexe a nota fiscal se necessário" },
      { text: "Salve o lançamento" },
    ],
    tip: "Todos os faturamentos são consolidados no Dashboard financeiro automaticamente.",
  },
  {
    id: 21, category: "Financeiro", categoryIcon: DollarSign, icon: "💰",
    keywords: ["conta a pagar", "pagamento", "despesa", "fornecedor", "contas pagar", "lançar despesa"],
    question: "Como lançar uma conta a pagar?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O módulo Financeiro é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Financeiro' → 'Contas a Pagar'" },
      { text: "Clique em '+ Nova Conta'" },
      { text: "Informe: fornecedor, descrição, valor e data de vencimento" },
      { text: "Selecione a categoria (material, mão de obra, serviço...)" },
      { text: "Vincule ao empreendimento se aplicável" },
      { text: "Salve e marque como pago quando o pagamento for realizado" },
    ],
    tip: "Contas vencidas ficam destacadas em vermelho no painel.",
  },
  {
    id: 22, category: "Financeiro", categoryIcon: DollarSign, icon: "💰",
    keywords: ["conta a receber", "recebimento", "bancário", "cobrança", "cliente deve"],
    question: "Como gerenciar contas a receber?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O módulo Financeiro é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Financeiro' → 'Contas a Receber'" },
      { text: "Visualize os recebimentos pendentes e em atraso" },
      { text: "Clique em '+ Novo Recebimento' para lançar manualmente" },
      { text: "Informe: cliente, valor, vencimento e forma de pagamento" },
      { text: "Marque como recebido quando o pagamento chegar" },
    ],
    tip: "Use os filtros de período para acompanhar o fluxo de caixa mensal.",
  },
  {
    id: 23, category: "Financeiro", categoryIcon: DollarSign, icon: "💰",
    keywords: ["imposto", "tributo", "tax", "fiscal", "simples", "inss", "iss", "recolhimento"],
    question: "Como registrar impostos?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O módulo de Impostos é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Financeiro' → 'Impostos'" },
      { text: "Clique em '+ Novo Lançamento'" },
      { text: "Selecione o tipo (ISS, INSS, Simples Nacional...)" },
      { text: "Informe o período de competência e o valor" },
      { text: "Defina a data de vencimento" },
      { text: "Marque como pago após o recolhimento" },
    ],
  },

  // ── OBRAS E PROJETOS ─────────────────────────────────────
  {
    id: 24, category: "Obras e Projetos", categoryIcon: Building2, icon: "🏢",
    keywords: ["empreendimento", "novo projeto", "cadastrar obra", "novo empreendimento", "projeto"],
    question: "Como cadastrar um novo empreendimento?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O cadastro de empreendimentos é restrito a administradores e masters.",
    steps: [
      { text: "Acesse 'Obras' → 'Empreendimentos' no menu lateral" },
      { text: "Clique em '+ Novo Empreendimento'" },
      { text: "Preencha: nome, endereço e tipo (residencial, comercial...)" },
      { text: "Defina o responsável técnico e a data prevista de entrega" },
      { text: "Informe o orçamento total do projeto" },
      { text: "Salve o empreendimento" },
    ],
    tip: "Após cadastrar, vincule metas, contratos e materiais ao empreendimento.",
  },
  {
    id: 25, category: "Obras e Projetos", categoryIcon: Building2, icon: "🏢",
    keywords: ["contrato", "contrato cliente", "assinar contrato", "novo contrato", "gestão contrato"],
    question: "Como cadastrar e gerenciar contratos?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O gerenciamento de contratos é restrito a administradores e masters.",
    steps: [
      { text: "Acesse 'Obras' → 'Contratos' no menu lateral" },
      { text: "Clique em '+ Novo Contrato'" },
      { text: "Selecione o empreendimento vinculado" },
      { text: "Informe: número do contrato, cliente, valor e vigência (início e fim)" },
      { text: "Faça upload do arquivo do contrato em PDF se disponível" },
      { text: "Defina o status: Em Negociação, Ativo, Encerrado ou Cancelado" },
      { text: "Salve o registro" },
    ],
    tip: "Mantenha os contratos sempre atualizados para referência em relatórios e auditorias.",
  },
  {
    id: 26, category: "Obras e Projetos", categoryIcon: Building2, icon: "🏢",
    keywords: ["cliente", "crm", "cadastrar cliente", "dados cliente", "contato cliente"],
    question: "Como gerenciar clientes (CRM)?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O módulo de Clientes é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Obras' → 'Clientes' no menu lateral" },
      { text: "Clique em '+ Novo Cliente'" },
      { text: "Preencha os dados: nome, CPF/CNPJ, telefone e e-mail" },
      { text: "Adicione o endereço completo" },
      { text: "Vincule ao empreendimento e/ou contrato correspondente" },
      { text: "Salve o cadastro" },
      { text: "Use a listagem para acompanhar todos os clientes e seus contratos ativos" },
    ],
    tip: "O CRM permite rastrear o histórico de cada cliente e seus empreendimentos.",
  },
  {
    id: 27, category: "Obras e Projetos", categoryIcon: Building2, icon: "🏢",
    keywords: ["material", "estoque", "insumo", "compra material", "pedido material", "solicitar material"],
    question: "Como registrar materiais e insumos?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Obras' → 'Materiais'" },
      { text: "Clique em '+ Novo Material'" },
      { text: "Informe: nome, quantidade, unidade e fornecedor" },
      { text: "Vincule ao empreendimento e à etapa da obra" },
      { text: "Defina se é compra nova ou item já em estoque" },
      { text: "Salve o lançamento" },
      { text: "Aprove pedidos de compra pendentes na listagem", roles: ["admin", "master"] },
    ],
    tip: "Acompanhe o consumo de materiais por obra no painel de Obras.",
  },

  // ── IMPORTAÇÃO ───────────────────────────────────────────
  {
    id: 28, category: "Importação de Dados", categoryIcon: Upload, icon: "📤",
    keywords: ["importar", "excel", "planilha", "xlsx", "csv", "upload dados", "importação em massa"],
    question: "Como importar dados via Excel?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "A importação de dados é restrita a administradores e masters.",
    steps: [
      { text: "Acesse 'Importar Excel' no menu lateral" },
      { text: "Clique em 'Baixar Modelo' para obter a planilha padrão" },
      { text: "Preencha a planilha com seus dados seguindo exatamente o formato do modelo" },
      { text: "Salve a planilha no formato .xlsx" },
      { text: "Volte ao sistema e clique em 'Selecionar Arquivo'" },
      { text: "Escolha o arquivo .xlsx preenchido" },
      { text: "Revise os dados na pré-visualização antes de confirmar" },
      { text: "Clique em 'Confirmar Importação'" },
    ],
    tip: "Não altere os nomes das colunas do modelo — isso causa erros na importação.",
  },

  // ── METAS AVANÇADAS ──────────────────────────────────────
  {
    id: 29, category: "Metas Avançadas", categoryIcon: Zap, icon: "⚡",
    keywords: ["metas avançadas", "okr", "análise avançada", "indicador avançado", "kpi avançado", "análise cruzada"],
    question: "O que são Metas Avançadas e como usar?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "Metas Avançadas é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Metas Avançadas' no menu lateral (seção Análise)" },
      { text: "Visualize análises cruzadas: progresso por departamento, categoria e ciclo" },
      { text: "Use os filtros para segmentar os dados por período ou equipe" },
      { text: "Veja o mapa de calor de desempenho por responsável" },
      { text: "Identifique gargalos e metas interdependentes" },
      { text: "Exporte análises para apresentações gerenciais" },
    ],
    tip: "Use Metas Avançadas nas reuniões de revisão de ciclo (OKR review).",
  },

  // ── CADASTRO DE DADOS ────────────────────────────────────
  {
    id: 30, category: "Cadastro de Dados", categoryIcon: ClipboardPlus, icon: "📋",
    keywords: ["cadastro", "dados mestres", "configurar sistema", "categorias", "departamento", "dados base"],
    question: "Como gerenciar dados cadastrais do sistema?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "O Cadastro de Dados é acessível apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Cadastro de Dados' no menu lateral" },
      { text: "Escolha o tipo de dado: Categorias, Departamentos, Fornecedores..." },
      { text: "Clique em '+ Novo' para adicionar um item" },
      { text: "Preencha as informações solicitadas e salve" },
      { text: "Os dados cadastrados ficam disponíveis em todos os formulários do sistema" },
      { text: "Para editar, clique no ícone de lápis ao lado do item" },
      { text: "Para excluir, clique no ícone de lixeira (⚠️ verifique se o item não está em uso)" },
    ],
    tip: "Mantenha os dados cadastrais sempre atualizados para facilitar o preenchimento dos formulários.",
  },

  // ── GERENCIAR USUÁRIOS ───────────────────────────────────
  {
    id: 31, category: "Gerenciar Usuários", categoryIcon: Users, icon: "👥",
    keywords: ["criar usuário", "novo usuário", "funcionário", "cadastrar usuário", "adicionar usuário"],
    question: "Como criar um novo usuário?",
    visibleTo: ["admin"],
    restrictedMessage: "Apenas administradores podem criar e gerenciar usuários do sistema.",
    steps: [
      { text: "Acesse 'Usuários' no menu lateral" },
      { text: "Clique em '+ Novo Usuário'" },
      { text: "Informe: nome completo e e-mail corporativo" },
      { text: "Defina o perfil de acesso: Normal, Master, Admin ou Engenheiro" },
      { text: "O sistema enviará um e-mail com o link de acesso para o usuário" },
      { text: "No primeiro acesso, o usuário define sua própria senha" },
    ],
    tip: "Normal: acessa metas e obras básico. Master: acessa financeiro. Admin: acesso total. Engenheiro: cria e visualiza RDOs.",
  },
  {
    id: 32, category: "Gerenciar Usuários", categoryIcon: Users, icon: "👥",
    keywords: ["alterar perfil", "mudar acesso", "permissão usuário", "role", "nível de acesso", "promover"],
    question: "Como alterar o perfil de acesso de um usuário?",
    visibleTo: ["admin"],
    restrictedMessage: "Apenas administradores podem alterar perfis de acesso.",
    steps: [
      { text: "Acesse 'Usuários' no menu lateral" },
      { text: "Localize o usuário na lista" },
      { text: "Clique no ícone de edição (✏️)" },
      { text: "Altere o campo 'Perfil de Acesso' para o nível desejado" },
      { text: "Salve as alterações" },
      { text: "A mudança tem efeito imediato — o usuário terá o novo perfil no próximo login" },
    ],
    tip: "Cuidado ao promover para Admin — ele terá acesso total ao sistema.",
  },
  {
    id: 33, category: "Gerenciar Usuários", categoryIcon: Users, icon: "👥",
    keywords: ["desativar usuário", "bloquear usuário", "remover usuário", "inativar", "deletar usuário"],
    question: "Como desativar ou remover um usuário?",
    visibleTo: ["admin"],
    restrictedMessage: "Apenas administradores podem desativar usuários.",
    steps: [
      { text: "Acesse 'Usuários' no menu lateral" },
      { text: "Localize o usuário que deseja desativar" },
      { text: "Clique nos três pontos (⋯) ao lado do usuário" },
      { text: "Selecione 'Desativar'" },
      { text: "Confirme a ação na janela de confirmação" },
      { text: "O usuário não conseguirá mais fazer login, mas seus dados são preservados" },
    ],
    tip: "Prefira desativar ao invés de deletar — os históricos de metas e check-ins são mantidos.",
  },

  // ── BACKUP E RESTAURAÇÃO ─────────────────────────────────
  {
    id: 34, category: "Backup e Restauração", categoryIcon: HardDrive, icon: "💾",
    keywords: ["backup", "exportar dados", "segurança dados", "salvar dados", "cópia segurança"],
    question: "Como fazer backup dos dados?",
    visibleTo: ["admin"],
    restrictedMessage: "Apenas administradores têm acesso ao módulo de Backup.",
    steps: [
      { text: "Acesse 'Backup' no menu lateral" },
      { text: "Clique em 'Gerar Backup Completo'" },
      { text: "Aguarde o processamento (pode levar alguns segundos)" },
      { text: "Clique em 'Baixar Arquivo' para salvar no seu computador" },
      { text: "Guarde o arquivo em local seguro (nuvem ou HD externo)" },
    ],
    tip: "Recomendamos fazer backup semanal ou antes de grandes importações de dados.",
  },
  {
    id: 35, category: "Backup e Restauração", categoryIcon: HardDrive, icon: "💾",
    keywords: ["restaurar", "recuperar dados", "restore backup", "importar backup", "reverter"],
    question: "Como restaurar um backup?",
    visibleTo: ["admin"],
    restrictedMessage: "Apenas administradores podem restaurar backups.",
    steps: [
      { text: "Acesse 'Backup' no menu lateral" },
      { text: "Clique em 'Restaurar Backup'" },
      { text: "Selecione o arquivo de backup salvo anteriormente (.json ou .zip)" },
      { text: "Revise os dados que serão restaurados na pré-visualização" },
      { text: "⚠️ ATENÇÃO: a restauração substituirá os dados atuais do sistema" },
      { text: "Confirme digitando 'CONFIRMAR' no campo de segurança" },
      { text: "Aguarde a conclusão do processo" },
    ],
    tip: "Sempre faça um novo backup antes de restaurar um anterior.",
  },

  // ── MANUAIS ──────────────────────────────────────────────
  {
    id: 36, category: "Manuais do Sistema", categoryIcon: BookOpen, icon: "📖",
    keywords: ["manual", "manual usuário", "guia", "ajuda manual", "documentação", "como usar"],
    question: "Como acessar o Manual do Usuário?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Manual' no menu lateral (seção Ajuda)" },
      { text: "O manual contém guias passo a passo de todas as funcionalidades disponíveis para seu perfil" },
      { text: "Use o índice para navegar pelas seções" },
      { text: "As instruções estão organizadas por módulo: Metas, Obras, Financeiro..." },
      { text: "Você pode imprimir ou exportar o manual em PDF" },
    ],
    tip: "O Manual do Usuário é atualizado sempre que novas funcionalidades são adicionadas.",
  },
  {
    id: 37, category: "Manuais do Sistema", categoryIcon: BookOpen, icon: "📖",
    keywords: ["manual admin", "manual administrador", "guia admin", "documentação admin", "configurar sistema"],
    question: "Como acessar o Manual do Administrador?",
    visibleTo: ["admin"],
    restrictedMessage: "O Manual do Administrador é acessível apenas para administradores.",
    steps: [
      { text: "Acesse 'Manual Admin' no menu lateral (seção Admin)" },
      { text: "O manual contém instruções técnicas de configuração e manutenção do sistema" },
      { text: "Inclui: configuração do Supabase, gerenciamento de usuários avançado, scripts SQL" },
      { text: "Seção de troubleshooting com soluções para problemas comuns" },
      { text: "Instruções para atualização e backup do sistema" },
    ],
    tip: "Consulte o Manual Admin antes de realizar alterações estruturais no sistema.",
  },

  // ── NOTIFICAÇÕES ─────────────────────────────────────────
  {
    id: 38, category: "Notificações", categoryIcon: Bell, icon: "🔔",
    keywords: ["notificação", "alerta", "aviso", "sino", "lembrete", "notificações admin"],
    question: "Como funcionam as notificações do sistema?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "O ícone de sino (🔔) no topo da tela exibe notificações pendentes" },
      { text: "Notificações incluem: metas vencendo, check-ins atrasados e novas atribuições" },
      { text: "Clique no sino para ver a lista de notificações" },
      { text: "Clique em uma notificação para ir diretamente ao item relacionado" },
      { text: "Marque como lida clicando no ✓ ao lado da notificação" },
      { text: "Administradores recebem notificações adicionais sobre usuários e sistema", roles: ["admin"] },
    ],
    tip: "Configure a frequência de check-ins nas metas para receber lembretes automáticos.",
  },

  // ── PROBLEMAS E SOLUÇÕES ─────────────────────────────────
  {
    id: 39, category: "Problemas e Soluções", categoryIcon: AlertTriangle, icon: "🔧",
    keywords: ["erro", "problema", "não funciona", "bug", "tela branca", "carregando", "travado", "lento"],
    question: "O sistema está com erro ou travado, o que fazer?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Primeiro, atualize a página com F5 ou Ctrl+R" },
      { text: "Se persistir, limpe o cache do navegador (Ctrl+Shift+Delete)" },
      { text: "Tente em uma aba anônima para descartar extensões do navegador" },
      { text: "Verifique sua conexão com a internet" },
      { text: "Faça logout e login novamente" },
      { text: "Se continuar, anote a mensagem de erro exata e contate o administrador", roles: ["normal", "master"] },
      { text: "Se continuar, acesse o painel do Supabase e verifique os logs de erro", roles: ["admin"] },
    ],
    tip: "A maioria dos problemas é resolvida com F5 + limpar cache.",
  },
  {
    id: 40, category: "Problemas e Soluções", categoryIcon: AlertTriangle, icon: "🔧",
    keywords: ["não consigo criar usuário", "edge function", "erro usuário", "falha envio email", "failed to send"],
    question: "Erro ao criar usuário: 'Failed to send request'",
    visibleTo: ["admin"],
    restrictedMessage: "Este problema é relevante apenas para administradores do sistema.",
    steps: [
      { text: "Acesse https://supabase.com/dashboard e abra seu projeto" },
      { text: "No menu à esquerda, clique em 'SQL Editor' → 'New Query'" },
      { text: "Abra o arquivo CORRECAO_BANCO_DADOS.sql que está na pasta do projeto" },
      { text: "Copie todo o conteúdo e cole no SQL Editor" },
      { text: "Verifique se o e-mail admin está correto na linha: target_email TEXT := 'emerson@sanremo.com'" },
      { text: "Clique em 'Run' para executar o script" },
      { text: "Tente criar o usuário novamente no sistema" },
    ],
    tip: "Este erro ocorre quando as permissões RLS do banco não estão configuradas corretamente.",
  },
  {
    id: 41, category: "Problemas e Soluções", categoryIcon: AlertTriangle, icon: "🔧",
    keywords: ["sem acesso", "sem permissão", "acesso negado", "módulo bloqueado", "não vejo módulo"],
    question: "Não consigo acessar um módulo ou funcionalidade",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Verifique seu perfil de acesso: Normal, Master ou Admin" },
      { text: "Perfil Normal: sem acesso a Financeiro, Relatórios completos, Usuários e Backup" },
      { text: "Perfil Master: sem acesso a Gerenciar Usuários e Backup" },
      { text: "Somente Admins têm acesso total ao sistema" },
      { text: "Se precisar de mais acesso, solicite ao administrador a elevação do seu perfil" },
    ],
    tip: "Consulte seu administrador para verificar e ajustar suas permissões.",
  },
  {
    id: 42, category: "Problemas e Soluções", categoryIcon: AlertTriangle, icon: "🔧",
    keywords: ["exportar pdf não funciona", "erro pdf", "pdf não baixa", "exportação falhou", "relatório não gera"],
    question: "O PDF não está sendo exportado, o que fazer?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "A exportação de PDF é uma funcionalidade de administradores e masters.",
    steps: [
      { text: "Verifique se os pop-ups estão bloqueados no navegador — o PDF abre em nova aba" },
      { text: "Clique no ícone de cadeado na barra de endereços e permita pop-ups para este site" },
      { text: "Verifique se há dados suficientes no período selecionado para gerar o relatório" },
      { text: "Tente em outro navegador (Chrome ou Edge são recomendados)" },
      { text: "Se o erro persistir, tente reduzir o período de análise selecionado" },
      { text: "Se nada funcionar, faça um print de tela como alternativa temporária" },
    ],
    tip: "Chrome e Edge oferecem melhor suporte à exportação de PDF no sistema.",
  },

  // ── ALMOXARIFADO ─────────────────────────────────────────
  {
    id: 43, category: "Almoxarifado", categoryIcon: Warehouse, icon: "🏭",
    keywords: ["almoxarifado", "ativo", "material", "cadastrar ativo", "remo", "código remo", "novo item", "estoque"],
    question: "Como cadastrar um novo ativo no Almoxarifado?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Almoxarifado' no menu lateral" },
      { text: "Clique em '+ Cadastrar ativo' no canto superior direito", roles: ["admin", "master"] },
      { text: "O código REMO é gerado automaticamente (ex: REMO0001) — não precisa preencher" },
      { text: "Informe o nome do item e a quantidade" },
      { text: "Selecione o destino inicial (Almoxarifado, Palazzo Lumini, Queen Victoria, Chateau Carmelo ou outro)" },
      { text: "Adicione categoria e descrição técnica se necessário" },
      { text: "Faça upload de até 3 fotos do item (opcional)" },
      { text: "Clique em 'Confirmar cadastro'" },
    ],
    tip: "O código REMO é único e sequencial. Ele identifica o ativo em todo o sistema e não pode ser alterado.",
  },
  {
    id: 44, category: "Almoxarifado", categoryIcon: Warehouse, icon: "🏭",
    keywords: ["transferir", "transferência", "enviar ativo", "mover material", "destino", "envio almoxarifado"],
    question: "Como transferir um ativo para outro destino?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Almoxarifado' no menu lateral" },
      { text: "Localize o ativo na lista de inventário" },
      { text: "Clique no ícone de setas (⇄) no card do ativo", roles: ["admin", "master"] },
      { text: "Selecione o novo destino no campo 'Novo destino'" },
      { text: "Se o destino não existir na lista, clique em '+ Novo destino...' e digite o nome para criar um novo" },
      { text: "Informe a quantidade a transferir (pode ser parcial)" },
      { text: "Adicione uma observação explicando o motivo (recomendado)" },
      { text: "Clique em 'Confirmar envio'" },
    ],
    tip: "Transferências parciais dividem o ativo: a quantidade restante fica no destino original e a transferida recebe um novo código REMO.",
  },
  {
    id: 45, category: "Almoxarifado", categoryIcon: Warehouse, icon: "🏭",
    keywords: ["destino novo", "criar destino", "novo local", "destino personalizado", "obra nova destino"],
    question: "Como criar um novo destino no Almoxarifado?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "Apenas administradores e masters podem criar novos destinos.",
    steps: [
      { text: "Abra o modal de transferência ou cadastro de ativo" },
      { text: "No campo de destino, clique no select para abrir a lista" },
      { text: "Role até o final da lista e clique em '+ Novo destino...'" },
      { text: "Digite o nome do novo destino (ex: 'Vila dos Pinheiros')" },
      { text: "Pressione Enter ou clique em 'Criar'" },
      { text: "O destino é salvo automaticamente e já fica disponível para todos" },
    ],
    tip: "Destinos criados ficam disponíveis em todos os cards de KPI e filtros do Almoxarifado.",
  },
  {
    id: 46, category: "Almoxarifado", categoryIcon: Warehouse, icon: "🏭",
    keywords: ["histórico envio", "movimentação", "rastrear ativo", "log transferência", "histórico almoxarifado"],
    question: "Como ver o histórico de transferências?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Almoxarifado' no menu lateral" },
      { text: "Clique na aba 'Histórico de envios'" },
      { text: "Veja todas as transferências registradas com origem, destino, quantidade e responsável" },
      { text: "As entradas mais recentes aparecem no topo" },
      { text: "Registros com observação exibem o texto em itálico abaixo da linha" },
    ],
    tip: "O histórico é completo e não pode ser apagado — serve como rastreabilidade de todos os ativos.",
  },
  {
    id: 47, category: "Almoxarifado", categoryIcon: Warehouse, icon: "🏭",
    keywords: ["filtrar almoxarifado", "buscar ativo", "pesquisar material", "filtro destino", "busca almoxarifado"],
    question: "Como filtrar e buscar ativos no inventário?",
    visibleTo: ["admin", "master", "normal"],
    steps: [
      { text: "Acesse 'Almoxarifado' → aba 'Inventário'" },
      { text: "Use o campo de busca para pesquisar por nome, código REMO ou categoria" },
      { text: "Use o filtro de destino à direita para ver apenas itens de um local específico" },
      { text: "Combine busca + filtro para resultados mais precisos" },
      { text: "Clique em qualquer card para ver os detalhes completos e fotos do ativo" },
    ],
  },

  // ── DIÁRIO DE OBRA ───────────────────────────────────────
  {
    id: 48, category: "Diário de Obra", categoryIcon: BookMarked, icon: "📋",
    keywords: ["rdo", "diário obra", "criar rdo", "novo rdo", "relatório diário", "registro diário"],
    question: "Como criar um Diário de Obra (RDO)?",
    visibleTo: ["admin", "master", "engenheiro"],
    steps: [
      { text: "Acesse 'Diário de Obra' no menu lateral" },
      { text: "Clique em 'Novo RDO'" },
      { text: "Selecione a obra vinculada (opcional) e a data" },
      { text: "Informe o clima da manhã e tarde" },
      { text: "Cadastre o efetivo: função, quantidade e horas" },
      { text: "Descreva as atividades executadas no dia" },
      { text: "Registre ocorrências, equipamentos e materiais (opcional)" },
      { text: "Adicione fotos (máximo 5 por RDO)" },
      { text: "Clique em 'Salvar RDO'" },
    ],
    tip: "O campo 'Atividades do dia' é obrigatório. Os demais são opcionais.",
  },
  {
    id: 49, category: "Diário de Obra", categoryIcon: BookMarked, icon: "📋",
    keywords: ["exportar rdo", "download rdo", "txt rdo", "baixar rdo"],
    question: "Como exportar o RDO?",
    visibleTo: ["admin", "master", "engenheiro"],
    steps: [
      { text: "Na lista de RDOs, clique no ícone de download (⬇) do registro" },
      { text: "Ou abra o RDO e clique em 'Exportar TXT' no canto superior" },
      { text: "O arquivo é salvo automaticamente no seu computador" },
    ],
    tip: "O TXT contém todas as informações do RDO formatadas: clima, efetivo, atividades, ocorrências e URLs das fotos.",
  },
  {
    id: 50, category: "Diário de Obra", categoryIcon: BookMarked, icon: "📋",
    keywords: ["permissão rdo", "quem cria rdo", "acesso rdo", "engenheiro rdo"],
    question: "Quem pode criar e editar RDOs?",
    visibleTo: ["admin", "master", "engenheiro", "normal"],
    steps: [
      { text: "Admin e Master: criam, editam e excluem qualquer RDO", roles: ["admin", "master"] },
      { text: "Engenheiro: cria e visualiza RDOs (perfil específico para obra)", roles: ["admin", "master"] },
      { text: "Normal e Almoxarife: somente visualização" },
      { text: "Para criar um usuário Engenheiro: acesse Usuários → Novo Usuário → Tipo: Engenheiro", roles: ["admin"] },
    ],
    tip: "O perfil 'Engenheiro' é criado especificamente para responsáveis de obra que precisam registrar RDOs.",
  },
  {
    id: 51, category: "Diário de Obra", categoryIcon: BookMarked, icon: "📋",
    keywords: ["relatório rdo", "relatório diário obra", "kpi rdo", "análise rdo"],
    question: "Como ver os relatórios do Diário de Obra?",
    visibleTo: ["admin", "master"],
    restrictedMessage: "Os relatórios de RDO são acessíveis apenas para administradores e masters.",
    steps: [
      { text: "Acesse 'Relatórios' no menu lateral" },
      { text: "Selecione 'Diário de Obra (RDO)' na barra de módulos" },
      { text: "Veja KPIs: total de RDOs, trabalhadores, homem-hora e ocorrências" },
      { text: "Filtre por período usando os campos de data" },
      { text: "No Relatório Completo, o Diário de Obra aparece automaticamente" },
    ],
    tip: "O módulo 'Diário de Obra' precisa estar ativado no Gerenciar Módulos para aparecer no menu.",
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const HISTORY_KEY = "helpchat_history";
const MAX_HISTORY = 5;

const fuzzyMatch = (text: string, query: string): boolean => {
  if (text.includes(query)) return true;
  if (query.length < 4) return false;
  for (let i = 0; i <= text.length - query.length; i++) {
    let diffs = 0;
    for (let j = 0; j < query.length; j++) {
      if (text[i + j] !== query[j]) diffs++;
      if (diffs > 1) break;
    }
    if (diffs <= 1) return true;
  }
  return false;
};

const roleLabel: Record<NonNullable<UserRole>, string> = {
  admin: "Administrador", master: "Master", normal: "Usuário", engenheiro: "Engenheiro",
};

const ROLE_STYLE: Record<NonNullable<UserRole>, { bg: string; text: string }> = {
  admin:      { bg: "bg-red-500/15",    text: "text-red-400" },
  master:     { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  normal:     { bg: "bg-blue-500/15",   text: "text-blue-400" },
  engenheiro: { bg: "bg-teal-500/15",   text: "text-teal-400" },
};

const CAT_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  "Acesso e Login":       { bg: "bg-muted",            text: "text-muted-foreground",  dot: "bg-muted-foreground" },
  "Dashboard":            { bg: "bg-blue-500/10",      text: "text-blue-400",           dot: "bg-blue-400" },
  "Meu Espaço":           { bg: "bg-teal-500/10",      text: "text-teal-400",           dot: "bg-teal-400" },
  "Metas":                { bg: "bg-yellow-500/10",    text: "text-yellow-400",         dot: "bg-yellow-400" },
  "Execução de Obra":     { bg: "bg-orange-500/10",    text: "text-orange-400",         dot: "bg-orange-400" },
  "Relatórios":           { bg: "bg-emerald-500/10",   text: "text-emerald-400",        dot: "bg-emerald-400" },
  "Financeiro":           { bg: "bg-green-500/10",     text: "text-green-400",          dot: "bg-green-400" },
  "Obras e Projetos":     { bg: "bg-amber-500/10",     text: "text-amber-400",          dot: "bg-amber-400" },
  "Importação de Dados":  { bg: "bg-indigo-500/10",    text: "text-indigo-400",         dot: "bg-indigo-400" },
  "Metas Avançadas":      { bg: "bg-purple-500/10",    text: "text-purple-400",         dot: "bg-purple-400" },
  "Cadastro de Dados":    { bg: "bg-cyan-500/10",      text: "text-cyan-400",           dot: "bg-cyan-400" },
  "Gerenciar Usuários":   { bg: "bg-pink-500/10",      text: "text-pink-400",           dot: "bg-pink-400" },
  "Backup e Restauração": { bg: "bg-red-500/10",       text: "text-red-400",            dot: "bg-red-400" },
  "Manuais do Sistema":   { bg: "bg-lime-500/10",      text: "text-lime-400",           dot: "bg-lime-400" },
  "Notificações":         { bg: "bg-yellow-500/10",    text: "text-yellow-400",         dot: "bg-yellow-400" },
  "Problemas e Soluções": { bg: "bg-rose-500/10",      text: "text-rose-400",           dot: "bg-rose-400" },
  "Almoxarifado":         { bg: "bg-orange-500/10",    text: "text-orange-400",         dot: "bg-orange-400" },
  "Diário de Obra":       { bg: "bg-sky-500/10",       text: "text-sky-400",            dot: "bg-sky-400" },
};

const catStyle = (cat: string) =>
  CAT_COLOR[cat] ?? { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" };

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENTE — Botão de tópico
// ─────────────────────────────────────────────────────────────
function TopicBtn({
  topic, hasAccess, onClick,
}: {
  topic: HelpTopic;
  hasAccess: boolean;
  onClick: () => void;
}) {
  const cs = catStyle(topic.category);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-sidebar-accent/60 transition-colors group"
    >
      <span className={`w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0 ${cs.bg} ${cs.text}`}>
        {topic.icon}
      </span>
      <span className="text-[12px] flex-1 truncate text-sidebar-foreground group-hover:text-sidebar-accent-foreground">
        {topic.question}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {!hasAccess && <Lock className="w-3 h-3 text-sidebar-muted" />}
        <ChevronRight className="w-3.5 h-3.5 text-sidebar-muted group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export function HelpChat() {
  const { user, userRole: authRole, enabledModules, signOut } = useAuth();

  // ── FIX: garante que userRole nunca seja undefined ────────
  const userRole = (authRole ?? null) as UserRole;

  const [isOpen, setIsOpen]               = useState(false);
  const [query, setQuery]                 = useState("");
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [view, setView]                   = useState<"home" | "search" | "category" | "topic">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [history, setHistory]             = useState<number[]>([]);
  const [pulse, setPulse]                 = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── FIX: enabledModules com fallback seguro ───────────────
  const safeModules = enabledModules ?? {};

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const t  = setTimeout(() => setPulse(true), 3000);
    const t2 = setTimeout(() => setPulse(false), 6000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  // ── Calcula categorias visíveis para este usuário ─────────
  const visibleCategories = useCallback((): Set<string> => {
    // sem role: nenhuma categoria
    if (!userRole) return new Set();
    // admin e master veem tudo
    if (userRole === "admin" || userRole === "master") {
      return new Set(allTopics.map(t => t.category));
    }
    // engenheiro: categorias universais + diário de obra
    if (userRole === "engenheiro") {
      const cats = new Set<string>(UNIVERSAL_CATEGORIES);
      cats.add("Diário de Obra");
      return cats;
    }
    // normal: universais + módulos habilitados
    const cats = new Set<string>(UNIVERSAL_CATEGORIES);
    for (const [moduleKey, categories] of Object.entries(MODULE_TO_CATEGORIES)) {
      if (safeModules[moduleKey] === true) {
        categories.forEach(c => cats.add(c));
      }
    }
    return cats;
  }, [userRole, safeModules]);

  // ── FIX: guard completo em hasAccess ──────────────────────
  const hasAccess = useCallback(
    (t: HelpTopic) => {
      // sem role: sem acesso
      if (!userRole) return false;
      // tópico sem visibleTo definido: nega por segurança
      if (!Array.isArray(t.visibleTo)) return false;
      // verifica se a role do usuário está na lista do tópico
      if (!t.visibleTo.includes(userRole)) return false;
      // admin e master: acesso total
      if (userRole === "admin" || userRole === "master") return true;
      // demais roles: verifica se a categoria está liberada
      return visibleCategories().has(t.category);
    },
    [userRole, visibleCategories]
  );

  // ── FIX: guard completo em accessibleTopics ───────────────
  const accessibleTopics = useCallback(() => {
    // sem role: retorna lista vazia
    if (!userRole) return [];
    const cats = visibleCategories();
    return allTopics.filter(t =>
      // FIX: verifica Array.isArray antes de chamar .includes
      Array.isArray(t.visibleTo) &&
      t.visibleTo.includes(userRole) &&
      cats.has(t.category)
    );
  }, [userRole, visibleCategories]);

  // ── FIX: guard em stepsForUser ────────────────────────────
  const stepsForUser = (steps: Step[]) => {
    if (!userRole) return steps.filter(s => !s.roles);
    return steps.filter(s =>
      !s.roles ||
      (Array.isArray(s.roles) && s.roles.includes(userRole as any))
    );
  };

  const searchResults = useCallback(() => {
    if (!query.trim()) return [];
    const q = normalize(query);
    return accessibleTopics().filter(t =>
      (Array.isArray(t.keywords) && t.keywords.some(k => fuzzyMatch(normalize(k), q))) ||
      fuzzyMatch(normalize(t.question), q) ||
      fuzzyMatch(normalize(t.category), q)
    );
  }, [query, accessibleTopics]);

  const categories = Array.from(
    new Map(
      accessibleTopics().map(t => [t.category, t.categoryIcon])
    ).entries()
  );

  const topicsByCategory = (cat: string) =>
    allTopics.filter(t =>
      t.category === cat &&
      Array.isArray(t.visibleTo) &&
      (userRole ? t.visibleTo.includes(userRole) : false)
    );

  const historyTopics = history
    .map(id => allTopics.find(t => t.id === id))
    .filter((t): t is HelpTopic =>
      !!t && accessibleTopics().some(a => a.id === t.id)
    );

  const saveToHistory = (id: number) => {
    const updated = [id, ...history.filter(h => h !== id)].slice(0, MAX_HISTORY);
    setHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
  };

  const openTopic = (topic: HelpTopic) => {
    saveToHistory(topic.id);
    setSelectedTopic(topic);
    setView("topic");
  };

  const goBack = () => {
    if (view === "topic") {
      setSelectedTopic(null);
      setView(selectedCategory ? "category" : query ? "search" : "home");
    } else if (view === "category") {
      setSelectedCategory(null);
      setView("home");
    } else if (view === "search") {
      setQuery("");
      setView("home");
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setView("home");
    setQuery("");
    setSelectedTopic(null);
    setSelectedCategory(null);
  };

  const greetingContext = useCallback((): string => {
    if (!userRole) return "Como posso ajudar você hoje?";
    if (userRole === "admin" || userRole === "master") return "Como posso ajudar você hoje?";
    if (userRole === "engenheiro") return "Central de ajuda — Diário de Obra.";
    const ativos = Object.entries(safeModules)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ativos.length === 1) {
      const labels: Record<string, string> = {
        almoxarifado: "Almoxarifado", metas: "Metas", execucao: "Execução de Obra",
        financeiro: "Financeiro", obras: "Obras", relatorios: "Relatórios",
        ranking: "Ranking", importacao: "Importação", cadastro: "Cadastro",
        metas_avancadas: "Metas Avançadas",
      };
      return `Central de ajuda do módulo ${labels[ativos[0]] ?? ativos[0]}.`;
    }
    return "Como posso ajudar você hoje?";
  }, [userRole, safeModules]);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";
  const cs        = catStyle(selectedCategory ?? "");
  const rStyle    = userRole ? ROLE_STYLE[userRole] : null;

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="bg-sidebar text-sidebar-foreground text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg border border-sidebar-border pointer-events-none select-none">
            Central de Ajuda
          </div>
        )}
        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          aria-label="Central de Ajuda"
          className={`
            relative w-13 h-13 w-12 h-12 rounded-xl shadow-xl
            flex items-center justify-center
            transition-all duration-200
            bg-sidebar border border-sidebar-border
            hover:border-primary hover:shadow-primary/20
            active:scale-95
          `}
          style={{ background: "hsl(var(--pbi-dark))" }}
        >
          {pulse && !isOpen && (
            <span className="absolute inset-0 rounded-xl border-2 border-primary animate-ping opacity-60" />
          )}
          <div className="relative z-10 transition-transform duration-200">
            {isOpen
              ? <X className="w-4.5 h-4.5 w-5 h-5 text-sidebar-foreground" />
              : <HelpIcon className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
            }
          </div>
          {!isOpen && history.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Painel principal ────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-[72px] right-4 z-50 w-[92vw] max-w-[380px] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-sidebar-border animate-in slide-in-from-bottom-3 fade-in duration-200"
          style={{ maxHeight: "calc(100dvh - 96px)", minHeight: "320px", background: "hsl(var(--pbi-dark))" }}
        >

          {/* ── Header ──────────────────────────────────── */}
          <div className="shrink-0 border-b border-sidebar-border" style={{ background: "hsl(215, 52%, 8%)" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                {view !== "home" && (
                  <button onClick={goBack}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors">
                    <ArrowLeft className="w-4 h-4 text-sidebar-foreground" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "hsl(var(--pbi-yellow))" }}>
                      <HelpIcon className="w-3 h-3" style={{ color: "hsl(var(--pbi-dark))" }} />
                    </div>
                    <span className="text-[13px] font-semibold text-sidebar-accent-foreground">
                      Central de Ajuda
                    </span>
                  </div>
                  {userRole && rStyle && (
                    <span className={`inline-flex items-center mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-semibold ${rStyle.bg} ${rStyle.text}`}>
                      {roleLabel[userRole]}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors">
                <X className="w-4 h-4 text-sidebar-muted" />
              </button>
            </div>

            {/* Search */}
            <div className="relative px-4 pb-3">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setView(e.target.value ? "search" : "home"); }}
                placeholder="Pesquise sua dúvida..."
                className="w-full pl-8 pr-8 py-2 rounded-md text-[12px] outline-none transition-colors border border-sidebar-border focus:border-primary placeholder:text-sidebar-muted text-sidebar-foreground"
                style={{ background: "hsl(215, 45%, 12%)" }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setView("home"); }}
                  className="absolute right-7 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-sidebar-muted hover:text-sidebar-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* ── Body ────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto" style={{ background: "hsl(var(--pbi-dark))" }}>

            {/* HOME */}
            {view === "home" && (
              <div className="p-4 space-y-4">

                {/* Boas vindas */}
                <div className="rounded-md p-3 border border-sidebar-border" style={{ background: "hsl(215, 48%, 10%)" }}>
                  <p className="text-[13px] font-semibold text-sidebar-accent-foreground">
                    {firstName ? `Olá, ${firstName}! 👋` : "Olá! 👋"}
                  </p>
                  <p className="text-[11px] text-sidebar-muted mt-0.5">
                    {greetingContext()}
                  </p>
                </div>

                {/* Histórico */}
                {historyTopics.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-muted mb-2 px-1">
                      Vistos recentemente
                    </p>
                    <div className="space-y-px">
                      {historyTopics.slice(0, 3).map(topic => (
                        <TopicBtn key={topic.id} topic={topic} hasAccess={hasAccess(topic)} onClick={() => openTopic(topic)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorias grid */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-muted mb-2 px-1">
                    Categorias
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(([cat, Icon]) => {
                      const count = topicsByCategory(cat).filter(t => hasAccess(t)).length;
                      const cst   = catStyle(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => { setSelectedCategory(cat); setView("category"); }}
                          className="group flex flex-col gap-2 p-3 rounded-md text-left border border-sidebar-border hover:border-primary/40 transition-all duration-150 hover:bg-sidebar-accent/40"
                          style={{ background: "hsl(215, 48%, 10%)" }}
                        >
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cst.bg} ${cst.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold leading-tight line-clamp-2 text-sidebar-accent-foreground">{cat}</p>
                            <p className="text-[10px] text-sidebar-muted mt-0.5">{count} tópicos</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* BUSCA */}
            {view === "search" && (
              <div className="p-4">
                {searchResults().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-md mx-auto flex items-center justify-center mb-3 border border-sidebar-border" style={{ background: "hsl(215, 48%, 10%)" }}>
                      <Search className="w-5 h-5 text-sidebar-muted" />
                    </div>
                    <p className="text-[12px] font-semibold text-sidebar-foreground">Nenhum resultado</p>
                    <p className="text-[11px] text-sidebar-muted mt-1">
                      Tente: meta, obra, usuário, relatório...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-px">
                    <p className="text-[11px] text-sidebar-muted mb-3 px-1">
                      <span className="font-semibold text-sidebar-foreground">{searchResults().length}</span> resultado(s) para "{query}"
                    </p>
                    {searchResults().map(topic => (
                      <TopicBtn key={topic.id} topic={topic} hasAccess={hasAccess(topic)} onClick={() => openTopic(topic)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORIA */}
            {view === "category" && selectedCategory && (
              <div className="p-4">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold mb-3 ${cs.bg} ${cs.text}`}>
                  {selectedCategory}
                </div>
                <div className="space-y-px">
                  {topicsByCategory(selectedCategory).map(topic => (
                    <TopicBtn key={topic.id} topic={topic} hasAccess={hasAccess(topic)} onClick={() => openTopic(topic)} />
                  ))}
                </div>
              </div>
            )}

            {/* TÓPICO */}
            {view === "topic" && selectedTopic && (() => {
              const tcs = catStyle(selectedTopic.category);
              return (
                <div className="p-4 space-y-4">

                  {/* Header do tópico */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center text-base shrink-0 ${tcs.bg} ${tcs.text}`}>
                      {selectedTopic.icon}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-sidebar-accent-foreground leading-snug">{selectedTopic.question}</h3>
                      {userRole && rStyle && (
                        <span className={`inline-flex mt-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${rStyle.bg} ${rStyle.text}`}>
                          {roleLabel[userRole]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sem permissão */}
                  {!hasAccess(selectedTopic) && selectedTopic.restrictedMessage ? (
                    <div className="flex gap-2.5 p-3 rounded-md border border-red-900/40 bg-red-900/20">
                      <Lock className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-300 leading-relaxed">{selectedTopic.restrictedMessage}</p>
                    </div>
                  ) : (
                    <>
                      {/* Passos */}
                      <div className="space-y-1.5">
                        {stepsForUser(selectedTopic.steps).map((step, i) => (
                          <div key={i} className="flex gap-2.5 p-2.5 rounded-md border border-sidebar-border" style={{ background: "hsl(215, 48%, 10%)" }}>
                            <div className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                              style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}>
                              {i + 1}
                            </div>
                            <p className="text-[12px] text-sidebar-foreground leading-relaxed">{step.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Dica */}
                      {selectedTopic.tip && (
                        <div className="flex gap-2.5 p-3 rounded-md border border-yellow-900/40 bg-yellow-900/20">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--pbi-yellow))" }} />
                          <p className="text-[11px] leading-relaxed" style={{ color: "hsl(45, 80%, 70%)" }}>{selectedTopic.tip}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Relacionados */}
                  {topicsByCategory(selectedTopic.category).filter(t => t.id !== selectedTopic.id).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-muted mb-2">
                        Ver também
                      </p>
                      <div className="space-y-px">
                        {topicsByCategory(selectedTopic.category)
                          .filter(t => t.id !== selectedTopic.id)
                          .slice(0, 3)
                          .map(topic => (
                            <TopicBtn key={topic.id} topic={topic} hasAccess={hasAccess(topic)} onClick={() => openTopic(topic)} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── Footer ──────────────────────────────────── */}
          <div className="shrink-0 px-4 py-3 border-t border-sidebar-border flex items-center justify-between gap-3" style={{ background: "hsl(215, 52%, 8%)" }}>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-sidebar-accent-foreground truncate leading-tight">
                {user?.user_metadata?.full_name ?? user?.email ?? "Usuário"}
              </p>
              {userRole && (
                <p className="text-[10px] text-sidebar-muted">{roleLabel[userRole]}</p>
              )}
            </div>
            <button
              onClick={async () => { setIsOpen(false); await signOut(); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border border-sidebar-border hover:border-red-900/50 hover:bg-red-900/20 text-sidebar-muted hover:text-red-400 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}