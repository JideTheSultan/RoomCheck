import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cleanupUnusedDiscoveredClassrooms,
  createClassroom,
  createTimetableEntry,
  deleteTimetableEntriesForDocument,
  getImportedDocumentById,
  updateImportedDocumentStatus,
} from '../../../database';
import type { ImportedDocument } from '../../../types';
import { createLocalId } from '../../../utils/createLocalId';
import { normalizeText } from '../../../utils/normalizeText';
import { parseSpreadsheetTimetable } from './spreadsheetTimetableParser';

function getProcessingErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'The timetable file could not be processed.';
}

async function loadUpdatedDocument(
  database: SQLiteDatabase,
  documentId: string,
) {
  const updatedDocument = await getImportedDocumentById(database, documentId);

  if (!updatedDocument) {
    throw new Error('The imported document record could not be loaded.');
  }

  return updatedDocument;
}

export async function processSpreadsheetDocument(
  database: SQLiteDatabase,
  document: ImportedDocument,
) {
  if (document.sourceType === 'image') {
    return document;
  }

  await updateImportedDocumentStatus(database, document.id, 'processing');

  try {
    if (!document.storedUri) {
      throw new Error('The stored timetable file could not be found.');
    }

    const storedFile = new File(document.storedUri);

    if (!storedFile.exists) {
      throw new Error('The stored timetable file could not be found.');
    }

    const data = await storedFile.arrayBuffer();
    const parseResult = parseSpreadsheetTimetable(data);

    if (parseResult.entries.length === 0) {
      throw new Error(
        'No timetable rows were recognised. Check that the sheet includes a department, level, classroom, weekday and time columns, or the school timetable grid shown in your sample.',
      );
    }

    await database.withTransactionAsync(async () => {
      await deleteTimetableEntriesForDocument(database, document.id);

      for (const entry of parseResult.entries) {
        const classroom = await createClassroom(database, {
          id: createLocalId('classroom'),
          name: entry.classroomName,
          origin: 'discovered',
        });

        if (!classroom) {
          throw new Error(
            `The classroom "${entry.classroomName}" could not be saved.`,
          );
        }

        await createTimetableEntry(database, {
          classroomId: classroom.id,
          courseCode: entry.courseCode,
          courseTitle: entry.courseTitle,
          dayOfWeek: entry.dayOfWeek,
          department: entry.department,
          documentId: document.id,
          endMinutes: entry.endMinutes,
          id: createLocalId('entry'),
          level: entry.level,
          normalizedDepartment: normalizeText(entry.department),
          normalizedLevel: normalizeText(entry.level),
          rawValue: entry.rawValue,
          sourceLocation: entry.sourceLocation,
          sourceSheet: entry.sourceSheet,
          startMinutes: entry.startMinutes,
        });
      }

      await cleanupUnusedDiscoveredClassrooms(database);
    });

    await updateImportedDocumentStatus(database, document.id, 'ready', {
      entryCount: parseResult.entries.length,
      errorMessage: null,
    });
  } catch (error: unknown) {
    await database.withTransactionAsync(async () => {
      await deleteTimetableEntriesForDocument(database, document.id);
      await cleanupUnusedDiscoveredClassrooms(database);
    });
    await updateImportedDocumentStatus(database, document.id, 'failed', {
      entryCount: 0,
      errorMessage: getProcessingErrorMessage(error),
    });
  }

  return loadUpdatedDocument(database, document.id);
}
