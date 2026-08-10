import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import {
  File,
  Paths,
} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';

import {
  AppButton,
  DatabaseSummaryCard,
  Screen,
} from '../components/ui';
import {
  createRoomCheckBackup,
  parseRoomCheckBackup,
  restoreRoomCheckBackup,
  serializeRoomCheckBackup,
  type RoomCheckBackup,
} from '../features/backup/services/roomCheckBackupService';
import { useRefreshDatabaseSummary } from '../hooks/useRefreshDatabaseSummary';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { useAppStore } from '../store/useAppStore';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DataBackup'>;

const maxBackupFileSize = 20 * 1024 * 1024;

function createBackupFileName(createdAt: string) {
  return `RoomCheck-Backup-${createdAt.slice(0, 19).replace(/[:T]/g, '-')}.json`;
}

function formatBackupDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
}

function removeOldStoredFiles(uris: string[]) {
  let failureCount = 0;

  uris.forEach((uri) => {
    try {
      const file = new File(uri);

      if (file.exists) {
        file.delete();
      }
    } catch {
      failureCount += 1;
    }
  });

  return failureCount;
}

export function DataBackupScreen({ navigation }: Props) {
  const database = useSQLiteContext();
  const refreshDatabaseSummary = useRefreshDatabaseSummary();
  const classroomCount = useAppStore((state) => state.classroomCount);
  const importedDocumentCount = useAppStore(
    (state) => state.importedDocumentCount,
  );
  const timetableEntryCount = useAppStore(
    (state) => state.timetableEntryCount,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isBusy = isExporting || isRestoring;

  const exportBackup = async () => {
    setIsExporting(true);
    setScreenError(null);
    setSuccessMessage(null);

    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('File sharing is not available on this device.');
      }

      const backup = await createRoomCheckBackup(database);
      const backupFile = new File(
        Paths.cache,
        createBackupFileName(backup.createdAt),
      );
      backupFile.create({ intermediates: true, overwrite: true });
      backupFile.write(serializeRoomCheckBackup(backup));

      await Sharing.shareAsync(backupFile.uri, {
        dialogTitle: 'Save RoomCheck backup',
        mimeType: 'application/json',
        UTI: 'public.json',
      });
      setSuccessMessage(
        `Backup prepared with ${backup.summary.documentCount} documents and ${backup.summary.timetableEntryCount} timetable rows.`,
      );
    } catch (caughtError: unknown) {
      setScreenError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The RoomCheck backup could not be created.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const completeRestore = async (backup: RoomCheckBackup) => {
    setIsRestoring(true);
    setScreenError(null);
    setSuccessMessage(null);

    try {
      const result = await restoreRoomCheckBackup(database, backup);
      const cleanupFailureCount = removeOldStoredFiles(
        result.previousStoredUris,
      );
      await refreshDatabaseSummary();

      Alert.alert(
        'Backup restored',
        `${result.documentCount} documents and ${result.timetableEntryCount} timetable rows are ready.${
          cleanupFailureCount > 0
            ? ` ${cleanupFailureCount} old stored files could not be cleaned up.`
            : ''
        }`,
        [
          {
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
            text: 'Continue',
          },
        ],
      );
    } catch (caughtError: unknown) {
      setScreenError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The RoomCheck backup could not be restored.',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const chooseBackup = async () => {
    setScreenError(null);
    setSuccessMessage(null);

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/json', 'text/json', 'text/plain'],
      });

      if (pickerResult.canceled) {
        return;
      }

      const asset = pickerResult.assets[0];

      if (!asset) {
        throw new Error('No backup file was selected.');
      }

      if (asset.size && asset.size > maxBackupFileSize) {
        throw new Error('The selected backup is larger than 20 MB.');
      }

      const backup = parseRoomCheckBackup(await new File(asset.uri).text());

      Alert.alert(
        'Replace current RoomCheck data?',
        `Backup created ${formatBackupDate(backup.createdAt)}\n\n${backup.summary.documentCount} documents\n${backup.summary.classroomCount} classrooms\n${backup.summary.timetableEntryCount} timetable rows\n\nRestoring will permanently replace the data currently in RoomCheck.`,
        [
          { style: 'cancel', text: 'Cancel' },
          {
            style: 'destructive',
            text: 'Restore backup',
            onPress: () => {
              void completeRestore(backup);
            },
          },
        ],
      );
    } catch (caughtError: unknown) {
      setScreenError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The selected backup could not be read.',
      );
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Backup and restore</Text>
        <Text style={styles.description}>
          Save a copy of RoomCheck&apos;s structured timetable data or restore a
          backup on this device.
        </Text>
      </View>

      <DatabaseSummaryCard
        summary={{
          classroomCount,
          importedDocumentCount,
          timetableEntryCount,
        }}
      />

      <View style={styles.infoCard}>
        <Ionicons color={colors.primary} name="shield-checkmark" size={24} />
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle}>What the backup includes</Text>
          <Text style={styles.infoText}>
            Documents, classrooms, departments, levels, courses, weekdays and
            class times are included. The original XLSX, CSV and image files
            are not included.
          </Text>
        </View>
      </View>

      {screenError ? (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <Text style={styles.errorText}>{screenError}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View accessibilityRole="summary" style={styles.successCard}>
          <Ionicons
            color={colors.success}
            name="checkmark-circle"
            size={21}
          />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <View style={styles.actionCard}>
        <View style={styles.actionHeading}>
          <View style={styles.actionIcon}>
            <Ionicons color={colors.primary} name="share-outline" size={23} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Export a backup</Text>
            <Text style={styles.actionDescription}>
              Creates a versioned JSON file that you can save or send to
              another device.
            </Text>
          </View>
        </View>
        <AppButton
          disabled={isBusy}
          icon="download-outline"
          label={isExporting ? 'Preparing backup…' : 'Export RoomCheck backup'}
          onPress={() => {
            void exportBackup();
          }}
        />
      </View>

      <View style={styles.actionCard}>
        <View style={styles.actionHeading}>
          <View style={styles.warningIcon}>
            <Ionicons color={colors.warning} name="refresh" size={23} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Restore a backup</Text>
            <Text style={styles.actionDescription}>
              Checks the file first, shows its totals, and asks for
              confirmation before replacing current data.
            </Text>
          </View>
        </View>
        <AppButton
          disabled={isBusy}
          icon="cloud-upload-outline"
          label={isRestoring ? 'Restoring backup…' : 'Choose backup file'}
          onPress={() => {
            void chooseBackup();
          }}
          variant="secondary"
        />
        {isRestoring ? (
          <View style={styles.progressRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.progressText}>
              Replacing timetable data safely…
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.disclaimer}>
        Keep backup files private. They contain your school timetable data.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  heading: {
    gap: spacing.sm,
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
  infoCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: '800',
  },
  infoText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  successText: {
    color: colors.success,
    flex: 1,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 19,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  actionHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  warningIcon: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  actionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  actionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  progressText: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
});
