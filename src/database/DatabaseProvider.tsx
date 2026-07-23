import { SQLiteProvider } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

import { databaseConfig } from './databaseConfig';
import { migrateDatabase } from './migrations';

type DatabaseProviderProps = PropsWithChildren<{
  onError?: (error: Error) => void;
}>;

export function DatabaseProvider({
  children,
  onError,
}: DatabaseProviderProps) {
  return (
    <SQLiteProvider
      databaseName={databaseConfig.name}
      onError={onError}
      onInit={migrateDatabase}
    >
      {children}
    </SQLiteProvider>
  );
}
