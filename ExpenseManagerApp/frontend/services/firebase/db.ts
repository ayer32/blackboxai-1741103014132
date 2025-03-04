import { db } from '../../firebaseConfig';

export type DocumentData = Record<string, any>;

export interface FirestoreDoc {
  id: string;
  data: DocumentData;
}

export interface FirestoreChange {
  type: 'added' | 'modified' | 'removed';
  doc: FirestoreDoc;
}

export interface FirestoreSnapshot {
  changes: FirestoreChange[];
}

export type SnapshotHandler = (snapshot: FirestoreSnapshot) => void;
export type ErrorHandler = (error: Error) => void;
export type Unsubscribe = () => void;

class DatabaseService {
  // Basic CRUD operations
  async getDocument(collection: string, id: string): Promise<DocumentData | null> {
    try {
      const doc = await db.collection(collection).doc(id).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  async setDocument(collection: string, id: string, data: DocumentData): Promise<void> {
    try {
      await db.collection(collection).doc(id).set({
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }

  async updateDocument(collection: string, id: string, data: DocumentData): Promise<void> {
    try {
      await db.collection(collection).doc(id).update({
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    try {
      await db.collection(collection).doc(id).delete();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Batch operations
  async batchUpdate(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    id: string;
    data?: DocumentData;
  }>): Promise<void> {
    try {
      const batch = db.batch();

      operations.forEach(op => {
        const ref = db.collection(op.collection).doc(op.id);
        switch (op.type) {
          case 'set':
            batch.set(ref, { ...op.data, updatedAt: new Date() });
            break;
          case 'update':
            batch.update(ref, { ...op.data, updatedAt: new Date() });
            break;
          case 'delete':
            batch.delete(ref);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }

  // Query operations
  listenToCollection(
    collection: string,
    userId: string,
    onSnapshot: SnapshotHandler,
    onError?: ErrorHandler
  ): Unsubscribe {
    const query = db.collection(collection).where('userId', '==', userId);
    
    return query.onSnapshot(
      snapshot => {
        const changes = snapshot.docChanges().map(change => ({
          type: change.type as 'added' | 'modified' | 'removed',
          doc: {
            id: change.doc.id,
            data: change.doc.data()
          }
        }));
        
        onSnapshot({ changes });
      },
      error => {
        console.error('Snapshot listener error:', error);
        if (onError) onError(error);
      }
    );
  }

  // Query helpers
  async queryCollection(
    collection: string,
    conditions: Array<{ field: string; op: string; value: any }>
  ): Promise<FirestoreDoc[]> {
    try {
      let query = db.collection(collection);
      
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.op, condition.value);
      });

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error) {
      console.error('Error querying collection:', error);
      return [];
    }
  }
}

export const dbService = new DatabaseService();
