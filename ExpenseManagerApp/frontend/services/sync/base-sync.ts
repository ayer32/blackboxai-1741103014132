import { BehaviorSubject } from 'rxjs';
import {
  SyncStatus,
  StorageType,
  DocumentData,
  StorageInterface,
  SyncServiceInterface
} from './sync.types';

export abstract class BaseSyncService implements SyncServiceInterface {
  protected syncStatus = new BehaviorSubject<SyncStatus>('online');
  protected firestoreUnsubscribers: (() => void)[] = [];

  constructor(protected storage: StorageInterface) {}

  abstract setupNetworkListener(): void;

  async saveItem(type: StorageType, id: string, data: DocumentData): Promise<void> {
    await this.storage.setItem(type, id, data);
    await this.sync();
  }

  async getItem(type: StorageType, id: string): Promise<DocumentData | null> {
    return await this.storage.getItem(type, id);
  }

  async sync(): Promise<void> {
    try {
      this.syncStatus.next('syncing');

      const unsynced = await this.storage.getUnsyncedItems();
      if (unsynced.length === 0) {
        this.syncStatus.next('online');
        return;
      }

      await this.syncItems(unsynced);
      this.syncStatus.next('online');
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStatus.next('error');
    }
  }

  protected abstract syncItems(
    items: Array<{ type: StorageType; id: string; data: DocumentData }>
  ): Promise<void>;

  abstract startListening(userId: string): void;

  stopListening(): void {
    this.firestoreUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.firestoreUnsubscribers = [];
  }

  abstract destroy(): void;

  getSyncStatus(): BehaviorSubject<SyncStatus> {
    return this.syncStatus;
  }
}
