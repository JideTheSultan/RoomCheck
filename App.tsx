import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { DatabaseFailureScreen } from './src/components/DatabaseFailureScreen';
import { DatabaseProvider } from './src/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationTheme } from './src/theme';

export default function App() {
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  if (databaseError) {
    return (
      <>
        <StatusBar style="dark" />
        <DatabaseFailureScreen message={databaseError.message} />
      </>
    );
  }

  return (
    <DatabaseProvider onError={setDatabaseError}>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </DatabaseProvider>
  );
}
