"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BookOpen, Download, History, LayoutList, Upload } from "lucide-react";

import { publishSqsMessageAction } from "@/app/actions";
import { HistoryList } from "@/components/catalog/history-list";
import { ManualVariablesDialog } from "@/components/catalog/manual-variables-dialog";
import { TemplateEditor } from "@/components/catalog/template-editor";
import { TemplateSidebar } from "@/components/catalog/template-sidebar";
import { PreviewDialog } from "@/components/catalog/preview-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCatalogStore } from "@/hooks/use-catalog-store";
import {
  collectTemplateVariables,
  resolveTemplateForSend,
  type ManualVariableDefinition,
} from "@/lib/template-parser";
import { exportTemplatesToFile, handleImportTemplates } from "@/lib/template-share";
import { type SendHistoryItem, type Template, type TemplateMessageAttribute } from "@/lib/types";

export function CatalogApp() {
  const {
    templates,
    history,
    isHydrated,
    createTemplate,
    upsertTemplate,
    mergeTemplates,
    deleteTemplate,
    addHistoryItem,
    clearHistory,
  } = useCatalogStore();
  const { toast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [draftTemplate, setDraftTemplate] = useState<Template | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [isManualVariablesModalOpen, setIsManualVariablesModalOpen] = useState(false);
  const [manualVariables, setManualVariables] = useState<ManualVariableDefinition[]>([]);
  const [pendingTemplateToSend, setPendingTemplateToSend] = useState<Template | null>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<string>("");
  const [previewAttributes, setPreviewAttributes] = useState<TemplateMessageAttribute[]>([]);
  const [pendingTemplateForPreview, setPendingTemplateForPreview] = useState<Template | null>(null);
  const [previewManualVariables, setPreviewManualVariables] = useState<ManualVariableDefinition[]>([]);
  const [isPreviewManualVariablesModalOpen, setIsPreviewManualVariablesModalOpen] = useState(false);
  const [pendingPreviewManualValues, setPendingPreviewManualValues] = useState<Record<string, string>>({});
  
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (templates.length === 0) {
      setSelectedTemplateId(null);
      setDraftTemplate(null);
      return;
    }

    const selectedTemplateStillExists = templates.some(
      (template) => template.id === selectedTemplateId,
    );
    if (!selectedTemplateStillExists) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [isHydrated, selectedTemplateId, templates]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setDraftTemplate(null);
      return;
    }

    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    setDraftTemplate(
      selectedTemplate ? (JSON.parse(JSON.stringify(selectedTemplate)) as Template) : null,
    );
  }, [selectedTemplateId, templates]);

  const handleSaveTemplate = () => {
    if (!draftTemplate) {
      return;
    }

    upsertTemplate(draftTemplate);
    toast({
      title: "Template salvo",
      description: "As alterações foram persistidas no catálogo local.",
    });
  };

  const executeSend = async (template: Template, manualValues: Record<string, string>) => {
    // Etapa central do envio: resolve variáveis, publica no SQS e grava no histórico.
    if (!template.queueUrl.trim()) {
      toast({
        title: "Queue URL obrigatória",
        description: "Preencha a Queue URL antes de enviar para o SQS.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    let finalPayloadForHistory = template.jsonBody;
    let finalAttributesForHistory = template.messageAttributes;

    try {
      const resolvedTemplate = resolveTemplateForSend(template, manualValues);
      if (resolvedTemplate.unresolvedVariables.length > 0) {
        throw new Error(
          `Ainda existem variáveis sem valor: ${resolvedTemplate.unresolvedVariables.join(", ")}`,
        );
      }

      finalPayloadForHistory = resolvedTemplate.finalPayload;
      finalAttributesForHistory = resolvedTemplate.finalMessageAttributes;

      const publishResult = await publishSqsMessageAction({
        queueUrl: template.queueUrl,
        messageBody: resolvedTemplate.finalPayload,
        messageAttributes: resolvedTemplate.finalMessageAttributes,
      });

      const historyItem: SendHistoryItem = {
        id: crypto.randomUUID(),
        templateId: template.id,
        templateName: template.name,
        queueUrl: template.queueUrl,
        sentAt: new Date().toISOString(),
        status: publishResult.success ? "success" : "error",
        finalPayload: finalPayloadForHistory,
        finalMessageAttributes: finalAttributesForHistory,
        responseMessageId: publishResult.messageId,
        errorMessage: publishResult.errorMessage,
      };

      addHistoryItem(historyItem);

      if (publishResult.success) {
        toast({
          title: "Mensagem enviada",
          description: `SQS MessageId: ${publishResult.messageId ?? "não retornado"}`,
        });
      } else {
        toast({
          title: "Falha no envio",
          description: publishResult.errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      addHistoryItem({
        id: crypto.randomUUID(),
        templateId: template.id,
        templateName: template.name,
        queueUrl: template.queueUrl,
        sentAt: new Date().toISOString(),
        status: "error",
        finalPayload: finalPayloadForHistory,
        finalMessageAttributes: finalAttributesForHistory,
        errorMessage: error instanceof Error ? error.message : "Erro inesperado no envio.",
      });

      toast({
        title: "Erro ao montar/enviar payload",
        description: error instanceof Error ? error.message : "Erro inesperado no envio.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!draftTemplate) {
      return;
    }

    upsertTemplate(draftTemplate);

    const { manualVariables: foundManualVariables } = collectTemplateVariables(
      draftTemplate.jsonBody,
      draftTemplate.messageAttributes,
    );

    // Se houver placeholders manuais, pausa o envio e abre o modal para coleta dos valores.
    if (foundManualVariables.length > 0) {
      setPendingTemplateToSend(draftTemplate);
      setManualVariables(foundManualVariables);
      setIsManualVariablesModalOpen(true);
      return;
    }

    await executeSend(draftTemplate, {});
  };

  const handlePreviewTemplate = async () => {
    if (!draftTemplate) {
      return;
    }

    upsertTemplate(draftTemplate);

    const { manualVariables: foundManualVariables } = collectTemplateVariables(
      draftTemplate.jsonBody,
      draftTemplate.messageAttributes,
    );

    // Se houver placeholders manuais, abre o modal para coleta dos valores
    if (foundManualVariables.length > 0) {
      setPendingTemplateForPreview(draftTemplate);
      setPreviewManualVariables(foundManualVariables);
      setIsPreviewManualVariablesModalOpen(true);
      return;
    }

    // Se não houver variáveis manuais, mostra o preview diretamente
    showPreview(draftTemplate, {});
  };

  const showPreview = (template: Template, manualValues: Record<string, string>) => {
    try {
      const resolvedTemplate = resolveTemplateForSend(template, manualValues);
      if (resolvedTemplate.unresolvedVariables.length > 0) {
        toast({
          title: "Variáveis não resolvidas",
          description: `Ainda existem variáveis sem valor: ${resolvedTemplate.unresolvedVariables.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      setPreviewPayload(resolvedTemplate.finalPayload);
      setPreviewAttributes(resolvedTemplate.finalMessageAttributes);
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Erro ao preparar preview",
        description: error instanceof Error ? error.message : "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPreviewSend = async () => {
    if (!draftTemplate) {
      return;
    }

    setIsPreviewOpen(false);
    await executeSend(draftTemplate, pendingPreviewManualValues);
  };

  const handleResend = async (historyItem: SendHistoryItem) => {
    // Reenvia exatamente o payload/attributes já registrados no histórico.
    setIsSending(true);

    try {
      const publishResult = await publishSqsMessageAction({
        queueUrl: historyItem.queueUrl,
        messageBody: historyItem.finalPayload,
        messageAttributes: historyItem.finalMessageAttributes,
      });

      addHistoryItem({
        id: crypto.randomUUID(),
        templateId: historyItem.templateId,
        templateName: `${historyItem.templateName} (reenvio)`,
        queueUrl: historyItem.queueUrl,
        sentAt: new Date().toISOString(),
        status: publishResult.success ? "success" : "error",
        finalPayload: historyItem.finalPayload,
        finalMessageAttributes: historyItem.finalMessageAttributes,
        responseMessageId: publishResult.messageId,
        errorMessage: publishResult.errorMessage,
      });

      if (publishResult.success) {
        toast({ title: "Mensagem reenviada com sucesso" });
      } else {
        toast({
          title: "Erro no reenvio",
          description: publishResult.errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleExportClick = () => {
    exportTemplatesToFile(templates);
    toast({
      title: "Exportação concluída",
      description: `Arquivo sqs-templates-export.json gerado com ${templates.length} templates.`,
    });
  };

  const handleImportFileSelection = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    try {
      const importResult = await handleImportTemplates({
        file: selectedFile,
        currentTemplates: templates,
        onMerge: mergeTemplates,
      });

      toast({
        title: "Importação concluída",
        description:
          `${importResult.importedCount} templates processados (` +
          `${importResult.addedCount} novos, ${importResult.updatedCount} atualizados).`,
      });
    } catch (error) {
      toast({
        title: "Falha na importação",
        description:
          error instanceof Error ? error.message : "Erro inesperado ao importar templates.",
        variant: "destructive",
      });
    } finally {
      // Permite reimportar o mesmo arquivo em sequência.
      event.target.value = "";
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Catálogo de Templates SQS</h1>
            <p className="text-sm text-muted-foreground">
              Catálogo interno para editar, gerar payloads dinâmicos e publicar mensagens no SQS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={importFileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                void handleImportFileSelection(event);
              }}
            />

            <Button
              variant="outline"
              onClick={() => {
                importFileInputRef.current?.click();
              }}
            >
              <Upload className="mr-1 h-4 w-4" />
              Importar
            </Button>

            <Button variant="outline" onClick={handleExportClick}>
              <Download className="mr-1 h-4 w-4" />
              Exportar
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                window.open("/docs", "_blank", "noopener,noreferrer");
              }}
            >
              <BookOpen className="mr-1 h-4 w-4" />
              Documentação
            </Button>
          </div>
        </div>

        <Tabs defaultValue="catalog">
          <TabsList>
            <TabsTrigger value="catalog">
              <LayoutList className="mr-1 h-4 w-4" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-1 h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <div className="grid gap-4 md:grid-cols-[320px_1fr]">
              <TemplateSidebar
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={(templateId) => setSelectedTemplateId(templateId)}
                onCreateTemplate={() => {
                  const newTemplate = createTemplate();
                  setSelectedTemplateId(newTemplate.id);
                  setDraftTemplate(newTemplate);
                }}
                onDeleteTemplate={(templateId) => {
                  deleteTemplate(templateId);
                  toast({ title: "Template removido" });
                }}
              />

              <TemplateEditor
                template={draftTemplate}
                isSending={isSending}
                onTemplateChange={setDraftTemplate}
                onSaveTemplate={handleSaveTemplate}
                onPreviewTemplate={() => {
                  void handlePreviewTemplate();
                }}
                onSendTemplate={() => {
                  void handleSendTemplate();
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <HistoryList
              history={history}
              onResend={(historyItem) => {
                void handleResend(historyItem);
              }}
              onClearHistory={clearHistory}
              isSending={isSending}
            />
          </TabsContent>
        </Tabs>
      </main>

      <ManualVariablesDialog
        open={isManualVariablesModalOpen}
        variables={manualVariables}
        isSubmitting={isSending}
        onOpenChange={setIsManualVariablesModalOpen}
        onConfirm={(values) => {
          if (!pendingTemplateToSend) {
            return;
          }

          setIsManualVariablesModalOpen(false);
          setPendingTemplateToSend(null);
          setManualVariables([]);
          void executeSend(pendingTemplateToSend, values);
        }}
      />

      <ManualVariablesDialog
        open={isPreviewManualVariablesModalOpen}
        variables={previewManualVariables}
        isSubmitting={false}
        onOpenChange={setIsPreviewManualVariablesModalOpen}
        onConfirm={(values) => {
          if (!pendingTemplateForPreview) {
            return;
          }

          setIsPreviewManualVariablesModalOpen(false);
          setPendingPreviewManualValues(values);
          setPendingTemplateForPreview(null);
          setPreviewManualVariables([]);
          showPreview(draftTemplate || pendingTemplateForPreview, values);
        }}
      />

      <PreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        finalPayload={previewPayload}
        finalMessageAttributes={previewAttributes}
        templateName={draftTemplate?.name || ""}
        onConfirm={() => {
          void handleConfirmPreviewSend();
        }}
        isLoading={isSending}
      />
    </>
  );
}
