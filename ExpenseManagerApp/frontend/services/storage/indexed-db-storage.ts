import { StorageInterface, StorageType } from './types';

type DocumentData = Record<string, any>;

export class IndexedDBStorage implements StorageInterface {
  private dbName = 'expensemanager';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      this.db = await this.openDB();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('expenses')) {
          db.createObjectStore('expenses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
      };
    });
  }

  private async getStore(type: StorageType, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      this.db = await this.openDB();
    }
    const transaction = this.db.transaction(type, mode);
    return transaction.objectStore(type);
  }

  async getItem(type: StorageType, id: string): Promise<DocumentData | null> {
    try {
      const store = await this.getStore(type);
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.data || null);
      });
    } catch (error) {
      console.error(`Failed to get item ${id} from ${type}:`, error);
      return null;
    }
  }

  async setItem(type: StorageType, id: string, data: DocumentData): Promise<void> {
    try {
      const store = await this.getStore(type, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put({
          id,
          data,
          synced: false,
          updatedAt: Date.now()
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error(`Failed to set item ${id} in ${type}:`, error);
    }
  }

  async removeItem(type: StorageType, id: string): Promise<void> {
    try {
      const store = await this.getStore(type, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error(`Failed to remove item ${id} from ${type}:`, error);
    }
  }

  async getUnsyncedItems(): Promise<Array<{ type: StorageType; id: string; data: DocumentData }>> {
    const unsynced: Array<{ type: StorageType; id: string; data: DocumentData }> = [];

    try {
      for (const type of ['expenses', 'budgets'] as StorageType[]) {
        const store = await this.getStore(type);
        
        await new Promise<void>((resolve, reject) => {
          const request = store.openCursor();
          
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              if (!cursor.value.synced) {
                unsynced.push({
                  type,
                  id: cursor.value.id,
                  data: cursor.value.data
                });
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
        });
      }
    } catch (error) {
      console.error('Failed to get unsynced items:', error);
    }

    return unsynced;
  }

  async markAsSynced(type: StorageType, id: string): Promise<void> {
    try {
      const store = await this.getStore(type, 'readwrite');
      return new Promise((resolve, reject) => {
        const getRequest = store.get(id);
        
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          if (data) {
            data.synced = true;
            const putRequest = store.put(data);
            putRequest.onerror = () => reject(putRequest.error);
            putRequest.onsuccess = () => resolve();
          } else {
            resolve();
          }
        };
      });
    } catch (error) {
      console.error(`Failed to mark item ${id} as synced in ${type}:`, error);
    }
  }
}
