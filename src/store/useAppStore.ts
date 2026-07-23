import { create } from 'zustand';

import type { DatabaseSummary } from '../types';

type AppState = {
  classroomCount: number;
  databaseSummaryError: string | null;
  hasLoadedDatabaseSummary: boolean;
  hasImportedDocuments: boolean;
  importedDocumentCount: number;
  isDatabaseSummaryLoading: boolean;
  setDatabaseSummary: (summary: DatabaseSummary) => void;
  setDatabaseSummaryError: (error: string | null) => void;
  setDatabaseSummaryLoading: (isLoading: boolean) => void;
  timetableEntryCount: number;
};

export const useAppStore = create<AppState>((set) => ({
  classroomCount: 0,
  databaseSummaryError: null,
  hasLoadedDatabaseSummary: false,
  hasImportedDocuments: false,
  importedDocumentCount: 0,
  isDatabaseSummaryLoading: false,
  setDatabaseSummary: (summary) =>
    set({
      classroomCount: Math.max(0, summary.classroomCount),
      databaseSummaryError: null,
      hasLoadedDatabaseSummary: true,
      hasImportedDocuments: summary.importedDocumentCount > 0,
      importedDocumentCount: Math.max(0, summary.importedDocumentCount),
      timetableEntryCount: Math.max(0, summary.timetableEntryCount),
    }),
  setDatabaseSummaryError: (databaseSummaryError) =>
    set((state) => ({
      databaseSummaryError,
      hasLoadedDatabaseSummary:
        databaseSummaryError === null
          ? state.hasLoadedDatabaseSummary
          : true,
    })),
  setDatabaseSummaryLoading: (isDatabaseSummaryLoading) =>
    set({ isDatabaseSummaryLoading }),
  timetableEntryCount: 0,
}));
