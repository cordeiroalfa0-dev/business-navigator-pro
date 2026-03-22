# 🔍 Troubleshooting: Erro ao Criar Usuários

## Erro: "Failed to send a request to the Edge Function"

Este erro significa que o frontend tentou chamar uma função do Supabase, mas a função não respondeu. Aqui estão as causas e soluções:

---

## 📋 Checklist de Diagnóstico

### 1. Verifique se você está logado como Admin
```
Passo 1: Abra o navegador (F12) > Console
Passo 2: Cole este código:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", session.user.id);
console.log("Sua role:", roles);
```
```
Resultado esperado: Deve mostrar `[{ role: "admin", ... }]`
Se mostrar `[]` ou `null`, você não tem permissão de admin.
```

### 2. Verifique se as Edge Functions estão ativas
```
Passo 1: Vá para https://supabase.com/dashboard/project/_/functions
Passo 2: Procure por estas funções:
  - create-user
  - list-users
  - delete-user
  - update-user-role
```
Se não estiverem lá, siga o arquivo `COMO_ATIVAR_FUNCOES.md`.

### 3. Verifique o erro exato no Console do Navegador
```
Passo 1: Abra o navegador (F12) > Console
Passo 2: Clique em "Novo Usuário" no sistema
Passo 3: Procure por mensagens de erro em vermelho
```

---

## 🛠️ Soluções Comuns

### Solução 1: Seu usuário não é Admin
**Sintoma**: Erro diz "Not authorized" ou "Not authenticated"

**Solução**:
1. Abra o SQL Editor do Supabase
2. Cole este comando:
```sql
-- Encontre seu ID de usuário
SELECT id, email FROM auth.users WHERE email = 'seu-email@aqui.com';

-- Copie o ID e cole aqui:
INSERT INTO public.user_roles (user_id, role)
VALUES ('COLE_O_ID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Solução 2: As Edge Functions não estão ativadas
**Sintoma**: Erro diz "404 Not Found" ou "Function not found"

**Solução**: Siga o arquivo `COMO_ATIVAR_FUNCOES.md` para fazer o deploy das funções.

---

### Solução 3: O banco de dados não está configurado
**Sintoma**: Erro diz "relation does not exist" ou "permission denied"

**Solução**:
1. Abra o SQL Editor do Supabase
2. Cole o arquivo `CORRECAO_BANCO_DADOS.sql` completo
3. Execute

---

## 🔗 Checklist de Configuração

- [ ] Meu e-mail está cadastrado em `auth.users`
- [ ] Meu usuário tem a role `admin` em `public.user_roles`
- [ ] As tabelas `profiles` e `user_roles` existem
- [ ] As Edge Functions estão ativadas no painel do Supabase
- [ ] A variável `VITE_SUPABASE_URL` está correta no `.env`
- [ ] A variável `VITE_SUPABASE_ANON_KEY` está correta no `.env`

---

## 📞 Se Nada Funcionar

1. **Tire uma screenshot do erro** (F12 > Console)
2. **Anote a URL exata** que está sendo chamada (F12 > Network)
3. **Verifique o painel do Supabase** em Settings > API para confirmar as chaves
4. **Tente criar um novo projeto Supabase** e repetir o processo

---

## 🎓 Entendendo o Fluxo

Quando você clica em "Criar Usuário", o sistema faz isto:

```
1. Frontend (React) → Envia dados para a Edge Function
2. Edge Function (Deno) → Verifica se você é admin
3. Edge Function → Cria o usuário em auth.users
4. Edge Function → Cria a role em public.user_roles
5. Frontend → Mostra sucesso ou erro
```

Se falhar em qualquer etapa, você vê "Failed to send a request to the Edge Function".

---

## 🚀 Teste Rápido

Para confirmar que tudo está funcionando:

1. Abra o Console do navegador (F12)
2. Cole isto:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const res = await supabase.functions.invoke("list-users", {
  headers: { Authorization: `Bearer ${session?.access_token}` },
});
console.log("Resultado:", res);
```

Se você vir uma lista de usuários, as Edge Functions estão funcionando! ✅
