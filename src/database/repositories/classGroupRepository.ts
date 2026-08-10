import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ClassGroupOption,
  ClassGroupScheduleEntry,
  ScheduleDay,
} from '../../types';

type ClassGroupOptionRow = {
  department: string;
  level: string;
  normalized_department: string;
  normalized_level: string;
};

type ClassGroupScheduleRow = {
  classroom_name: string;
  course_code: string;
  course_title: string | null;
  department: string;
  end_minutes: number;
  id: string;
  level: string;
  start_minutes: number;
};

type FindClassGroupScheduleInput = {
  dayOfWeek: ScheduleDay;
  endMinutes: number;
  normalizedDepartment: string;
  normalizedLevel: string;
  startMinutes: number;
};

export async function listClassGroupOptions(database: SQLiteDatabase) {
  const rows = await database.getAllAsync<ClassGroupOptionRow>(`
    SELECT
      normalized_department,
      MIN(department) AS department,
      normalized_level,
      MIN(level) AS level
    FROM timetable_entries
    GROUP BY
      normalized_department,
      normalized_level
    ORDER BY
      department COLLATE NOCASE ASC,
      CAST(level AS INTEGER) ASC,
      level COLLATE NOCASE ASC
  `);
  const groups = new Map<string, ClassGroupOption>();

  rows.forEach((row) => {
    const existing = groups.get(row.normalized_department);
    const level = {
      level: row.level,
      normalizedLevel: row.normalized_level,
    };

    if (existing) {
      existing.levels.push(level);
      return;
    }

    groups.set(row.normalized_department, {
      department: row.department,
      levels: [level],
      normalizedDepartment: row.normalized_department,
    });
  });

  return [...groups.values()];
}

export async function findClassGroupSchedule(
  database: SQLiteDatabase,
  input: FindClassGroupScheduleInput,
) {
  const startMinutes = Math.max(0, Math.min(1439, input.startMinutes));
  const endMinutes = Math.max(
    startMinutes + 1,
    Math.min(1440, input.endMinutes),
  );
  const rows = await database.getAllAsync<ClassGroupScheduleRow>(
    `
      SELECT
        timetable_entries.id,
        timetable_entries.department,
        timetable_entries.level,
        timetable_entries.course_code,
        timetable_entries.course_title,
        timetable_entries.start_minutes,
        timetable_entries.end_minutes,
        classrooms.name AS classroom_name
      FROM timetable_entries
      INNER JOIN classrooms
        ON classrooms.id = timetable_entries.classroom_id
      WHERE
        timetable_entries.normalized_department = ?
        AND timetable_entries.normalized_level = ?
        AND timetable_entries.day_of_week = ?
        AND timetable_entries.start_minutes < ?
        AND timetable_entries.end_minutes > ?
      ORDER BY
        timetable_entries.start_minutes ASC,
        timetable_entries.end_minutes ASC,
        timetable_entries.course_code COLLATE NOCASE ASC
    `,
    input.normalizedDepartment,
    input.normalizedLevel,
    input.dayOfWeek,
    endMinutes,
    startMinutes,
  );

  return rows.map<ClassGroupScheduleEntry>((row) => ({
    classroomName: row.classroom_name,
    courseCode: row.course_code,
    courseTitle: row.course_title,
    department: row.department,
    endMinutes: row.end_minutes,
    id: row.id,
    level: row.level,
    startMinutes: row.start_minutes,
  }));
}
