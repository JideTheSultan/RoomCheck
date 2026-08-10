import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  AppButton,
  Screen,
} from '../components/ui';
import {
  listClassGroupOptions,
  listTimetableTimeSlots,
} from '../database';
import type { RootStackParamList } from '../navigation/navigationTypes';
import type {
  ClassGroupOption,
  TimetableDay,
  TimetableTimeSlot,
} from '../types';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';
import {
  formatTimeRange,
  getCurrentSchedulePeriod,
  timetableWeekdays,
} from '../utils/timetableDateTime';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CheckDepartmentLevel'
>;

function formatLevel(level: string) {
  return /^\d+$/.test(level) ? `${level} Level` : level;
}

export function CheckDepartmentLevelScreen({ navigation }: Props) {
  const database = useSQLiteContext();
  const currentDay = new Date().getDay();
  const [classGroups, setClassGroups] = useState<ClassGroupOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimetableTimeSlot[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<TimetableDay>(
    currentDay >= 1 && currentDay <= 5 ? (currentDay as TimetableDay) : 1,
  );
  const [selectedSlot, setSelectedSlot] =
    useState<TimetableTimeSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSearchOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [groups, slots] = await Promise.all([
        listClassGroupOptions(database),
        listTimetableTimeSlots(database),
      ]);
      setClassGroups(groups);
      setTimeSlots(slots);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Department and level options could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  useFocusEffect(
    useCallback(() => {
      void loadSearchOptions();
    }, [loadSearchOptions]),
  );

  const effectiveDepartment = useMemo(
    () =>
      classGroups.find(
        (group) => group.normalizedDepartment === selectedDepartment,
      ) ??
      classGroups[0] ??
      null,
    [classGroups, selectedDepartment],
  );
  const effectiveLevel = useMemo(
    () =>
      effectiveDepartment?.levels.find(
        (level) => level.normalizedLevel === selectedLevel,
      ) ??
      effectiveDepartment?.levels[0] ??
      null,
    [effectiveDepartment, selectedLevel],
  );
  const availableSlots = useMemo(() => {
    const uniqueSlots = new Map<string, TimetableTimeSlot>();

    timeSlots.forEach((slot) => {
      const key = `${slot.startMinutes}-${slot.endMinutes}`;

      if (!uniqueSlots.has(key)) {
        uniqueSlots.set(key, {
          ...slot,
          dayOfWeek: selectedDay,
        });
      }
    });

    return [...uniqueSlots.values()].sort(
      (left, right) =>
        left.startMinutes - right.startMinutes ||
        left.endMinutes - right.endMinutes,
    );
  }, [selectedDay, timeSlots]);
  const selectedSlotIsAvailable =
    selectedSlot?.dayOfWeek === selectedDay &&
    availableSlots.some(
      (slot) =>
        slot.startMinutes === selectedSlot.startMinutes &&
        slot.endMinutes === selectedSlot.endMinutes,
    );
  const effectiveSelectedSlot = selectedSlotIsAvailable
    ? selectedSlot
    : (availableSlots[0] ?? null);
  const canSearch = Boolean(effectiveDepartment && effectiveLevel);

  const openResults = (
    period: {
      dayOfWeek: RootStackParamList['SearchResults']['dayOfWeek'];
      endMinutes: number;
      startMinutes: number;
    },
    searchMode: 'now' | 'selected',
  ) => {
    if (!effectiveDepartment || !effectiveLevel) {
      return;
    }

    navigation.navigate('SearchResults', {
      ...period,
      department: effectiveDepartment.department,
      kind: 'class-group',
      level: effectiveLevel.level,
      normalizedDepartment: effectiveDepartment.normalizedDepartment,
      normalizedLevel: effectiveLevel.normalizedLevel,
      searchMode,
      title: 'Class group schedule',
    });
  };

  const checkNow = () => {
    openResults(getCurrentSchedulePeriod(), 'now');
  };

  const checkSelectedTime = () => {
    if (!effectiveSelectedSlot) {
      return;
    }

    openResults(
      {
        dayOfWeek: effectiveSelectedSlot.dayOfWeek,
        endMinutes: effectiveSelectedSlot.endMinutes,
        startMinutes: effectiveSelectedSlot.startMinutes,
      },
      'selected',
    );
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Check a department and level</Text>
      <Text style={styles.description}>
        Select a class group, then check whether it has a scheduled course now
        or during a chosen timetable period.
      </Text>

      {isLoading ? (
        <View style={styles.inlineState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Loading class groups…</Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton
            label="Try again"
            onPress={() => {
              void loadSearchOptions();
            }}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && !error && classGroups.length === 0 ? (
        <View style={styles.inlineState}>
          <Text style={styles.stateText}>
            No departments or levels were found in the imported timetable.
          </Text>
        </View>
      ) : null}

      {!isLoading && !error && effectiveDepartment ? (
        <>
          <View style={styles.formSection}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.departmentList}>
              {classGroups.map((group) => {
                const isSelected =
                  group.normalizedDepartment ===
                  effectiveDepartment.normalizedDepartment;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={group.normalizedDepartment}
                    onPress={() => {
                      setSelectedDepartment(group.normalizedDepartment);
                      setSelectedLevel(null);
                    }}
                    style={({ pressed }) => [
                      styles.departmentOption,
                      isSelected && styles.departmentOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.departmentText,
                        isSelected && styles.departmentTextSelected,
                      ]}
                    >
                      {group.department}
                    </Text>
                    <Ionicons
                      color={isSelected ? colors.primary : colors.textMuted}
                      name={
                        isSelected
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={21}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Level / year</Text>
            <View style={styles.levelRow}>
              {effectiveDepartment.levels.map((level) => {
                const isSelected =
                  level.normalizedLevel === effectiveLevel?.normalizedLevel;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={level.normalizedLevel}
                    onPress={() => setSelectedLevel(level.normalizedLevel)}
                    style={({ pressed }) => [
                      styles.levelChip,
                      isSelected && styles.levelChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        isSelected && styles.levelTextSelected,
                      ]}
                    >
                      {formatLevel(level.level)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.nowCard}>
        <View style={styles.nowCopy}>
          <Text style={styles.cardTitle}>Check this group now</Text>
          <Text style={styles.cardDescription}>
            Checks whether the selected group has a class during the next 60
            minutes.
          </Text>
        </View>
        <AppButton
          disabled={!canSearch || isLoading || Boolean(error)}
          icon="time-outline"
          label="Check now"
          onPress={checkNow}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR CHOOSE A TIME</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Weekday</Text>
        <View style={styles.dayRow}>
          {timetableWeekdays.map((weekday) => {
            const isSelected = selectedDay === weekday.day;

            return (
              <Pressable
                accessibilityRole="button"
                key={weekday.day}
                onPress={() => {
                  setSelectedDay(weekday.day);
                  setSelectedSlot(null);
                }}
                style={({ pressed }) => [
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                  ]}
                >
                  {weekday.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Timetable period</Text>
        {!isLoading && !error && availableSlots.length === 0 ? (
          <View style={styles.inlineState}>
            <Text style={styles.stateText}>
              No timetable periods were found in the imported data.
            </Text>
          </View>
        ) : null}
        {!isLoading && !error && availableSlots.length > 0 ? (
          <View style={styles.slotGrid}>
            {availableSlots.map((slot) => {
              const isSelected =
                effectiveSelectedSlot?.startMinutes === slot.startMinutes &&
                effectiveSelectedSlot.endMinutes === slot.endMinutes;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={`${slot.startMinutes}-${slot.endMinutes}`}
                  onPress={() => setSelectedSlot(slot)}
                  style={({ pressed }) => [
                    styles.slotChip,
                    isSelected && styles.slotChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotChipText,
                      isSelected && styles.slotChipTextSelected,
                    ]}
                  >
                    {formatTimeRange(slot.startMinutes, slot.endMinutes)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <AppButton
        disabled={
          !canSearch ||
          !effectiveSelectedSlot ||
          isLoading ||
          Boolean(error)
        }
        icon="search-outline"
        label="Check class group"
        onPress={checkSelectedTime}
      />

      <Text style={styles.disclaimer}>
        Results use the imported timetable and the full selected period.
      </Text>
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
  formSection: {
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
  },
  departmentList: {
    gap: spacing.sm,
  },
  departmentOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  departmentOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  departmentText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.label,
    fontWeight: '600',
  },
  departmentTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  levelChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  levelChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  levelTextSelected: {
    color: colors.white,
  },
  nowCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  nowCopy: {
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 20,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  divider: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  dayChipTextSelected: {
    color: colors.white,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  slotChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  slotChipText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  slotChipTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  inlineState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  stateText: {
    color: colors.textMuted,
    flex: 1,
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
    padding: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
});
