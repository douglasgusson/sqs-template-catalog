import { GENERATOR_PREFIX, runGenerator } from "@/lib/generators";

import { type Template, type TemplateMessageAttribute } from "@/lib/types";

const PLACEHOLDER_REGEX = /{{\s*([^{}]+?)\s*}}/g;
const QUOTED_PLACEHOLDER_REGEX = /"\{\{\s*([^{}]+?)\s*\}\}"/g;

const SUPPORTED_PLACEHOLDER_TYPES = new Set(["string", "number", "boolean"] as const);

export type PlaceholderValueType = "string" | "number" | "boolean";

export interface ManualVariableDefinition {
  name: string;
  type: PlaceholderValueType;
}

interface ParsedPlaceholder {
  originalToken: string;
  isGenerator: boolean;
  key: string;
  type: PlaceholderValueType;
}

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

function parsePlaceholderToken(rawToken: string): ParsedPlaceholder | null {
  const trimmedToken = rawToken.trim();
  if (!trimmedToken) {
    return null;
  }

  const tokenParts = trimmedToken.split(":");
  if (tokenParts.length > 2) {
    return null;
  }

  const rawKey = tokenParts[0]?.trim() ?? "";
  const rawType = tokenParts[1]?.trim().toLowerCase() ?? "string";

  if (!rawKey || !SUPPORTED_PLACEHOLDER_TYPES.has(rawType as PlaceholderValueType)) {
    return null;
  }

  const isGenerator = rawKey.startsWith(GENERATOR_PREFIX);
  const normalizedKey = isGenerator ? rawKey.slice(GENERATOR_PREFIX.length) : rawKey;
  if (!normalizedKey) {
    return null;
  }

  return {
    originalToken: trimmedToken,
    isGenerator,
    key: normalizedKey,
    type: rawType as PlaceholderValueType,
  };
}

function parseBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return undefined;
}

function parseNumberValue(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  const parsedNumber = Number(String(value).trim());
  return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
}

function resolveRawPlaceholderValue(
  parsedPlaceholder: ParsedPlaceholder,
  manualValues: Record<string, string>,
): unknown {
  if (parsedPlaceholder.isGenerator) {
    return runGenerator(parsedPlaceholder.key);
  }

  const hasManualValue = Object.prototype.hasOwnProperty.call(manualValues, parsedPlaceholder.key);
  if (!hasManualValue) {
    return undefined;
  }

  return manualValues[parsedPlaceholder.key];
}

function toJsonLiteral(value: unknown, type: PlaceholderValueType): string | undefined {
  if (type === "number") {
    const parsedNumber = parseNumberValue(value);
    return parsedNumber === undefined ? undefined : String(parsedNumber);
  }

  if (type === "boolean") {
    const parsedBoolean = parseBooleanValue(value);
    return parsedBoolean === undefined ? undefined : String(parsedBoolean);
  }

  return JSON.stringify(String(value));
}

function toAttributeStringValue(value: unknown, type: PlaceholderValueType): string | undefined {
  if (type === "number") {
    const parsedNumber = parseNumberValue(value);
    return parsedNumber === undefined ? undefined : String(parsedNumber);
  }

  if (type === "boolean") {
    const parsedBoolean = parseBooleanValue(value);
    return parsedBoolean === undefined ? undefined : String(parsedBoolean);
  }

  return String(value);
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
  // Separa variáveis automáticas (@*) das variáveis que exigem input manual e tipagem declarada.
  const bodyVariables = extractPlaceholders(jsonBody);
  const attributeVariables = messageAttributes.flatMap((attribute) =>
    extractPlaceholders(attribute.value),
  );
  const allVariables = [...new Set([...bodyVariables, ...attributeVariables])];

  const generatorVariables: string[] = [];
  const manualVariablesByName = new Map<string, ManualVariableDefinition>();

  for (const variableToken of allVariables) {
    const parsedPlaceholder = parsePlaceholderToken(variableToken);
    if (!parsedPlaceholder) {
      continue;
    }

    if (parsedPlaceholder.isGenerator) {
      generatorVariables.push(parsedPlaceholder.originalToken);
      continue;
    }

    if (!manualVariablesByName.has(parsedPlaceholder.key)) {
      manualVariablesByName.set(parsedPlaceholder.key, {
        name: parsedPlaceholder.key,
        type: parsedPlaceholder.type,
      });
    }
  }

  return {
    generatorVariables,
    manualVariables: [...manualVariablesByName.values()],
  };
}

export function resolveTemplateForSend(
  template: Template,
  manualValues: Record<string, string>,
) {
  // Substitui placeholders no body e nos attributes, validando o JSON final antes de enviar.
  const unresolvedVariables = new Set<string>();

  const bodyWithResolvedVariables = template.jsonBody.replace(
    QUOTED_PLACEHOLDER_REGEX,
    (fullMatch, placeholderToken: string) => {
      const parsedPlaceholder = parsePlaceholderToken(placeholderToken);
      if (!parsedPlaceholder) {
        unresolvedVariables.add(placeholderToken.trim());
        return fullMatch;
      }

      const resolvedRawValue = resolveRawPlaceholderValue(parsedPlaceholder, manualValues);
      if (resolvedRawValue === undefined || String(resolvedRawValue).trim() === "") {
        unresolvedVariables.add(parsedPlaceholder.originalToken);
        return fullMatch;
      }

      const typedLiteral = toJsonLiteral(resolvedRawValue, parsedPlaceholder.type);
      if (typedLiteral === undefined) {
        unresolvedVariables.add(parsedPlaceholder.originalToken);
        return fullMatch;
      }

      return typedLiteral;
    },
  );

  const unresolvedBodyTokens = extractPlaceholders(bodyWithResolvedVariables).map((token) =>
    token.trim(),
  );
  for (const unresolvedBodyToken of unresolvedBodyTokens) {
    unresolvedVariables.add(unresolvedBodyToken);
  }

  const resolveAttributePlaceholder = (placeholderName: string) => {
    const parsedPlaceholder = parsePlaceholderToken(placeholderName);
    if (!parsedPlaceholder) {
      unresolvedVariables.add(placeholderName);
      return undefined;
    }

    const resolvedRawValue = resolveRawPlaceholderValue(parsedPlaceholder, manualValues);
    if (resolvedRawValue === undefined || String(resolvedRawValue).trim() === "") {
      unresolvedVariables.add(parsedPlaceholder.originalToken);
      return undefined;
    }

    const attributeValue = toAttributeStringValue(resolvedRawValue, parsedPlaceholder.type);
    if (attributeValue === undefined) {
      unresolvedVariables.add(parsedPlaceholder.originalToken);
      return undefined;
    }

    return attributeValue;
  };

  const resolvedMessageAttributes = template.messageAttributes.map((attribute) => ({
    ...attribute,
    value: replacePlaceholders(attribute.value, resolveAttributePlaceholder),
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
