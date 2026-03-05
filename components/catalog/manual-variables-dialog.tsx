"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManualVariablesDialogProps {
  open: boolean;
  variables: string[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: Record<string, string>) => void;
}

export function ManualVariablesDialog({
  open,
  variables,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ManualVariablesDialogProps) {
  const formId = "manual-variables-form";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preencher variáveis manuais</DialogTitle>
          <DialogDescription>
            As variáveis abaixo não usam Faker e precisam ser informadas antes do envio.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            const values = variables.reduce<Record<string, string>>((result, variableName) => {
              result[variableName] = String(formData.get(variableName) ?? "").trim();
              return result;
            }, {});

            onConfirm(values);
          }}
        >
          {variables.map((variableName) => (
            <div key={variableName} className="space-y-1.5">
              <Label htmlFor={`manual-variable-${variableName}`}>{variableName}</Label>
              <Input
                id={`manual-variable-${variableName}`}
                name={variableName}
                placeholder={`Digite o valor de ${variableName}`}
                required
              />
            </div>
          ))}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting}
          >
            Confirmar e enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
