"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((currentToast) => currentToast.id !== toastId),
    );
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default" }: ToastInput) => {
      const toastId = crypto.randomUUID();

      setToasts((currentToasts) => [
        {
          id: toastId,
          title,
          description,
          variant,
        },
        ...currentToasts,
      ]);

      setTimeout(() => {
        dismissToast(toastId);
      }, TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const contextValue = useMemo(
    () => ({
      toast,
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((currentToast) => (
          <div
            key={currentToast.id}
            className={cn(
              "pointer-events-auto rounded-md border p-4 shadow-lg",
              currentToast.variant === "destructive"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-border bg-background text-foreground",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{currentToast.title}</p>
                {currentToast.description ? (
                  <p className="mt-1 text-xs opacity-90">{currentToast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-sm p-1 opacity-70 hover:opacity-100"
                onClick={() => dismissToast(currentToast.id)}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Fechar notificação</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toastContext = useContext(ToastContext);
  if (!toastContext) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }

  return toastContext;
}
