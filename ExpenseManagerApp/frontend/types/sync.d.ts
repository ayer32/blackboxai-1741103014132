import { DocumentData, DocumentChange, QuerySnapshot } from 'firebase/firestore';
import { NetInfoState } from '@react-native-community/netinfo';
import { SQLTransaction } from 'expo-sqlite';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';
export type StorageType = 'expenses' | 'budgets';

export interface StorageItem {
  id: string;
  data: DocumentData;
  synced: boolean;
  updatedAt: number;
}

export interface SQLiteResult {
  rows: {
    length: number;
    item: (index: number) => any;
    _array: any[];
  };
  rowsAffected: number;
  insertId?: number;
}

export interface DatabaseTransaction extends SQLTransaction {
  executeSqlAsync(
    sqlStatement: string,
    args?: any[]
  ): Promise<[SQLiteResult]>;
}

export interface FirestoreChange {
  type: 'added' | 'modified' | 'removed';
  doc: {
    id: string;
    data(): DocumentData;
  };
}

export interface SyncServiceInterface {
  saveItem(type: StorageType, id: string, data: DocumentData): Promise<void>;
  getItem(type: StorageType, id: string): Promise<DocumentData | null>;
  sync(): Promise<void>;
  startListening(userId: string): void;
  stopListening(): void;
  destroy(): void;
}
