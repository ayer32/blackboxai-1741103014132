import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextValue {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isLoading: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
  isLoading: true,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkContextValue>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isLoading: true,
  });

  useEffect(() => {
    // Initial network state check
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
        isLoading: false,
      });
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
        isLoading: false,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// Example usage:
/*
function App() {
  return (
    <NetworkProvider>
      <SyncProvider>
        <YourApp />
      </SyncProvider>
    </NetworkProvider>
  );
}

function YourComponent() {
  const { isConnected, isInternetReachable, type } = useNetwork();
  
  if (!isConnected) {
    return <Text>No network connection</Text>;
  }

  return (
    <View>
      <Text>Network type: {type}</Text>
      <Text>Internet reachable: {isInternetReachable ? 'Yes' : 'No'}</Text>
    </View>
  );
}
*/
