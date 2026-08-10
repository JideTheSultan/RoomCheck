import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';

import {
  AppButton,
  DatabaseSummaryCard,
  ImportedDocumentCard,
  Screen,
} from '../components/ui';
import { importPickerMimeTypes } from '../constants/importFormats';
import { processSpreadsheetDocument } from '../features/import/services/spreadsheetProcessingService';
import {
  clearImportedDocuments,
  removeImportedDocument,
  replaceImportedDocument,
} from '../features/import/services/timetableImportService';
import { useImportedDocuments } from '../hooks/useImportedDocuments';
import { useRefreshDatabaseSummary } from '../hooks/useRefreshDatabaseSummary';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { useAppStore } from '../store/useAppStore';
import type { ImportedDocument } from '../types';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageDocuments'>;

export function ManageDocumentsScreen({ navigation }: Props) {
  const refreshDatabaseSummary = useRefreshDatabaseSummary();
  const {
    database,
    documents,
    error,
    isLoading,
    refreshDocuments,
  } = useImportedDocuments();
  const [removingDocumentId, setRemovingDocumentId] = useState<string | null>(
    null,
  );
  const [processingDocumentId, setProcessingDocumentId] = useState<
    string | null
  >(null);
  const [replacingDocumentId, setReplacingDocumentId] = useState<
    string | null
  >(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const classroomCount = useAppStore((state) => state.classroomCount);
  const importedDocumentCount = useAppStore(
    (state) => state.importedDocumentCount,
  );
  const timetableEntryCount = useAppStore(
    (state) => state.timetableEntryCount,
  );
  const hasActiveDocumentOperation = Boolean(
    removingDocumentId || processingDocumentId || replacingDocumentId,
  );
  const actionsDisabled = isClearingAll || hasActiveDocumentOperation;

  const refreshScreenData = async () => {
    await Promise.all([
      refreshDocuments(),
      refreshDatabaseSummary(),
    ]);
  };

  const confirmRemoval = (document: ImportedDocument) => {
    Alert.alert(
      'Remove timetable document?',
      `${document.name} and its ${document.entryCount} timetable entries will be removed. Other imported documents will not be affected.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Remove',
          onPress: () => {
            setRemovingDocumentId(document.id);

            void removeImportedDocument(database, document)
              .then(async ({ fileCleanupFailed }) => {
                await refreshScreenData();

                if (fileCleanupFailed) {
                  Alert.alert(
                    'Document removed',
                    'The timetable data was removed, but its stored file could not be cleaned up.',
                  );
                }
              })
              .catch((caughtError: unknown) => {
                Alert.alert(
                  'Could not remove document',
                  caughtError instanceof Error
                    ? caughtError.message
                    : 'Please try again.',
                );
              })
              .finally(() => {
                setRemovingDocumentId(null);
              });
          },
        },
      ],
    );
  };

  const processDocument = (document: ImportedDocument) => {
    setProcessingDocumentId(document.id);

    void processSpreadsheetDocument(database, document)
      .then(async (processedDocument) => {
        await refreshScreenData();

        if (processedDocument.status === 'failed') {
          Alert.alert(
            'Processing failed',
            processedDocument.errorMessage ??
              'The timetable rows were not recognised.',
          );
        }
      })
      .catch((caughtError: unknown) => {
        Alert.alert(
          'Could not process document',
          caughtError instanceof Error
            ? caughtError.message
            : 'Please try again.',
        );
      })
      .finally(() => {
        setProcessingDocumentId(null);
      });
  };

  const selectReplacement = async (document: ImportedDocument) => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [...importPickerMimeTypes],
      });

      if (pickerResult.canceled) {
        return;
      }

      const replacementAsset = pickerResult.assets[0];

      if (!replacementAsset) {
        return;
      }

      setReplacingDocumentId(document.id);
      const result = await replaceImportedDocument(
        database,
        document,
        replacementAsset,
      );
      await refreshScreenData();

      if (result.status === 'replaced') {
        Alert.alert(
          'Document replaced',
          `${document.name} was replaced with ${result.document.name}.${
            result.fileCleanupFailed
              ? ' The old stored file could not be cleaned up.'
              : ''
          }`,
        );
        return;
      }

      Alert.alert(
        result.status === 'duplicate'
          ? 'File already imported'
          : result.status === 'unsupported'
            ? 'Unsupported replacement'
            : 'Replacement failed',
        result.status === 'failed'
          ? `${result.message}\n\nThe original document was kept.`
          : result.message,
      );
    } catch (caughtError: unknown) {
      Alert.alert(
        'Could not replace document',
        `${
          caughtError instanceof Error
            ? caughtError.message
            : 'Please try again.'
        }\n\nThe original document was kept.`,
      );
    } finally {
      setReplacingDocumentId(null);
    }
  };

  const confirmReplacement = (document: ImportedDocument) => {
    Alert.alert(
      'Replace timetable document?',
      'Choose a new timetable file. The current document and its timetable entries will be kept until a spreadsheet replacement is processed successfully. Timetable images cannot replace processed spreadsheet data yet.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          text: 'Choose file',
          onPress: () => {
            void selectReplacement(document);
          },
        },
      ],
    );
  };

  const confirmClearAll = () => {
    Alert.alert(
      'Clear all timetable documents?',
      `This will remove ${documents.length} documents and all timetable entries created from them. This cannot be undone.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Clear all',
          onPress: () => {
            setIsClearingAll(true);

            void clearImportedDocuments(database, documents)
              .then(async (result) => {
                await refreshScreenData();
                Alert.alert(
                  'All documents removed',
                  result.fileCleanupFailureCount > 0
                    ? `${result.removedCount} document records were removed. ${result.fileCleanupFailureCount} stored files could not be cleaned up.`
                    : `${result.removedCount} documents and their timetable entries were removed.`,
                );
              })
              .catch((caughtError: unknown) => {
                Alert.alert(
                  'Could not clear documents',
                  caughtError instanceof Error
                    ? caughtError.message
                    : 'Please try again.',
                );
              })
              .finally(() => {
                setIsClearingAll(false);
              });
          },
        },
      ],
    );
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Timetable documents</Text>
      <Text style={styles.description}>
        Add, replace or remove XLSX, CSV and timetable image files stored in
        RoomCheck.
      </Text>

      <DatabaseSummaryCard
        summary={{
          classroomCount,
          importedDocumentCount,
          timetableEntryCount,
        }}
      />

      <AppButton
        disabled={actionsDisabled}
        icon="add-circle-outline"
        label="Add documents"
        onPress={() => navigation.navigate('ImportTimetables')}
      />

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Imported files</Text>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading documents…</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton
              label="Try again"
              onPress={() => {
                void refreshDocuments();
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        {!isLoading && !error && documents.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.stateText}>
              Select Add documents to save your first timetable file.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error
          ? documents.map((document) => (
              <ImportedDocumentCard
                disabled={actionsDisabled}
                document={document}
                isProcessing={processingDocumentId === document.id}
                isRemoving={removingDocumentId === document.id}
                isReplacing={replacingDocumentId === document.id}
                key={document.id}
                onProcess={() => processDocument(document)}
                onRemove={() => confirmRemoval(document)}
                onReplace={() => confirmReplacement(document)}
              />
            ))
          : null}
      </View>

      {!isLoading && !error && documents.length > 0 ? (
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Clear all timetable data</Text>
          <Text style={styles.dangerDescription}>
            Removes every imported document and all timetable entries created
            from them.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={actionsDisabled}
            onPress={confirmClearAll}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && !actionsDisabled && styles.clearButtonPressed,
              actionsDisabled && styles.clearButtonDisabled,
            ]}
          >
            {isClearingAll ? (
              <ActivityIndicator color={colors.white} />
            ) : null}
            <Text style={styles.clearButtonText}>
              {isClearingAll ? 'Clearing documents…' : 'Clear all documents'}
            </Text>
          </Pressable>
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
  listSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  stateText: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  dangerSection: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  dangerTitle: {
    color: colors.danger,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  dangerDescription: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  clearButtonPressed: {
    opacity: 0.82,
  },
  clearButtonDisabled: {
    opacity: 0.45,
  },
  clearButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
