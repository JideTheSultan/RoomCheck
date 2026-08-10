import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ImportTimetableResult } from '../../features/import/services/timetableImportService';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../../theme';
import { AppButton } from './AppButton';

type ImportResultCardProps = {
  onContinue: () => void;
  result: ImportTimetableResult;
};

type DetailListProps = {
  color?: 'danger' | 'muted' | 'warning';
  items: string[];
  title: string;
};

function DetailList({
  color = 'muted',
  items,
  title,
}: DetailListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailTitle}>{title}</Text>
      {items.map((item, index) => (
        <Text
          key={`${title}-${item}-${index}`}
          style={[
            styles.detailText,
            color === 'danger' && styles.dangerText,
            color === 'warning' && styles.warningText,
          ]}
        >
          • {item}
        </Text>
      ))}
    </View>
  );
}

export function ImportResultCard({
  onContinue,
  result,
}: ImportResultCardProps) {
  const readyDocuments = result.imported.filter(
    (document) => document.status === 'ready',
  );
  const attentionCount =
    result.unsupported.length +
    result.failures.length +
    result.processingFailures.length;
  const hasNewFiles = result.imported.length > 0;
  const hasReadyDocuments = readyDocuments.length > 0;
  const title = hasReadyDocuments
    ? 'Timetables ready'
    : hasNewFiles
      ? 'Files saved'
      : 'No new files imported';
  const description = hasReadyDocuments
    ? 'RoomCheck finished reading the timetable rows below.'
    : result.deferredImages.length > 0
      ? 'The selected images are stored safely. Enter their timetable rows manually from document management.'
      : 'Review the details below, then choose different timetable files if needed.';

  return (
    <View accessibilityRole="summary" style={styles.card}>
      <View style={styles.headingRow}>
        <View
          style={[
            styles.icon,
            hasReadyDocuments ? styles.successIcon : styles.warningIcon,
          ]}
        >
          <Ionicons
            color={hasReadyDocuments ? colors.success : colors.warning}
            name={hasReadyDocuments ? 'checkmark-circle-outline' : 'information-circle-outline'}
            size={24}
          />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{result.imported.length}</Text>
          <Text style={styles.metricLabel}>Saved</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{readyDocuments.length}</Text>
          <Text style={styles.metricLabel}>Ready</Text>
        </View>
        <View style={styles.metric}>
          <Text
            style={[
              styles.metricValue,
              attentionCount > 0 && styles.dangerText,
            ]}
          >
            {attentionCount}
          </Text>
          <Text style={styles.metricLabel}>Needs attention</Text>
        </View>
      </View>

      <DetailList
        items={readyDocuments.map(
          (document) =>
            `${document.name} — ${document.entryCount} timetable ${
              document.entryCount === 1 ? 'entry' : 'entries'
            }`,
        )}
        title="Ready to use"
      />
      <DetailList
        color="warning"
        items={result.deferredImages}
        title="Images ready for manual entry"
      />
      <DetailList
        items={result.duplicates}
        title="Already imported"
      />
      <DetailList
        color="warning"
        items={result.unsupported}
        title="Unsupported files"
      />
      <DetailList
        color="danger"
        items={result.failures.map(
          (failure) => `${failure.name}: ${failure.message}`,
        )}
        title="Files that could not be saved"
      />
      <DetailList
        color="danger"
        items={result.processingFailures.map(
          (failure) => `${failure.name}: ${failure.message}`,
        )}
        title="Files that could not be processed"
      />

      {hasNewFiles ? (
        <AppButton
          icon={hasReadyDocuments ? 'home-outline' : 'folder-open-outline'}
          label={
            hasReadyDocuments ? 'Continue to Home' : 'Manage saved images'
          }
          onPress={onContinue}
          variant="secondary"
        />
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
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  successIcon: {
    backgroundColor: colors.successSoft,
  },
  warningIcon: {
    backgroundColor: colors.warningSoft,
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailSection: {
    gap: spacing.xs,
  },
  detailTitle: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
  },
  detailText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  warningText: {
    color: colors.warning,
  },
  dangerText: {
    color: colors.danger,
  },
});
