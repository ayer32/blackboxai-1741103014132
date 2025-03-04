import { db } from '../../firebaseConfig';
import {
  DocumentData,
  FirestoreDoc,
  FirestoreDocRef,
  FirestoreQuerySnapshot,
  FirestoreError,
  BatchOperation,
  QueryCondition
} from './db.types';

class Database {
  private getDocRef(collection: string, id: string): FirestoreDocRef {
    return db.collection(collection).doc(id) as FirestoreDocRef;
  }

  async get(collection: string, id: string): Promise<DocumentData | null> {
    try {
      const doc = await this.getDocRef(collection, id).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  async set(collection: string, id: string, data: DocumentData): Promise<void> {
    try {
      await this.getDocRef(collection, id).set({
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }

  async update(collection: string, id: string, data: DocumentData): Promise<void> {
    try {
      await this.getDocRef(collection, id).update({
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      await this.getDocRef(collection, id).delete();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async batchWrite(operations: BatchOperation[]): Promise<void> {
    try {
      const batch = db.batch();

      operations.forEach(op => {
        const ref = this.getDocRef(op.collection, op.id);
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
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  listen(
    collection: string,
    userId: string,
    onNext: (snapshot: FirestoreQuerySnapshot) => void,
    onError: (error: FirestoreError) => void
  ): () => void {
    const query = db.collection(collection).where('userId', '==', userId);
    
    return query.onSnapshot(
      (snapshot: FirestoreQuerySnapshot) => onNext(snapshot),
      (error: FirestoreError) => {
        console.error('Listener error:', error);
        onError(error);
      }
    );
  }

  async query(collection: string, conditions: QueryCondition[]): Promise<FirestoreDoc[]> {
    try {
      let query = db.collection(collection);
      
      conditions.forEach(({ field, op, value }) => {
        query = query.where(field, op, value);
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

export const database = new Database();
