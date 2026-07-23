import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  typography,
} from '../theme';

type DatabaseFailureScreenProps = {
  message: string;
};

export function DatabaseFailureScreen({
  message,
}: DatabaseFailureScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>RoomCheck could not start</Text>
        <Text style={styles.description}>
          The local timetable database could not be opened. Close the app and
          try again.
        </Text>
        <Text selectable style={styles.error}>
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
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
  error: {
    color: colors.warning,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
