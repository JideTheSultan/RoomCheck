import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getDatabaseSummary } from '../database';
import { useAppStore } from '../store/useAppStore';

export function useRefreshDatabaseSummary() {
  const database = useSQLiteContext();
  const setDatabaseSummary = useAppStore(
    (state) => state.setDatabaseSummary,
  );
  const setDatabaseSummaryError = useAppStore(
    (state) => state.setDatabaseSummaryError,
  );
  const setDatabaseSummaryLoading = useAppStore(
    (state) => state.setDatabaseSummaryLoading,
  );

  const refreshDatabaseSummary = useCallback(async () => {
    setDatabaseSummaryLoading(true);
    setDatabaseSummaryError(null);

    try {
      const summary = await getDatabaseSummary(database);
      setDatabaseSummary(summary);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'The local database could not be read.';

      setDatabaseSummaryError(message);
    } finally {
      setDatabaseSummaryLoading(false);
    }
  }, [
    database,
    setDatabaseSummary,
    setDatabaseSummaryError,
    setDatabaseSummaryLoading,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refreshDatabaseSummary();
    }, [refreshDatabaseSummary]),
  );

  return refreshDatabaseSummary;
}
