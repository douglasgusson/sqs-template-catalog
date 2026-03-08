"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { JsonMonacoEditor } from "@/components/catalog/json-monaco-editor";
import { type TemplateMessageAttribute } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  finalPayload: string;
  finalMessageAttributes: TemplateMessageAttribute[];
  templateName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function PreviewDialog({
  isOpen,
  onClose,
  finalPayload,
  finalMessageAttributes,
  templateName,
  onConfirm,
  isLoading = false,
}: PreviewDialogProps) {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedAttributes, setCopiedAttributes] = useState(false);
  const { toast } = useToast();

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(finalPayload);
      setCopiedPayload(true);
      toast({
        title: "Copiado",
        description: "JSON body foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o JSON.",
        variant: "destructive",
      });
    }
  };

  const handleCopyAttributes = async () => {
    try {
      const attributesJson = JSON.stringify(finalMessageAttributes, null, 2);
      await navigator.clipboard.writeText(attributesJson);
      setCopiedAttributes(true);
      toast({
        title: "Copiado",
        description: "Message attributes foram copiados para a área de transferência.",
      });
      setTimeout(() => setCopiedAttributes(false), 2000);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar os atributos.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {templateName}</DialogTitle>
          <DialogDescription>
            Visualize o JSON final que será enviado para o SQS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">JSON Body</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPayload}
              >
                {copiedPayload ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-md border bg-muted">
              <JsonMonacoEditor
                value={finalPayload}
                onChange={() => {}}
                readOnly={true}
              />
            </div>
          </div>

          {finalMessageAttributes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Message Attributes</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAttributes}
                >
                  {copiedAttributes ? (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-md border bg-muted max-h-48 overflow-y-auto">
                <pre className="p-4 text-xs overflow-x-auto">
                  {JSON.stringify(finalMessageAttributes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Fechar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Confirmar e Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
