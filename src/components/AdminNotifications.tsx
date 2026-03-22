import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, X, Clock } from "lucide-react";
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
}

export function AdminNotifications() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const fetchNotifications = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("admin_id", u.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, []);

  // Carregar uma vez ao montar + realtime (sem polling de 30s)
  useEffect(() => {
    if (!isAdmin || !user) return;
    fetchNotifications();

    const channel = supabase
      .channel("admin-notifications-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_notifications" }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, user?.id, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("admin_notifications").delete().eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    setLoading(true);
    await supabase.from("admin_notifications").update({ is_read: true }).eq("admin_id", user?.id || "");
    await fetchNotifications();
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 border-red-500/20 text-red-600";
      case "warning":  return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600";
      default:         return "bg-blue-500/10 border-blue-500/20 text-blue-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="w-4 h-4" />;
      case "warning":  return <Clock className="w-4 h-4" />;
      default:         return <Info className="w-4 h-4" />;
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-400 hover:text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[600px] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" /> Notificações
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white text-[10px]">{unreadCount} novas</Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300">
                Marcar tudo como lido
              </Button>
            )}
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação no momento</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id}
                  className={`p-3 rounded-lg border transition-all ${getSeverityColor(notif.severity)} ${
                    !notif.is_read ? "ring-2 ring-offset-1 ring-slate-700" : ""
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">{getSeverityIcon(notif.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{notif.title}</h4>
                        <button onClick={() => deleteNotification(notif.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {notif.message && <p className="text-xs opacity-80 mb-2">{notif.message}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-60">
                          {new Date(notif.created_at).toLocaleString("pt-BR")}
                        </span>
                        {!notif.is_read && (
                          <button onClick={() => markAsRead(notif.id)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold">
                            Marcar como lido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
