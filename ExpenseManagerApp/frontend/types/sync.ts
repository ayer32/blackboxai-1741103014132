export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface SyncData {
  expenses: Expense[];
  lastSynced?: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  data?: SyncData;
}

export interface SyncOptions {
  force?: boolean;
  silent?: boolean;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
}
