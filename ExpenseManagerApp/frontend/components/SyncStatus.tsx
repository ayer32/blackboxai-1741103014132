import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSyncContext } from '../contexts/SyncContext';
import { Ionicons } from '@expo/vector-icons';

interface SyncStatusProps {
  showButton?: boolean;
  compact?: boolean;
  style?: any;
}

export function SyncStatus({ showButton = true, compact = false, style }: SyncStatusProps) {
  const { syncStatus, sync, isOnline, isSyncing, hasError } = useSyncContext();

  const getStatusIcon = () => {
    if (hasError) return 'alert-circle';
    if (isSyncing) return 'sync';
    if (isOnline) return 'cloud-done';
    return 'cloud-offline';
  };

  const getStatusColor = () => {
    if (hasError) return '#dc3545';
    if (isSyncing) return '#ffc107';
    if (isOnline) return '#28a745';
    return '#6c757d';
  };

  const getStatusText = () => {
    if (hasError) return 'Sync Error';
    if (isSyncing) return 'Syncing...';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const handleSync = async () => {
    try {
      await sync();
    } catch (error) {
      // Error handling is managed by the sync service
      console.log('Sync failed:', error);
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={16} 
          color={getStatusColor()} 
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusContainer}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={getStatusColor()} style={styles.icon} />
        ) : (
          <Ionicons 
            name={getStatusIcon() as any} 
            size={20} 
            color={getStatusColor()} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {showButton && !isSyncing && (
        <TouchableOpacity 
          style={[
            styles.syncButton,
            hasError && styles.errorButton,
            !isOnline && styles.offlineButton
          ]} 
          onPress={handleSync}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {hasError ? 'Retry' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 8,
  },
  compactContainer: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  errorButton: {
    backgroundColor: '#dc3545',
  },
  offlineButton: {
    backgroundColor: '#6c757d',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
