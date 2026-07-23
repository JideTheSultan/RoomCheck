import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Classroom,
  ClassroomAlias,
  ClassroomOrigin,
  NewClassroom,
} from '../../types';
import { normalizeText } from '../../utils/normalizeText';

type ClassroomRow = {
  created_at: string;
  id: string;
  is_active: number;
  name: string;
  normalized_name: string;
  origin: ClassroomOrigin;
  updated_at: string;
};

type ClassroomAliasRow = {
  alias: string;
  classroom_id: string;
  created_at: string;
  id: string;
  normalized_alias: string;
};

function mapClassroom(row: ClassroomRow): Classroom {
  return {
    createdAt: row.created_at,
    id: row.id,
    isActive: row.is_active === 1,
    name: row.name,
    normalizedName: row.normalized_name,
    origin: row.origin,
    updatedAt: row.updated_at,
  };
}

function mapClassroomAlias(row: ClassroomAliasRow): ClassroomAlias {
  return {
    alias: row.alias,
    classroomId: row.classroom_id,
    createdAt: row.created_at,
    id: row.id,
    normalizedAlias: row.normalized_alias,
  };
}

export async function createClassroom(
  database: SQLiteDatabase,
  input: NewClassroom,
) {
  const normalizedName = normalizeText(input.name);
  const existing = await findClassroomByName(database, input.name);

  if (existing) {
    return existing;
  }

  const timestamp = new Date().toISOString();

  await database.runAsync(
    `
      INSERT INTO classrooms (
        id,
        name,
        normalized_name,
        origin,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    input.id,
    input.name.trim(),
    normalizedName,
    input.origin,
    timestamp,
    timestamp,
  );

  return getClassroomById(database, input.id);
}

export async function getClassroomById(
  database: SQLiteDatabase,
  classroomId: string,
) {
  const row = await database.getFirstAsync<ClassroomRow>(
    'SELECT * FROM classrooms WHERE id = ?',
    classroomId,
  );

  return row ? mapClassroom(row) : null;
}

export async function findClassroomByName(
  database: SQLiteDatabase,
  name: string,
) {
  const normalizedName = normalizeText(name);
  const row = await database.getFirstAsync<ClassroomRow>(
    `
      SELECT classrooms.*
      FROM classrooms
      LEFT JOIN classroom_aliases
        ON classroom_aliases.classroom_id = classrooms.id
      WHERE
        classrooms.normalized_name = ?
        OR classroom_aliases.normalized_alias = ?
      LIMIT 1
    `,
    normalizedName,
    normalizedName,
  );

  return row ? mapClassroom(row) : null;
}

export async function listClassrooms(
  database: SQLiteDatabase,
  includeInactive = false,
) {
  const rows = await database.getAllAsync<ClassroomRow>(
    `
      SELECT *
      FROM classrooms
      WHERE is_active = ? OR ? = 1
      ORDER BY name COLLATE NOCASE ASC
    `,
    includeInactive ? 0 : 1,
    includeInactive ? 1 : 0,
  );

  return rows.map(mapClassroom);
}

export async function countClassrooms(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM classrooms WHERE is_active = 1',
  );

  return row?.count ?? 0;
}

export async function addClassroomAlias(
  database: SQLiteDatabase,
  input: Omit<ClassroomAlias, 'createdAt' | 'normalizedAlias'>,
) {
  const timestamp = new Date().toISOString();

  await database.runAsync(
    `
      INSERT INTO classroom_aliases (
        id,
        classroom_id,
        alias,
        normalized_alias,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    input.id,
    input.classroomId,
    input.alias.trim(),
    normalizeText(input.alias),
    timestamp,
  );

  const row = await database.getFirstAsync<ClassroomAliasRow>(
    'SELECT * FROM classroom_aliases WHERE id = ?',
    input.id,
  );

  return row ? mapClassroomAlias(row) : null;
}

export async function setClassroomActive(
  database: SQLiteDatabase,
  classroomId: string,
  isActive: boolean,
) {
  await database.runAsync(
    `
      UPDATE classrooms
      SET is_active = ?, updated_at = ?
      WHERE id = ?
    `,
    isActive ? 1 : 0,
    new Date().toISOString(),
    classroomId,
  );
}

export async function cleanupUnusedDiscoveredClassrooms(
  database: SQLiteDatabase,
) {
  await database.runAsync(`
    DELETE FROM classrooms
    WHERE
      origin = 'discovered'
      AND NOT EXISTS (
        SELECT 1
        FROM timetable_entries
        WHERE timetable_entries.classroom_id = classrooms.id
      )
  `);
}
