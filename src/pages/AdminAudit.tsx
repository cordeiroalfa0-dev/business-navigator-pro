import { useState, useEffect, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn, Filter, Download, Eye, Calendar, User, Database, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AccessDenied from "@/components/AccessDenied";
import * as XLSX from "xlsx";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_values: any;
  new_values: any;
  changes_summary: string;
  ip_address: string;
  created_at: string;
}

export default function AdminAudit() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [filterTable, setFilterTable] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [isAdmin, fetchLogs]);
  useRealtimeTable("audit_logs", fetchLogs);

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    if (filterTable !== "all") {
      filtered = filtered.filter(l => l.table_name === filterTable);
    }

    if (filterAction !== "all") {
      filtered = filtered.filter(l => l.action === filterAction);
    }

    if (filterUser) {
      filtered = filtered.filter(l =>
        l.user_email?.toLowerCase().includes(filterUser.toLowerCase()) ||
        l.user_name?.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    if (filterDateFrom) {
      filtered = filtered.filter(l => new Date(l.created_at) >= new Date(filterDateFrom));
    }

    if (filterDateTo) {
      filtered = filtered.filter(l => new Date(l.created_at) <= new Date(filterDateTo));
    }

    setFilteredLogs(filtered);
  }, [logs, filterTable, filterAction, filterUser, filterDateFrom, filterDateTo]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return <Badge className="bg-green-600">Criado</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-600">Atualizado</Badge>;
      case "DELETE":
        return <Badge className="bg-red-600">Deletado</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const exportToExcel = () => {
    const data = filteredLogs.map(log => ({
      Data: new Date(log.created_at).toLocaleString("pt-BR"),
      Usuário: log.user_name,
      Email: log.user_email,
      Tabela: log.table_name,
      Ação: log.action,
      Resumo: log.changes_summary,
      "IP Address": log.ip_address,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
    XLSX.writeFile(wb, `auditoria_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Exportado", description: "Arquivo Excel gerado com sucesso." });
  };

  const tables = [...new Set(logs.map(l => l.table_name))].sort();

  if (!authLoading && !isAdmin) return <AccessDenied requiredRole="Administrador" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <LogIn className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Auditoria de Ações</h1>
          <p className="text-xs text-slate-500">Histórico completo de alterações no sistema</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Tabela</label>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Todas as tabelas</SelectItem>
                  {tables.map(table => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Ação</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">Criado</SelectItem>
                  <SelectItem value="UPDATE">Atualizado</SelectItem>
                  <SelectItem value="DELETE">Deletado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Usuário</label>
              <Input
                placeholder="Nome ou e-mail"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-9"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">De</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-9"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Até</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-9"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={fetchLogs}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Atualizar
            </Button>
            <Button
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              className="text-xs gap-2"
            >
              <Download className="w-3 h-3" /> Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Registros ({filteredLogs.length} de {logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Carregando...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Nenhum registro encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="text-left py-3 px-4">Data/Hora</th>
                    <th className="text-left py-3 px-4">Usuário</th>
                    <th className="text-left py-3 px-4">Tabela</th>
                    <th className="text-left py-3 px-4">Ação</th>
                    <th className="text-left py-3 px-4">Resumo</th>
                    <th className="text-center py-3 px-4">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-500" />
                          <div>
                            <div className="font-medium">{log.user_name}</div>
                            <div className="text-[10px] text-slate-500">{log.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Database className="w-3 h-3 text-slate-500" />
                          <span>{log.table_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.changes_summary}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Alteração</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Usuário</div>
                  <div className="font-medium">{selectedLog.user_name}</div>
                  <div className="text-xs text-slate-400">{selectedLog.user_email}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Data/Hora</div>
                  <div className="font-medium">{new Date(selectedLog.created_at).toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-slate-400">{selectedLog.ip_address}</div>
                </div>
              </div>

              {/* Action Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tabela</div>
                  <div className="font-medium">{selectedLog.table_name}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Ação</div>
                  {getActionBadge(selectedLog.action)}
                </div>
              </div>

              {/* Changes */}
              {selectedLog.action === "UPDATE" && selectedLog.old_values && selectedLog.new_values && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-sm font-bold">Alterações Realizadas:</div>
                  {Object.entries(selectedLog.new_values).map(([key, newVal]: any) => {
                    const oldVal = selectedLog.old_values?.[key];
                    if (oldVal === newVal) return null;
                    return (
                      <div key={key} className="flex items-center gap-3 text-xs">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-300">{key}</div>
                          <div className="text-slate-500 line-through">{String(oldVal)}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-green-400">{String(newVal)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Raw JSON */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Dados Completos (JSON)</div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
                  <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}