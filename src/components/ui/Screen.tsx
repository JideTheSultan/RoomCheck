import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme';

type ScreenProps = PropsWithChildren<{
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
}>;

export function Screen({
  children,
  contentContainerStyle,
  scrollable = true,
  scrollViewProps,
}: ScreenProps) {
  if (!scrollable) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={[styles.content, styles.flex, contentContainerStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  flex: {
    flex: 1,
  },
});
