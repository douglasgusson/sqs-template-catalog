"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Copy, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Template } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TemplateSidebarProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onCreateTemplate: () => void;
  onDuplicateTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export function TemplateSidebar({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onCreateTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
}: TemplateSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(templates, {
        keys: ["name", "description"],
        threshold: 0.4,
      }),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [fuse, searchQuery, templates]);

  return (
    <Card className="sticky top-6 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Templates salvos</CardTitle>
          <Button size="sm" onClick={onCreateTemplate}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent className="min-h-0 space-y-2 overflow-y-auto">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum template cadastrado. Clique em &quot;Novo&quot; para iniciar.
          </p>
        ) : filteredTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum template encontrado para &quot;{searchQuery}&quot;.
          </p>
        ) : null}

        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "rounded-xl border p-3 transition-colors",
              template.id === selectedTemplateId
                ? "border-foreground"
                : "border-border",
            )}
          >
            <div className="relative">
              <label htmlFor={template.id} className="font-medium leading-none">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 cursor-pointer"
                />
                <p className="line-clamp-1 text-sm font-medium">
                  {template.name}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {template.description || "Sem descrição"}
                </p>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={template.id === selectedTemplateId}
                  id={template.id}
                  onChange={() => onSelectTemplate(template.id)}
                />
              </label>
            </div>

            <div className="mt-2 flex justify-end gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                title="Duplicar template"
                onClick={() => onDuplicateTemplate(template.id)}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Duplicar template</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Excluir template"
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
