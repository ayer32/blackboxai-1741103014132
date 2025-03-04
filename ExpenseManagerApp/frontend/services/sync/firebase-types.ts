// Basic types for Firebase
export interface FirebaseDocument {
  id: string;
  data(): Record<string, any>;
}

export interface FirebaseDocumentChange {
  type: 'added' | 'modified' | 'removed';
  doc: FirebaseDocument;
}

export interface FirebaseQuerySnapshot {
  docChanges(): FirebaseDocumentChange[];
}

export interface FirebaseError {
  code: string;
  message: string;
  stack?: string;
}

// Type definitions for Firebase listeners
export type SnapshotListener = (snapshot: FirebaseQuerySnapshot) => Promise<void>;
export type ErrorListener = (error: FirebaseError) => void;
export type Unsubscribe = () => void;

// Type definitions for Firebase operations
export interface FirebaseOperations {
  collection: (path: string) => any;
  doc: (collection: any, id: string) => any;
  query: (collection: any, ...constraints: any[]) => any;
  where: (field: string, op: string, value: any) => any;
  writeBatch: () => {
    set: (ref: any, data: any) => void;
    commit: () => Promise<void>;
  };
  onSnapshot: (
    query: any,
    onNext: SnapshotListener,
    onError?: ErrorListener
  ) => Unsubscribe;
  Timestamp: {
    now: () => { seconds: number; nanoseconds: number };
  };
}
