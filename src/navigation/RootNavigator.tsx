import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CheckDepartmentLevelScreen } from '../screens/CheckDepartmentLevelScreen';
import { FindFreeClassroomScreen } from '../screens/FindFreeClassroomScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ImageTimetableEntryScreen } from '../screens/ImageTimetableEntryScreen';
import { ImportTimetablesScreen } from '../screens/ImportTimetablesScreen';
import { ManageDocumentsScreen } from '../screens/ManageDocumentsScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        component={HomeScreen}
        name="Home"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        component={ImportTimetablesScreen}
        name="ImportTimetables"
        options={{ title: 'Import timetables' }}
      />
      <Stack.Screen
        component={FindFreeClassroomScreen}
        name="FindFreeClassroom"
        options={{ title: 'Find a classroom' }}
      />
      <Stack.Screen
        component={CheckDepartmentLevelScreen}
        name="CheckDepartmentLevel"
        options={{ title: 'Check a class group' }}
      />
      <Stack.Screen
        component={ImageTimetableEntryScreen}
        name="ImageTimetableEntry"
        options={{ title: 'Enter image timetable' }}
      />
      <Stack.Screen
        component={ManageDocumentsScreen}
        name="ManageDocuments"
        options={{ title: 'Timetable documents' }}
      />
      <Stack.Screen
        component={SearchResultsScreen}
        name="SearchResults"
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
