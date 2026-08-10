import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  FreeClassroom,
  ScheduleDay,
  TimetableTimeSlot,
} from '../../types';

type TimeSlotRow = {
  day_of_week: TimetableTimeSlot['dayOfWeek'];
  end_minutes: number;
  start_minutes: number;
};

type FreeClassroomRow = {
  id: string;
  name: string;
};

type FindFreeClassroomsInput = {
  dayOfWeek: ScheduleDay;
  endMinutes: number;
  startMinutes: number;
};

export async function listTimetableTimeSlots(database: SQLiteDatabase) {
  const rows = await database.getAllAsync<TimeSlotRow>(`
    SELECT DISTINCT
      day_of_week,
      start_minutes,
      end_minutes
    FROM timetable_entries
    ORDER BY
      day_of_week ASC,
      start_minutes ASC,
      end_minutes ASC
  `);

  return rows.map<TimetableTimeSlot>((row) => ({
    dayOfWeek: row.day_of_week,
    endMinutes: row.end_minutes,
    startMinutes: row.start_minutes,
  }));
}

export async function findFreeClassrooms(
  database: SQLiteDatabase,
  input: FindFreeClassroomsInput,
) {
  const startMinutes = Math.max(0, Math.min(1439, input.startMinutes));
  const endMinutes = Math.max(
    startMinutes + 1,
    Math.min(1440, input.endMinutes),
  );
  const rows = await database.getAllAsync<FreeClassroomRow>(
    `
      SELECT
        classrooms.id,
        classrooms.name
      FROM classrooms
      WHERE
        classrooms.is_active = 1
        AND NOT EXISTS (
          SELECT 1
          FROM timetable_entries
          WHERE
            timetable_entries.classroom_id = classrooms.id
            AND timetable_entries.day_of_week = ?
            AND timetable_entries.start_minutes < ?
            AND timetable_entries.end_minutes > ?
        )
      ORDER BY classrooms.normalized_name ASC
    `,
    input.dayOfWeek,
    endMinutes,
    startMinutes,
  );

  return rows.map<FreeClassroom>((row) => ({
    id: row.id,
    name: row.name,
  }));
}
