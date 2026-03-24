import { useState, useEffect, useCallback, useRef } from "react";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/useConfirm";
import {
  Package, Plus, Search, Filter, ArrowRightLeft, Eye, Trash2,
  X, Upload, ChevronLeft, ChevronRight, Loader2, History,
  MapPin, Box, Info, Send, Image as ImageIcon, AlertCircle,
  Warehouse, PlusCircle, ZoomIn, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface AtivoFoto {
  id: string; ativo_id: string; url_imagem: string;
  nome_arquivo: string; tamanho: number | null; ordem: number; created_at: string;
}
interface Ativo {
  id: string; codigo_remo: string; nome: string; descricao: string | null;
  destino: string; quantidade: number; categoria: string | null;
  usuario_id: string | null; usuario_nome: string | null;
  created_at: string; updated_at: string; ativos_fotos?: AtivoFoto[];
}
interface Envio {
  id: string; ativo_id: string; origem: string; destino: string;
  quantidade: number; observacao: string | null; usuario_nome: string | null;
  created_at: string; ativo?: { nome: string; codigo_remo: string } | null;
}
interface Destino { id: string; nome: string; padrao: boolean; ativo: boolean; }

// ── Helpers ────────────────────────────────────────────────────────────────
async function gerarCodigoRemo(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("gerar_proximo_codigo_remo");
    if (!error && data) return data;
  } catch {}
  const { data } = await supabase
    .from("ativos_remo").select("codigo_remo")
    .order("codigo_remo", { ascending: false }).limit(1).maybeSingle();
  if (!data) return "REMO0001";
  const num = parseInt(data.codigo_remo.replace("REMO", "") || "0");
  return `REMO${String(num + 1).padStart(4, "0")}`;
}

async function uploadFoto(file: File, ativoId: string, ordem: number) {
  const ext  = file.name.split(".").pop();
  const path = `${ativoId}/${ativoId}-${Date.now()}-${ordem}.${ext}`;
  const { error } = await supabase.storage.from("fotos-materiais").upload(path, file);
  if (error) throw new Error(`Storage: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from("fotos-materiais").getPublicUrl(path);
  await supabase.from("ativos_fotos").insert({
    ativo_id: ativoId, url_imagem: publicUrl,
    nome_arquivo: file.name, tamanho: file.size, ordem,
  });
}

// ── Selector de destino com criação inline ────────────────────────────────
function DestinoSelect({
  value, onChange, excluir, destinos, onNovoDestino, canEdit,
}: {
  value: string;
  onChange: (v: string) => void;
  excluir?: string;       // destino a excluir da lista (origem atual)
  destinos: Destino[];
  onNovoDestino: (nome: string) => Promise<void>;
  canEdit: boolean;
}) {
  const [criando, setCriando]   = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [saving, setSaving]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lista = destinos.filter(d => d.ativo && d.nome !== excluir);

  const handleCriar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    setSaving(true);
    await onNovoDestino(nome);
    onChange(nome);
    setNovoNome("");
    setCriando(false);
    setSaving(false);
  };

  if (criando) {
    return (
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          autoFocus
          placeholder="Nome do destino..."
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleCriar();
            if (e.key === "Escape") setCriando(false);
          }}
          className="flex-1"
        />
        <Button size="sm" onClick={handleCriar} disabled={saving || !novoNome.trim()} className="gap-1 shrink-0">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Criar
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCriando(false)} className="shrink-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {lista.map(d => (
          <SelectItem key={d.id} value={d.nome}>
            {d.nome}
            {d.padrao && <span className="ml-1.5 text-[10px] text-muted-foreground">(padrão)</span>}
          </SelectItem>
        ))}
        {canEdit && (
          <div
            className="flex items-center gap-2 px-2 py-2 text-sm text-primary cursor-pointer hover:bg-accent rounded-sm mt-1 border-t border-border"
            onMouseDown={e => { e.preventDefault(); setCriando(true); }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Novo destino...
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

// ── Modal Detalhes ─────────────────────────────────────────────────────────
function ModalDetalhes({
  ativo, onClose, canEdit, onFotoDeleted,
}: {
  ativo: Ativo;
  onClose: () => void;
  canEdit: boolean;
  onFotoDeleted: (fotoId: string) => void;
}) {
  const [fotoIdx, setFotoIdx]       = useState(0);
  const [lightbox, setLightbox]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const confirm = useConfirm();
  const fotos = ativo.ativos_fotos ?? [];

  // Garantir que idx não ultrapasse o array após remoção
  const idxSafe = Math.min(fotoIdx, Math.max(fotos.length - 1, 0));

  const handleDeleteFoto = async (foto: AtivoFoto) => {
    if (!(await confirm({ message: `Excluir a foto "${foto.nome_arquivo}"?`, title: "Excluir Foto", confirmLabel: "Excluir", variant: "danger" }))) return;
    setDeletingId(foto.id);
    try {
      // Remover do storage
      const path = foto.url_imagem.split("/fotos-materiais/")[1];
      if (path) await supabase.storage.from("fotos-materiais").remove([path]);
      // Remover do banco
      const { error } = await supabase.from("ativos_fotos").delete().eq("id", foto.id);
      if (error) throw error;
      onFotoDeleted(foto.id);
      toast({ title: "Foto removida" });
      // Ajustar índice
      if (idxSafe >= fotos.length - 1) setFotoIdx(Math.max(0, fotos.length - 2));
    } catch (err: any) {
      toast({ title: "Erro ao remover foto", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">

            {/* ── Área da imagem principal ── */}
            <div className="w-full md:w-3/5 bg-muted relative aspect-square md:aspect-auto min-h-[280px] flex items-center justify-center">
              {fotos.length > 0 ? (
                <>
                  {/* Imagem principal */}
                  <img
                    src={fotos[idxSafe].url_imagem}
                    alt={ativo.nome}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightbox(true)}
                  />

                  {/* Botão zoom */}
                  <button
                    onClick={() => setLightbox(true)}
                    className="absolute top-3 right-3 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                    title="Ampliar">
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  {/* Botão excluir foto */}
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteFoto(fotos[idxSafe])}
                      disabled={deletingId === fotos[idxSafe].id}
                      className="absolute top-3 right-14 w-8 h-8 bg-destructive/80 rounded-full flex items-center justify-center hover:bg-destructive transition-colors disabled:opacity-50"
                      title="Excluir esta foto">
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}

                  {/* Navegação prev/next */}
                  {fotos.length > 1 && (
                    <>
                      <button onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setFotoIdx(i => (i + 1) % fotos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Contador + dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] bg-background/70 px-2 py-0.5 rounded-full text-foreground font-medium">
                      {idxSafe + 1} / {fotos.length}
                    </span>
                    {fotos.length > 1 && (
                      <div className="flex gap-1.5">
                        {fotos.map((_, i) => (
                          <button key={i} onClick={() => setFotoIdx(i)}
                            className={`h-1.5 rounded-full transition-all ${i === idxSafe ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40"}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Código REMO */}
                  <Badge className="absolute top-3 left-3 font-mono text-xs" variant="secondary">
                    {ativo.codigo_remo}
                  </Badge>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Camera className="w-16 h-16 opacity-20" />
                  <span className="text-xs">Sem imagens</span>
                </div>
              )}
            </div>

            {/* ── Painel direito ── */}
            <div className="w-full md:w-2/5 p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  {ativo.categoria && <p className="text-xs text-muted-foreground mb-1">{ativo.categoria}</p>}
                  <h2 className="text-xl font-semibold">{ativo.nome}</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Localização</span>
                  </div>
                  <p className="text-sm font-semibold">{ativo.destino}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Box className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Quantidade</span>
                  </div>
                  <p className="text-sm font-semibold">{ativo.quantidade} un.</p>
                </div>
              </div>

              {ativo.descricao && (
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Descrição</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ativo.descricao}</p>
                </div>
              )}

              {/* ── Galeria de thumbnails ── */}
              {fotos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Camera className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">
                        Fotos ({fotos.length})
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {fotos.map((foto, i) => (
                      <div key={foto.id} className="relative group aspect-square rounded-md overflow-hidden border-2 transition-all cursor-pointer"
                        style={{ borderColor: i === idxSafe ? "hsl(var(--primary))" : "transparent" }}
                        onClick={() => setFotoIdx(i)}>
                        <img
                          src={foto.url_imagem}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Overlay com botão excluir no hover */}
                        {canEdit && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteFoto(foto); }}
                              disabled={deletingId === foto.id}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-destructive rounded-full flex items-center justify-center disabled:opacity-50"
                              title="Excluir foto">
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                        {/* Badge da foto atual */}
                        {i === idxSafe && (
                          <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Clique para selecionar · {canEdit ? "Passe o mouse para excluir" : ""}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-border text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Registrado por</span><span>{ativo.usuario_nome ?? "Sistema"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data</span>
                  <span>{format(new Date(ativo.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox (tela cheia) ── */}
      {lightbox && fotos.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}>
          {/* Fechar */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10">
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Contador */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {idxSafe + 1} / {fotos.length}
          </span>

          {/* Imagem */}
          <img
            src={fotos[idxSafe].url_imagem}
            alt={ativo.nome}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />

          {/* Prev/Next no lightbox */}
          {fotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Thumbnails no lightbox */}
          {fotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
              onClick={e => e.stopPropagation()}>
              {fotos.map((foto, i) => (
                <button key={foto.id} onClick={() => setFotoIdx(i)}
                  className="w-12 h-12 rounded overflow-hidden transition-all"
                  style={{ opacity: i === idxSafe ? 1 : 0.5, outline: i === idxSafe ? "2px solid white" : "none" }}>
                  <img src={foto.url_imagem} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Nome do arquivo */}
          <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-[11px]">
            {fotos[idxSafe]?.nome_arquivo}
          </p>
        </div>
      )}
    </>
  );
}

// ── Modal Transferência ────────────────────────────────────────────────────
function ModalTransferencia({
  ativo, destinos, onClose, onSuccess, onNovoDestino, canEdit,
}: {
  ativo: Ativo; destinos: Destino[];
  onClose: () => void; onSuccess: () => void;
  onNovoDestino: (nome: string) => Promise<void>;
  canEdit: boolean;
}) {
  const { user, profile } = useAuth();
  const { toast }         = useToast();
  const primeiroDisponivel = destinos.find(d => d.ativo && d.nome !== ativo.destino)?.nome ?? "";
  const [destino, setDestino]     = useState(primeiroDisponivel);
  const [quantidade, setQuantidade] = useState(ativo.quantidade);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async () => {
    if (!destino) { toast({ title: "Selecione um destino", variant: "destructive" }); return; }
    if (quantidade < 1 || quantidade > ativo.quantidade) {
      toast({ title: "Quantidade inválida", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const { error: envioErr } = await supabase.from("ativos_envios").insert({
        ativo_id: ativo.id, origem: ativo.destino, destino,
        quantidade, observacao: observacao.trim() || null,
        usuario_id: user?.id,
        usuario_nome: profile?.full_name ?? user?.email ?? "Sistema",
      });
      if (envioErr) throw envioErr;

      if (ativo.quantidade === quantidade) {
        await supabase.from("ativos_remo").update({ destino }).eq("id", ativo.id);
      } else {
        await supabase.from("ativos_remo").update({ quantidade: ativo.quantidade - quantidade }).eq("id", ativo.id);
        const novoCodigoRemo = await gerarCodigoRemo();
        await supabase.from("ativos_remo").insert({
          codigo_remo: novoCodigoRemo, nome: ativo.nome, descricao: ativo.descricao,
          destino, quantidade, categoria: ativo.categoria,
          usuario_id: user?.id, usuario_nome: profile?.full_name ?? user?.email,
        });
      }
      toast({ title: "Transferência realizada com sucesso" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro na transferência", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Transferir ativo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-mono">{ativo.codigo_remo}</p>
              <p className="font-medium text-sm">{ativo.nome}</p>
              <p className="text-xs text-muted-foreground">Local atual: <strong>{ativo.destino}</strong></p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Novo destino</label>
            <DestinoSelect
              value={destino}
              onChange={setDestino}
              excluir={ativo.destino}
              destinos={destinos}
              onNovoDestino={onNovoDestino}
              canEdit={canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Quantidade</label>
            <Input
              type="number" min={1} max={ativo.quantidade}
              value={quantidade}
              onChange={e => setQuantidade(parseInt(e.target.value) || 1)}
            />
            <p className="text-[11px] text-muted-foreground">Disponível: {ativo.quantidade}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Observação</label>
            <Textarea
              placeholder="Motivo ou detalhes da movimentação..."
              value={observacao} onChange={e => setObservacao(e.target.value)}
              rows={3} className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !destino} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Confirmar envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal Cadastrar Ativo ──────────────────────────────────────────────────
function ModalCadastrar({
  destinos, onClose, onSuccess, onNovoDestino, canEdit,
}: {
  destinos: Destino[]; onClose: () => void; onSuccess: () => void;
  onNovoDestino: (nome: string) => Promise<void>; canEdit: boolean;
}) {
  const { user, profile } = useAuth();
  const { toast }         = useToast();
  const fileInputRef      = useRef<HTMLInputElement>(null);

  const [codigoRemo, setCodigoRemo] = useState("");
  const [nome, setNome]             = useState("");
  const [descricao, setDescricao]   = useState("");
  const [destino, setDestino]       = useState(destinos.find(d => d.ativo)?.nome ?? "Almoxarifado");
  const [quantidade, setQuantidade] = useState(1);
  const [categoria, setCategoria]   = useState("");
  const [arquivos, setArquivos]     = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [erroMsg, setErroMsg]       = useState<string | null>(null);

  useEffect(() => { gerarCodigoRemo().then(setCodigoRemo); }, []);

  const handleFiles = (files: File[]) => {
    const allowed = files.slice(0, Math.max(0, 3 - arquivos.length));
    if (arquivos.length + files.length > 3) toast({ title: "Máximo 3 fotos por ativo", variant: "destructive" });
    setArquivos(prev => [...prev, ...allowed]);
    allowed.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removerFoto = (i: number) => {
    setArquivos(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!nome.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    setLoading(true); setErroMsg(null);
    try {
      const { data: ativo, error } = await supabase.from("ativos_remo").insert({
        codigo_remo: codigoRemo, nome: nome.trim(),
        descricao: descricao.trim() || null, destino, quantidade,
        categoria: categoria.trim() || null,
        usuario_id: user?.id, usuario_nome: profile?.full_name ?? user?.email,
      }).select().single();
      if (error) throw error;

      for (let i = 0; i < arquivos.length; i++) {
        try { await uploadFoto(arquivos[i], ativo.id, i); }
        catch (fotoErr: any) { toast({ title: "Ativo salvo, mas erro nas fotos", description: fotoErr.message }); }
      }
      toast({ title: "Ativo cadastrado com sucesso" });
      onSuccess();
    } catch (err: any) {
      setErroMsg(err.message ?? "Erro desconhecido");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" /> Cadastrar novo ativo
          </DialogTitle>
        </DialogHeader>

        {erroMsg && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{erroMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Código REMO</label>
                <Input value={codigoRemo} disabled className="font-mono text-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Categoria</label>
                <Input placeholder="Ex: Mobiliário" value={categoria} onChange={e => setCategoria(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Nome do item *</label>
                <Input placeholder="Nome identificador do ativo" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quantidade</label>
                <Input type="number" min={1} value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value) || 1)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Destino inicial</label>
              <DestinoSelect
                value={destino} onChange={setDestino}
                destinos={destinos} onNovoDestino={onNovoDestino} canEdit={canEdit}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição técnica</label>
              <Textarea
                placeholder="Estado, especificações, observações..."
                value={descricao} onChange={e => setDescricao(e.target.value)}
                rows={4} className="resize-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Fotos
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              disabled={arquivos.length >= 3}
              onChange={e => e.target.files && handleFiles(Array.from(e.target.files))} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={arquivos.length >= 3}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Upload className="w-8 h-8" />
              <p className="text-xs">{arquivos.length >= 3 ? "Limite atingido" : `${arquivos.length}/3 fotos`}</p>
            </button>
            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removerFoto(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Confirmar cadastro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Almoxarifado() {
  const { canAlmoxarifado, user } = useAuth();
  const { toast } = useToast();

  const [ativos, setAtivos]         = useState<Ativo[]>([]);
  const [envios, setEnvios]         = useState<Envio[]>([]);
  const [destinos, setDestinos]     = useState<Destino[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [search, setSearch]         = useState("");
  const [filtroDestino, setFiltroDestino] = useState("todos");

  const [ativoDetalhes, setAtivoDetalhes]     = useState<Ativo | null>(null);
  const [ativoTransferir, setAtivoTransferir] = useState<Ativo | null>(null);
  const [deleteId, setDeleteId]               = useState<string | null>(null);
  const [showCadastrar, setShowCadastrar]     = useState(false);
  const [tab, setTab]                         = useState("inventario");

  // ── Fetch destinos ─────────────────────────────────────────────────────
  const fetchDestinos = useCallback(async () => {
    const { data } = await supabase
      .from("ativos_destinos").select("*").eq("ativo", true).order("padrao", { ascending: false }).order("nome");
    setDestinos((data ?? []) as Destino[]);
  }, []);

  // ── Criar novo destino inline ──────────────────────────────────────────
  const handleNovoDestino = useCallback(async (nome: string) => {
    const { error } = await supabase.from("ativos_destinos").insert({
      nome, padrao: false, ativo: true, created_by: user?.id,
    });
    if (error) {
      toast({ title: "Erro ao criar destino", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Destino "${nome}" criado` });
      await fetchDestinos();
    }
  }, [user?.id, toast, fetchDestinos]);

  // ── Fetch ativos ───────────────────────────────────────────────────────
  const fetchAtivos = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("ativos_remo").select("*, ativos_fotos(*)")
      .order("created_at", { ascending: false });
    if (filtroDestino !== "todos") query = query.eq("destino", filtroDestino);
    if (search.trim()) query = query.or(`nome.ilike.%${search}%,codigo_remo.ilike.%${search}%,categoria.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) toast({ title: "Erro ao carregar ativos", description: error.message, variant: "destructive" });
    else setAtivos((data ?? []) as Ativo[]);
    setLoading(false);
  }, [search, filtroDestino, toast]);

  // ── Fetch envios ───────────────────────────────────────────────────────
  const fetchEnvios = useCallback(async () => {
    setLoadingEnvios(true);
    const { data } = await supabase.from("ativos_envios")
      .select("*, ativo:ativos_remo(nome, codigo_remo)")
      .order("created_at", { ascending: false }).limit(100);
    setEnvios((data ?? []) as Envio[]);
    setLoadingEnvios(false);
  }, []);

  useEffect(() => { fetchDestinos(); }, [fetchDestinos]);
  useEffect(() => { fetchAtivos(); }, [fetchAtivos]);
  useEffect(() => { if (tab === "historico") fetchEnvios(); }, [tab, fetchEnvios]);

  useRealtimeTable("ativos_remo", fetchAtivos);
  useRealtimeTable("ativos_fotos", fetchAtivos);
  useRealtimeTable("ativos_envios", fetchEnvios);
  useRealtimeTable("ativos_destinos", fetchDestinos);

  // ── Deletar ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("ativos_remo").delete().eq("id", deleteId);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else { toast({ title: "Ativo excluído" }); setDeleteId(null); fetchAtivos(); }
  };

  // ── KPIs dinâmicos — baseados nos destinos do banco ───────────────────
  const totalAtivos    = ativos.length;
  const totalUnidades  = ativos.reduce((s, a) => s + a.quantidade, 0);

  // Destinos que têm pelo menos 1 ativo OU são padrão
  const destinosKPI = destinos.filter(d =>
    d.padrao || ativos.some(a => a.destino === d.nome)
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            Almoxarifado
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de ativos, transferências e inventário por destino
          </p>
        </div>
        {canAlmoxarifado && (
          <Button onClick={() => setShowCadastrar(true)} className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> Cadastrar ativo
          </Button>
        )}
      </div>

      {/* KPIs — dinâmicos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300/80">Itens cadastrados</p>
          </div>
          <p className="text-2xl font-semibold text-blue-100">{totalAtivos}</p>
        </div>
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300/80">Total unidades</p>
          </div>
          <p className="text-2xl font-semibold text-blue-100">{totalUnidades}</p>
        </div>
        {destinosKPI.map(d => (
          <div key={d.id} className="rounded-lg border border-border bg-card p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate" title={d.nome}>{d.nome}</p>
            </div>
            <p className="text-2xl font-semibold">
              {ativos.filter(a => a.destino === d.nome).reduce((s, a) => s + a.quantidade, 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm">
          <TabsTrigger value="inventario" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="w-3.5 h-3.5" /> Inventário
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <History className="w-3.5 h-3.5" /> Histórico de envios
          </TabsTrigger>
        </TabsList>

        {/* TAB INVENTÁRIO */}
        <TabsContent value="inventario" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, código ou categoria..."
                value={search} onChange={e => setSearch(e.target.value)} className="pl-9 border-blue-500/20 focus:border-blue-500/50 bg-blue-500/5" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-blue-400" />
              <Select value={filtroDestino} onValueChange={setFiltroDestino}>
                <SelectTrigger className="w-48 border-blue-500/20 bg-blue-500/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os destinos</SelectItem>
                  {destinos.map(d => <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
            </div>
          ) : ativos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Package className="w-12 h-12 opacity-20" />
              <p className="text-sm">Nenhum ativo encontrado.</p>
              {canAlmoxarifado && (
                <Button variant="outline" size="sm" onClick={() => setShowCadastrar(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Cadastrar ativo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ativos.map(ativo => {
                const foto = ativo.ativos_fotos?.[0];
                return (
                  <div key={ativo.id} onClick={() => setAtivoDetalhes(ativo)}
                    className="group rounded-lg border border-border bg-card overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer flex flex-col">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {foto ? (
                        <img src={foto.url_imagem} alt={ativo.nome}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge variant="secondary" className="absolute top-2 left-2 font-mono text-[10px]">
                        {ativo.codigo_remo}
                      </Badge>
                      {/* Contador de fotos */}
                      {(ativo.ativos_fotos?.length ?? 0) > 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          <Camera className="w-2.5 h-2.5" />
                          {ativo.ativos_fotos?.length}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div>
                        {ativo.categoria && <p className="text-[11px] text-muted-foreground">{ativo.categoria}</p>}
                        <h3 className="font-medium text-sm leading-tight truncate">{ativo.nome}</h3>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Localização</span>
                          <span className="font-medium">{ativo.destino}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estoque</span>
                          <span className="font-medium">{ativo.quantidade} un.</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); setAtivoDetalhes(ativo); }}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canAlmoxarifado && (
                            <button onClick={e => { e.stopPropagation(); setAtivoTransferir(ativo); }}
                              className="p-1.5 rounded hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                              title="Transferir">
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {canAlmoxarifado && (
                          <button onClick={e => { e.stopPropagation(); setDeleteId(ativo.id); }}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB HISTÓRICO */}
        <TabsContent value="historico" className="mt-4">
          {loadingEnvios ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Carregando histórico...
            </div>
          ) : envios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <History className="w-12 h-12 opacity-20" />
              <p className="text-sm">Nenhuma transferência registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {envios.map(e => (
                <div key={e.id} className="rounded-lg border border-border bg-card p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{e.ativo?.nome ?? "Item removido"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {e.ativo?.codigo_remo && (
                            <Badge variant="outline" className="font-mono text-[10px] h-4">{e.ativo.codigo_remo}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">Qtd: {e.quantidade}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{e.origem}</span>
                      <ArrowRightLeft className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-medium">{e.destino}</span>
                    </div>
                    <div className="text-right shrink-0 text-xs text-muted-foreground">
                      <p>{format(new Date(e.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                      <p className="mt-0.5">{e.usuario_nome ?? "Sistema"}</p>
                    </div>
                  </div>
                  {e.observacao && (
                    <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground italic">
                      "{e.observacao}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {ativoDetalhes && (
        <ModalDetalhes
          ativo={ativoDetalhes}
          onClose={() => setAtivoDetalhes(null)}
          canEdit={canAlmoxarifado}
          onFotoDeleted={(fotoId) => {
            // Remover a foto do state local sem precisar refetch
            setAtivoDetalhes(prev => {
              if (!prev) return null;
              return {
                ...prev,
                ativos_fotos: (prev.ativos_fotos ?? []).filter(f => f.id !== fotoId),
              };
            });
            // Atualizar também na lista de ativos
            setAtivos(prev => prev.map(a => {
              if (a.id !== ativoDetalhes?.id) return a;
              return { ...a, ativos_fotos: (a.ativos_fotos ?? []).filter(f => f.id !== fotoId) };
            }));
          }}
        />
      )}

      {ativoTransferir && (
        <ModalTransferencia
          ativo={ativoTransferir}
          destinos={destinos}
          onClose={() => setAtivoTransferir(null)}
          onSuccess={() => { setAtivoTransferir(null); fetchAtivos(); fetchDestinos(); }}
          onNovoDestino={handleNovoDestino}
          canEdit={canAlmoxarifado}
        />
      )}

      {showCadastrar && (
        <ModalCadastrar
          destinos={destinos}
          onClose={() => setShowCadastrar(false)}
          onSuccess={() => { setShowCadastrar(false); fetchAtivos(); fetchDestinos(); }}
          onNovoDestino={handleNovoDestino}
          canEdit={canAlmoxarifado}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ativo?</AlertDialogTitle>
            <AlertDialogDescription>
              O ativo e todas as suas fotos serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
