import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cleanupUnusedDiscoveredClassrooms,
  createClassroom,
} from '../../../database/repositories/classroomRepository';
import {
  getImportedDocumentById,
  updateImportedDocumentStatus,
} from '../../../database/repositories/importedDocumentRepository';
import {
  countTimetableEntriesForDocument,
  createTimetableEntry,
  deleteTimetableEntry,
  listTimetableEntriesForDocument,
} from '../../../database/repositories/timetableEntryRepository';
import type {
  DocumentTimetableEntry,
  TimetableDay,
} from '../../../types';
import { createLocalId } from '../../../utils/createLocalId';
import { normalizeText } from '../../../utils/normalizeText';

export type ManualImageTimetableEntryInput = {
  classroomName: string;
  courseCode: string;
  courseTitle?: string;
  dayOfWeek: TimetableDay;
  department: string;
  endMinutes: number;
  level: string;
  startMinutes: number;
};

async function requireImageDocument(
  database: SQLiteDatabase,
  documentId: string,
) {
  const document = await getImportedDocumentById(database, documentId);

  if (!document) {
    throw new Error('The imported timetable image could not be found.');
  }

  if (document.sourceType !== 'image') {
    throw new Error('Manual timetable rows can only be added to an image.');
  }

  return document;
}

function requireText(value: string, label: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${label} is required.`);
  }

  return trimmedValue;
}

function validateTimeRange(startMinutes: number, endMinutes: number) {
  if (startMinutes < 0 || startMinutes > 1439) {
    throw new Error('Enter a valid class start time.');
  }

  if (endMinutes < 1 || endMinutes > 1440) {
    throw new Error('Enter a valid class end time.');
  }

  if (endMinutes <= startMinutes) {
    throw new Error('The end time must be later than the start time.');
  }
}

export async function listManualImageTimetableEntries(
  database: SQLiteDatabase,
  documentId: string,
) {
  await requireImageDocument(database, documentId);
  return listTimetableEntriesForDocument(database, documentId);
}

export async function addManualImageTimetableEntry(
  database: SQLiteDatabase,
  documentId: string,
  input: ManualImageTimetableEntryInput,
): Promise<DocumentTimetableEntry> {
  await requireImageDocument(database, documentId);

  const department = requireText(input.department, 'Department');
  const level = requireText(input.level, 'Level');
  const classroomName = requireText(input.classroomName, 'Classroom');
  const courseCode = requireText(input.courseCode, 'Course code');
  const courseTitle = input.courseTitle?.trim() || null;
  validateTimeRange(input.startMinutes, input.endMinutes);

  if (input.dayOfWeek < 1 || input.dayOfWeek > 5) {
    throw new Error('Choose a weekday for this class.');
  }

  const entryId = createLocalId('entry');

  await database.withTransactionAsync(async () => {
    const classroom = await createClassroom(database, {
      id: createLocalId('classroom'),
      name: classroomName,
      origin: 'discovered',
    });

    if (!classroom) {
      throw new Error(`The classroom "${classroomName}" could not be saved.`);
    }

    const entry = await createTimetableEntry(database, {
      classroomId: classroom.id,
      courseCode,
      courseTitle,
      dayOfWeek: input.dayOfWeek,
      department,
      documentId,
      endMinutes: input.endMinutes,
      id: entryId,
      level,
      normalizedDepartment: normalizeText(department),
      normalizedLevel: normalizeText(level),
      rawValue: [courseCode, courseTitle, classroomName]
        .filter(Boolean)
        .join(' · '),
      sourceLocation: 'Entered manually from image',
      sourceSheet: 'Timetable image',
      startMinutes: input.startMinutes,
    });

    if (!entry) {
      throw new Error('The timetable row could not be saved.');
    }

    const entryCount = await countTimetableEntriesForDocument(
      database,
      documentId,
    );
    await updateImportedDocumentStatus(database, documentId, 'ready', {
      entryCount,
      errorMessage: null,
    });
  });

  const rows = await listTimetableEntriesForDocument(database, documentId);
  const savedEntry = rows.find((entry) => entry.id === entryId);

  if (!savedEntry) {
    throw new Error('The saved timetable row could not be loaded.');
  }

  return savedEntry;
}

export async function removeManualImageTimetableEntry(
  database: SQLiteDatabase,
  documentId: string,
  entryId: string,
) {
  await requireImageDocument(database, documentId);

  await database.withTransactionAsync(async () => {
    await deleteTimetableEntry(database, documentId, entryId);
    const entryCount = await countTimetableEntriesForDocument(
      database,
      documentId,
    );
    await updateImportedDocumentStatus(
      database,
      documentId,
      entryCount > 0 ? 'ready' : 'pending',
      {
        entryCount,
        errorMessage: null,
      },
    );
    await cleanupUnusedDiscoveredClassrooms(database);
  });
}
