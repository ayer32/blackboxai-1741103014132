import { Platform } from 'react-native';
import { BehaviorSubject } from 'rxjs';
import { database } from '../firebase/database';
import { SQLiteStorage } from '../storage/sqlite-storage';
import { IndexedDBStorage } from '../storage/indexed-db-storage';
import { StorageInterface } from '../storage/types';
import { DocumentData, FirestoreQuerySnapshot, FirestoreError } from '../firebase/db.types';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';
export type StorageType = 'expenses' | 'budgets';

export class SyncService {
  private storage: StorageInterface;
  private syncStatus = new BehaviorSubject<SyncStatus>('online');
  private unsubscribers: (() => void)[] = [];

  constructor() {
    this.storage = Platform.OS === 'web' 
      ? new IndexedDBStorage()
      : new SQLiteStorage();
  }

  getSyncStatus(): BehaviorSubject<SyncStatus> {
    return this.syncStatus;
  }

  async saveItem(type: StorageType, id: string, data: DocumentData): Promise<void> {
    try {
      await this.storage.setItem(type, id, data);
      await this.sync();
    } catch (error) {
      console.error('Error saving item:', error);
      this.syncStatus.next('error');
      throw error;
    }
  }

  async getItem(type: StorageType, id: string): Promise<DocumentData | null> {
    try {
      return await this.storage.getItem(type, id);
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  async sync(): Promise<void> {
    try {
      this.syncStatus.next('syncing');

      const unsynced = await this.storage.getUnsyncedItems();
      if (unsynced.length === 0) {
        this.syncStatus.next('online');
        return;
      }

      const operations = unsynced.map(item => ({
        type: 'set' as const,
        collection: item.type,
        id: item.id,
        data: item.data
      }));

      await database.batchWrite(operations);

      // Mark items as synced
      for (const item of unsynced) {
        await this.storage.markAsSynced(item.type, item.id);
      }

      this.syncStatus.next('online');
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStatus.next('error');
      throw error;
    }
  }

  startListening(userId: string): void {
    const handleSnapshot = (type: StorageType) => 
      async (snapshot: FirestoreQuerySnapshot) => {
        try {
          for (const change of snapshot.docChanges()) {
            const { type: changeType, doc } = change;

            if (changeType === 'added' || changeType === 'modified') {
              await this.saveItem(type, doc.id, doc.data());
            } else if (changeType === 'removed') {
              await this.storage.removeItem(type, doc.id);
            }
          }
        } catch (error) {
          console.error(`Error processing ${type} changes:`, error);
          this.syncStatus.next('error');
        }
      };

    const handleError = (error: FirestoreError) => {
      console.error('Listener error:', error);
      this.syncStatus.next('error');
    };

    // Listen to expenses
    const expensesUnsubscribe = database.listen(
      'expenses',
      userId,
      handleSnapshot('expenses'),
      handleError
    );

    // Listen to budgets
    const budgetsUnsubscribe = database.listen(
      'budgets',
      userId,
      handleSnapshot('budgets'),
      handleError
    );

    this.unsubscribers.push(expensesUnsubscribe, budgetsUnsubscribe);
  }

  stopListening(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  destroy(): void {
    this.stopListening();
  }
}

export const syncService = new SyncService();
