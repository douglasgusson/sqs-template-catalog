"use client";

import Editor, { type Monaco } from "@monaco-editor/react";

import { listGenerators } from "@/lib/generators";

interface JsonMonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  readOnly?: boolean;
}

interface GeneratorSuggestionItem {
  label: string;
  key: string;
  token: string;
  documentation: string;
}

const GENERATOR_SUGGESTIONS: GeneratorSuggestionItem[] = listGenerators().map((generator) => ({
  label: `@${generator.key}`,
  key: generator.key,
  token: generator.token,
  documentation: generator.description,
}));

let generatorCompletionProviderDisposable: { dispose: () => void } | null = null;

function registerGeneratorCompletion(monaco: Monaco) {
  generatorCompletionProviderDisposable?.dispose();
  generatorCompletionProviderDisposable = monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ["@", "{"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems(model: any, position: any) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const wordUntilPosition = model.getWordUntilPosition(position);
      const startsGeneratorPlaceholder = /\{\{@$/.test(textUntilPosition);
      const isTypingGeneratorKey = /\{\{@[a-zA-Z0-9_]*$/.test(textUntilPosition);

      // Só dispara quando há contexto válido de placeholder de gerador: {{@...}}
      if (!startsGeneratorPlaceholder && !isTypingGeneratorKey) {
        return { suggestions: [] };
      }

      const generatorKeyMatch = textUntilPosition.match(/\{\{@([a-zA-Z0-9_]*)$/);
      const typedGeneratorKey = generatorKeyMatch?.[1] ?? "";

      const replacementRange = new monaco.Range(
        position.lineNumber,
        wordUntilPosition.startColumn,
        position.lineNumber,
        wordUntilPosition.endColumn,
      );

      const suggestions = GENERATOR_SUGGESTIONS.filter((suggestion) => {
        return suggestion.key.startsWith(typedGeneratorKey);
      }).map((suggestion, index) => ({
        label: suggestion.label,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: `{{${suggestion.token}}}`,
        documentation: suggestion.documentation,
        // Completa e fecha a placeholder automaticamente.
        insertText: `@${suggestion.key}`,
        range: replacementRange,
        sortText: `0${index}`,
      }));

      return { suggestions };
    },
  });
}

export function JsonMonacoEditor({
  value,
  onChange,
  height = 320,
  readOnly = false,
}: JsonMonacoEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="json"
      language="json"
      theme="vs-dark"
      value={value}
      beforeMount={(monaco) => {
        registerGeneratorCompletion(monaco);
      }}
      onChange={(newValue) => {
        onChange(newValue ?? "");
      }}
      options={{
        minimap: { enabled: false },
        automaticLayout: true,
        wordWrap: "on",
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: false, strings: true },
        quickSuggestionsDelay: 0,
        fontSize: 13,
        tabSize: 2,
        formatOnPaste: true,
        scrollBeyondLastLine: false,
        readOnly,
      }}
    />
  );
}
