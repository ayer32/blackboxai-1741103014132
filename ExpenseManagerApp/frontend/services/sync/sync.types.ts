// Basic types
export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';
export type StorageType = 'expenses' | 'budgets';

// Data interfaces
export interface DocumentData {
  [key: string]: any;
}

export interface StorageItem {
  id: string;
  data: DocumentData;
  synced: boolean;
  updatedAt: number;
}

// Firestore interfaces
export interface FirestoreDocument {
  id: string;
  data(): DocumentData;
}

export interface FirestoreChange {
  type: 'added' | 'modified' | 'removed';
  doc: FirestoreDocument;
}

export interface FirestoreSnapshot {
  docChanges(): FirestoreChange[];
}

export interface FirestoreError {
  code: string;
  message: string;
  stack?: string;
}

// Service interfaces
export interface StorageInterface {
  getItem(type: StorageType, id: string): Promise<DocumentData | null>;
  setItem(type: StorageType, id: string, data: DocumentData): Promise<void>;
  removeItem(type: StorageType, id: string): Promise<void>;
  getUnsyncedItems(): Promise<Array<{ type: StorageType; id: string; data: DocumentData }>>;
  markAsSynced(type: StorageType, id: string): Promise<void>;
}

export interface SyncServiceInterface {
  saveItem(type: StorageType, id: string, data: DocumentData): Promise<void>;
  getItem(type: StorageType, id: string): Promise<DocumentData | null>;
  sync(): Promise<void>;
  startListening(userId: string): void;
  stopListening(): void;
  destroy(): void;
}

// Event handlers
export type ErrorHandler = (error: FirestoreError) => void;
export type SnapshotHandler = (snapshot: FirestoreSnapshot) => void;
export type NetworkStateHandler = (isConnected: boolean) => void;
