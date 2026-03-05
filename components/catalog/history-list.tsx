"use client";

import { RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SendHistoryItem } from "@/lib/types";

interface HistoryListProps {
  history: SendHistoryItem[];
  onResend: (historyItem: SendHistoryItem) => void;
  onClearHistory: () => void;
  isSending: boolean;
}

function prettyPrintJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function HistoryList({
  history,
  onResend,
  onClearHistory,
  isSending,
}: HistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Histórico de envios</CardTitle>
            <CardDescription>
              Lista das mensagens enviadas com payload final e status.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClearHistory} disabled={history.length === 0}>
            <Trash2 className="mr-1 h-4 w-4" />
            Limpar histórico
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma mensagem enviada até o momento.
          </p>
        ) : null}

        {history.map((historyItem) => (
          <div key={historyItem.id} className="space-y-3 rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{historyItem.templateName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(historyItem.sentAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <Badge variant={historyItem.status === "success" ? "success" : "destructive"}>
                {historyItem.status === "success" ? "Sucesso" : "Erro"}
              </Badge>
            </div>

            {historyItem.responseMessageId ? (
              <p className="text-xs text-muted-foreground">
                MessageId: {historyItem.responseMessageId}
              </p>
            ) : null}

            {historyItem.errorMessage ? (
              <p className="text-xs text-red-600">{historyItem.errorMessage}</p>
            ) : null}

            <div>
              <p className="mb-1 text-xs font-medium">Payload final enviado:</p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {prettyPrintJson(historyItem.finalPayload)}
              </pre>
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => onResend(historyItem)}
                disabled={isSending}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Re-enviar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
