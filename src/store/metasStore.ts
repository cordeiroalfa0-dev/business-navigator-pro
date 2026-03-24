/**
 * Store centralizado para Metas, Ações e Check-ins.
 *
 * Fase 1 — substitui os 3 useRealtimeTable independentes em Metas.tsx por um
 * único canal Supabase que escuta as três tabelas e dispara um único re-fetch
 * com debounce de 400 ms. Isso elimina a possibilidade de 3 subscriptions
 * duplicadas quando o componente remonta várias vezes.
 *
 * Padrão: módulo singleton — o canal é criado uma vez e compartilhado por
 * todos os consumidores via contador de referências.
 */

import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

const TABLES = ["metas", "acoes_meta", "meta_checkins"] as const;
const CHANNEL_NAME = "metas-store-central";
const DEBOUNCE_MS = 400;

// ── Registro de listeners por tabela ──────────────────────────────────────
const listeners: Record<string, Set<Listener>> = {
  metas: new Set(),
  acoes_meta: new Set(),
  meta_checkins: new Set(),
};

let refCount = 0;
let channel: ReturnType<typeof supabase.channel> | null = null;
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function notify(table: string) {
  clearTimeout(debounceTimers[table]);
  debounceTimers[table] = setTimeout(() => {
    listeners[table]?.forEach((fn) => fn());
  }, DEBOUNCE_MS);
}

function startChannel() {
  if (channel) return;
  let ch = supabase.channel(CHANNEL_NAME);
  TABLES.forEach((table) => {
    ch = ch.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table },
      () => notify(table)
    );
  });
  ch.subscribe();
  channel = ch;
}

function stopChannel() {
  if (!channel) return;
  supabase.removeChannel(channel);
  channel = null;
  Object.keys(debounceTimers).forEach((k) => clearTimeout(debounceTimers[k]));
}

/** Registra um listener para uma tabela. Retorna a função de cancelamento. */
export function subscribe(
  table: (typeof TABLES)[number],
  fn: Listener
): () => void {
  if (refCount === 0) startChannel();
  refCount++;
  listeners[table].add(fn);

  return () => {
    listeners[table].delete(fn);
    refCount--;
    if (refCount === 0) stopChannel();
  };
}
