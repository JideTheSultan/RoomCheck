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
import { listTimetableTimeSlots } from '../database';
import type { RootStackParamList } from '../navigation/navigationTypes';
import type {
  TimetableDay,
  TimetableTimeSlot,
} from '../types';
import {
  formatTimeRange,
  getCurrentSchedulePeriod,
  timetableWeekdays,
} from '../utils/timetableDateTime';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FindFreeClassroom'>;

export function FindFreeClassroomScreen({ navigation }: Props) {
  const database = useSQLiteContext();
  const currentDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<TimetableDay>(
    currentDay >= 1 && currentDay <= 5 ? (currentDay as TimetableDay) : 1,
  );
  const [selectedSlot, setSelectedSlot] =
    useState<TimetableTimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimetableTimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTimeSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const slots = await listTimetableTimeSlots(database);
      setTimeSlots(slots);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The timetable time slots could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  useFocusEffect(
    useCallback(() => {
      void loadTimeSlots();
    }, [loadTimeSlots]),
  );

  const availableSlots = useMemo(
    () => {
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
    },
    [selectedDay, timeSlots],
  );
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

  const checkNow = () => {
    const period = getCurrentSchedulePeriod();

    navigation.navigate('SearchResults', {
      ...period,
      kind: 'free-classrooms',
      searchMode: 'now',
      title: 'Free classrooms',
    });
  };

  const checkSelectedTime = () => {
    if (!effectiveSelectedSlot) {
      return;
    }

    navigation.navigate('SearchResults', {
      dayOfWeek: effectiveSelectedSlot.dayOfWeek,
      endMinutes: effectiveSelectedSlot.endMinutes,
      kind: 'free-classrooms',
      searchMode: 'selected',
      startMinutes: effectiveSelectedSlot.startMinutes,
      title: 'Free classrooms',
    });
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Find a scheduled free classroom</Text>
      <Text style={styles.description}>
        Check which classrooms are scheduled to remain free for the next hour,
        or choose a weekday and timetable period.
      </Text>

      <View style={styles.nowCard}>
        <View style={styles.nowCopy}>
          <Text style={styles.cardTitle}>Need a room now?</Text>
          <Text style={styles.cardDescription}>
            Checks the current time through the next 60 minutes.
          </Text>
        </View>
        <AppButton icon="time-outline" label="Check now" onPress={checkNow} />
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

        {isLoading ? (
          <View style={styles.inlineState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading timetable periods…</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton
              label="Try again"
              onPress={() => {
                void loadTimeSlots();
              }}
              variant="secondary"
            />
          </View>
        ) : null}

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
        disabled={!effectiveSelectedSlot || isLoading || Boolean(error)}
        icon="search-outline"
        label="Find free classrooms"
        onPress={checkSelectedTime}
      />

      <Text style={styles.disclaimer}>
        Results use the imported timetable. They do not detect whether someone
        is physically inside a room.
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
  formSection: {
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.label,
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
