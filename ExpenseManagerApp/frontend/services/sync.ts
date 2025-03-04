import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import * as SQLite from 'expo-sqlite';
import { BehaviorSubject } from 'rxjs';

// Types
type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';
type StorageType = 'expenses' | 'budgets';

interface StorageItem {
  id: string;
  data: any;
  synced: boolean;
  updatedAt: number;
}

// Create observable for sync status
const syncStatus = new BehaviorSubject<SyncStatus>('online');

class SyncService {
  private db: SQLite.SQLiteDatabase;
  private unsubscribeNetInfo?: () => void;
  private firestoreUnsubscribers: (() => void)[] = [];

  constructor() {
    if (Platform.OS !== 'web') {
      this.db = SQLite.openDatabase('expensemanager.db');
      this.initDatabase();
    }
    this.setupNetworkListener();
  }

  private async initDatabase() {
    if (Platform.OS === 'web') return;

    await this.db.transactionAsync(async (tx) => {
      // Create expenses table
      await tx.executeSqlAsync(
        `CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          data TEXT,
          synced INTEGER DEFAULT 0,
          updatedAt INTEGER
        )`
      );

      // Create budgets table
      await tx.executeSqlAsync(
        `CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          data TEXT,
          synced INTEGER DEFAULT 0,
          updatedAt INTEGER
        )`
      );
    });
  }

  private setupNetworkListener() {
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.sync();
        syncStatus.next('online');
      } else {
        syncStatus.next('offline');
      }
    });
  }

  async saveItem(type: StorageType, id: string, data: any) {
    if (Platform.OS === 'web') {
      // Save to IndexedDB (implement if needed)
      return;
    }

    await this.db.transactionAsync(async (tx) => {
      await tx.executeSqlAsync(
        `INSERT OR REPLACE INTO ${type} (id, data, synced, updatedAt) VALUES (?, ?, 0, ?)`,
        [id, JSON.stringify(data), Date.now()]
      );
    });

    // If online, sync immediately
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      await this.sync();
    }
  }

  async getItem(type: StorageType, id: string) {
    if (Platform.OS === 'web') {
      // Get from IndexedDB (implement if needed)
      return null;
    }

    const result = await this.db.transactionAsync(async (tx) => {
      const [{ rows }] = await tx.executeSqlAsync(
        `SELECT * FROM ${type} WHERE id = ?`,
        [id]
      );
      if (rows.length > 0) {
        const item = rows.item(0);
        return {
          ...JSON.parse(item.data),
          synced: Boolean(item.synced)
        };
      }
      return null;
    });

    return result;
  }

  async sync() {
    try {
      if (Platform.OS === 'web') return;

      syncStatus.next('syncing');

      const unsynced = await this.getUnsyncedItems();
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
      await this.db.transactionAsync(async (tx) => {
        for (const item of unsynced) {
          await tx.executeSqlAsync(
            `UPDATE ${item.type} SET synced = 1 WHERE id = ?`,
            [item.id]
          );
        }
      });

      syncStatus.next('online');
    } catch (error) {
      console.error('Sync error:', error);
      syncStatus.next('error');
    }
  }

  private async getUnsyncedItems() {
    if (Platform.OS === 'web') return [];

    const unsynced: Array<{ type: StorageType; id: string; data: any }> = [];

    await this.db.transactionAsync(async (tx) => {
      // Get unsynced expenses
      const [{ rows: expenseRows }] = await tx.executeSqlAsync(
        'SELECT * FROM expenses WHERE synced = 0'
      );
      for (let i = 0; i < expenseRows.length; i++) {
        const item = expenseRows.item(i);
        unsynced.push({
          type: 'expenses',
          id: item.id,
          data: JSON.parse(item.data)
        });
      }

      // Get unsynced budgets
      const [{ rows: budgetRows }] = await tx.executeSqlAsync(
        'SELECT * FROM budgets WHERE synced = 0'
      );
      for (let i = 0; i < budgetRows.length; i++) {
        const item = budgetRows.item(i);
        unsynced.push({
          type: 'budgets',
          id: item.id,
          data: JSON.parse(item.data)
        });
      }
    });

    return unsynced;
  }

  startListening(userId: string) {
    // Listen to expenses
    const expensesUnsubscribe = onSnapshot(
      query(collection(db, 'expenses'), where('userId', '==', userId)),
      snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added' || change.type === 'modified') {
            await this.saveItem('expenses', change.doc.id, change.doc.data());
          }
        });
      }
    );

    // Listen to budgets
    const budgetsUnsubscribe = onSnapshot(
      query(collection(db, 'budgets'), where('userId', '==', userId)),
      snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added' || change.type === 'modified') {
            await this.saveItem('budgets', change.doc.id, change.doc.data());
          }
        });
      }
    );

    this.firestoreUnsubscribers.push(expensesUnsubscribe, budgetsUnsubscribe);
  }

  stopListening() {
    this.firestoreUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.firestoreUnsubscribers = [];
  }

  destroy() {
    this.unsubscribeNetInfo?.();
    this.stopListening();
  }
}

export const syncService = new SyncService();
export { syncStatus };
