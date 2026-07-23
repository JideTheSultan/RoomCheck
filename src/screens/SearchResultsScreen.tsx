import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StyleSheet,
  Text,
} from 'react-native';

import {
  PhaseNotice,
  Screen,
} from '../components/ui';
import type { RootStackParamList } from '../navigation/navigationTypes';
import {
  colors,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchResults'>;

export function SearchResultsScreen({ route }: Props) {
  return (
    <Screen contentContainerStyle={styles.content}>
      <Text style={styles.title}>{route.params.title}</Text>
      <PhaseNotice description="Search results will be displayed here after the timetable query services are implemented." />
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
});
