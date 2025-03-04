// Basic types
export type DocumentData = Record<string, any>;

// Document interfaces
export interface FirestoreDoc {
  id: string;
  data: DocumentData;
  exists?: boolean;
}

export interface FirestoreDocRef {
  id: string;
  get(): Promise<{ exists: boolean; data(): DocumentData }>;
  set(data: DocumentData): Promise<void>;
  update(data: DocumentData): Promise<void>;
  delete(): Promise<void>;
}

// Collection interfaces
export interface FirestoreCollection {
  doc(id: string): FirestoreDocRef;
  where(field: string, op: string, value: any): FirestoreQuery;
}

export interface FirestoreQuery {
  where(field: string, op: string, value: any): FirestoreQuery;
  get(): Promise<FirestoreQuerySnapshot>;
  onSnapshot(
    onNext: (snapshot: FirestoreQuerySnapshot) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe;
}

// Snapshot interfaces
export interface FirestoreDocChange {
  type: 'added' | 'modified' | 'removed';
  doc: {
    id: string;
    data(): DocumentData;
  };
}

export interface FirestoreQuerySnapshot {
  docs: Array<{
    id: string;
    data(): DocumentData;
  }>;
  docChanges(): FirestoreDocChange[];
}

// Batch interfaces
export interface FirestoreBatch {
  set(ref: FirestoreDocRef, data: DocumentData): void;
  update(ref: FirestoreDocRef, data: DocumentData): void;
  delete(ref: FirestoreDocRef): void;
  commit(): Promise<void>;
}

// Database interface
export interface FirestoreDB {
  collection(name: string): FirestoreCollection;
  batch(): FirestoreBatch;
}

// Error interface
export interface FirestoreError extends Error {
  code: string;
  name: string;
  stack?: string;
}

// Operation types
export type BatchOperation = {
  type: 'set' | 'update' | 'delete';
  collection: string;
  id: string;
  data?: DocumentData;
};

export type QueryCondition = {
  field: string;
  op: string;
  value: any;
};

// Handler types
export type SnapshotHandler = (snapshot: FirestoreQuerySnapshot) => void;
export type ErrorHandler = (error: FirestoreError) => void;
export type Unsubscribe = () => void;
