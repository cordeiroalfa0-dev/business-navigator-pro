# 🛠️ Manual de Restauração Completa: Business Navigator Pro

Este manual descreve o processo passo a passo para restaurar o banco de dados do **Business Navigator Pro** caso você perca sua instância gratuita do Supabase ou deseje migrar para um novo projeto.

---

## 📦 O que o Backup Contém?

Ao clicar em **"Gerar Backup 100%"** na área de Admin, o sistema gera um arquivo `.zip` contendo:

1.  **`backup_completo.json`**: Arquivo principal para restauração automática via interface do Admin.
2.  **`restauracao_supabase.sql`**: Script SQL para execução direta no SQL Editor do Supabase (contém todos os comandos `INSERT`).
3.  **`dados_tabelas/`**: Pasta com arquivos `.csv` (para Excel) e `.json` individuais de cada tabela.
4.  **`usuarios_auth_referencia.json`**: Lista de e-mails e IDs dos usuários (apenas para referência, senhas não são exportadas por segurança).
5.  **`INSTRUCOES_RESTAURACAO.txt`**: Guia rápido de uso.

---

## 🚀 Passo 1: Preparar o Novo Projeto Supabase

Se você perdeu o banco antigo, siga estes passos para configurar o novo:

1.  Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e crie um **New Project**.
2.  Anote a **URL** e a **Service Role Key** do novo projeto (em *Project Settings > API*).
3.  Atualize as variáveis de ambiente (`.env`) do seu projeto local com as novas credenciais.

---

## 🏗️ Passo 2: Recriar a Estrutura (Schema)

Antes de importar os dados, o banco precisa ter as tabelas criadas.

### Opção A: Via CLI (Recomendado)
Se você tem o Supabase CLI instalado:
```bash
supabase link --project-ref seu-novo-id-projeto
supabase db push
```

### Opção B: Via SQL Editor (Manual)
1.  No seu código, abra a pasta `supabase/migrations/`.
2.  Copie o conteúdo dos arquivos SQL em ordem cronológica (pela data no nome do arquivo).
3.  Cole e execute no **SQL Editor** do painel do Supabase.

---

## 📥 Passo 3: Restaurar os Dados

### Método 1: Via Interface Admin (Mais Fácil)
1.  Acesse a página de **Admin > Backup** no seu aplicativo (já conectado ao novo banco).
2.  Clique em **"Selecionar Arquivo"** e escolha o arquivo `backup_completo.json` (extraia do ZIP primeiro).
3.  Escolha o escopo **"Tudo (Sistema + Banco)"**.
4.  Clique em **"Confirmar e Iniciar"**. O sistema irá inserir todos os registros automaticamente, respeitando as chaves estrangeiras.

### Método 2: Via SQL Editor (Backup SQL)
1.  Abra o arquivo `restauracao_supabase.sql` que veio no ZIP.
2.  Copie todo o conteúdo.
3.  No painel do Supabase, vá em **SQL Editor > New Query**.
4.  Cole o conteúdo e clique em **Run**.
    *   *Nota: Este script usa `ON CONFLICT (id) DO UPDATE`, então ele não criará duplicatas se rodado mais de uma vez.*

---

## 👤 Passo 4: Usuários e Autenticação

O Supabase **não permite exportar senhas** via API por questões de segurança. Para restaurar o acesso dos usuários:

1.  Consulte o arquivo `usuarios_auth_referencia.json` no backup para ver quem eram os usuários.
2.  No painel do Supabase, vá em **Authentication > Users**.
3.  Clique em **Invite** e envie convites para os e-mails da lista.
4.  **Importante:** Assim que o usuário aceitar o convite e criar a senha, o sistema automaticamente vinculará o perfil dele (na tabela `profiles`) através do e-mail/ID, mantendo todas as permissões e dados vinculados.

---

## 💡 Dicas de Segurança

*   **Frequência:** Realize um backup pelo menos uma vez por semana.
*   **Armazenamento:** Não guarde o backup apenas no seu computador. Salve uma cópia no Google Drive, Dropbox ou OneDrive.
*   **Teste:** Tente restaurar o backup em um projeto de teste ocasionalmente para garantir que o processo está funcionando como esperado.

---

> **Aviso:** Este sistema de backup foca nos dados do banco de dados (PostgreSQL). Arquivos enviados para o **Storage** (fotos de perfil, anexos) devem ser baixados manualmente do bucket do Supabase, caso existam.
