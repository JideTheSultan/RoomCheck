import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';

import {
  AppButton,
  PhaseNotice,
  Screen,
} from '../components/ui';
import {
  importPickerMimeTypes,
  supportedFormatLabels,
} from '../constants/importFormats';
import {
  importTimetableAssets,
  type ImportTimetableResult,
} from '../features/import/services/timetableImportService';
import { useRefreshDatabaseSummary } from '../hooks/useRefreshDatabaseSummary';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { useAppStore } from '../store/useAppStore';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportTimetables'>;

export function ImportTimetablesScreen({ navigation }: Props) {
  const database = useSQLiteContext();
  const refreshDatabaseSummary = useRefreshDatabaseSummary();
  const hadUsableTimetable = useAppStore(
    (state) => state.timetableEntryCount > 0,
  );
  const [importResult, setImportResult] =
    useState<ImportTimetableResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const selectTimetableFiles = async () => {
    setImportResult(null);
    setScreenError(null);

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: [...importPickerMimeTypes],
      });

      if (pickerResult.canceled) {
        return;
      }

      setIsImporting(true);
      const result = await importTimetableAssets(
        database,
        pickerResult.assets,
      );
      await refreshDatabaseSummary();

      if (
        !hadUsableTimetable &&
        result.imported.some((document) => document.status === 'ready')
      ) {
        navigation.replace('Home');
        return;
      }

      setImportResult(result);
    } catch (error: unknown) {
      setScreenError(
        error instanceof Error
          ? error.message
          : 'The selected files could not be saved.',
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Import timetable files</Text>
      <Text style={styles.description}>
        Select one or several XLSX files, CSV files or timetable images from
        your device.
      </Text>

      <View style={styles.formats}>
        {supportedFormatLabels.map((format) => (
          <View key={format} style={styles.formatBadge}>
            <Text style={styles.formatLabel}>{format}</Text>
          </View>
        ))}
      </View>

      <PhaseNotice description="XLSX and CSV files are processed after they are saved. Images are stored safely, but image text extraction requires a later phase." />

      <AppButton
        disabled={isImporting}
        icon="documents-outline"
        label={isImporting ? 'Saving and processing…' : 'Select timetable files'}
        onPress={() => {
          void selectTimetableFiles();
        }}
      />

      {isImporting ? (
        <View style={styles.progress}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.progressText}>
            Saving files and reading timetable rows…
          </Text>
        </View>
      ) : null}

      {screenError ? (
        <View style={styles.errorCard}>
          <Text style={styles.error}>{screenError}</Text>
        </View>
      ) : null}

      {importResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Import finished</Text>
          <Text style={styles.resultLine}>
            Saved: {importResult.imported.length}
          </Text>
          <Text style={styles.resultLine}>
            Processed:{' '}
            {
              importResult.imported.filter(
                (document) => document.status === 'ready',
              ).length
            }
          </Text>
          <Text style={styles.resultLine}>
            Images waiting for text extraction:{' '}
            {importResult.deferredImages.length}
          </Text>
          <Text style={styles.resultLine}>
            Already imported: {importResult.duplicates.length}
          </Text>
          <Text style={styles.resultLine}>
            Unsupported: {importResult.unsupported.length}
          </Text>
          <Text style={styles.resultLine}>
            File failures: {importResult.failures.length}
          </Text>
          <Text style={styles.resultLine}>
            Processing failures: {importResult.processingFailures.length}
          </Text>

          {importResult.failures.map((failure, index) => (
            <Text key={`${failure.name}-${index}`} style={styles.error}>
              {failure.name}: {failure.message}
            </Text>
          ))}
          {importResult.processingFailures.map((failure, index) => (
            <Text
              key={`processing-${failure.name}-${index}`}
              style={styles.error}
            >
              {failure.name}: {failure.message}
            </Text>
          ))}

          {importResult.imported.length > 0 ? (
            <AppButton
              icon="home-outline"
              label="Continue to Home"
              onPress={() => navigation.replace('Home')}
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  formats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  formatBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  formatLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  progressText: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  resultLine: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
});
