# ⚡ GUIA RÁPIDO: FAZER O SISTEMA FUNCIONAR AGORA

Você recebeu o erro **"Failed to send a request to the Edge Function"** ao tentar criar um usuário. Aqui está o caminho mais rápido para resolver:

---

## 🎯 Opção 1: Solução Rápida (5 minutos) - Recomendada

### Passo 1: Abra o SQL Editor do Supabase
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu à esquerda, clique em **SQL Editor**
4. Clique em **New Query**

### Passo 2: Cole o Script de Correção
1. Abra o arquivo `CORRECAO_BANCO_DADOS.sql` (que está na pasta do projeto)
2. **Copie TODO o conteúdo**
3. Cole no SQL Editor do Supabase
4. **IMPORTANTE**: Se o seu e-mail de login NÃO é `emerson@sanremo.com`, procure pela linha:
   ```sql
   target_email TEXT := 'emerson@sanremo.com';
   ```
   E mude para o seu e-mail.

### Passo 3: Execute
Clique no botão **Run** (ou aperte `Ctrl+Enter`)

✅ **Pronto!** Seu banco de dados está configurado. Agora teste criar um usuário no sistema.

---

## 🔧 Opção 2: Solução Completa (20 minutos) - Se a Opção 1 não funcionar

Se o erro persistir, você precisa ativar as Edge Functions. Siga o arquivo `COMO_ATIVAR_FUNCOES.md`.

---

## 🚨 Se Ainda Não Funcionar

### Verifique:
1. **Você está logado com o e-mail correto?** 
   - O usuário que tenta criar outros usuários DEVE ter a role `admin` no banco de dados.
   
2. **O seu projeto Supabase está ativo?**
   - Vá em https://supabase.com/dashboard e confirme que o projeto não foi pausado.

3. **As variáveis de ambiente estão corretas?**
   - Abra o arquivo `.env` e `.env.local`
   - Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` apontam para o seu projeto.

### Última Opção: Reinicie Tudo
Se nada funcionar, você pode:
1. Criar um novo projeto Supabase (gratuito)
2. Atualizar o `.env` com as novas credenciais
3. Rodar o script `CORRECAO_BANCO_DADOS.sql` novamente
4. Recarregar o navegador (Ctrl+Shift+Delete para limpar cache)

---

## 📞 Precisa de Ajuda?

Se o erro continuar, tire uma screenshot do erro exato e verifique:
- **Console do navegador** (F12 > Console): Qual é a mensagem de erro completa?
- **Network** (F12 > Network): Qual URL está sendo chamada? Ela retorna 404 ou 500?

Isso ajudará a identificar se o problema é com a Edge Function ou com o banco de dados.
