import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download, Database, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import * as XLSX from "xlsx";

interface ImportedRow {
  [key: string]: string | number;
}

export default function ImportacaoExcel() {
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();
  if (!authLoading && userRole === "normal") return <AccessDenied requiredRole="Admin ou Master" />;
  const [data, setData] = useState<ImportedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ title: "Formato inválido", description: "Use arquivos .xlsx, .xls ou .csv", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(sheet);
        if (jsonData.length === 0) { toast({ title: "Planilha vazia", variant: "destructive" }); return; }
        setHeaders(Object.keys(jsonData[0]));
        setData(jsonData);
        setFileName(file.name);
        toast({ title: "Arquivo importado!", description: `${jsonData.length} registros de "${file.name}"` });
      } catch { toast({ title: "Erro ao ler arquivo", variant: "destructive" }); }
    };
    reader.readAsBinaryString(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }, [processFile]);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) processFile(file); };
  const clearData = () => { setData([]); setHeaders([]); setFileName(""); };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Data", "Categoria", "Descrição", "Valor", "Responsável"], ["01/01/2025", "Vendas", "Exemplo", 10000, "João"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, "modelo_importacao_sanremo.xlsx");
    toast({ title: "Modelo baixado!" });
  };

  const saveToDatabase = async () => {
    if (!user || data.length === 0) return;
    setSaving(true);

    // Map imported columns to dados_cadastro columns
    const headerMap: Record<string, string> = {};
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
    
    const catIdx = lowerHeaders.findIndex((h) => h.includes("categor"));
    const descIdx = lowerHeaders.findIndex((h) => h.includes("descri"));
    const valIdx = lowerHeaders.findIndex((h) => h.includes("valor") || h.includes("total") || h.includes("preço") || h.includes("preco"));
    const dataIdx = lowerHeaders.findIndex((h) => h.includes("data") || h.includes("date"));
    const respIdx = lowerHeaders.findIndex((h) => h.includes("responsav") || h.includes("resp"));

    if (descIdx === -1) {
      toast({ title: "Coluna obrigatória não encontrada", description: "A planilha precisa de uma coluna 'Descrição'.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const rows = data.map((row) => ({
      categoria: catIdx >= 0 ? String(row[headers[catIdx]] || "Importação") : "Importação",
      descricao: String(row[headers[descIdx]] || ""),
      valor: valIdx >= 0 ? Number(row[headers[valIdx]]) || 0 : 0,
      data: dataIdx >= 0 ? parseImportDate(String(row[headers[dataIdx]])) : new Date().toISOString().split("T")[0],
      responsavel: respIdx >= 0 ? String(row[headers[respIdx]] || "") : "",
      created_by: user.id,
    })).filter((r) => r.descricao.trim() !== "");

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from("dados_cadastro").insert(batch);
      if (error) {
        toast({ title: "Erro ao salvar", description: `Batch ${i}: ${error.message}`, variant: "destructive" });
        setSaving(false);
        return;
      }
      inserted += batch.length;
    }

    setSaving(false);
    toast({ title: "Dados salvos!", description: `${inserted} registros salvos no banco de dados.` });
    clearData();
  };

  return (
    <div className="space-y-4">
      {/* PBI Header */}
      <div className="pbi-header flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5" style={{ color: "hsl(var(--pbi-yellow))" }} />
          <div>
            <h1 className="text-base font-semibold text-white">Importação de Dados</h1>
            <p className="text-[11px]" style={{ color: "hsl(0, 0%, 72%)" }}>Importe planilhas Excel ou CSV</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="h-8 text-[11px] gap-1.5 border-none bg-secondary text-foreground hover:bg-secondary/80">
          <Download className="w-3.5 h-3.5" /> Baixar Modelo
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="pbi-tile">
          <label
            className={`flex flex-col items-center justify-center py-16 cursor-pointer border-2 border-dashed rounded-lg transition-colors ${dragOver ? "border-primary" : "border-border"}`}
            style={{ background: dragOver ? "hsl(var(--pbi-yellow) / 0.05)" : "transparent" }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="p-4 rounded-full mb-4" style={{ background: "hsl(var(--pbi-yellow) / 0.1)" }}>
              <Upload className="w-8 h-8" style={{ color: "hsl(var(--pbi-yellow))" }} />
            </div>
            <p className="text-[13px] font-semibold text-foreground">Arraste sua planilha aqui</p>
            <p className="text-[11px] mt-1 text-muted-foreground">ou clique para selecionar .xlsx, .xls ou .csv</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
          </label>
        </div>
      ) : (
        <>
          {/* File info */}
          <div className="pbi-tile flex items-center gap-3" style={{ borderLeft: "3px solid hsl(152, 60%, 38%)" }}>
            <FileSpreadsheet className="w-5 h-5 shrink-0" style={{ color: "hsl(152, 60%, 38%)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate text-foreground">{fileName}</p>
              <p className="text-[10px] text-muted-foreground">{data.length} registros · {headers.length} colunas</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearData} className="hover:bg-destructive/20 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Data table */}
          <div className="pbi-tile">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(152, 60%, 38%)" }} />
                <span className="text-[12px] font-semibold text-foreground">Dados Importados</span>
              </div>
              <Button
                onClick={saveToDatabase}
                disabled={saving}
                className="h-7 text-[11px] font-semibold gap-1"
                style={{ background: "hsl(var(--pbi-yellow))", color: "hsl(var(--pbi-dark))" }}
              >
                <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar no Sistema"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">#</th>
                    {headers.map((h) => (
                      <th key={h} className="text-left py-2 px-2 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((row, i) => (
                    <tr key={i} className="pbi-row-hover transition-colors border-b border-border/50">
                      <td className="py-1.5 px-2 text-muted-foreground">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="py-1.5 px-2 max-w-[200px] truncate text-foreground">{String(row[h] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 50 && (
                <div className="py-3 text-center">
                  <p className="text-[10px] flex items-center justify-center gap-1 text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" /> Exibindo 50 de {data.length} registros (todos serão salvos)
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function parseImportDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  // Try DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try ISO
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
}
