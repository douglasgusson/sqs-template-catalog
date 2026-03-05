"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Template } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TemplateSidebarProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
  onDeleteTemplate: (templateId: string) => void;
}

export function TemplateSidebar({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onCreateTemplate,
  onDeleteTemplate,
}: TemplateSidebarProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Templates salvos</CardTitle>
          <Button size="sm" onClick={onCreateTemplate}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum template cadastrado. Clique em &quot;Novo&quot; para iniciar.
          </p>
        ) : null}

        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "rounded-md border p-3 transition-colors",
              template.id === selectedTemplateId ? "border-foreground" : "border-border",
            )}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onSelectTemplate(template.id)}
            >
              <p className="line-clamp-1 text-sm font-medium">{template.name}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {template.description || "Sem descrição"}
              </p>
            </button>

            <div className="mt-2 flex justify-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteTemplate(template.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir template</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
