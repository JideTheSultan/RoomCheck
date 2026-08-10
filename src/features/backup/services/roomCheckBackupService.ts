import type { SQLiteDatabase } from 'expo-sqlite';

import { databaseConfig } from '../../../database/databaseConfig';
import type {
  ClassroomOrigin,
  ImportedDocumentSourceType,
  TimetableDay,
} from '../../../types';

const backupFormat = 'roomcheck-backup';
const backupVersion = 1;
const maxBackupTextLength = 20 * 1024 * 1024;

type BackupDocument = {
  extension: string;
  fileSizeBytes: number | null;
  id: string;
  importedAt: string;
  mimeType: string | null;
  name: string;
  sourceType: ImportedDocumentSourceType;
  updatedAt: string;
};

type BackupClassroom = {
  createdAt: string;
  id: string;
  isActive: boolean;
  name: string;
  normalizedName: string;
  origin: ClassroomOrigin;
  updatedAt: string;
};

type BackupClassroomAlias = {
  alias: string;
  classroomId: string;
  createdAt: string;
  id: string;
  normalizedAlias: string;
};

type BackupTimetableEntry = {
  classroomId: string;
  courseCode: string;
  courseTitle: string | null;
  createdAt: string;
  dayOfWeek: TimetableDay;
  department: string;
  documentId: string;
  endMinutes: number;
  id: string;
  level: string;
  normalizedDepartment: string;
  normalizedLevel: string;
  rawValue: string | null;
  sourceLocation: string | null;
  sourceSheet: string | null;
  startMinutes: number;
};

export type RoomCheckBackupSummary = {
  classroomCount: number;
  documentCount: number;
  timetableEntryCount: number;
};

export type RoomCheckBackup = {
  appVersion: string;
  createdAt: string;
  data: {
    classroomAliases: BackupClassroomAlias[];
    classrooms: BackupClassroom[];
    documents: BackupDocument[];
    timetableEntries: BackupTimetableEntry[];
  };
  databaseVersion: number;
  format: typeof backupFormat;
  summary: RoomCheckBackupSummary;
  version: typeof backupVersion;
};

export type RestoreRoomCheckBackupResult = RoomCheckBackupSummary & {
  previousStoredUris: string[];
};

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string) {
  if (!isRecord(value)) {
    throw new Error(`${label} is missing or invalid.`);
  }

  return value;
}

function requireString(
  record: RecordValue,
  key: string,
  label: string,
  maxLength = 10_000,
) {
  const value = record[key];

  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > maxLength
  ) {
    throw new Error(`${label} is missing or invalid.`);
  }

  return value;
}

function optionalString(
  record: RecordValue,
  key: string,
  label: string,
  maxLength = 10_000,
) {
  const value = record[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || value.length > maxLength) {
    throw new Error(`${label} is invalid.`);
  }

  return value;
}

function requireInteger(
  record: RecordValue,
  key: string,
  label: string,
  minimum: number,
  maximum: number,
) {
  const value = record[key];

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${label} is invalid.`);
  }

  return value;
}

function optionalInteger(
  record: RecordValue,
  key: string,
  label: string,
  minimum: number,
) {
  const value = record[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < minimum
  ) {
    throw new Error(`${label} is invalid.`);
  }

  return value;
}

function requireArray<T>(
  value: unknown,
  label: string,
  maximumItems: number,
  parser: (item: unknown, index: number) => T,
) {
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw new Error(`${label} is missing, invalid or too large.`);
  }

  return value.map(parser);
}

function parseDocument(value: unknown, index: number): BackupDocument {
  const record = requireRecord(value, `Document ${index + 1}`);
  const sourceType = requireString(
    record,
    'sourceType',
    `Document ${index + 1} source type`,
    10,
  );

  if (!['xlsx', 'csv', 'image'].includes(sourceType)) {
    throw new Error(`Document ${index + 1} has an unsupported source type.`);
  }

  return {
    extension: requireString(
      record,
      'extension',
      `Document ${index + 1} extension`,
      20,
    ),
    fileSizeBytes: optionalInteger(
      record,
      'fileSizeBytes',
      `Document ${index + 1} file size`,
      0,
    ),
    id: requireString(record, 'id', `Document ${index + 1} ID`, 256),
    importedAt: requireString(
      record,
      'importedAt',
      `Document ${index + 1} import date`,
      100,
    ),
    mimeType: optionalString(
      record,
      'mimeType',
      `Document ${index + 1} MIME type`,
      200,
    ),
    name: requireString(record, 'name', `Document ${index + 1} name`, 500),
    sourceType: sourceType as ImportedDocumentSourceType,
    updatedAt: requireString(
      record,
      'updatedAt',
      `Document ${index + 1} update date`,
      100,
    ),
  };
}

function parseClassroom(value: unknown, index: number): BackupClassroom {
  const record = requireRecord(value, `Classroom ${index + 1}`);
  const origin = requireString(
    record,
    'origin',
    `Classroom ${index + 1} origin`,
    20,
  );

  if (!['discovered', 'manual'].includes(origin)) {
    throw new Error(`Classroom ${index + 1} has an invalid origin.`);
  }

  if (typeof record.isActive !== 'boolean') {
    throw new Error(`Classroom ${index + 1} active state is invalid.`);
  }

  return {
    createdAt: requireString(
      record,
      'createdAt',
      `Classroom ${index + 1} creation date`,
      100,
    ),
    id: requireString(record, 'id', `Classroom ${index + 1} ID`, 256),
    isActive: record.isActive,
    name: requireString(record, 'name', `Classroom ${index + 1} name`, 500),
    normalizedName: requireString(
      record,
      'normalizedName',
      `Classroom ${index + 1} normalized name`,
      500,
    ),
    origin: origin as ClassroomOrigin,
    updatedAt: requireString(
      record,
      'updatedAt',
      `Classroom ${index + 1} update date`,
      100,
    ),
  };
}

function parseClassroomAlias(
  value: unknown,
  index: number,
): BackupClassroomAlias {
  const record = requireRecord(value, `Classroom alias ${index + 1}`);

  return {
    alias: requireString(
      record,
      'alias',
      `Classroom alias ${index + 1} name`,
      500,
    ),
    classroomId: requireString(
      record,
      'classroomId',
      `Classroom alias ${index + 1} classroom ID`,
      256,
    ),
    createdAt: requireString(
      record,
      'createdAt',
      `Classroom alias ${index + 1} creation date`,
      100,
    ),
    id: requireString(record, 'id', `Classroom alias ${index + 1} ID`, 256),
    normalizedAlias: requireString(
      record,
      'normalizedAlias',
      `Classroom alias ${index + 1} normalized name`,
      500,
    ),
  };
}

function parseTimetableEntry(
  value: unknown,
  index: number,
): BackupTimetableEntry {
  const record = requireRecord(value, `Timetable row ${index + 1}`);
  const startMinutes = requireInteger(
    record,
    'startMinutes',
    `Timetable row ${index + 1} start time`,
    0,
    1439,
  );
  const endMinutes = requireInteger(
    record,
    'endMinutes',
    `Timetable row ${index + 1} end time`,
    1,
    1440,
  );

  if (endMinutes <= startMinutes) {
    throw new Error(`Timetable row ${index + 1} has a reversed time range.`);
  }

  return {
    classroomId: requireString(
      record,
      'classroomId',
      `Timetable row ${index + 1} classroom ID`,
      256,
    ),
    courseCode: requireString(
      record,
      'courseCode',
      `Timetable row ${index + 1} course code`,
      500,
    ),
    courseTitle: optionalString(
      record,
      'courseTitle',
      `Timetable row ${index + 1} course title`,
    ),
    createdAt: requireString(
      record,
      'createdAt',
      `Timetable row ${index + 1} creation date`,
      100,
    ),
    dayOfWeek: requireInteger(
      record,
      'dayOfWeek',
      `Timetable row ${index + 1} weekday`,
      1,
      5,
    ) as TimetableDay,
    department: requireString(
      record,
      'department',
      `Timetable row ${index + 1} department`,
      500,
    ),
    documentId: requireString(
      record,
      'documentId',
      `Timetable row ${index + 1} document ID`,
      256,
    ),
    endMinutes,
    id: requireString(record, 'id', `Timetable row ${index + 1} ID`, 256),
    level: requireString(
      record,
      'level',
      `Timetable row ${index + 1} level`,
      500,
    ),
    normalizedDepartment: requireString(
      record,
      'normalizedDepartment',
      `Timetable row ${index + 1} normalized department`,
      500,
    ),
    normalizedLevel: requireString(
      record,
      'normalizedLevel',
      `Timetable row ${index + 1} normalized level`,
      500,
    ),
    rawValue: optionalString(
      record,
      'rawValue',
      `Timetable row ${index + 1} raw value`,
    ),
    sourceLocation: optionalString(
      record,
      'sourceLocation',
      `Timetable row ${index + 1} source location`,
      500,
    ),
    sourceSheet: optionalString(
      record,
      'sourceSheet',
      `Timetable row ${index + 1} source sheet`,
      500,
    ),
    startMinutes,
  };
}

function rejectDuplicateIds(items: { id: string }[], label: string) {
  const ids = new Set<string>();

  items.forEach((item) => {
    if (ids.has(item.id)) {
      throw new Error(`The backup contains a duplicate ${label} ID.`);
    }

    ids.add(item.id);
  });
}

function validateRelationships(backup: RoomCheckBackup) {
  const documentIds = new Set(backup.data.documents.map(({ id }) => id));
  const classroomIds = new Set(backup.data.classrooms.map(({ id }) => id));

  backup.data.classroomAliases.forEach((alias) => {
    if (!classroomIds.has(alias.classroomId)) {
      throw new Error('A classroom alias refers to a missing classroom.');
    }
  });

  backup.data.timetableEntries.forEach((entry) => {
    if (!documentIds.has(entry.documentId)) {
      throw new Error('A timetable row refers to a missing document.');
    }

    if (!classroomIds.has(entry.classroomId)) {
      throw new Error('A timetable row refers to a missing classroom.');
    }
  });
}

function getSummary(backup: Pick<RoomCheckBackup, 'data'>) {
  return {
    classroomCount: backup.data.classrooms.filter(({ isActive }) => isActive)
      .length,
    documentCount: backup.data.documents.length,
    timetableEntryCount: backup.data.timetableEntries.length,
  };
}

export function parseRoomCheckBackup(text: string): RoomCheckBackup {
  if (!text.trim() || text.length > maxBackupTextLength) {
    throw new Error('The selected backup is empty or too large.');
  }

  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  const record = requireRecord(value, 'Backup');

  if (record.format !== backupFormat) {
    throw new Error('This is not a RoomCheck backup file.');
  }

  if (record.version !== backupVersion) {
    throw new Error('This RoomCheck backup version is not supported.');
  }

  const dataRecord = requireRecord(record.data, 'Backup data');
  const backup: RoomCheckBackup = {
    appVersion: requireString(record, 'appVersion', 'Backup app version', 50),
    createdAt: requireString(record, 'createdAt', 'Backup date', 100),
    data: {
      classroomAliases: requireArray(
        dataRecord.classroomAliases,
        'Classroom aliases',
        20_000,
        parseClassroomAlias,
      ),
      classrooms: requireArray(
        dataRecord.classrooms,
        'Classrooms',
        10_000,
        parseClassroom,
      ),
      documents: requireArray(
        dataRecord.documents,
        'Documents',
        1_000,
        parseDocument,
      ),
      timetableEntries: requireArray(
        dataRecord.timetableEntries,
        'Timetable rows',
        100_000,
        parseTimetableEntry,
      ),
    },
    databaseVersion: requireInteger(
      record,
      'databaseVersion',
      'Backup database version',
      1,
      databaseConfig.version,
    ),
    format: backupFormat,
    summary: {
      classroomCount: 0,
      documentCount: 0,
      timetableEntryCount: 0,
    },
    version: backupVersion,
  };

  rejectDuplicateIds(backup.data.documents, 'document');
  rejectDuplicateIds(backup.data.classrooms, 'classroom');
  rejectDuplicateIds(backup.data.classroomAliases, 'classroom alias');
  rejectDuplicateIds(backup.data.timetableEntries, 'timetable row');
  validateRelationships(backup);
  backup.summary = getSummary(backup);

  return backup;
}

export async function createRoomCheckBackup(
  database: SQLiteDatabase,
): Promise<RoomCheckBackup> {
  const [documents, classrooms, classroomAliases, timetableEntries] =
    await Promise.all([
      database.getAllAsync<BackupDocument>(`
        SELECT
          id,
          name,
          source_type AS sourceType,
          mime_type AS mimeType,
          extension,
          file_size_bytes AS fileSizeBytes,
          imported_at AS importedAt,
          updated_at AS updatedAt
        FROM imported_documents
        ORDER BY imported_at ASC
      `),
      database.getAllAsync<Omit<BackupClassroom, 'isActive'> & {
        isActive: number;
      }>(`
        SELECT
          id,
          name,
          normalized_name AS normalizedName,
          origin,
          is_active AS isActive,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM classrooms
        ORDER BY name COLLATE NOCASE ASC
      `),
      database.getAllAsync<BackupClassroomAlias>(`
        SELECT
          id,
          classroom_id AS classroomId,
          alias,
          normalized_alias AS normalizedAlias,
          created_at AS createdAt
        FROM classroom_aliases
        ORDER BY alias COLLATE NOCASE ASC
      `),
      database.getAllAsync<BackupTimetableEntry>(`
        SELECT
          id,
          document_id AS documentId,
          department,
          normalized_department AS normalizedDepartment,
          level,
          normalized_level AS normalizedLevel,
          course_code AS courseCode,
          course_title AS courseTitle,
          day_of_week AS dayOfWeek,
          start_minutes AS startMinutes,
          end_minutes AS endMinutes,
          classroom_id AS classroomId,
          source_sheet AS sourceSheet,
          source_location AS sourceLocation,
          raw_value AS rawValue,
          created_at AS createdAt
        FROM timetable_entries
        ORDER BY day_of_week ASC, start_minutes ASC, course_code ASC
      `),
    ]);
  const backup: RoomCheckBackup = {
    appVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    data: {
      classroomAliases,
      classrooms: classrooms.map((classroom) => ({
        ...classroom,
        isActive: classroom.isActive === 1,
      })),
      documents,
      timetableEntries,
    },
    databaseVersion: databaseConfig.version,
    format: backupFormat,
    summary: {
      classroomCount: 0,
      documentCount: 0,
      timetableEntryCount: 0,
    },
    version: backupVersion,
  };

  backup.summary = getSummary(backup);
  return backup;
}

export function serializeRoomCheckBackup(backup: RoomCheckBackup) {
  return JSON.stringify(backup, null, 2);
}

export async function restoreRoomCheckBackup(
  database: SQLiteDatabase,
  backup: RoomCheckBackup,
): Promise<RestoreRoomCheckBackupResult> {
  const storedFiles = await database.getAllAsync<{ storedUri: string }>(`
    SELECT stored_uri AS storedUri
    FROM imported_documents
    WHERE stored_uri IS NOT NULL
  `);
  const entryCounts = new Map<string, number>();

  backup.data.timetableEntries.forEach((entry) => {
    entryCounts.set(entry.documentId, (entryCounts.get(entry.documentId) ?? 0) + 1);
  });

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(`
      DELETE FROM classroom_aliases;
      DELETE FROM timetable_entries;
      DELETE FROM imported_documents;
      DELETE FROM classrooms;
    `);

    for (const document of backup.data.documents) {
      const entryCount = entryCounts.get(document.id) ?? 0;
      const status =
        entryCount > 0
          ? 'ready'
          : document.sourceType === 'image'
            ? 'pending'
            : 'failed';
      const errorMessage =
        status === 'failed'
          ? 'The original source file is not included in this backup. Replace this document to process it again.'
          : null;

      await transaction.runAsync(
        `
          INSERT INTO imported_documents (
            id,
            name,
            source_type,
            mime_type,
            extension,
            original_uri,
            stored_uri,
            file_size_bytes,
            fingerprint,
            status,
            entry_count,
            extracted_text,
            error_message,
            imported_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, NULL, ?, ?, ?)
        `,
        document.id,
        document.name,
        document.sourceType,
        document.mimeType,
        document.extension,
        `roomcheck-backup://${document.id}`,
        document.fileSizeBytes,
        status,
        entryCount,
        errorMessage,
        document.importedAt,
        document.updatedAt,
      );
    }

    for (const classroom of backup.data.classrooms) {
      await transaction.runAsync(
        `
          INSERT INTO classrooms (
            id,
            name,
            normalized_name,
            origin,
            is_active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        classroom.id,
        classroom.name,
        classroom.normalizedName,
        classroom.origin,
        classroom.isActive ? 1 : 0,
        classroom.createdAt,
        classroom.updatedAt,
      );
    }

    for (const alias of backup.data.classroomAliases) {
      await transaction.runAsync(
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
        alias.id,
        alias.classroomId,
        alias.alias,
        alias.normalizedAlias,
        alias.createdAt,
      );
    }

    for (const entry of backup.data.timetableEntries) {
      await transaction.runAsync(
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
        entry.id,
        entry.documentId,
        entry.department,
        entry.normalizedDepartment,
        entry.level,
        entry.normalizedLevel,
        entry.courseCode,
        entry.courseTitle,
        entry.dayOfWeek,
        entry.startMinutes,
        entry.endMinutes,
        entry.classroomId,
        entry.sourceSheet,
        entry.sourceLocation,
        entry.rawValue,
        entry.createdAt,
      );
    }
  });

  return {
    ...getSummary(backup),
    previousStoredUris: storedFiles.map(({ storedUri }) => storedUri),
  };
}
