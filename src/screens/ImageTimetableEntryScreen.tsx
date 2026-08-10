import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AppButton,
  Screen,
} from '../components/ui';
import { getImportedDocumentById } from '../database';
import {
  addManualImageTimetableEntry,
  listManualImageTimetableEntries,
  removeManualImageTimetableEntry,
} from '../features/import/services/manualImageTimetableService';
import { useRefreshDatabaseSummary } from '../hooks/useRefreshDatabaseSummary';
import type { RootStackParamList } from '../navigation/navigationTypes';
import type {
  DocumentTimetableEntry,
  TimetableDay,
} from '../types';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';
import {
  formatTimeRange,
  getDayLabel,
  parseTimetableTimeInput,
  timetableWeekdays,
} from '../utils/timetableDateTime';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ImageTimetableEntry'
>;

type FormFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
};

function FormField({
  label,
  optional = false,
  ...props
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <TextInput
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function ImageTimetableEntryScreen({
  navigation,
  route,
}: Props) {
  const database = useSQLiteContext();
  const refreshDatabaseSummary = useRefreshDatabaseSummary();
  const { documentId } = route.params;
  const [entries, setEntries] = useState<DocumentTimetableEntry[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null);
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<TimetableDay>(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const isBusy = isSaving || Boolean(removingEntryId);

  const loadDocumentRows = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [document, timetableEntries] = await Promise.all([
        getImportedDocumentById(database, documentId),
        listManualImageTimetableEntries(database, documentId),
      ]);

      if (!document) {
        throw new Error('The imported timetable image could not be found.');
      }

      setImageUri(document.storedUri);
      setEntries(timetableEntries);
    } catch (caughtError: unknown) {
      setLoadError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The timetable image details could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [database, documentId]);

  useEffect(() => {
    void loadDocumentRows();
  }, [loadDocumentRows]);

  const saveEntry = async () => {
    setFormError(null);

    const startMinutes = parseTimetableTimeInput(startTime);
    const endMinutes = parseTimetableTimeInput(endTime);

    if (startMinutes === null) {
      setFormError('Enter a valid start time, such as 8:30 AM or 14:30.');
      return;
    }

    if (endMinutes === null) {
      setFormError('Enter a valid end time, such as 9:30 AM or 15:30.');
      return;
    }

    setIsSaving(true);

    try {
      await addManualImageTimetableEntry(database, documentId, {
        classroomName,
        courseCode,
        courseTitle,
        dayOfWeek: selectedDay,
        department,
        endMinutes,
        level,
        startMinutes,
      });
      const updatedEntries = await listManualImageTimetableEntries(
        database,
        documentId,
      );
      setEntries(updatedEntries);
      await refreshDatabaseSummary();
      setClassroomName('');
      setCourseCode('');
      setCourseTitle('');
      setStartTime('');
      setEndTime('');
    } catch (caughtError: unknown) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The timetable row could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmEntryRemoval = (entry: DocumentTimetableEntry) => {
    Alert.alert(
      'Remove this timetable row?',
      `${entry.courseCode} in ${entry.classroomName} will be removed from this image.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Remove',
          onPress: () => {
            setRemovingEntryId(entry.id);

            void removeManualImageTimetableEntry(
              database,
              documentId,
              entry.id,
            )
              .then(async () => {
                const updatedEntries =
                  await listManualImageTimetableEntries(database, documentId);
                setEntries(updatedEntries);
                await refreshDatabaseSummary();
              })
              .catch((caughtError: unknown) => {
                Alert.alert(
                  'Could not remove timetable row',
                  caughtError instanceof Error
                    ? caughtError.message
                    : 'Please try again.',
                );
              })
              .finally(() => {
                setRemovingEntryId(null);
              });
          },
        },
      ],
    );
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.title}>Enter timetable rows</Text>
        <Text style={styles.description}>
          Read each class from {route.params.documentName} and save it as one
          timetable row.
        </Text>
      </View>

      <View style={styles.notice}>
        <Ionicons color={colors.warning} name="information-circle" size={22} />
        <Text style={styles.noticeText}>
          Automatic image text extraction is not available in Expo Go. This
          manual option keeps your timetable data on the device.
        </Text>
      </View>

      {imageUri ? (
        <Image
          accessibilityLabel={`Preview of ${route.params.documentName}`}
          resizeMode="contain"
          source={{ uri: imageUri }}
          style={styles.preview}
        />
      ) : null}

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Loading timetable rows…</Text>
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>
          <AppButton
            label="Try again"
            onPress={() => {
              void loadDocumentRows();
            }}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <View style={styles.savedSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>Saved rows</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{entries.length}</Text>
              </View>
            </View>

            {entries.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.emptyTitle}>No rows entered yet</Text>
                <Text style={styles.stateText}>
                  Complete the form below for the first class shown in the
                  timetable image.
                </Text>
              </View>
            ) : null}

            {entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryCopy}>
                  <Text style={styles.entryCourse}>{entry.courseCode}</Text>
                  <Text style={styles.entryDetails}>
                    {entry.department} · {entry.level} · {entry.classroomName}
                  </Text>
                  <Text style={styles.entryDetails}>
                    {getDayLabel(entry.dayOfWeek)} ·{' '}
                    {formatTimeRange(entry.startMinutes, entry.endMinutes)}
                  </Text>
                  {entry.courseTitle ? (
                    <Text style={styles.entryTitle}>{entry.courseTitle}</Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel={`Remove ${entry.courseCode}`}
                  accessibilityRole="button"
                  disabled={isBusy}
                  hitSlop={8}
                  onPress={() => confirmEntryRemoval(entry)}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.pressed,
                    isBusy && styles.disabled,
                  ]}
                >
                  {removingEntryId === entry.id ? (
                    <ActivityIndicator color={colors.danger} size="small" />
                  ) : (
                    <Ionicons
                      color={colors.danger}
                      name="trash-outline"
                      size={19}
                    />
                  )}
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Add one class</Text>
            <Text style={styles.formDescription}>
              Department, level, classroom, course code, weekday and both times
              are required.
            </Text>

            <FormField
              autoCapitalize="words"
              editable={!isBusy}
              label="Department"
              onChangeText={setDepartment}
              placeholder="e.g. ISMS"
              value={department}
            />
            <FormField
              autoCapitalize="words"
              editable={!isBusy}
              label="Level / year"
              onChangeText={setLevel}
              placeholder="e.g. 300"
              value={level}
            />
            <FormField
              autoCapitalize="characters"
              editable={!isBusy}
              label="Classroom"
              onChangeText={setClassroomName}
              placeholder="e.g. Enugu"
              value={classroomName}
            />
            <FormField
              autoCapitalize="characters"
              editable={!isBusy}
              label="Course code"
              onChangeText={setCourseCode}
              placeholder="e.g. ISM 301"
              value={courseCode}
            />
            <FormField
              autoCapitalize="words"
              editable={!isBusy}
              label="Course title"
              onChangeText={setCourseTitle}
              optional
              placeholder="e.g. Systems Analysis"
              value={courseTitle}
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Weekday</Text>
              <View style={styles.dayRow}>
                {timetableWeekdays.map((weekday) => {
                  const isSelected = selectedDay === weekday.day;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      key={weekday.day}
                      onPress={() => setSelectedDay(weekday.day)}
                      style={({ pressed }) => [
                        styles.dayChip,
                        isSelected && styles.dayChipSelected,
                        pressed && styles.pressed,
                        isBusy && styles.disabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {weekday.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <FormField
                  autoCapitalize="characters"
                  editable={!isBusy}
                  label="Start time"
                  onChangeText={setStartTime}
                  placeholder="8:30 AM"
                  value={startTime}
                />
              </View>
              <View style={styles.timeField}>
                <FormField
                  autoCapitalize="characters"
                  editable={!isBusy}
                  label="End time"
                  onChangeText={setEndTime}
                  placeholder="9:30 AM"
                  value={endTime}
                />
              </View>
            </View>

            {formError ? (
              <View accessibilityRole="alert" style={styles.errorCard}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <AppButton
              disabled={isBusy}
              icon="add-circle-outline"
              label={isSaving ? 'Saving timetable row…' : 'Save timetable row'}
              onPress={() => {
                void saveEntry();
              }}
            />
          </View>

          {entries.length > 0 ? (
            <AppButton
              disabled={isBusy}
              icon="checkmark-circle-outline"
              label="Finish and return to documents"
              onPress={() => navigation.goBack()}
              variant="secondary"
            />
          ) : null}
        </>
      ) : null}
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
  notice: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.warning,
    flex: 1,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  preview: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 240,
    width: '100%',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.lg,
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
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  savedSection: {
    gap: spacing.md,
  },
  sectionHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 30,
    paddingHorizontal: spacing.sm,
  },
  countText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
  },
  entryCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  entryCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  entryCourse: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  entryDetails: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  entryTitle: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  formDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
  },
  optional: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayChip: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: colors.white,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
