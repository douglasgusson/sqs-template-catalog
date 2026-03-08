"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { createEmptyTemplate, createMockTemplates } from "@/lib/mock-data";
import { type SendHistoryItem, type Template } from "@/lib/types";

const TEMPLATES_STORAGE_KEY = "catalogo-mensagens:templates";
const HISTORY_STORAGE_KEY = "catalogo-mensagens:history";
const MAX_HISTORY_ITEMS = 50;

function parseStorageValue<T>(rawValue: string | null, fallbackValue: T): T {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallbackValue;
  }
}

function loadTemplatesFromStorage() {
  // Em SSR não existe window/localStorage, então retornamos vazio e hidratamos no client.
  if (typeof window === "undefined") {
    return [] as Template[];
  }

  const storedTemplates = parseStorageValue<Template[]>(
    localStorage.getItem(TEMPLATES_STORAGE_KEY),
    [],
  );

  return storedTemplates.length > 0 ? storedTemplates : createMockTemplates();
}

function loadHistoryFromStorage() {
  // Mesmo comportamento dos templates: leitura segura somente no browser.
  if (typeof window === "undefined") {
    return [] as SendHistoryItem[];
  }

  return parseStorageValue<SendHistoryItem[]>(localStorage.getItem(HISTORY_STORAGE_KEY), []);
}

function subscribeToHydration() {
  return () => undefined;
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function useCatalogStore() {
  const [templates, setTemplates] = useState<Template[]>(loadTemplatesFromStorage);
  const [history, setHistory] = useState<SendHistoryItem[]>(loadHistoryFromStorage);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  useEffect(() => {
    // Persiste automaticamente toda alteração dos templates.
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }, [isHydrated, templates]);

  useEffect(() => {
    // Persiste automaticamente todo novo item do histórico.
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history, isHydrated]);

  const createTemplate = useCallback(() => {
    const newTemplate = createEmptyTemplate();
    setTemplates((currentTemplates) => [newTemplate, ...currentTemplates]);
    return newTemplate;
  }, []);

  const upsertTemplate = useCallback((template: Template) => {
    setTemplates((currentTemplates) => {
      const templateIndex = currentTemplates.findIndex(
        (currentTemplate) => currentTemplate.id === template.id,
      );

      if (templateIndex === -1) {
        return [template, ...currentTemplates];
      }

      return currentTemplates.map((currentTemplate) =>
        currentTemplate.id === template.id ? template : currentTemplate,
      );
    });
  }, []);

  const mergeTemplates = useCallback((importedTemplates: Template[]) => {
    // Merge em lote por ID: atualiza existentes e adiciona novos.
    setTemplates((currentTemplates) => {
      const mergedTemplatesById = new Map(
        currentTemplates.map((currentTemplate) => [currentTemplate.id, currentTemplate] as const),
      );

      for (const importedTemplate of importedTemplates) {
        mergedTemplatesById.set(importedTemplate.id, importedTemplate);
      }

      return [...mergedTemplatesById.values()];
    });
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId),
    );
  }, []);

  const addHistoryItem = useCallback((historyItem: SendHistoryItem) => {
    setHistory((currentHistory) => [historyItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return useMemo(
    () => ({
      templates,
      history,
      isHydrated,
      createTemplate,
      upsertTemplate,
      mergeTemplates,
      deleteTemplate,
      addHistoryItem,
      clearHistory,
    }),
    [
      templates,
      history,
      isHydrated,
      createTemplate,
      upsertTemplate,
      mergeTemplates,
      deleteTemplate,
      addHistoryItem,
      clearHistory,
    ],
  );
}
