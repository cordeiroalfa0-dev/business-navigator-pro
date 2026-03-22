# 🛠️ Como Ativar as Funções de Criação de Usuário (Edge Functions)

O erro **"Failed to send a request to the Edge Function"** ocorre porque o seu projeto Supabase ainda não "conhece" as funções de criação de usuário. Siga estes passos simples para ativar:

### 1. Instale o Supabase CLI (no seu computador)
Se você ainda não tem, abra o terminal do seu computador e digite:
```bash
npm install -g supabase
```

### 2. Faça o Login
```bash
supabase login
```

### 3. Vincule ao seu Projeto
Vá na pasta do projeto `business-navigator-pro` e rode:
```bash
supabase link --project-ref [SEU-ID-DO-PROJETO]
```
*(Você encontra o ID do projeto na URL do seu painel do Supabase ou em Settings > API)*

### 4. Envie as Funções (Deploy)
Agora, envie todas as funções de uma vez para o Supabase:
```bash
supabase functions deploy create-user
supabase functions deploy list-users
supabase functions deploy delete-user
supabase functions deploy update-user-role
```

### 5. Configure as Chaves de Segurança (MUITO IMPORTANTE)
Para que as funções funcionem, elas precisam de permissão de "Service Role". No painel do Supabase, vá em **Settings > API** e copie a `service_role key`.

Depois, no terminal do seu computador, rode:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[COLE_A_CHAVE_AQUI]
```

---

### ✅ Pronto!
Agora, ao clicar em "Criar Usuário" no sistema, ele conseguirá se comunicar com o Supabase e criar o usuário corretamente.

> **Dica:** Se você não quiser usar o terminal, você pode simplesmente usar o script SQL `CORRECAO_BANCO_DADOS.sql` que eu preparei para garantir que o seu usuário de Admin tenha todas as permissões necessárias no banco de dados.
