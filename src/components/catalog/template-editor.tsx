"use client";

import { Plus, Send, Save, Trash2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JsonMonacoEditor } from "@/components/catalog/json-monaco-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type MessageAttributeType, type Template } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";

interface TemplateEditorProps {
  template: Template | null;
  isSending: boolean;
  onTemplateChange: (template: Template) => void;
  onSaveTemplate: () => void;
  onPreviewTemplate: () => void;
  onSendTemplate: () => void;
}

const ATTRIBUTE_TYPES: MessageAttributeType[] = ["String", "Number", "Binary"];

export function TemplateEditor({
  template,
  isSending,
  onTemplateChange,
  onSaveTemplate,
  onPreviewTemplate,
  onSendTemplate,
}: TemplateEditorProps) {
  if (!template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editor de template</CardTitle>
          <CardDescription>
            Selecione um template na lateral para editar e enviar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor de template</CardTitle>
        <CardDescription>
          Use placeholders como {"{{@email}}"} (automático) e {"{{orderId}}"}
          (manual via modal).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Nome</Label>
            <Input
              id="template-name"
              value={template.name}
              onChange={(event) =>
                onTemplateChange({
                  ...template,
                  name: event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-queue">Queue URL</Label>
            <Input
              id="template-queue"
              value={template.queueUrl}
              onChange={(event) =>
                onTemplateChange({
                  ...template,
                  queueUrl: event.target.value,
                })
              }
              placeholder="https://sqs.us-east-1.amazonaws.com/..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="template-description">Descrição</Label>
          <Input
            id="template-description"
            value={template.description}
            onChange={(event) =>
              onTemplateChange({
                ...template,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="template-json">JSON Body</Label>
          <div className="rounded-lg border bg-muted">
            <JsonMonacoEditor
              value={template.jsonBody}
              onChange={(value) =>
                onTemplateChange({
                  ...template,
                  jsonBody: value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Message Attributes</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onTemplateChange({
                  ...template,
                  messageAttributes: [
                    ...template.messageAttributes,
                    {
                      key: "",
                      type: "String",
                      value: "",
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar atributo
            </Button>
          </div>

          <div className="space-y-2">
            {template.messageAttributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum atributo configurado.
              </p>
            ) : null}

            {template.messageAttributes.map((attribute, index) => (
              <div
                key={`attribute-${index}`}
                className="grid gap-2 md:grid-cols-[1fr_140px_1fr_auto]"
              >
                <Input
                  placeholder="chave"
                  value={attribute.key}
                  onChange={(event) => {
                    const updatedAttributes = [...template.messageAttributes];
                    updatedAttributes[index] = {
                      ...updatedAttributes[index],
                      key: event.target.value,
                    };

                    onTemplateChange({
                      ...template,
                      messageAttributes: updatedAttributes,
                    });
                  }}
                />

                <Select
                  defaultValue={attribute.type}
                  value={attribute.type}
                  onValueChange={(value) => {
                    const updatedAttributes = [...template.messageAttributes];
                    updatedAttributes[index] = {
                      ...updatedAttributes[index],
                      type: value as MessageAttributeType,
                    };

                    onTemplateChange({
                      ...template,
                      messageAttributes: updatedAttributes,
                    });
                  }}>
                  <SelectTrigger className="w-full max-w-48">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tipo</SelectLabel>
                      {ATTRIBUTE_TYPES.map((attributeType) => (
                        <SelectItem key={attributeType} value={attributeType}>
                          {attributeType}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="valor"
                  value={attribute.value}
                  onChange={(event) => {
                    const updatedAttributes = [...template.messageAttributes];
                    updatedAttributes[index] = {
                      ...updatedAttributes[index],
                      value: event.target.value,
                    };

                    onTemplateChange({
                      ...template,
                      messageAttributes: updatedAttributes,
                    });
                  }}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const updatedAttributes = template.messageAttributes.filter(
                      (_, itemIndex) => itemIndex !== index,
                    );

                    onTemplateChange({
                      ...template,
                      messageAttributes: updatedAttributes,
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remover atributo</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={onSaveTemplate}>
            <Save className="mr-1 h-4 w-4" />
            Salvar
          </Button>
          <Button
            variant="outline"
            onClick={onPreviewTemplate}
            disabled={isSending}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={onSendTemplate} disabled={isSending}>
            <Send className="mr-1 h-4 w-4" />
            {isSending ? "Enviando..." : "Enviar para SQS"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
