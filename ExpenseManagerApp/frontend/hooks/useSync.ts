import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { syncService, SyncStatus } from '../services/sync/sync';

export function useSync() {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');

  useEffect(() => {
    if (!user) return;

    // Subscribe to sync status changes
    const subscription = syncService.getSyncStatus().subscribe(status => {
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

  const sync = async () => {
    if (!user) return;
    try {
      await syncService.sync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const saveItem = async (
    type: 'expenses' | 'budgets',
    id: string,
    data: Record<string, any>
  ) => {
    if (!user) return;
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
    type: 'expenses' | 'budgets',
    id: string
  ) => {
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
