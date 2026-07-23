import type { SQLiteDatabase } from 'expo-sqlite';

import { databaseConfig } from './databaseConfig';

type UserVersionRow = {
  user_version: number;
};

async function createVersionOneSchema(database: SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS imported_documents (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL
        CHECK (source_type IN ('xlsx', 'csv', 'image')),
      mime_type TEXT,
      extension TEXT NOT NULL,
      original_uri TEXT NOT NULL,
      stored_uri TEXT,
      file_size_bytes INTEGER,
      fingerprint TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
      entry_count INTEGER NOT NULL DEFAULT 0
        CHECK (entry_count >= 0),
      extracted_text TEXT,
      error_message TEXT,
      imported_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS
      imported_documents_fingerprint_index
      ON imported_documents(fingerprint)
      WHERE fingerprint IS NOT NULL;

    CREATE INDEX IF NOT EXISTS
      imported_documents_status_index
      ON imported_documents(status);

    CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      origin TEXT NOT NULL
        CHECK (origin IN ('discovered', 'manual')),
      is_active INTEGER NOT NULL DEFAULT 1
        CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classroom_aliases (
      id TEXT PRIMARY KEY NOT NULL,
      classroom_id TEXT NOT NULL,
      alias TEXT NOT NULL,
      normalized_alias TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS
      classroom_aliases_classroom_index
      ON classroom_aliases(classroom_id);

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY NOT NULL,
      document_id TEXT NOT NULL,
      department TEXT NOT NULL,
      normalized_department TEXT NOT NULL,
      level TEXT NOT NULL,
      normalized_level TEXT NOT NULL,
      course_code TEXT NOT NULL,
      course_title TEXT,
      day_of_week INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 1 AND 5),
      start_minutes INTEGER NOT NULL
        CHECK (start_minutes BETWEEN 0 AND 1439),
      end_minutes INTEGER NOT NULL
        CHECK (end_minutes BETWEEN 1 AND 1440),
      classroom_id TEXT NOT NULL,
      source_sheet TEXT,
      source_location TEXT,
      raw_value TEXT,
      created_at TEXT NOT NULL,
      CHECK (end_minutes > start_minutes),
      FOREIGN KEY (document_id)
        REFERENCES imported_documents(id)
        ON DELETE CASCADE,
      FOREIGN KEY (classroom_id)
        REFERENCES classrooms(id)
        ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS
      timetable_entries_document_index
      ON timetable_entries(document_id);

    CREATE INDEX IF NOT EXISTS
      timetable_entries_classroom_time_index
      ON timetable_entries(
        classroom_id,
        day_of_week,
        start_minutes,
        end_minutes
      );

    CREATE INDEX IF NOT EXISTS
      timetable_entries_group_time_index
      ON timetable_entries(
        normalized_department,
        normalized_level,
        day_of_week,
        start_minutes,
        end_minutes
      );
  `);
}

export async function migrateDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionRow = await database.getFirstAsync<UserVersionRow>(
    'PRAGMA user_version',
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > databaseConfig.version) {
    throw new Error(
      `RoomCheck database version ${currentVersion} is newer than the app supports.`,
    );
  }

  if (currentVersion < 1) {
    await database.withTransactionAsync(async () => {
      await createVersionOneSchema(database);
      await database.execAsync('PRAGMA user_version = 1');
    });
  }
}
