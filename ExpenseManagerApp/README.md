# Expense Manager App - Data Sync Implementation

A React Native application with offline-first capabilities and real-time data synchronization.

## Features

### Data Synchronization
- Real-time sync between local storage and cloud (Firebase)
- Offline support with automatic sync when back online
- Conflict resolution with timestamp-based versioning
- Progress indicators and status notifications
- Support for both mobile (SQLite) and web (IndexedDB) platforms

### Network Handling
- Automatic network status detection
- Configurable sync preferences (Wi-Fi only, auto-sync)
- Visual indicators for connection status
- Graceful degradation when offline

### Storage Implementation
- Cross-platform storage abstraction
- SQLite for mobile platforms
- IndexedDB for web platforms
- Batch operations support
- Automatic error handling and retry mechanisms

### User Interface
- Real-time sync status indicators
- Offline mode notifications
- Sync progress feedback
- Manual sync triggers
- Data management controls

## Architecture

### Core Components

1. **Storage Layer**
   - `SQLiteStorage`: Mobile storage implementation
   - `IndexedDBStorage`: Web storage implementation
   - Common interface for cross-platform compatibility

2. **Sync Service**
   - Real-time data synchronization
   - Conflict resolution
   - Batch operations
   - Error handling

3. **Network Management**
   - Connection status monitoring
   - Automatic sync triggering
   - Configurable sync preferences

4. **Context Providers**
   - `SyncProvider`: Sync state and operations
   - `NetworkProvider`: Network status and type

### Key Files

```
frontend/
├── services/
│   ├── firebase/
│   │   ├── database.ts       # Firebase database service
│   │   └── db.types.ts      # Firebase type definitions
│   ├── storage/
│   │   ├── sqlite-storage.ts # Mobile storage implementation
│   │   └── indexed-db.ts    # Web storage implementation
│   └── sync/
│       ├── sync.ts          # Core sync functionality
│       └── sync.types.ts    # Sync type definitions
├── contexts/
│   ├── NetworkContext.tsx   # Network status management
│   └── SyncContext.tsx     # Sync state management
├── hooks/
│   └── useSyncData.ts      # Custom hook for sync operations
└── components/
    └── SyncStatus.tsx      # Sync status indicator component
```

### Data Flow

1. User makes changes to data
2. Changes are immediately saved to local storage
3. If online, changes are synced to cloud
4. If offline, changes are queued for sync
5. When connection is restored:
   - Queued changes are synced
   - Conflicts are resolved
   - Local data is updated

## Usage

### Basic Implementation

```typescript
// In your component
import { useSyncContext } from '../contexts/SyncContext';
import { useNetwork } from '../contexts/NetworkContext';

function MyComponent() {
  const { saveItem, getItem, isOnline } = useSyncContext();
  const { isConnected } = useNetwork();

  const handleSave = async (data) => {
    await saveItem('expenses', 'expense-id', data);
  };

  return (
    <View>
      <SyncStatus />
      {/* Your component content */}
    </View>
  );
}
```

### Sync Status Component

```typescript
<SyncStatus
  showButton={true}  // Show/hide manual sync button
  compact={false}    // Compact/full display mode
  style={styles}     // Custom styles
/>
```

## Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Firestore
3. Configure authentication
4. Add Firebase config to your app

### Local Storage Setup

1. Install required dependencies:
   ```bash
   npm install @react-native-community/async-storage
   npm install expo-sqlite
   ```

2. Configure storage adapters in your app

### Network Configuration

1. Install network info package:
   ```bash
   npm install @react-native-community/netinfo
   ```

2. Configure network detection in your app

## Best Practices

1. Always handle offline scenarios
2. Implement proper error handling
3. Provide clear feedback to users
4. Use batch operations for better performance
5. Implement proper conflict resolution
6. Regular testing of offline scenarios
7. Monitor sync status and errors

## Error Handling

- Network errors
- Storage errors
- Sync conflicts
- Data validation
- Version mismatches

## Testing

1. Offline mode testing
2. Sync conflict testing
3. Network transition testing
4. Data consistency verification
5. Error recovery testing

## Future Improvements

1. Enhanced conflict resolution
2. Selective sync
3. Background sync
4. Data compression
5. Enhanced error recovery
6. Sync analytics
7. Custom sync strategies
