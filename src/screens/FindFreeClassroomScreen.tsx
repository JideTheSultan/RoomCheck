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

export function FindFreeClassroomScreen() {
  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>Find a scheduled free classroom</Text>
      <Text style={styles.description}>
        You will be able to check the current time or choose a future date,
        starting time and duration.
      </Text>

      <PhaseNotice description="The availability form and timetable query will be enabled after document importing and local storage are complete." />

      <AppButton disabled icon="time-outline" label="Check now" />
      <AppButton
        disabled
        icon="calendar-outline"
        label="Choose date and time"
        variant="secondary"
      />
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
