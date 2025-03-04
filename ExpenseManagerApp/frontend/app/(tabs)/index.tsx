import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Link } from 'expo-router';
import { useSyncContext } from '../../contexts/SyncContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { SyncStatus } from '../../components/SyncStatus';
import { Ionicons } from '@expo/vector-icons';

interface Summary {
  totalExpenses: number;
  totalBudget: number;
  recentExpenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }>;
  topCategories: Array<{
    category: string;
    spent: number;
    limit: number;
  }>;
}

export default function HomeScreen() {
  const { getItem } = useSyncContext();
  const { isConnected } = useNetwork();
  const [summary, setSummary] = useState<Summary>({
    totalExpenses: 0,
    totalBudget: 0,
    recentExpenses: [],
    topCategories: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const [expensesData, budgetsData] = await Promise.all([
        getItem('expenses', 'all'),
        getItem('budgets', 'all'),
      ]);

      const expenses = expensesData?.expenses || [];
      const budgets = budgetsData?.budgets || [];

      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const totalBudget = budgets.reduce((sum: number, budget: any) => sum + budget.limit, 0);

      setSummary({
        totalExpenses,
        totalBudget,
        recentExpenses: expenses.slice(0, 3),
        topCategories: budgets.slice(0, 3),
      });
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setIsLoading(false);
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
        <Text style={styles.title}>Overview</Text>
        <SyncStatus compact showButton={false} />
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={20} color="#fff" />
          <Text style={styles.offlineText}>
            You're offline. Data may not be up to date.
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Monthly Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>${summary.totalExpenses}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={styles.summaryValue}>${summary.totalBudget}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Link href="/expenses" style={styles.sectionLink}>View All</Link>
          </View>
          {summary.recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View>
                <Text style={styles.expenseAmount}>${expense.amount}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </View>
              <Text style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <Link href="/budget" style={styles.sectionLink}>View All</Link>
          </View>
          {summary.topCategories.map((category) => (
            <View key={category.category} style={styles.categoryItem}>
              <View>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categorySpent}>
                  ${category.spent} of ${category.limit}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((category.spent / category.limit) * 100, 100)}%`,
                      backgroundColor: category.spent > category.limit ? '#dc3545' : '#28a745',
                    },
                  ]} 
                />
              </View>
            </View>
          ))}
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
  summaryCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionLink: {
    color: '#007AFF',
    fontSize: 14,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  categoryItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categorySpent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
