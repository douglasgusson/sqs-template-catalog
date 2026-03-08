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
import { type ManualVariableDefinition } from "@/lib/template-parser";

interface ManualVariablesDialogProps {
  open: boolean;
  variables: ManualVariableDefinition[];
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
            As variáveis abaixo precisam ser informadas antes do envio.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            const values = variables.reduce<Record<string, string>>((result, variable) => {
              result[variable.name] = String(formData.get(variable.name) ?? "").trim();
              return result;
            }, {});

            onConfirm(values);
          }}
        >
          {variables.map((variable) => (
            <div key={variable.name} className="space-y-1.5">
              <Label htmlFor={`manual-variable-${variable.name}`}>
                {variable.name}
                <span className="ml-1 text-xs text-muted-foreground">({variable.type})</span>
              </Label>

              {variable.type === "number" ? (
                <Input
                  id={`manual-variable-${variable.name}`}
                  name={variable.name}
                  type="number"
                  step="any"
                  placeholder={`Digite um número para ${variable.name}`}
                  required
                />
              ) : null}

              {variable.type === "boolean" ? (
                <select
                  id={`manual-variable-${variable.name}`}
                  name={variable.name}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Selecione True/False
                  </option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : null}

              {variable.type === "string" ? (
                <Input
                  id={`manual-variable-${variable.name}`}
                  name={variable.name}
                  placeholder={`Digite o valor de ${variable.name}`}
                  required
                />
              ) : null}
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
