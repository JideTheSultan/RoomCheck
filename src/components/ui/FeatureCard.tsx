import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
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

type FeatureCardProps = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
};

export function FeatureCard({
  description,
  icon,
  onPress,
  title,
}: FeatureCardProps) {
  return (
    <Pressable
      accessibilityHint={description}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons color={colors.primary} name={icon} size={23} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.995 }],
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 20,
  },
});
