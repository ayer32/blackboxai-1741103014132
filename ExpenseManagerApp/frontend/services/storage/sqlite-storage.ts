import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { StorageInterface, StorageType } from './types';

type DocumentData = Record<string, any>;

interface SQLiteResult {
  rows: {
    length: number;
    item: (index: number) => any;
    _array: any[];
  };
  rowsAffected: number;
  insertId?: number;
}

interface DatabaseTransaction {
  executeSql(
    sqlStatement: string,
    args?: any[]
  ): Promise<[SQLiteResult]>;
}

export class SQLiteStorage implements StorageInterface {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    if (Platform.OS !== 'web') {
      this.db = SQLite.openDatabase('expensemanager.db');
      this.initDatabase();
    }
  }

  private async initDatabase(): Promise<void> {
    await this.db.transactionAsync(async (tx: DatabaseTransaction) => {
      // Create expenses table
      await tx.executeSql(
        `CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          data TEXT,
          synced INTEGER DEFAULT 0,
          updatedAt INTEGER
        )`,
        []
      );

      // Create budgets table
      await tx.executeSql(
        `CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          data TEXT,
          synced INTEGER DEFAULT 0,
          updatedAt INTEGER
        )`,
        []
      );
    });
  }

  async getItem(type: StorageType, id: string): Promise<DocumentData | null> {
    if (Platform.OS === 'web') return null;

    const result = await this.db.transactionAsync(async (tx: DatabaseTransaction) => {
      const [{ rows }] = await tx.executeSql(
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

  async setItem(type: StorageType, id: string, data: DocumentData): Promise<void> {
    if (Platform.OS === 'web') return;

    await this.db.transactionAsync(async (tx: DatabaseTransaction) => {
      await tx.executeSql(
        `INSERT OR REPLACE INTO ${type} (id, data, synced, updatedAt) VALUES (?, ?, 0, ?)`,
        [id, JSON.stringify(data), Date.now()]
      );
    });
  }

  async removeItem(type: StorageType, id: string): Promise<void> {
    if (Platform.OS === 'web') return;

    await this.db.transactionAsync(async (tx: DatabaseTransaction) => {
      await tx.executeSql(
        `DELETE FROM ${type} WHERE id = ?`,
        [id]
      );
    });
  }

  async getUnsyncedItems(): Promise<Array<{ type: StorageType; id: string; data: DocumentData }>> {
    if (Platform.OS === 'web') return [];

    const unsynced: Array<{ type: StorageType; id: string; data: DocumentData }> = [];

    await this.db.transactionAsync(async (tx: DatabaseTransaction) => {
      // Get unsynced expenses
      const [{ rows: expenseRows }] = await tx.executeSql(
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
      const [{ rows: budgetRows }] = await tx.executeSql(
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

  async markAsSynced(type: StorageType, id: string): Promise<void> {
    if (Platform.OS === 'web') return;

    await this.db.transactionAsync(async (tx: DatabaseTransaction) => {
      await tx.executeSql(
        `UPDATE ${type} SET synced = 1 WHERE id = ?`,
        [id]
      );
    });
  }
}
