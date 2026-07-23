import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  ImportedDocumentCard,
  Screen,
} from '../components/ui';
import { processSpreadsheetDocument } from '../features/import/services/spreadsheetProcessingService';
import { removeImportedDocument } from '../features/import/services/timetableImportService';
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
  const classroomCount = useAppStore((state) => state.classroomCount);
  const importedDocumentCount = useAppStore(
    (state) => state.importedDocumentCount,
  );
  const timetableEntryCount = useAppStore(
    (state) => state.timetableEntryCount,
  );

  const confirmRemoval = (document: ImportedDocument) => {
    Alert.alert(
      'Remove timetable document?',
      `${document.name} will be removed from RoomCheck.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Remove',
          onPress: () => {
            setRemovingDocumentId(document.id);

            void removeImportedDocument(database, document)
              .then(async ({ fileCleanupFailed }) => {
                await Promise.all([
                  refreshDocuments(),
                  refreshDatabaseSummary(),
                ]);

                if (fileCleanupFailed) {
                  Alert.alert(
                    'Document removed',
                    'The document record was removed, but its stored file could not be cleaned up.',
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
        await Promise.all([
          refreshDocuments(),
          refreshDatabaseSummary(),
        ]);

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

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Timetable documents</Text>
      <Text style={styles.description}>
        Add XLSX, CSV and timetable image files, or remove files you no longer
        need.
      </Text>

      <DatabaseSummaryCard
        summary={{
          classroomCount,
          importedDocumentCount,
          timetableEntryCount,
        }}
      />

      <AppButton
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
                document={document}
                isProcessing={processingDocumentId === document.id}
                isRemoving={removingDocumentId === document.id}
                key={document.id}
                onProcess={() => processDocument(document)}
                onRemove={() => confirmRemoval(document)}
              />
            ))
          : null}
      </View>
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
});
