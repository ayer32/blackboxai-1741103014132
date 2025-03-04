import React, { createContext, useContext, useCallback } from 'react';
import { useSyncData } from '../hooks/useSyncData';
import type { DocumentData } from '../services/firebase/db.types';
import type { StorageType } from '../services/sync/sync';

interface SyncContextValue {
  syncStatus: 'online' | 'offline' | 'syncing' | 'error';
  sync: () => Promise<void>;
  saveItem: (type: StorageType, id: string, data: DocumentData) => Promise<void>;
  getItem: (type: StorageType, id: string) => Promise<DocumentData | null>;
  isOnline: boolean;
  isSyncing: boolean;
  hasError: boolean;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const syncData = useSyncData();

  const value = {
    ...syncData,
    saveItem: useCallback(syncData.saveItem, [syncData.saveItem]),
    getItem: useCallback(syncData.getItem, [syncData.getItem]),
    sync: useCallback(syncData.sync, [syncData.sync]),
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

// Example usage:
/*
function App() {
  return (
    <SyncProvider>
      <ExpenseSync />
      <ExpenseList />
      <BudgetList />
    </SyncProvider>
  );
}

function ExpenseList() {
  const { getItem, saveItem, isOnline } = useSyncContext();
  
  // Use sync functionality here
  return (
    <View>
      {isOnline ? (
        <Text>Connected</Text>
      ) : (
        <Text>Offline Mode</Text>
      )}
    </View>
  );
}
*/
