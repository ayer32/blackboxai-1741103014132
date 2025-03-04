import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import VoiceRecorder from '../../components/VoiceRecorder';
import { useSyncContext } from '../../contexts/SyncContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { SyncStatus } from '../../components/SyncStatus';
import { Ionicons } from '@expo/vector-icons';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export default function ExpensesScreen() {
  const { saveItem, getItem, isOnline } = useSyncContext();
  const { isConnected } = useNetwork();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await getItem('expenses', 'all');
      setExpenses(data?.expenses || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDummyExpense = async () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: Math.floor(Math.random() * 100) + 1,
      category: 'Food',
      date: new Date().toISOString(),
      description: 'Test expense',
    };

    try {
      const updatedExpenses = [...expenses, newExpense];
      await saveItem('expenses', 'all', { expenses: updatedExpenses });
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <SyncStatus compact showButton={false} />
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="#fff" />
          <Text style={styles.offlineText}>
            You're offline. Changes will sync when you're back online.
          </Text>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <View>
              <Text style={styles.expenseAmount}>${item.amount}</Text>
              <Text style={styles.expenseDescription}>{item.description}</Text>
            </View>
            <Text style={styles.expenseDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No expenses yet</Text>
          </View>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, styles.voiceButton]}
          onPress={() => setShowVoiceRecorder(true)}
        >
          <Ionicons name="mic" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={addDummyExpense}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <VoiceRecorder
        isVisible={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={async (text) => {
          try {
            // Send the transcribed text to the AI endpoint for parsing
            const response = await fetch('/api/ai/parse-expense', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text }),
            });

            const data = await response.json();
            
            if (data.success) {
              const { amount, category, description } = data.data;
              const newExpense = {
                id: Date.now().toString(),
                amount,
                category,
                description,
                date: new Date().toISOString(),
              };

              const updatedExpenses = [...expenses, newExpense];
              await saveItem('expenses', 'all', { expenses: updatedExpenses });
              setExpenses(updatedExpenses);
            } else {
              throw new Error(data.error || 'Failed to parse expense');
            }
          } catch (error) {
            console.error('Error processing voice input:', error);
            Alert.alert(
              'Error',
              'Failed to process voice input. Please try again or add expense manually.'
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    padding: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  voiceButton: {
    backgroundColor: '#34C759',
    marginRight: 16,
  },
});
