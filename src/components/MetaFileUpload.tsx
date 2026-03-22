import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, FileText, FileSpreadsheet, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MetaFileUploadProps {
  files: string[];
  onChange: (files: string[]) => void;
  maxFiles?: number;
  folder?: string;
}

const ALLOWED_TYPES: Record<string, { label: string; icon: typeof FileText }> = {
  "image/jpeg": { label: "JPG", icon: ImagePlus },
  "image/png": { label: "PNG", icon: ImagePlus },
  "image/webp": { label: "WEBP", icon: ImagePlus },
  "image/gif": { label: "GIF", icon: ImagePlus },
  "application/pdf": { label: "PDF", icon: FileText },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { label: "XLSX", icon: FileSpreadsheet },
  "application/vnd.ms-excel": { label: "XLS", icon: FileSpreadsheet },
};

const ACCEPT_STRING = "image/*,.pdf,.xlsx,.xls";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

function isPdf(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

function isExcel(url: string) {
  return /\.(xlsx|xls)(\?|$)/i.test(url);
}

function getFileName(url: string) {
  try {
    const parts = url.split("/");
    const name = parts[parts.length - 1].split("?")[0];
    // Remove the timestamp prefix
    return name.replace(/^\d+_[a-z0-9]+\./, ".");
  } catch {
    return "arquivo";
  }
}

export default function MetaFileUpload({ files, onChange, maxFiles = 5, folder = "uploads" }: MetaFileUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      toast({ title: `Máximo de ${maxFiles} arquivos`, variant: "destructive" });
      return;
    }

    const toUpload = selected.slice(0, remaining);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || "anon";
      const newUrls: string[] = [];

      for (const file of toUpload) {
        if (!ALLOWED_TYPES[file.type]) {
          toast({ title: "Formato não suportado", description: "Use imagens, PDF ou Excel", variant: "destructive" });
          continue;
        }
        if (file.size > MAX_SIZE) {
          toast({ title: "Arquivo muito grande (máx 10MB)", variant: "destructive" });
          continue;
        }

        const ext = file.name.split(".").pop() || "bin";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
        const path = `${userId}/${folder}/${Date.now()}_${safeName}`;

        const { error } = await supabase.storage.from("meta-images").upload(path, file);
        if (error) {
          toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
          continue;
        }

        const { data: urlData } = supabase.storage.from("meta-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }

      onChange([...files, ...newUrls]);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {files.map((url, i) => (
          <div key={i} className="relative group">
            {isImage(url) ? (
              <div className="w-16 h-16 rounded overflow-hidden" style={{ border: "1px solid hsl(var(--pbi-border))" }}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Arquivo ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              </div>
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="w-16 h-16 rounded flex flex-col items-center justify-center gap-0.5"
                style={{ border: "1px solid hsl(var(--pbi-border))", background: "hsl(var(--pbi-dark))" }}
              >
                {isPdf(url) ? (
                  <FileText className="w-5 h-5" style={{ color: "hsl(0, 72%, 51%)" }} />
                ) : isExcel(url) ? (
                  <FileSpreadsheet className="w-5 h-5" style={{ color: "hsl(152, 60%, 38%)" }} />
                ) : (
                  <Paperclip className="w-5 h-5" style={{ color: "hsl(var(--pbi-text-secondary))" }} />
                )}
                <span className="text-[7px] font-medium truncate w-14 text-center" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
                  {isPdf(url) ? "PDF" : isExcel(url) ? "Excel" : "Arquivo"}
                </span>
              </a>
            )}
            <button
              onClick={() => removeFile(i)}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "hsl(0, 72%, 51%)", color: "white" }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {files.length < maxFiles && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{
              border: "2px dashed hsl(var(--pbi-border))",
              color: "hsl(var(--pbi-text-secondary))",
              background: "hsl(var(--pbi-dark))",
            }}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Paperclip className="w-4 h-4" />
                <span className="text-[7px]">Anexar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <p className="text-[9px]" style={{ color: "hsl(var(--pbi-text-secondary))" }}>
        {files.length}/{maxFiles} arquivos · Imagens, PDF ou Excel (máx 10MB)
      </p>
    </div>
  );
}
