import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
  typography,
} from '../../theme';

type PhaseNoticeProps = {
  description: string;
  title?: string;
};

export function PhaseNotice({
  description,
  title = 'Coming in the next phase',
}: PhaseNoticeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons color={colors.warning} name="construct-outline" size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconContainer: {
    paddingTop: 2,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 20,
  },
});
