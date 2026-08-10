import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
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
import {
  findClassGroupSchedule,
  findFreeClassrooms,
} from '../database';
import type {
  ClassGroupSearchParams,
  FreeClassroomSearchParams,
  RootStackParamList,
} from '../navigation/navigationTypes';
import type {
  ClassGroupScheduleEntry,
  FreeClassroom,
} from '../types';
import {
  formatTimeRange,
  getDayLabel,
} from '../utils/timetableDateTime';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchResults'>;

function formatLevel(level: string) {
  return /^\d+$/.test(level) ? `${level} Level` : level;
}

function NowNotice() {
  return (
    <View style={styles.notice}>
      <Ionicons color={colors.primary} name="time-outline" size={20} />
      <Text style={styles.noticeText}>
        Checking the current time through the next 60 minutes.
      </Text>
    </View>
  );
}

function FreeClassroomResults({
  params,
}: {
  params: FreeClassroomSearchParams;
}) {
  const database = useSQLiteContext();
  const {
    dayOfWeek,
    endMinutes,
    searchMode,
    startMinutes,
  } = params;
  const [classrooms, setClassrooms] = useState<FreeClassroom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await findFreeClassrooms(database, {
        dayOfWeek,
        endMinutes,
        startMinutes,
      });
      setClassrooms(results);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Free classrooms could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [database, dayOfWeek, endMinutes, startMinutes]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>{params.title}</Text>
      <Text style={styles.description}>
        {getDayLabel(dayOfWeek)} · {formatTimeRange(startMinutes, endMinutes)}
      </Text>

      {searchMode === 'now' ? <NowNotice /> : null}

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Checking classroom schedules…</Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not load results</Text>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton
            label="Try again"
            onPress={() => {
              void loadResults();
            }}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{classrooms.length}</Text>
          <Text style={styles.summaryLabel}>
            {classrooms.length === 1
              ? 'classroom is scheduled free'
              : 'classrooms are scheduled free'}
          </Text>
        </View>
      ) : null}

      {!isLoading && !error && classrooms.length === 0 ? (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              color={colors.textMuted}
              name="business-outline"
              size={25}
            />
          </View>
          <Text style={styles.emptyTitle}>No free classrooms found</Text>
          <Text style={styles.stateText}>
            Every known classroom has a timetable entry that overlaps this
            period.
          </Text>
        </View>
      ) : null}

      {!isLoading && !error && classrooms.length > 0 ? (
        <View style={styles.results}>
          {classrooms.map((classroom) => (
            <View key={classroom.id} style={styles.roomCard}>
              <View style={styles.roomIcon}>
                <Ionicons
                  color={colors.success}
                  name="business-outline"
                  size={22}
                />
              </View>
              <View style={styles.roomCopy}>
                <Text style={styles.roomName}>{classroom.name}</Text>
                <Text style={styles.roomStatus}>
                  Scheduled free for this full period
                </Text>
              </View>
              <Ionicons
                color={colors.success}
                name="checkmark-circle"
                size={22}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        Scheduled free does not guarantee that a room is physically empty.
      </Text>
    </Screen>
  );
}

function ClassGroupResults({ params }: { params: ClassGroupSearchParams }) {
  const database = useSQLiteContext();
  const {
    dayOfWeek,
    endMinutes,
    normalizedDepartment,
    normalizedLevel,
    searchMode,
    startMinutes,
  } = params;
  const [classes, setClasses] = useState<ClassGroupScheduleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await findClassGroupSchedule(database, {
        dayOfWeek,
        endMinutes,
        normalizedDepartment,
        normalizedLevel,
        startMinutes,
      });
      setClasses(results);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The class-group schedule could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    database,
    dayOfWeek,
    endMinutes,
    normalizedDepartment,
    normalizedLevel,
    startMinutes,
  ]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>{params.title}</Text>
      <View style={styles.groupBanner}>
        <View style={styles.groupIcon}>
          <Ionicons color={colors.primary} name="people" size={23} />
        </View>
        <View style={styles.groupCopy}>
          <Text style={styles.groupDepartment}>{params.department}</Text>
          <Text style={styles.groupLevel}>{formatLevel(params.level)}</Text>
        </View>
      </View>
      <Text style={styles.description}>
        {getDayLabel(dayOfWeek)} · {formatTimeRange(startMinutes, endMinutes)}
      </Text>

      {searchMode === 'now' ? <NowNotice /> : null}

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Checking the class schedule…</Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not load the schedule</Text>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton
            label="Try again"
            onPress={() => {
              void loadResults();
            }}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && !error && classes.length === 0 ? (
        <View style={styles.freeGroupCard}>
          <View style={styles.freeGroupIcon}>
            <Ionicons
              color={colors.success}
              name="checkmark-circle"
              size={30}
            />
          </View>
          <Text style={styles.freeGroupTitle}>No scheduled class</Text>
          <Text style={styles.freeGroupText}>
            {params.department} {formatLevel(params.level)} is free during this
            period according to the imported timetable.
          </Text>
        </View>
      ) : null}

      {!isLoading && !error && classes.length > 0 ? (
        <>
          <View style={styles.classSummaryCard}>
            <Ionicons color={colors.primary} name="school" size={25} />
            <Text style={styles.classSummaryText}>
              {classes.length === 1
                ? 'A scheduled class overlaps this period.'
                : `${classes.length} scheduled classes overlap this period.`}
            </Text>
          </View>
          <View style={styles.results}>
            {classes.map((classEntry) => (
              <View key={classEntry.id} style={styles.classCard}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCode}>
                      {classEntry.courseCode}
                    </Text>
                  </View>
                  <Ionicons
                    color={colors.primary}
                    name="book-outline"
                    size={22}
                  />
                </View>
                {classEntry.courseTitle ? (
                  <Text style={styles.courseTitle}>
                    {classEntry.courseTitle}
                  </Text>
                ) : null}
                <View style={styles.classDetailRow}>
                  <Ionicons
                    color={colors.textMuted}
                    name="location-outline"
                    size={19}
                  />
                  <Text style={styles.classDetailText}>
                    {classEntry.classroomName}
                  </Text>
                </View>
                <View style={styles.classDetailRow}>
                  <Ionicons
                    color={colors.textMuted}
                    name="time-outline"
                    size={19}
                  />
                  <Text style={styles.classDetailText}>
                    {formatTimeRange(
                      classEntry.startMinutes,
                      classEntry.endMinutes,
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.disclaimer}>
        “Free” means no class is listed in the imported timetable for this
        period.
      </Text>
    </Screen>
  );
}

export function SearchResultsScreen({ route }: Props) {
  if (route.params.kind === 'class-group') {
    return <ClassGroupResults params={route.params} />;
  }

  return <FreeClassroomResults params={route.params} />;
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
  },
  notice: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.primary,
    flex: 1,
    fontSize: typography.label,
    lineHeight: 20,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
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
  errorTitle: {
    color: colors.danger,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  summaryCard: {
    alignItems: 'baseline',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  summaryValue: {
    color: colors.success,
    fontSize: typography.display,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.success,
    flex: 1,
    fontSize: typography.label,
    fontWeight: '700',
  },
  results: {
    gap: spacing.md,
  },
  roomCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  roomIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  roomCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  roomName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  roomStatus: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  groupBanner: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  groupIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  groupCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  groupDepartment: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  groupLevel: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: '600',
  },
  freeGroupCard: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  freeGroupIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  freeGroupTitle: {
    color: colors.success,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  freeGroupText: {
    color: colors.success,
    fontSize: typography.label,
    lineHeight: 21,
    textAlign: 'center',
  },
  classSummaryCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  classSummaryText: {
    color: colors.primary,
    flex: 1,
    fontSize: typography.label,
    fontWeight: '700',
    lineHeight: 20,
  },
  classCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  courseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courseCodeBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  courseCode: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: '800',
  },
  courseTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  classDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  classDetailText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: typography.label,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
});
