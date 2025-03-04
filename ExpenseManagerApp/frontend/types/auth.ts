export interface User {
  id: string;
  email: string;
  name?: string;
  preferences?: {
    currency?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      enabled: boolean;
      budgetAlerts: boolean;
      weeklyReport: boolean;
    };
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
