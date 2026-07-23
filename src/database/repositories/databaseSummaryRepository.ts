import type { SQLiteDatabase } from 'expo-sqlite';

import type { DatabaseSummary } from '../../types';
import { countClassrooms } from './classroomRepository';
import { countImportedDocuments } from './importedDocumentRepository';
import { countTimetableEntries } from './timetableEntryRepository';

export async function getDatabaseSummary(
  database: SQLiteDatabase,
): Promise<DatabaseSummary> {
  const importedDocumentCount = await countImportedDocuments(database);
  const classroomCount = await countClassrooms(database);
  const timetableEntryCount = await countTimetableEntries(database);

  return {
    classroomCount,
    importedDocumentCount,
    timetableEntryCount,
  };
}
