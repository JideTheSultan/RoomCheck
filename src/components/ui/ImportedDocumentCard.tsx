import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  ImportedDocument,
  ImportedDocumentSourceType,
} from '../../types';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../../theme';

type ImportedDocumentCardProps = {
  document: ImportedDocument;
  isProcessing?: boolean;
  isRemoving?: boolean;
  onProcess?: () => void;
  onRemove: () => void;
};

const sourceIcons: Record<
  ImportedDocumentSourceType,
  keyof typeof Ionicons.glyphMap
> = {
  csv: 'list-outline',
  image: 'image-outline',
  xlsx: 'grid-outline',
};

function formatFileSize(size: number | null) {
  if (size === null) {
    return 'Size unavailable';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatImportDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Import date unavailable';
  }

  return date.toLocaleString([], {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ImportedDocumentCard({
  document,
  isProcessing = false,
  isRemoving = false,
  onProcess,
  onRemove,
}: ImportedDocumentCardProps) {
  const isImage = document.sourceType === 'image';
  const canProcess =
    !isImage &&
    document.status !== 'ready' &&
    document.status !== 'processing' &&
    Boolean(onProcess);
  const statusLabel =
    document.status === 'ready'
      ? `${document.entryCount} timetable classes processed`
      : document.status === 'failed'
        ? document.errorMessage ?? 'Timetable processing failed'
        : isImage
          ? 'Saved · Image text extraction is not available yet'
          : document.status === 'processing' || isProcessing
            ? 'Processing timetable…'
            : 'Ready to process';
  const statusStyle =
    document.status === 'ready'
      ? styles.readyStatus
      : document.status === 'failed'
        ? styles.failedStatus
        : styles.pendingStatus;
  const statusDotStyle =
    document.status === 'ready'
      ? styles.readyStatusDot
      : document.status === 'failed'
        ? styles.failedStatusDot
        : styles.pendingStatusDot;
  const statusTextStyle =
    document.status === 'ready'
      ? styles.readyStatusText
      : document.status === 'failed'
        ? styles.failedStatusText
        : styles.pendingStatusText;

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.icon}>
          <Ionicons
            color={colors.primary}
            name={sourceIcons[document.sourceType]}
            size={22}
          />
        </View>

        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.name}>
            {document.name}
          </Text>
          <Text style={styles.metadata}>
            {document.sourceType.toUpperCase()} ·{' '}
            {formatFileSize(document.fileSizeBytes)}
          </Text>
          <Text style={styles.metadata}>
            Imported {formatImportDate(document.importedAt)}
          </Text>
        </View>

        <Pressable
          accessibilityLabel={`Remove ${document.name}`}
          accessibilityRole="button"
          disabled={isRemoving}
          hitSlop={8}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
            isRemoving && styles.removeButtonDisabled,
          ]}
        >
          <Ionicons
            color={colors.danger}
            name={isRemoving ? 'hourglass-outline' : 'trash-outline'}
            size={20}
          />
        </Pressable>
      </View>

      <View style={[styles.status, statusStyle]}>
        <View style={[styles.statusDot, statusDotStyle]} />
        <Text style={[styles.statusText, statusTextStyle]}>{statusLabel}</Text>
      </View>

      {canProcess ? (
        <Pressable
          accessibilityRole="button"
          disabled={isProcessing}
          onPress={onProcess}
          style={({ pressed }) => [
            styles.processButton,
            pressed && styles.processButtonPressed,
            isProcessing && styles.removeButtonDisabled,
          ]}
        >
          <Ionicons
            color={colors.primary}
            name="refresh-outline"
            size={18}
          />
          <Text style={styles.processButtonText}>
            {document.status === 'failed'
              ? 'Try processing again'
              : 'Process file'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  mainRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
    lineHeight: 20,
  },
  metadata: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 17,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  removeButtonPressed: {
    opacity: 0.72,
  },
  removeButtonDisabled: {
    opacity: 0.45,
  },
  status: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  statusText: {
    flex: 1,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  pendingStatus: {
    backgroundColor: colors.warningSoft,
  },
  pendingStatusDot: {
    backgroundColor: colors.warning,
  },
  pendingStatusText: {
    color: colors.warning,
  },
  readyStatus: {
    backgroundColor: colors.successSoft,
  },
  readyStatusDot: {
    backgroundColor: colors.success,
  },
  readyStatusText: {
    color: colors.success,
  },
  failedStatus: {
    backgroundColor: colors.dangerSoft,
  },
  failedStatusDot: {
    backgroundColor: colors.danger,
  },
  failedStatusText: {
    color: colors.danger,
  },
  processButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  processButtonPressed: {
    opacity: 0.72,
  },
  processButtonText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
