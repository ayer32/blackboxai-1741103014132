import { DocumentData } from 'firebase/firestore';

export type StorageType = 'expenses' | 'budgets';

export interface StorageItem {
  id: string;
  data: DocumentData;
  synced: boolean;
  updatedAt: number;
}

export interface StorageInterface {
  getItem(type: StorageType, id: string): Promise<DocumentData | null>;
  setItem(type: StorageType, id: string, data: DocumentData): Promise<void>;
  removeItem(type: StorageType, id: string): Promise<void>;
  getUnsyncedItems(): Promise<Array<{ type: StorageType; id: string; data: DocumentData }>>;
  markAsSynced(type: StorageType, id: string): Promise<void>;
}
