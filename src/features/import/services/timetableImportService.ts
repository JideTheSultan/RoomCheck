import type { DocumentPickerAsset } from 'expo-document-picker';
import {
  Directory,
  File,
  Paths,
} from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cleanupUnusedDiscoveredClassrooms,
  createImportedDocument,
  deleteImportedDocument,
  getImportedDocumentByFingerprint,
} from '../../../database';
import {
  getDocumentSourceType,
  getFileExtension,
} from '../../../constants/importFormats';
import type {
  ImportedDocument,
  ImportedDocumentSourceType,
} from '../../../types';
import { createLocalId } from '../../../utils/createLocalId';
import { processSpreadsheetDocument } from './spreadsheetProcessingService';

const timetableDocumentsDirectory = new Directory(
  Paths.document,
  'roomcheck-timetables',
);

type ImportFailure = {
  message: string;
  name: string;
};

export type ImportTimetableResult = {
  deferredImages: string[];
  duplicates: string[];
  failures: ImportFailure[];
  imported: ImportedDocument[];
  processingFailures: ImportFailure[];
  unsupported: string[];
};

export type RemoveImportedDocumentResult = {
  fileCleanupFailed: boolean;
};

function ensureTimetableDocumentsDirectory() {
  timetableDocumentsDirectory.create({
    idempotent: true,
    intermediates: true,
  });
}

function createFallbackFingerprint(
  asset: DocumentPickerAsset,
  sourceType: ImportedDocumentSourceType,
) {
  return [
    sourceType,
    asset.name.trim().toLowerCase(),
    asset.size ?? 0,
    asset.lastModified ?? 0,
  ].join(':');
}

function inspectSourceFile(
  asset: DocumentPickerAsset,
  sourceType: ImportedDocumentSourceType,
) {
  const sourceFile = new File(asset.uri);

  try {
    const info = sourceFile.info({ md5: true });

    if (!info.exists) {
      throw new Error('The selected file is no longer available.');
    }

    return {
      file: sourceFile,
      fileSizeBytes: info.size ?? asset.size ?? null,
      fingerprint: info.md5
        ? `${sourceType}:${info.md5}`
        : createFallbackFingerprint(asset, sourceType),
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('no longer available')) {
      throw error;
    }

    return {
      file: sourceFile,
      fileSizeBytes: asset.size ?? null,
      fingerprint: createFallbackFingerprint(asset, sourceType),
    };
  }
}

function getFailureMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'The file could not be saved.';
}

export async function importTimetableAssets(
  database: SQLiteDatabase,
  assets: DocumentPickerAsset[],
): Promise<ImportTimetableResult> {
  const result: ImportTimetableResult = {
    deferredImages: [],
    duplicates: [],
    failures: [],
    imported: [],
    processingFailures: [],
    unsupported: [],
  };

  ensureTimetableDocumentsDirectory();

  for (const asset of assets) {
    const sourceType = getDocumentSourceType({
      mimeType: asset.mimeType,
      name: asset.name,
    });

    if (!sourceType) {
      result.unsupported.push(asset.name);
      continue;
    }

    let destinationFile: File | null = null;
    let importedDocument: ImportedDocument | null = null;

    try {
      const source = inspectSourceFile(asset, sourceType);
      const existingDocument = await getImportedDocumentByFingerprint(
        database,
        source.fingerprint,
      );

      if (existingDocument) {
        result.duplicates.push(asset.name);
        continue;
      }

      const documentId = createLocalId('document');
      const extension = getFileExtension(asset.name);
      destinationFile = new File(
        timetableDocumentsDirectory,
        `${documentId}${extension}`,
      );
      source.file.copy(destinationFile);

      importedDocument = await createImportedDocument(database, {
        extension,
        fileSizeBytes: source.fileSizeBytes,
        fingerprint: source.fingerprint,
        id: documentId,
        mimeType: asset.mimeType ?? null,
        name: asset.name,
        originalUri: asset.uri,
        sourceType,
        storedUri: destinationFile.uri,
      });

      if (!importedDocument) {
        throw new Error('The saved document record could not be loaded.');
      }

    } catch (error: unknown) {
      if (destinationFile?.exists) {
        try {
          destinationFile.delete();
        } catch {
          // The database record was not created, so this file is safe to ignore.
        }
      }

      result.failures.push({
        message: getFailureMessage(error),
        name: asset.name,
      });
      continue;
    }

    result.imported.push(importedDocument);

    if (importedDocument.sourceType === 'image') {
      result.deferredImages.push(importedDocument.name);
      continue;
    }

    try {
      const processedDocument = await processSpreadsheetDocument(
        database,
        importedDocument,
      );
      result.imported[result.imported.length - 1] = processedDocument;

      if (processedDocument.status === 'failed') {
        result.processingFailures.push({
          message:
            processedDocument.errorMessage ??
            'The timetable rows could not be processed.',
          name: processedDocument.name,
        });
      }
    } catch (error: unknown) {
      result.processingFailures.push({
        message: getFailureMessage(error),
        name: importedDocument.name,
      });
    }
  }

  return result;
}

export async function removeImportedDocument(
  database: SQLiteDatabase,
  document: ImportedDocument,
): Promise<RemoveImportedDocumentResult> {
  await database.withTransactionAsync(async () => {
    await deleteImportedDocument(database, document.id);
    await cleanupUnusedDiscoveredClassrooms(database);
  });

  if (!document.storedUri) {
    return { fileCleanupFailed: false };
  }

  try {
    const storedFile = new File(document.storedUri);

    if (storedFile.exists) {
      storedFile.delete();
    }

    return { fileCleanupFailed: false };
  } catch {
    return { fileCleanupFailed: true };
  }
}
