import { NetInfoState } from '@react-native-community/netinfo';
import { 
  DocumentData, 
  DocumentChange, 
  QuerySnapshot,
  FirestoreError
} from 'firebase/firestore';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface FirestoreListener {
  (
    snapshot: QuerySnapshot<DocumentData>,
    error?: FirestoreError
  ): void;
}

export interface NetworkState extends NetInfoState {
  isConnected: boolean | null;
}

export interface FirestoreDocumentChange extends DocumentChange<DocumentData> {
  type: 'added' | 'modified' | 'removed';
  doc: {
    id: string;
    data(): DocumentData;
  };
}

export interface SyncServiceInterface {
  saveItem(type: string, id: string, data: DocumentData): Promise<void>;
  getItem(type: string, id: string): Promise<DocumentData | null>;
  sync(): Promise<void>;
  startListening(userId: string): void;
  stopListening(): void;
  destroy(): void;
}
