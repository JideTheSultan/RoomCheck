import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ImportedDocument,
  ImportedDocumentSourceType,
  ImportedDocumentStatus,
  NewImportedDocument,
} from '../../types';

type ImportedDocumentRow = {
  entry_count: number;
  error_message: string | null;
  extension: string;
  extracted_text: string | null;
  file_size_bytes: number | null;
  fingerprint: string | null;
  id: string;
  imported_at: string;
  mime_type: string | null;
  name: string;
  original_uri: string;
  source_type: ImportedDocumentSourceType;
  status: ImportedDocumentStatus;
  stored_uri: string | null;
  updated_at: string;
};

type ProcessingResult = {
  entryCount?: number;
  errorMessage?: string | null;
  extractedText?: string | null;
  storedUri?: string | null;
};

function mapImportedDocument(row: ImportedDocumentRow): ImportedDocument {
  return {
    entryCount: row.entry_count,
    errorMessage: row.error_message,
    extension: row.extension,
    extractedText: row.extracted_text,
    fileSizeBytes: row.file_size_bytes,
    fingerprint: row.fingerprint,
    id: row.id,
    importedAt: row.imported_at,
    mimeType: row.mime_type,
    name: row.name,
    originalUri: row.original_uri,
    sourceType: row.source_type,
    status: row.status,
    storedUri: row.stored_uri,
    updatedAt: row.updated_at,
  };
}

export async function createImportedDocument(
  database: SQLiteDatabase,
  input: NewImportedDocument,
) {
  const timestamp = input.importedAt ?? new Date().toISOString();

  await database.runAsync(
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
        imported_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    input.id,
    input.name,
    input.sourceType,
    input.mimeType ?? null,
    input.extension,
    input.originalUri,
    input.storedUri ?? null,
    input.fileSizeBytes ?? null,
    input.fingerprint ?? null,
    timestamp,
    timestamp,
  );

  return getImportedDocumentById(database, input.id);
}

export async function getImportedDocumentById(
  database: SQLiteDatabase,
  documentId: string,
) {
  const row = await database.getFirstAsync<ImportedDocumentRow>(
    'SELECT * FROM imported_documents WHERE id = ?',
    documentId,
  );

  return row ? mapImportedDocument(row) : null;
}

export async function getImportedDocumentByFingerprint(
  database: SQLiteDatabase,
  fingerprint: string,
) {
  const row = await database.getFirstAsync<ImportedDocumentRow>(
    'SELECT * FROM imported_documents WHERE fingerprint = ?',
    fingerprint,
  );

  return row ? mapImportedDocument(row) : null;
}

export async function listImportedDocuments(database: SQLiteDatabase) {
  const rows = await database.getAllAsync<ImportedDocumentRow>(
    `
      SELECT *
      FROM imported_documents
      ORDER BY imported_at DESC
    `,
  );

  return rows.map(mapImportedDocument);
}

export async function countImportedDocuments(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM imported_documents',
  );

  return row?.count ?? 0;
}

export async function updateImportedDocumentStatus(
  database: SQLiteDatabase,
  documentId: string,
  status: ImportedDocumentStatus,
  result: ProcessingResult = {},
) {
  await database.runAsync(
    `
      UPDATE imported_documents
      SET
        status = ?,
        stored_uri = COALESCE(?, stored_uri),
        entry_count = COALESCE(?, entry_count),
        extracted_text = COALESCE(?, extracted_text),
        error_message = ?,
        updated_at = ?
      WHERE id = ?
    `,
    status,
    result.storedUri ?? null,
    result.entryCount ?? null,
    result.extractedText ?? null,
    result.errorMessage ?? null,
    new Date().toISOString(),
    documentId,
  );
}

export async function deleteImportedDocument(
  database: SQLiteDatabase,
  documentId: string,
) {
  await database.runAsync(
    'DELETE FROM imported_documents WHERE id = ?',
    documentId,
  );
}

export async function deleteAllImportedDocuments(database: SQLiteDatabase) {
  await database.runAsync('DELETE FROM imported_documents');
}
