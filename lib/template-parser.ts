import { faker } from "@faker-js/faker";

import { type Template, type TemplateMessageAttribute } from "@/lib/types";

const PLACEHOLDER_REGEX = /{{\s*([^{}]+?)\s*}}/g;

function extractPlaceholders(input: string): string[] {
  // Captura todas as variáveis no formato {{variavel}} sem duplicidade.
  const variableSet = new Set<string>();
  let regexMatch: RegExpExecArray | null;

  regexMatch = PLACEHOLDER_REGEX.exec(input);
  while (regexMatch) {
    variableSet.add(regexMatch[1].trim());
    regexMatch = PLACEHOLDER_REGEX.exec(input);
  }

  PLACEHOLDER_REGEX.lastIndex = 0;

  return [...variableSet];
}

function executeFakerPath(path: string): unknown {
  // Resolve dinamicamente expressões como faker.internet.email.
  const pathTokens = path.replace(/^faker\./, "").split(".");
  let currentValue: unknown = faker;

  for (const pathToken of pathTokens) {
    if (typeof currentValue !== "object" && typeof currentValue !== "function") {
      return undefined;
    }

    currentValue = (currentValue as Record<string, unknown>)[pathToken];
  }

  if (typeof currentValue === "function") {
    return (currentValue as () => unknown)();
  }

  return currentValue;
}

function replacePlaceholders(
  input: string,
  resolver: (placeholderName: string) => string | undefined,
): string {
  return input.replace(PLACEHOLDER_REGEX, (_, placeholderName: string) => {
    const resolvedValue = resolver(placeholderName.trim());

    return resolvedValue ?? `{{${placeholderName.trim()}}}`;
  });
}

export function collectTemplateVariables(
  jsonBody: string,
  messageAttributes: TemplateMessageAttribute[],
) {
  // Separa variáveis automáticas (faker.*) das variáveis que exigem input manual.
  const bodyVariables = extractPlaceholders(jsonBody);
  const attributeVariables = messageAttributes.flatMap((attribute) =>
    extractPlaceholders(attribute.value),
  );
  const allVariables = [...new Set([...bodyVariables, ...attributeVariables])];

  const fakerVariables = allVariables.filter((variableName) =>
    variableName.startsWith("faker."),
  );
  const manualVariables = allVariables.filter(
    (variableName) => !variableName.startsWith("faker."),
  );

  return {
    fakerVariables,
    manualVariables,
  };
}

export function resolveTemplateForSend(
  template: Template,
  manualValues: Record<string, string>,
) {
  // Substitui placeholders no body e nos attributes, validando o JSON final antes de enviar.
  const unresolvedVariables = new Set<string>();

  const resolvePlaceholder = (placeholderName: string) => {
    if (placeholderName.startsWith("faker.")) {
      const fakerResult = executeFakerPath(placeholderName);

      if (fakerResult === undefined) {
        unresolvedVariables.add(placeholderName);
        return undefined;
      }

      if (typeof fakerResult === "object") {
        return JSON.stringify(fakerResult);
      }

      return String(fakerResult);
    }

    const manualValue = manualValues[placeholderName];
    if (!manualValue) {
      unresolvedVariables.add(placeholderName);
      return undefined;
    }

    return manualValue;
  };

  const bodyWithResolvedVariables = replacePlaceholders(template.jsonBody, resolvePlaceholder);
  const resolvedMessageAttributes = template.messageAttributes.map((attribute) => ({
    ...attribute,
    value: replacePlaceholders(attribute.value, resolvePlaceholder),
  }));

  if (unresolvedVariables.size > 0) {
    return {
      unresolvedVariables: [...unresolvedVariables],
      finalPayload: "",
      finalMessageAttributes: [] as TemplateMessageAttribute[],
    };
  }

  try {
    const parsedBody = JSON.parse(bodyWithResolvedVariables);

    return {
      unresolvedVariables: [] as string[],
      finalPayload: JSON.stringify(parsedBody),
      finalMessageAttributes: resolvedMessageAttributes,
    };
  } catch {
    throw new Error(
      "O JSON do template ficou inválido após substituir variáveis. Revise o jsonBody e os placeholders.",
    );
  }
}
