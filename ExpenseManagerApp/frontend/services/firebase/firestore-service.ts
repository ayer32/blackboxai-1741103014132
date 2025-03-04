import { db } from '../../firebaseConfig';

// Basic types
export type DocumentData = Record<string, any>;

export interface FirestoreDoc {
  id: string;
  data: DocumentData;
}

export interface FirestoreQuery {
  where: (field: string, op: string, value: any) => FirestoreQuery;
  get: () => Promise<FirestoreQueryResult>;
}

export interface FirestoreQueryResult {
  docs: FirestoreDoc[];
}

export interface FirestoreChange {
  type: 'added' | 'modified' | 'removed';
  doc: FirestoreDoc;
}

export interface FirestoreSnapshot {
  docChanges: () => FirestoreChange[];
}

export type FirestoreListener = (snapshot: FirestoreSnapshot) => void;
export type FirestoreErrorHandler = (error: Error) => void;
export type Unsubscribe = () => void;

class FirestoreService {
  // Collection operations
  getCollection(path: string) {
    return db.collection(path);
  }

  // Document operations
  async getDoc(collectionPath: string, docId: string): Promise<DocumentData | null> {
    try {
      const docRef = db.collection(collectionPath).doc(docId);
      const doc = await docRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  async setDoc(
    collectionPath: string,
    docId: string,
    data: DocumentData
  ): Promise<void> {
    try {
      await db.collection(collectionPath).doc(docId).set({
        ...data,
        updatedAt: this.getTimestamp()
      });
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }

  async updateDoc(
    collectionPath: string,
    docId: string,
    data: DocumentData
  ): Promise<void> {
    try {
      await db.collection(collectionPath).doc(docId).update({
        ...data,
        updatedAt: this.getTimestamp()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDoc(collectionPath: string, docId: string): Promise<void> {
    try {
      await db.collection(collectionPath).doc(docId).delete();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Query operations
  createQuery(collectionPath: string) {
    return db.collection(collectionPath);
  }

  // Batch operations
  async runBatch(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    doc: string;
    data?: DocumentData;
  }>): Promise<void> {
    try {
      const batch = db.batch();

      operations.forEach(op => {
        const docRef = db.collection(op.collection).doc(op.doc);
        switch (op.type) {
          case 'set':
            batch.set(docRef, {
              ...op.data,
              updatedAt: this.getTimestamp()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: this.getTimestamp()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error running batch operation:', error);
      throw error;
    }
  }

  // Real-time listeners
  onSnapshot(
    collectionPath: string,
    queryFn: (query: FirestoreQuery) => FirestoreQuery,
    onNext: FirestoreListener,
    onError?: FirestoreErrorHandler
  ): Unsubscribe {
    try {
      const query = queryFn(this.createQuery(collectionPath));
      return query.onSnapshot(onNext, onError);
    } catch (error) {
      console.error('Error setting up snapshot listener:', error);
      throw error;
    }
  }

  // Utility functions
  getTimestamp() {
    return new Date();
  }
}

export const firestoreService = new FirestoreService();
