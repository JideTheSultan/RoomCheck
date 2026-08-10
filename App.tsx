import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { DatabaseFailureScreen } from './src/components/DatabaseFailureScreen';
import { DatabaseProvider } from './src/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationTheme } from './src/theme';

export default function App() {
  const [databaseError, setDatabaseError] = useState<Error | null>(null);
  const [databaseAttempt, setDatabaseAttempt] = useState(0);

  const retryDatabase = () => {
    setDatabaseError(null);
    setDatabaseAttempt((attempt) => attempt + 1);
  };

  if (databaseError) {
    return (
      <>
        <StatusBar style="dark" />
        <DatabaseFailureScreen
          message={databaseError.message}
          onRetry={retryDatabase}
        />
      </>
    );
  }

  return (
    <AppErrorBoundary>
      <DatabaseProvider key={databaseAttempt} onError={setDatabaseError}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </DatabaseProvider>
    </AppErrorBoundary>
  );
}
