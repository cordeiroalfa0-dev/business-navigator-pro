import { useState, useCallback, useRef } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

let globalSetState: ((state: ConfirmState) => void) | null = null;

/**
 * Hook que substitui window.confirm() nativo por um diálogo customizado.
 * Uso:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "Excluir esta meta?" }))) return;
 */
export function useConfirm() {
  return useCallback(async (options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;

    return new Promise<boolean>((resolve) => {
      if (globalSetState) {
        globalSetState({ ...opts, open: true, resolve });
      } else {
        // fallback seguro se o provider não estiver montado
        resolve(window.confirm(opts.message));
      }
    });
  }, []);
}

const VARIANT_COLORS: Record<string, string> = {
  danger: "hsl(0, 72%, 51%)",
  warning: "hsl(42, 65%, 56%)",
  info: "hsl(207, 89%, 48%)",
};

/**
 * Provider que deve ser colocado próximo à raiz do app (em App.tsx).
 * Renderiza o diálogo flutuante quando useConfirm() é chamado.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    message: "",
    resolve: null,
  });

  // registra a função global ao montar
  const ref = useRef(setState);
  ref.current = setState;

  // Atribui o setter global (uma única instância)
  globalSetState = (s) => ref.current(s);

  const respond = (value: boolean) => {
    state.resolve?.(value);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  };

  const color = VARIANT_COLORS[state.variant ?? "danger"];

  return (
    <>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => respond(false)}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-xl p-5 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeInScale 0.15s ease" }}
          >
            {state.title && (
              <p className="text-[14px] font-semibold text-foreground mb-1">
                {state.title}
              </p>
            )}
            <p className="text-[13px] text-muted-foreground mb-5">
              {state.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => respond(false)}
                className="h-8 px-4 rounded text-[12px] font-medium bg-secondary text-foreground hover:opacity-80 transition-opacity"
              >
                {state.cancelLabel ?? "Cancelar"}
              </button>
              <button
                onClick={() => respond(true)}
                className="h-8 px-4 rounded text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: color }}
              >
                {state.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.95); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
