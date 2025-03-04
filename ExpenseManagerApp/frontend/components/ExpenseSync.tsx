import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSyncData } from '../hooks/useSyncData';

export function ExpenseSync() {
  const { syncStatus, sync, isOnline, isSyncing, hasError } = useSyncData();

  const getStatusColor = () => {
    if (hasError) return '#ff4444';
    if (isSyncing) return '#ffbb33';
    if (isOnline) return '#00C851';
    return '#ff8800';
  };

  const getStatusText = () => {
    if (hasError) return 'Sync Error';
    if (isSyncing) return 'Syncing...';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      {!isSyncing && (
        <TouchableOpacity 
          style={styles.syncButton} 
          onPress={sync}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {hasError ? 'Retry Sync' : 'Sync Now'}
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
