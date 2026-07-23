import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  NewTimetableEntry,
  TimetableDay,
  TimetableEntry,
} from '../../types';

type TimetableEntryRow = {
  classroom_id: string;
  course_code: string;
  course_title: string | null;
  created_at: string;
  day_of_week: TimetableDay;
  department: string;
  document_id: string;
  end_minutes: number;
  id: string;
  level: string;
  normalized_department: string;
  normalized_level: string;
  raw_value: string | null;
  source_location: string | null;
  source_sheet: string | null;
  start_minutes: number;
};

function mapTimetableEntry(row: TimetableEntryRow): TimetableEntry {
  return {
    classroomId: row.classroom_id,
    courseCode: row.course_code,
    courseTitle: row.course_title,
    createdAt: row.created_at,
    dayOfWeek: row.day_of_week,
    department: row.department,
    documentId: row.document_id,
    endMinutes: row.end_minutes,
    id: row.id,
    level: row.level,
    normalizedDepartment: row.normalized_department,
    normalizedLevel: row.normalized_level,
    rawValue: row.raw_value,
    sourceLocation: row.source_location,
    sourceSheet: row.source_sheet,
    startMinutes: row.start_minutes,
  };
}

export async function createTimetableEntry(
  database: SQLiteDatabase,
  input: NewTimetableEntry,
) {
  const timestamp = input.createdAt ?? new Date().toISOString();

  await database.runAsync(
    `
      INSERT INTO timetable_entries (
        id,
        document_id,
        department,
        normalized_department,
        level,
        normalized_level,
        course_code,
        course_title,
        day_of_week,
        start_minutes,
        end_minutes,
        classroom_id,
        source_sheet,
        source_location,
        raw_value,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.id,
    input.documentId,
    input.department,
    input.normalizedDepartment,
    input.level,
    input.normalizedLevel,
    input.courseCode,
    input.courseTitle,
    input.dayOfWeek,
    input.startMinutes,
    input.endMinutes,
    input.classroomId,
    input.sourceSheet,
    input.sourceLocation,
    input.rawValue,
    timestamp,
  );

  const row = await database.getFirstAsync<TimetableEntryRow>(
    'SELECT * FROM timetable_entries WHERE id = ?',
    input.id,
  );

  return row ? mapTimetableEntry(row) : null;
}

export async function countTimetableEntries(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM timetable_entries',
  );

  return row?.count ?? 0;
}

export async function deleteTimetableEntriesForDocument(
  database: SQLiteDatabase,
  documentId: string,
) {
  await database.runAsync(
    'DELETE FROM timetable_entries WHERE document_id = ?',
    documentId,
  );
}
