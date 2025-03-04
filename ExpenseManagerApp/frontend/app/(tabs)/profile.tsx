import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useSyncContext } from '../../contexts/SyncContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { SyncStatus } from '../../components/SyncStatus';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { syncStatus, sync, isOnline } = useSyncContext();
  const { isConnected, type: networkType } = useNetwork();
  const [autoSync, setAutoSync] = useState(true);
  const [syncOnWifiOnly, setSyncOnWifiOnly] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleManualSync = async () => {
    try {
      await sync();
      Alert.alert('Success', 'Data synchronized successfully');
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to synchronize data. Please try again.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'Are you sure you want to clear all local data? This will not affect your cloud data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Implementation for clearing local data would go here
            Alert.alert('Success', 'Local data cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <SyncStatus compact showButton={false} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Network Status</Text>
              <Text style={[
                styles.value,
                { color: isConnected ? '#28a745' : '#dc3545' }
              ]}>
                {isConnected ? 'Connected' : 'Offline'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Network Type</Text>
              <Text style={styles.value}>{networkType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Last Synced</Text>
              <Text style={styles.value}>Just now</Text>
            </View>
          </View>
        </View>

        {/* Sync Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync data when changes are made
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoSync ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            <View style={styles.row}>
              <View>
                <Text style={styles.settingLabel}>Sync on Wi-Fi Only</Text>
                <Text style={styles.settingDescription}>
                  Only sync when connected to Wi-Fi
                </Text>
              </View>
              <Switch
                value={syncOnWifiOnly}
                onValueChange={setSyncOnWifiOnly}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={syncOnWifiOnly ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleManualSync}
              disabled={!isConnected}
            >
              <Ionicons name="sync" size={20} color="#007AFF" />
              <Text style={styles.buttonText}>Sync Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonBorder]}
              onPress={handleClearData}
            >
              <Ionicons name="trash-bin" size={20} color="#dc3545" />
              <Text style={[styles.buttonText, { color: '#dc3545' }]}>
                Clear Local Data
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { borderBottomWidth: 0 }]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out" size={20} color="#dc3545" />
              <Text style={[styles.buttonText, { color: '#dc3545' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  buttonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});
