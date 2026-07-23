import {
  StyleSheet,
  Text,
} from 'react-native';

import {
  AppButton,
  PhaseNotice,
  Screen,
} from '../components/ui';
import {
  colors,
  spacing,
  typography,
} from '../theme';

export function CheckDepartmentLevelScreen() {
  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Check a department and level</Text>
      <Text style={styles.description}>
        Select a department, level and time to see whether that class group has
        a scheduled course and where it is being held.
      </Text>

      <PhaseNotice description="Department, level and time selection will be connected after the timetable data model is ready." />

      <AppButton disabled icon="search-outline" label="Check class group" />
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
});
