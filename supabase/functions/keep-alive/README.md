# Keep-Alive — Supabase Free Tier

Evita o auto-pause do projeto após 7 dias sem atividade.

## Como funciona

Um cron job (`pg_cron`) dispara a cada 2 dias às 08:00 UTC e chama
a Edge Function `keep-alive`, que insere um registro na tabela
`system_heartbeats` mantendo o projeto ativo.

## Deploy (rode uma vez após clonar)

```bash
npx supabase login
npx supabase link --project-ref fntenxsyxzdrmqiweorq
npx supabase db push
npx supabase functions deploy keep-alive
```

## Monitoramento (SQL Editor do Supabase)

```sql
SELECT * FROM system_heartbeat_status;
```

| Coluna | Descrição |
|--------|-----------|
| last_heartbeat | Data/hora do último registro |
| heartbeats_last_week | Quantidade nos últimos 7 dias |
| time_since_last | Tempo desde o último heartbeat |
| status | OK / AVISO / CRITICO |

## Cron

```
0 8 */2 * *   →  todo dia par às 08:00 UTC  (~15 execuções/mês)
```

Custo estimado: **$0**
