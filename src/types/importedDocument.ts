export type ImportedDocumentSourceType = 'xlsx' | 'csv' | 'image';

export type ImportedDocumentStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed';

export type ImportedDocument = {
  entryCount: number;
  errorMessage: string | null;
  extension: string;
  extractedText: string | null;
  fileSizeBytes: number | null;
  fingerprint: string | null;
  id: string;
  importedAt: string;
  mimeType: string | null;
  name: string;
  originalUri: string;
  sourceType: ImportedDocumentSourceType;
  status: ImportedDocumentStatus;
  storedUri: string | null;
  updatedAt: string;
};

export type NewImportedDocument = {
  extension: string;
  fileSizeBytes?: number | null;
  fingerprint?: string | null;
  id: string;
  importedAt?: string;
  mimeType?: string | null;
  name: string;
  originalUri: string;
  sourceType: ImportedDocumentSourceType;
  storedUri?: string | null;
};
