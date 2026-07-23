import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { DatabaseSummary } from '../../types';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../../theme';

type DatabaseSummaryCardProps = {
  summary: DatabaseSummary;
};

const summaryItems: Array<{
  key: keyof DatabaseSummary;
  label: string;
}> = [
  {
    key: 'importedDocumentCount',
    label: 'Documents',
  },
  {
    key: 'classroomCount',
    label: 'Rooms',
  },
  {
    key: 'timetableEntryCount',
    label: 'Classes',
  },
];

export function DatabaseSummaryCard({
  summary,
}: DatabaseSummaryCardProps) {
  return (
    <View style={styles.container}>
      {summaryItems.map((item) => (
        <View key={item.key} style={styles.item}>
          <Text style={styles.value}>{summary[item.key]}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  value: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: '800',
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
