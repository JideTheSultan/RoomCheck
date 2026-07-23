import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import {
  useCallback,
  useState,
} from 'react';

import { listImportedDocuments } from '../database';
import type { ImportedDocument } from '../types';

export function useImportedDocuments() {
  const database = useSQLiteContext();
  const [documents, setDocuments] = useState<ImportedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const importedDocuments = await listImportedDocuments(database);
      setDocuments(importedDocuments);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The imported documents could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  useFocusEffect(
    useCallback(() => {
      void refreshDocuments();
    }, [refreshDocuments]),
  );

  return {
    database,
    documents,
    error,
    isLoading,
    refreshDocuments,
  };
}
