import { db } from '../../firebaseConfig';
import {
  collection,
  doc,
  query,
  where,
  writeBatch,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentChange
} from 'firebase/firestore';

export type FirestoreListener = (snapshot: QuerySnapshot<DocumentData>) => void;
export type FirestoreErrorHandler = (error: Error) => void;
export type Unsubscribe = () => void;

class FirestoreService {
  createCollection(path: string) {
    return collection(db, path);
  }

  createDoc(collectionPath: string, id: string) {
    return doc(db, collectionPath, id);
  }

  createQuery(collectionRef: any, field: string, operator: string, value: any) {
    return query(collectionRef, where(field, operator, value));
  }

  createBatch() {
    return writeBatch(db);
  }

  getTimestamp() {
    return Timestamp.now();
  }

  listenToQuery(
    queryRef: any,
    onData: FirestoreListener,
    onError?: FirestoreErrorHandler
  ): Unsubscribe {
    return onSnapshot(queryRef, onData, onError);
  }

  async setDoc(docRef: any, data: DocumentData): Promise<void> {
    await docRef.set(data);
  }

  async updateDoc(docRef: any, data: DocumentData): Promise<void> {
    await docRef.update(data);
  }

  async deleteDoc(docRef: any): Promise<void> {
    await docRef.delete();
  }
}

export const firestoreService = new FirestoreService();
