import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { db } from '../../firebaseConfig';
import {
  collection,
  doc,
  query,
  where,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { BaseSyncService } from './base-sync';
import { SQLiteStorage } from '../storage/sqlite-storage';
import { IndexedDBStorage } from '../storage/indexed-db-storage';
import {
  StorageType,
  DocumentData,
  FirestoreSnapshot,
  FirestoreError,
  ErrorHandler
} from './sync.types';

export class FirebaseSyncService extends BaseSyncService {
  private unsubscribeNetInfo?: () => void;

  constructor() {
    // Initialize appropriate storage based on platform
    const storage = Platform.OS === 'web' 
      ? new IndexedDBStorage()
      : new SQLiteStorage();
    
    super(storage);
    this.setupNetworkListener();
  }

  setupNetworkListener(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.sync();
        this.syncStatus.next('online');
      } else {
        this.syncStatus.next('offline');
      }
    });
  }

  protected async syncItems(
    items: Array<{ type: StorageType; id: string; data: DocumentData }>
  ): Promise<void> {
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
  }

  startListening(userId: string): void {
    const handleSnapshot = (type: StorageType) => async (snapshot: FirestoreSnapshot) => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added' || change.type === 'modified') {
          await this.saveItem(type, change.doc.id, change.doc.data());
        } else if (change.type === 'removed') {
          await this.storage.removeItem(type, change.doc.id);
        }
      });
    };

    const handleError: ErrorHandler = (error) => {
      console.error('Firestore listener error:', error);
      this.syncStatus.next('error');
    };

    // Listen to expenses
    const expensesUnsubscribe = onSnapshot(
      query(collection(db, 'expenses'), where('userId', '==', userId)),
      handleSnapshot('expenses'),
      handleError
    );

    // Listen to budgets
    const budgetsUnsubscribe = onSnapshot(
      query(collection(db, 'budgets'), where('userId', '==', userId)),
      handleSnapshot('budgets'),
      handleError
    );

    this.firestoreUnsubscribers.push(expensesUnsubscribe, budgetsUnsubscribe);
  }

  destroy(): void {
    this.unsubscribeNetInfo?.();
    this.stopListening();
  }
}

// Export singleton instance
export const syncService = new FirebaseSyncService();
