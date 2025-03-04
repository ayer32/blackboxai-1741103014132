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
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { StorageInterface, StorageType } from '../storage/types';
import { SQLiteStorage } from '../storage/sqlite-storage';
import { IndexedDBStorage } from '../storage/indexed-db-storage';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

// Create observable for sync status
export const syncStatus = new BehaviorSubject<SyncStatus>('online');

export class SyncService {
  private storage: StorageInterface;
  private unsubscribeNetInfo?: () => void;
  private firestoreUnsubscribers: (() => void)[] = [];

  constructor() {
    // Initialize appropriate storage based on platform
    this.storage = Platform.OS === 'web' 
      ? new IndexedDBStorage()
      : new SQLiteStorage();
    
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.sync();
        syncStatus.next('online');
      } else {
        syncStatus.next('offline');
      }
    });
  }

  async saveItem(type: StorageType, id: string, data: DocumentData): Promise<void> {
    await this.storage.setItem(type, id, data);

    // If online, sync immediately
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await this.sync();
    }
  }

  async getItem(type: StorageType, id: string): Promise<DocumentData | null> {
    return await this.storage.getItem(type, id);
  }

  async sync(): Promise<void> {
    try {
      syncStatus.next('syncing');

      const unsynced = await this.storage.getUnsyncedItems();
      if (unsynced.length === 0) {
        syncStatus.next('online');
        return;
      }

      const batch = writeBatch(db);

      for (const item of unsynced) {
        const ref = doc(db, item.type, item.id);
        batch.set(ref, {
          ...item.data,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();

      // Mark items as synced
      for (const item of unsynced) {
        await this.storage.markAsSynced(item.type, item.id);
      }

      syncStatus.next('online');
    } catch (error) {
      console.error('Sync error:', error);
      syncStatus.next('error');
    }
  }

  startListening(userId: string): void {
    // Listen to expenses
    const expensesUnsubscribe = onSnapshot(
      query(collection(db, 'expenses'), where('userId', '==', userId)),
      snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added' || change.type === 'modified') {
            await this.saveItem('expenses', change.doc.id, change.doc.data());
          } else if (change.type === 'removed') {
            await this.storage.removeItem('expenses', change.doc.id);
          }
        });
      },
      error => {
        console.error('Firestore expenses listener error:', error);
        syncStatus.next('error');
      }
    );

    // Listen to budgets
    const budgetsUnsubscribe = onSnapshot(
      query(collection(db, 'budgets'), where('userId', '==', userId)),
      snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added' || change.type === 'modified') {
            await this.saveItem('budgets', change.doc.id, change.doc.data());
          } else if (change.type === 'removed') {
            await this.storage.removeItem('budgets', change.doc.id);
          }
        });
      },
      error => {
        console.error('Firestore budgets listener error:', error);
        syncStatus.next('error');
      }
    );

    this.firestoreUnsubscribers.push(expensesUnsubscribe, budgetsUnsubscribe);
  }

  stopListening(): void {
    this.firestoreUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.firestoreUnsubscribers = [];
  }

  destroy(): void {
    this.unsubscribeNetInfo?.();
    this.stopListening();
  }
}

export const syncService = new SyncService();
