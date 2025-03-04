import { Platform } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, doc, query, where, writeBatch, onSnapshot, Timestamp } from 'firebase/firestore';
import { BaseSyncService } from './base-sync';
import { SQLiteStorage } from '../storage/sqlite-storage';
import { IndexedDBStorage } from '../storage/indexed-db-storage';
import { StorageType, DocumentData } from './sync.types';

export class FirebaseSyncService extends BaseSyncService {
  private unsubscribeNetInfo?: () => void;

  constructor() {
    const storage = Platform.OS === 'web' 
      ? new IndexedDBStorage()
      : new SQLiteStorage();
    super(storage);
  }

  setupNetworkListener(): void {
    // Implementation will be added when @react-native-community/netinfo is properly typed
  }

  protected async syncItems(
    items: Array<{ type: StorageType; id: string; data: DocumentData }>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const item of items) {
        const ref = doc(db, item.type, item.id);
        batch.set(ref, {
          ...item.data,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();

      // Mark items as synced
      for (const item of items) {
        await this.storage.markAsSynced(item.type, item.id);
      }
    } catch (error) {
      console.error('Error syncing items:', error);
      throw error;
    }
  }

  startListening(userId: string): void {
    try {
      // Listen to expenses
      const expensesUnsubscribe = onSnapshot(
        query(collection(db, 'expenses'), where('userId', '==', userId)),
        async (snapshot) => {
          for (const change of snapshot.docChanges()) {
            try {
              if (change.type === 'added' || change.type === 'modified') {
                await this.saveItem('expenses', change.doc.id, change.doc.data());
              } else if (change.type === 'removed') {
                await this.storage.removeItem('expenses', change.doc.id);
              }
            } catch (error) {
              console.error('Error processing expense change:', error);
            }
          }
        },
        (error) => {
          console.error('Expenses listener error:', error);
          this.syncStatus.next('error');
        }
      );

      // Listen to budgets
      const budgetsUnsubscribe = onSnapshot(
        query(collection(db, 'budgets'), where('userId', '==', userId)),
        async (snapshot) => {
          for (const change of snapshot.docChanges()) {
            try {
              if (change.type === 'added' || change.type === 'modified') {
                await this.saveItem('budgets', change.doc.id, change.doc.data());
              } else if (change.type === 'removed') {
                await this.storage.removeItem('budgets', change.doc.id);
              }
            } catch (error) {
              console.error('Error processing budget change:', error);
            }
          }
        },
        (error) => {
          console.error('Budgets listener error:', error);
          this.syncStatus.next('error');
        }
      );

      this.firestoreUnsubscribers.push(expensesUnsubscribe, budgetsUnsubscribe);
    } catch (error) {
      console.error('Error setting up listeners:', error);
      this.syncStatus.next('error');
    }
  }

  destroy(): void {
    this.unsubscribeNetInfo?.();
    this.stopListening();
  }
}

// Export singleton instance
export const syncService = new FirebaseSyncService();
