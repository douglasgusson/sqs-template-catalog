import { type Template } from "@/lib/types";

interface ImportTemplatesParams {
  file: File;
  currentTemplates: Template[];
  onMerge: (importedTemplates: Template[]) => void;
}

interface ImportTemplatesResult {
  importedCount: number;
  addedCount: number;
  updatedCount: number;
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      resolve(String(fileReader.result ?? ""));
    };

    fileReader.onerror = () => {
      reject(new Error("Não foi possível ler o arquivo selecionado."));
    };

    fileReader.readAsText(file, "utf-8");
  });
}

function isTemplateMessageAttribute(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const attribute = value as Record<string, unknown>;
  return (
    typeof attribute.key === "string" &&
    (attribute.type === "String" || attribute.type === "Number" || attribute.type === "Binary") &&
    typeof attribute.value === "string"
  );
}

function isTemplate(value: unknown): value is Template {
  if (!value || typeof value !== "object") {
    return false;
  }

  const template = value as Record<string, unknown>;
  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.description === "string" &&
    typeof template.queueUrl === "string" &&
    typeof template.jsonBody === "string" &&
    Array.isArray(template.messageAttributes) &&
    template.messageAttributes.every(isTemplateMessageAttribute)
  );
}

export function exportTemplatesToFile(templates: Template[]) {
  const jsonContent = JSON.stringify(templates, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  const temporaryAnchor = document.createElement("a");
  temporaryAnchor.href = objectUrl;
  temporaryAnchor.download = "sqs-templates-export.json";
  temporaryAnchor.click();

  URL.revokeObjectURL(objectUrl);
}

export async function handleImportTemplates({
  file,
  currentTemplates,
  onMerge,
}: ImportTemplatesParams): Promise<ImportTemplatesResult> {
  const fileContent = await readFileAsText(file);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(fileContent);
  } catch {
    throw new Error("JSON inválido. Verifique o arquivo antes de importar.");
  }

  if (!Array.isArray(parsedJson)) {
    throw new Error("Formato inválido: o arquivo deve conter um array de templates.");
  }

  const validTemplates = parsedJson.filter(isTemplate);
  if (validTemplates.length !== parsedJson.length) {
    throw new Error("O arquivo possui itens inválidos. Revise o schema dos templates.");
  }

  const uniqueImportedById = new Map<string, Template>();
  for (const template of validTemplates) {
    uniqueImportedById.set(template.id, template);
  }

  const currentTemplateIds = new Set(currentTemplates.map((template) => template.id));
  let addedCount = 0;
  let updatedCount = 0;

  for (const importedTemplateId of uniqueImportedById.keys()) {
    if (currentTemplateIds.has(importedTemplateId)) {
      updatedCount += 1;
    } else {
      addedCount += 1;
    }
  }

  onMerge([...uniqueImportedById.values()]);

  return {
    importedCount: uniqueImportedById.size,
    addedCount,
    updatedCount,
  };
}
