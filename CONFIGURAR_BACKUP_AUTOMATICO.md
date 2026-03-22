# GUIA DE CONFIGURAÇÃO — BACKUP AUTOMÁTICO
# Business Navigator Pro — San Remo

## Por que o backup automático não funcionava?

O sistema precisava de duas **Edge Functions** no Supabase que não existiam:
- `backup-system`    — exporta e importa dados via interface
- `automated-backup` — executa o backup periódico (cron ou manual)

Além disso, as tabelas já existiam no banco mas sem as colunas corretas e
o bucket de Storage não estava configurado.

**Tempo total para configurar: ~15 minutos**

---

## PASSO 1 — Rodar o SQL de configuração (3 min)

1. Acesse https://supabase.com/dashboard → seu projeto
2. Clique em **SQL Editor** → **New Query**
3. Copie e cole o conteúdo do arquivo:
   `supabase/migrations/20260318000001_backup_tables.sql`
4. Clique em **Run**

✅ Isso adiciona colunas faltantes, configura RLS e cria o bucket de Storage.

---

## PASSO 2 — Fazer deploy das Edge Functions (10 min)

### Opção A: Via CLI (mais rápido)

```bash
# Instale o CLI se não tiver
npm install -g supabase

# Autentique com sua conta
supabase login

# Na pasta raiz do projeto
supabase functions deploy backup-system     --project-ref SEU_PROJECT_REF
supabase functions deploy automated-backup  --project-ref SEU_PROJECT_REF
```

> Seu `project-ref` está na URL do Supabase: `https://supabase.com/dashboard/project/SEU_PROJECT_REF`
> Também está no arquivo `.env` como parte do `VITE_SUPABASE_URL`

### Opção B: Via Dashboard (sem instalar nada)

1. No Dashboard → **Edge Functions** → **New Function**
2. Nome: `backup-system`
3. Copie o conteúdo de `supabase/functions/backup-system/index.ts`
4. Cole e clique em **Deploy**
5. Repita com nome `automated-backup` usando `supabase/functions/automated-backup/index.ts`

---

## PASSO 3 — Configurar o Cron para backup automático (2 min)

1. No Dashboard → **Edge Functions** → clique em `automated-backup`
2. Aba **Schedules** → **Add Schedule**
3. Cron expression: `0 2 * * 0`
   _(todo domingo às 02:00 — pode ajustar como quiser)_
4. Salve

> Sem o cron, o backup automático NÃO executa sozinho.
> O botão **"Executar agora"** na tela de Backup sempre funciona.

---

## Verificação — teste em 30 segundos

1. Acesse o sistema → menu **Backup**
2. Clique no botão roxo **"Executar agora"**
3. Resultado esperado: `"✅ Backup automático executado! X registros · Y tabelas"`
4. Histórico de execuções deve aparecer abaixo
5. Teste também o botão verde **"Exportar Backup"** — deve baixar um `.zip`

---

## Como funciona o sistema completo

```
BOTÃO "Exportar Backup" (verde)
  ├─ Tenta Edge Function "backup-system" (action: export)
  └─ Fallback automático: gera backup direto no navegador
  └─ Baixa .zip com: JSON + SQL + CSV por tabela

BOTÃO "Executar agora" (roxo)
  └─ Chama Edge Function "automated-backup"
  └─ Salva JSON no bucket 'backups' do Storage
  └─ Registra no backup_history
  └─ Notifica todos os admins

CRON (domingo 02:00)
  └─ Mesmo fluxo do "Executar agora"

RESTAURAR BACKUP
  ├─ Tenta Edge Function "backup-system" (action: import)
  └─ Fallback: upsert direto via cliente Supabase
```

---

## Tabelas incluídas no backup

| Grupo     | Tabelas |
|-----------|---------|
| Sistema   | profiles, user_roles, admin_notifications |
| Metas     | metas, acoes_meta, meta_checkins, meta_predictions, meta_dependencies |
| Financeiro| faturamento, contas_pagar, contas_receber, dados_cadastro, relatorios_gerados |
| Obras     | empreendimentos, contratos, materiais, execucao_obras |

---

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Edge Function indisponível" | Funções não deployadas | Siga o Passo 2 |
| "Não autorizado" | Usuário sem role admin | Verificar `user_roles` no banco |
| Histórico não aparece | Tabela sem RLS correto | Rodar o SQL do Passo 1 |
| Storage vazio após backup | Bucket não criado | O SQL do Passo 1 cria automaticamente |
| Botão "Exportar" baixa vazio | Tabelas não existem | Verificar se há dados no banco |
