import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSyncContext } from '../../contexts/SyncContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { SyncStatus } from '../../components/SyncStatus';
import { Ionicons } from '@expo/vector-icons';

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
}

export default function BudgetScreen() {
  const { saveItem, getItem } = useSyncContext();
  const { isConnected } = useNetwork();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const data = await getItem('budgets', 'all');
      setBudgets(data?.budgets || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDummyBudget = async () => {
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping'];
    const newBudget: Budget = {
      id: Date.now().toString(),
      category: categories[Math.floor(Math.random() * categories.length)],
      limit: Math.floor(Math.random() * 500) + 100,
      spent: Math.floor(Math.random() * 300),
      period: 'monthly',
    };

    try {
      const updatedBudgets = [...budgets, newBudget];
      await saveItem('budgets', 'all', { budgets: updatedBudgets });
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 90) return '#dc3545';
    if (percentage >= 70) return '#ffc107';
    return '#28a745';
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
        <Text style={styles.title}>Budget</Text>
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

      <ScrollView style={styles.content}>
        {budgets.map((budget) => (
          <View key={budget.id} style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
              <Text style={styles.category}>{budget.category}</Text>
              <Text style={styles.period}>{budget.period}</Text>
            </View>
            
            <View style={styles.budgetInfo}>
              <Text style={styles.amount}>
                ${budget.spent} <Text style={styles.limit}>of ${budget.limit}</Text>
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%`,
                    backgroundColor: getProgressColor(budget.spent, budget.limit),
                  },
                ]} 
              />
            </View>
          </View>
        ))}

        {budgets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No budgets set</Text>
            <Text style={styles.emptyStateSubtext}>
              Add a budget to start tracking your spending
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={addDummyBudget}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
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
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 18,
    fontWeight: '600',
  },
  period: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  budgetInfo: {
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
  },
  limit: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'normal',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
});
