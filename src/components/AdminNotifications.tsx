import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, X, Clock, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
  related_entity_type?: string;
  action_url?: string;
}

export function AdminNotifications() {
  const { user, isAdmin, userRole } = useAuth();

  // Notificações visíveis para admin E master
  const canReceive = isAdmin || userRole === "master";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showPanel,     setShowPanel]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [pulse,         setPulse]         = useState(false); // animação sino

  const userRef    = useRef(user);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCount  = useRef(0);

  useEffect(() => { userRef.current = user; }, [user]);

  // ── Fetch notificações ────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;

    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("admin_id", u.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const list = data as Notification[];
      const unread = list.filter(n => !n.is_read).length;

      setNotifications(list);
      setUnreadCount(unread);

      // Animar o sino se chegou notificação nova
      if (unread > prevCount.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
      }
      prevCount.current = unread;
    }
  }, []);

  // ── Realtime + carga inicial ──────────────────────────────────────────
  useEffect(() => {
    if (!canReceive || !user) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "admin_notifications",
          // Filtrar pelo admin_id do usuário logado
          filter: `admin_id=eq.${user.id}`,
        },
        () => {
          // Debounce 400ms — evita múltiplos fetches em lote
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => fetchNotifications(), 400);
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [canReceive, user?.id, fetchNotifications]);

  // ── Ações ─────────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id);
    // Atualizar localmente sem refetch
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    prevCount.current = Math.max(0, prevCount.current - 1);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("admin_notifications").delete().eq("id", id);
    const removed = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (removed && !removed.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevCount.current = Math.max(0, prevCount.current - 1);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("admin_id", user.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    prevCount.current = 0;
    setLoading(false);
  };

  // ── Helpers visuais ───────────────────────────────────────────────────
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical": return {
        bg:    "hsl(0,72%,51%,0.08)",
        border:"hsl(0,72%,51%,0.25)",
        color: "hsl(0,72%,51%)",
      };
      case "warning": return {
        bg:    "hsl(42,65%,56%,0.08)",
        border:"hsl(42,65%,56%,0.25)",
        color: "hsl(42,65%,56%)",
      };
      default: return {
        bg:    "hsl(210,80%,48%,0.08)",
        border:"hsl(210,80%,48%,0.25)",
        color: "hsl(210,80%,48%)",
      };
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />;
      case "warning":  return <Clock         className="w-4 h-4 shrink-0 mt-0.5" />;
      default:         return <Info          className="w-4 h-4 shrink-0 mt-0.5" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(min / 60);
    const d    = Math.floor(h / 24);
    if (d > 0)  return `${d}d atrás`;
    if (h > 0)  return `${h}h atrás`;
    if (min > 0) return `${min}min atrás`;
    return "agora";
  };

  if (!canReceive) return null;

  return (
    <>
      {/* ── Botão sino ── */}
      <button
        onClick={() => { setShowPanel(!showPanel); if (unreadCount > 0 && !showPanel) {} }}
        className="relative p-2 rounded-lg transition-colors hover:bg-sidebar-accent"
        title={unreadCount > 0 ? `${unreadCount} notificação${unreadCount > 1 ? "ões" : ""} não lida${unreadCount > 1 ? "s" : ""}` : "Notificações"}
      >
        {/* Sino — troca para BellRing quando tem notificação nova não lida */}
        {pulse && unreadCount > 0
          ? <BellRing className="w-5 h-5 text-sidebar-primary animate-bounce" />
          : <Bell     className="w-5 h-5 text-sidebar-foreground" />
        }

        {/* Badge de contagem */}
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
            text-[10px] font-bold rounded-full flex items-center justify-center
            transition-transform ${pulse ? "scale-125" : "scale-100"}`}
            style={{ background: "hsl(0,72%,51%)", color: "white" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Painel de notificações ── */}
      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-md max-h-[600px] overflow-hidden flex flex-col p-0">

          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-[15px]">
                <Bell className="w-4 h-4" style={{ color: "hsl(42,65%,56%)" }} />
                Notificações
                {unreadCount > 0 && (
                  <Badge className="text-[10px] font-bold px-1.5 py-0.5"
                    style={{ background: "hsl(0,72%,51%)", color: "white" }}>
                    {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </DialogTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={loading}
                  className="text-[11px] h-7 px-2"
                  style={{ color: "hsl(210,80%,48%)" }}>
                  {loading ? "..." : "Marcar todas como lidas"}
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                <p className="text-[13px] font-medium text-foreground">Tudo em dia!</p>
                <p className="text-[11px] text-muted-foreground">
                  Nenhuma notificação no momento.
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const style = getSeverityStyle(notif.severity);
                return (
                  <div key={notif.id}
                    className="rounded-lg p-3 transition-all"
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      opacity: notif.is_read ? 0.65 : 1,
                    }}>
                    <div className="flex items-start gap-2.5">
                      <div style={{ color: style.color }}>
                        {getSeverityIcon(notif.severity)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[12px] font-semibold text-foreground leading-snug">
                            {notif.title}
                            {!notif.is_read && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 mb-0.5 align-middle"
                                style={{ background: style.color }} />
                            )}
                          </h4>
                          <button onClick={() => deleteNotification(notif.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {notif.message && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(notif.created_at)}
                          </span>
                          {!notif.is_read && (
                            <button onClick={() => markAsRead(notif.id)}
                              className="text-[10px] font-medium transition-colors"
                              style={{ color: style.color }}>
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-border shrink-0">
              <p className="text-[10px] text-muted-foreground text-center">
                {notifications.length} notificaç{notifications.length > 1 ? "ões" : "ão"} ·{" "}
                Atualizações em tempo real
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1.5 mb-0.5 align-middle animate-pulse" />
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
