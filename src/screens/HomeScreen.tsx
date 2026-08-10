import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import {
  AppButton,
  DatabaseSummaryCard,
  FeatureCard,
} from '../components/ui';
import { useRefreshDatabaseSummary } from '../hooks/useRefreshDatabaseSummary';
import type { RootStackParamList } from '../navigation/navigationTypes';
import { useAppStore } from '../store/useAppStore';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const refreshDatabaseSummary = useRefreshDatabaseSummary();

  const classroomCount = useAppStore((state) => state.classroomCount);
  const databaseSummaryError = useAppStore(
    (state) => state.databaseSummaryError,
  );
  const hasLoadedDatabaseSummary = useAppStore(
    (state) => state.hasLoadedDatabaseSummary,
  );
  const importedDocumentCount = useAppStore(
    (state) => state.importedDocumentCount,
  );
  const isDatabaseSummaryLoading = useAppStore(
    (state) => state.isDatabaseSummaryLoading,
  );
  const timetableEntryCount = useAppStore(
    (state) => state.timetableEntryCount,
  );
  const hasUsableTimetable = timetableEntryCount > 0;

  useEffect(() => {
    if (
      hasLoadedDatabaseSummary &&
      !isDatabaseSummaryLoading &&
      !databaseSummaryError &&
      importedDocumentCount === 0
    ) {
      navigation.replace('ImportTimetables');
    }
  }, [
    databaseSummaryError,
    hasLoadedDatabaseSummary,
    importedDocumentCount,
    isDatabaseSummaryLoading,
    navigation,
  ]);

  if (!hasLoadedDatabaseSummary || isDatabaseSummaryLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <View style={styles.logo}>
            <Ionicons color={colors.white} name="business" size={24} />
          </View>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Checking timetable data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons color={colors.white} name="business" size={24} />
          </View>
          <Text style={styles.brand}>RoomCheck</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.readinessRow}>
            <View
              style={[
                styles.readinessBadge,
                databaseSummaryError
                  ? styles.errorBadge
                  : hasUsableTimetable
                    ? styles.readyBadge
                    : styles.attentionBadge,
              ]}
            >
              <View
                style={[
                  styles.readinessDot,
                  databaseSummaryError
                    ? styles.errorDot
                    : hasUsableTimetable
                      ? styles.readyDot
                      : styles.attentionDot,
                ]}
              />
              <Text
                style={[
                  styles.readinessText,
                  databaseSummaryError
                    ? styles.errorBadgeText
                    : hasUsableTimetable
                      ? styles.readyText
                      : styles.attentionText,
                ]}
              >
                {databaseSummaryError
                  ? 'DATA CHECK FAILED'
                  : hasUsableTimetable
                    ? 'TIMETABLE READY'
                    : 'SETUP NEEDS ATTENTION'}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>Find the right room, at the right time.</Text>
          <Text style={styles.subtitle}>
            Check scheduled classroom availability using your school timetable.
          </Text>
        </View>

        {databaseSummaryError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not check timetable data</Text>
            <Text style={styles.errorDescription}>
              {databaseSummaryError}
            </Text>
            <AppButton
              icon="refresh-outline"
              label="Try again"
              onPress={() => {
                void refreshDatabaseSummary();
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        {!databaseSummaryError && importedDocumentCount > 0 ? (
          <DatabaseSummaryCard
            summary={{
              classroomCount,
              importedDocumentCount,
              timetableEntryCount,
            }}
          />
        ) : null}

        {!databaseSummaryError &&
        importedDocumentCount > 0 &&
        !hasUsableTimetable ? (
          <View style={styles.setupCard}>
            <View style={styles.setupIcon}>
              <Ionicons
                color={colors.warning}
                name="alert-circle-outline"
                size={26}
              />
            </View>
            <Text style={styles.setupTitle}>No usable timetable data yet</Text>
            <Text style={styles.setupDescription}>
              Your files are saved, but none has produced classroom schedule
              entries. Open document management to retry a failed spreadsheet,
              enter rows from an image or add another timetable file.
            </Text>
            <AppButton
              icon="folder-open-outline"
              label="Manage documents"
              onPress={() => navigation.navigate('ManageDocuments')}
            />
            <AppButton
              icon="add-circle-outline"
              label="Add timetable files"
              onPress={() => navigation.navigate('ImportTimetables')}
              variant="secondary"
            />
          </View>
        ) : null}

        {!databaseSummaryError && hasUsableTimetable ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What do you want to check?</Text>
            <FeatureCard
              description="See classrooms scheduled to be free now or later."
              icon="search-outline"
              onPress={() => navigation.navigate('FindFreeClassroom')}
              title="Find a free classroom"
            />
            <FeatureCard
              description="Check whether a department and level has a class."
              icon="people-outline"
              onPress={() => navigation.navigate('CheckDepartmentLevel')}
              title="Check department and level"
            />
            <FeatureCard
              description="Add or remove imported timetable files."
              icon="folder-open-outline"
              onPress={() => navigation.navigate('ManageDocuments')}
              title="Manage timetable documents"
            />
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          RoomCheck reports scheduled availability. It does not detect physical
          occupancy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  brand: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
    marginTop: spacing.xxl,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  readinessRow: {
    alignItems: 'flex-start',
  },
  readinessBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readyBadge: {
    backgroundColor: colors.successSoft,
  },
  attentionBadge: {
    backgroundColor: colors.warningSoft,
  },
  errorBadge: {
    backgroundColor: colors.dangerSoft,
  },
  readinessDot: {
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  readyDot: {
    backgroundColor: colors.success,
  },
  attentionDot: {
    backgroundColor: colors.warning,
  },
  errorDot: {
    backgroundColor: colors.danger,
  },
  readinessText: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  readyText: {
    color: colors.success,
  },
  attentionText: {
    color: colors.warning,
  },
  errorBadgeText: {
    color: colors.danger,
  },
  title: {
    color: colors.text,
    fontSize: typography.display,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  setupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  setupIcon: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  setupTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  setupDescription: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 21,
  },
  section: {
    gap: spacing.md,
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
  errorDescription: {
    color: colors.danger,
    fontSize: typography.label,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 'auto',
    paddingTop: spacing.xl,
    textAlign: 'center',
  },
});
