import type { ImportedDocumentSourceType } from '../types';

export const importPickerMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/*',
] as const;

export const supportedSpreadsheetExtensions = ['.xlsx', '.csv'] as const;

export const supportedImageExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
  '.heif',
] as const;

export const supportedFormatLabels = ['XLSX', 'CSV', 'IMAGE'] as const;

type FileTypeInput = {
  mimeType?: string | null;
  name: string;
};

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex === -1) {
    return '';
  }

  return fileName.slice(dotIndex).toLowerCase();
}

export function getDocumentSourceType({
  mimeType,
  name,
}: FileTypeInput): ImportedDocumentSourceType | null {
  const extension = getExtension(name);
  const normalizedMimeType = mimeType?.toLowerCase() ?? '';

  if (extension === '.xlsx') {
    return 'xlsx';
  }

  if (extension === '.csv' || normalizedMimeType === 'text/csv') {
    return 'csv';
  }

  if (
    normalizedMimeType.startsWith('image/') ||
    supportedImageExtensions.some(
      (supportedExtension) => supportedExtension === extension,
    )
  ) {
    return 'image';
  }

  return null;
}

export function getFileExtension(fileName: string) {
  return getExtension(fileName);
}
