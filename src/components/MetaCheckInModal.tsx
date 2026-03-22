import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Camera, Plus } from "lucide-react";

interface MetaCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metaId: string;
  metaNome: string;
  percentualAtual: number;
  onCheckInSuccess?: () => void;
}

export function MetaCheckInModal({
  open,
  onOpenChange,
  metaId,
  metaNome,
  percentualAtual,
  onCheckInSuccess,
}: MetaCheckInModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [percentualNovo, setPercentualNovo] = useState(percentualAtual);
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      setFotos([...fotos, ...Array.from(files)]);
    }
  };

  const removeFoto = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const adicionarTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removerTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Upload fotos para Supabase Storage
      const fotoUrls: string[] = [];
      for (const foto of fotos) {
        const fileName = `${metaId}/${Date.now()}_${foto.name}`;
        const { data, error } = await supabase.storage
          .from("meta-evidencias")
          .upload(fileName, foto);

        if (error) throw error;

        const { data: publicUrl } = supabase.storage
          .from("meta-evidencias")
          .getPublicUrl(fileName);

        fotoUrls.push(publicUrl.publicUrl);
      }

      // Inserir check-in
      const { error: checkInError } = await supabase
        .from("meta_checkins_v2")
        .insert({
          meta_id: metaId,
          user_id: user.id,
          user_name: profile?.full_name || user.email,
          percentual_anterior: percentualAtual,
          percentual_novo: percentualNovo,
          comentario: comentario || null,
          evidencia_urls: fotoUrls,
          tags: tags,
        });

      if (checkInError) throw checkInError;

      // Atualizar a meta com o novo percentual
      const { error: updateError } = await supabase
        .from("metas")
        .update({ atual: percentualNovo })
        .eq("id", metaId);

      if (updateError) throw updateError;

      toast({
        title: "Check-in realizado com sucesso!",
        description: `Meta atualizada para ${percentualNovo}%`,
      });

      onOpenChange(false);
      onCheckInSuccess?.();

      // Reset form
      setPercentualNovo(percentualAtual);
      setComentario("");
      setFotos([]);
      setTags([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Check-in de Progresso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Meta Info */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Meta</p>
            <p className="text-lg font-semibold">{metaNome}</p>
            <p className="text-xs text-slate-400 mt-2">Progresso Anterior: <span className="font-bold text-blue-400">{percentualAtual}%</span></p>
          </div>

          {/* Novo Percentual */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-300 uppercase">Novo Percentual (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max="100"
                value={percentualNovo}
                onChange={(e) => setPercentualNovo(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="bg-slate-950 border-slate-700 text-white text-lg font-bold"
              />
              <div className="text-sm">
                <span className="text-slate-400">Aumento: </span>
                <span className={`font-bold ${percentualNovo > percentualAtual ? 'text-green-400' : 'text-red-400'}`}>
                  {percentualNovo - percentualAtual > 0 ? '+' : ''}{percentualNovo - percentualAtual}%
                </span>
              </div>
            </div>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-300 uppercase">Comentário / Observações</Label>
            <Textarea
              placeholder="Descreva o que foi feito, desafios encontrados, próximos passos..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white text-sm min-h-[100px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-300 uppercase">Tags / Categorias</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Ex: Pintura, Elétrica, Estrutura..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && adicionarTag()}
                className="bg-slate-950 border-slate-700 text-white text-sm"
              />
              <Button onClick={adicionarTag} size="sm" variant="outline" className="gap-1">
                <Plus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer hover:bg-red-600/20">
                    {tag}
                    <X className="w-3 h-3" onClick={() => removerTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Upload de Fotos */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-300 uppercase">Evidências (Fotos)</Label>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFotoUpload}
                className="hidden"
                id="foto-upload"
              />
              <label htmlFor="foto-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm text-slate-400">Clique para adicionar fotos ou arraste aqui</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP até 5MB cada</p>
              </label>
            </div>

            {/* Preview de Fotos */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fotos.map((foto, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(foto)}
                      alt={`Preview ${index}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFoto(index)}
                      className="absolute top-1 right-1 bg-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <p className="text-xs text-slate-400 mt-1 truncate">{foto.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || percentualNovo === percentualAtual}
              className="gap-2"
            >
              {loading ? "Salvando..." : "Confirmar Check-in"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
