import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { syncService, SyncStatus, StorageType } from '../services/sync/sync';
import type { User } from '../types/auth';
import type { DocumentData } from '../services/firebase/db.types';

interface SyncHookResult {
  syncStatus: SyncStatus;
  sync: () => Promise<void>;
  saveItem: (type: StorageType, id: string, data: DocumentData) => Promise<void>;
  getItem: (type: StorageType, id: string) => Promise<DocumentData | null>;
  isOnline: boolean;
  isSyncing: boolean;
  hasError: boolean;
}

export function useSyncData(): SyncHookResult {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');

  useEffect(() => {
    if (!user) return;

    // Subscribe to sync status changes
    const subscription = syncService.getSyncStatus().subscribe((status: SyncStatus) => {
      setSyncStatus(status);
    });

    // Start listening to data changes
    syncService.startListening(user.id);

    // Cleanup
    return () => {
      subscription.unsubscribe();
      syncService.stopListening();
    };
  }, [user]);

  const sync = async (): Promise<void> => {
    if (!user) return;
    try {
      await syncService.sync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const saveItem = async (
    type: StorageType,
    id: string,
    data: DocumentData
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    try {
      await syncService.saveItem(type, id, {
        ...data,
        userId: user.id
      });
    } catch (error) {
      console.error('Save item failed:', error);
      throw error;
    }
  };

  const getItem = async (
    type: StorageType,
    id: string
  ): Promise<DocumentData | null> => {
    if (!user) return null;
    try {
      return await syncService.getItem(type, id);
    } catch (error) {
      console.error('Get item failed:', error);
      return null;
    }
  };

  return {
    syncStatus,
    sync,
    saveItem,
    getItem,
    isOnline: syncStatus === 'online',
    isSyncing: syncStatus === 'syncing',
    hasError: syncStatus === 'error'
  };
}
