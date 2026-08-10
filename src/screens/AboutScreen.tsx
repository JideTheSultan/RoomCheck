import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  Screen,
} from '../components/ui';
import type { RootStackParamList } from '../navigation/navigationTypes';
import {
  colors,
  radius,
  spacing,
  typography,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

type InformationRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  title: string;
};

function InformationRow({ icon, text, title }: InformationRowProps) {
  return (
    <View style={styles.informationRow}>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.primary} name={icon} size={21} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowText}>{text}</Text>
      </View>
    </View>
  );
}

export function AboutScreen({ navigation }: Props) {
  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.brandCard}>
        <View style={styles.logo}>
          <Ionicons color={colors.white} name="business" size={30} />
        </View>
        <Text style={styles.title}>RoomCheck</Text>
        <Text style={styles.version}>Version 1.0.0 · Release candidate</Text>
        <Text style={styles.description}>
          Check scheduled classroom availability using imported university
          timetable data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy and data</Text>
        <InformationRow
          icon="phone-portrait-outline"
          text="Imported documents and timetable rows are stored locally in RoomCheck on this device."
          title="Local storage"
        />
        <InformationRow
          icon="cloud-offline-outline"
          text="RoomCheck has no account system, advertising, analytics or timetable-data server."
          title="No tracking"
        />
        <InformationRow
          icon="share-social-outline"
          text="Data leaves the app only when you deliberately export or share a backup file."
          title="User-controlled sharing"
        />
        <InformationRow
          icon="trash-outline"
          text="Remove one document or clear every imported document from Timetable Documents."
          title="Deletion controls"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important limitations</Text>
        <InformationRow
          icon="calendar-outline"
          text="Results show scheduled availability. They cannot detect whether someone is physically inside a room."
          title="Scheduled, not live occupancy"
        />
        <InformationRow
          icon="image-outline"
          text="Automatic image OCR is not available in Expo Go. Timetable image rows can be entered manually."
          title="Image timetables"
        />
        <InformationRow
          icon="document-text-outline"
          text="Backups preserve structured timetable data but do not contain the original XLSX, CSV or image files."
          title="Backup contents"
        />
      </View>

      <AppButton
        icon="folder-open-outline"
        label="Manage timetable documents"
        onPress={() => navigation.navigate('ManageDocuments')}
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  brandCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 64,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  version: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.label,
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  informationRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: '700',
  },
  rowText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 19,
  },
});
