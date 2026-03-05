"use client";

import Editor, { type Monaco } from "@monaco-editor/react";

interface JsonMonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

interface FakerSuggestionItem {
  label: string;
  path: string;
  documentation: string;
}

const FAKER_SUGGESTIONS: FakerSuggestionItem[] = [
  {
    label: "internet.email()",
    path: "faker.internet.email",
    documentation: "Gera um e-mail aleatório.",
  },
  {
    label: "internet.url()",
    path: "faker.internet.url",
    documentation: "Gera uma URL aleatória.",
  },
  {
    label: "string.uuid()",
    path: "faker.string.uuid",
    documentation: "Gera UUID v4.",
  },
  {
    label: "string.alphanumeric()",
    path: "faker.string.alphanumeric",
    documentation: "Gera string alfanumérica.",
  },
  {
    label: "person.fullName()",
    path: "faker.person.fullName",
    documentation: "Gera nome completo.",
  },
  {
    label: "person.firstName()",
    path: "faker.person.firstName",
    documentation: "Gera primeiro nome.",
  },
  {
    label: "date.recent()",
    path: "faker.date.recent",
    documentation: "Gera data recente.",
  },
  {
    label: "number.int()",
    path: "faker.number.int",
    documentation: "Gera número inteiro.",
  },
  {
    label: "phone.number()",
    path: "faker.phone.number",
    documentation: "Gera telefone.",
  },
  {
    label: "location.city()",
    path: "faker.location.city",
    documentation: "Gera cidade.",
  },
];

let isFakerCompletionRegistered = false;

function registerFakerCompletion(monaco: Monaco) {
  if (isFakerCompletionRegistered) {
    return;
  }

  monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: [".", "{"],
    provideCompletionItems(model: any, position: any) {
      const linePrefix = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1);

      // Só dispara sugestões quando o usuário está digitando dentro de {{faker....
      const fakerContextMatch = linePrefix.match(
        /\{\{\s*(faker(?:\.[a-zA-Z_][\w]*)*\.?[\w]*)$/,
      );

      if (!fakerContextMatch) {
        return { suggestions: [] };
      }

      const typedFakerExpression = fakerContextMatch[1];
      const typedAfterFaker = typedFakerExpression.replace(/^faker\.?/, "");
      const replaceStartColumn =
        linePrefix.length - typedFakerExpression.length + 1;

      const suggestions = FAKER_SUGGESTIONS.filter((suggestion) => {
        const normalizedPath = suggestion.path.replace(/^faker\./, "");
        return normalizedPath.startsWith(typedAfterFaker);
      }).map((suggestion, index) => ({
        label: suggestion.label,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: suggestion.path,
        documentation: suggestion.documentation,
        // Completa e fecha a placeholder automaticamente.
        insertText: `${suggestion.path}}}`,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: replaceStartColumn,
          endColumn: position.column,
        },
        sortText: `0${index}`,
      }));

      return { suggestions };
    },
  });

  isFakerCompletionRegistered = true;
}

export function JsonMonacoEditor({
  value,
  onChange,
  height = 320,
}: JsonMonacoEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="json"
      language="json"
      theme="vs-dark"
      value={value}
      beforeMount={(monaco) => {
        registerFakerCompletion(monaco);
      }}
      onChange={(newValue) => {
        onChange(newValue ?? "");
      }}
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
        wordWrap: "on",
        fontSize: 13,
        tabSize: 2,
        formatOnPaste: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
