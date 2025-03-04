import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useSyncContext } from '../../contexts/SyncContext';
import type { Expense } from '../../types/sync';

export default function InsightsScreen() {
  const { getItem } = useSyncContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });
  const [categoryData, setCategoryData] = useState<{ name: string, amount: number, color: string }[]>([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await getItem('expenses', 'all');
      if (data?.expenses) {
        setExpenses(data.expenses);
        processExpenseData(data.expenses);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const processExpenseData = (expenseData: Expense[]) => {
    // Process monthly totals
    const monthlyData = new Map<string, number>();
    const categoryTotals = new Map<string, number>();
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    expenseData.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      // Update monthly totals
      monthlyData.set(monthYear, (monthlyData.get(monthYear) || 0) + expense.amount);
      
      // Update category totals
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + expense.amount);
    });

    // Sort monthly data chronologically
    const sortedMonths = Array.from(monthlyData.keys()).sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });

    // Prepare data for charts
    setMonthlyTotals({
      labels: sortedMonths,
      data: sortedMonths.map(month => monthlyData.get(month) || 0)
    });

    // Prepare category data for pie chart
    const categoryChartData = Array.from(categoryTotals.entries()).map(([category, amount], index) => ({
      name: category,
      amount,
      color: colors[index % colors.length]
    }));

    setCategoryData(categoryChartData);
  };

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Spending Trends</Text>
        {monthlyTotals.data.length > 0 ? (
          <LineChart
            data={{
              labels: monthlyTotals.labels,
              datasets: [{ data: monthlyTotals.data }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No monthly data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {categoryData.length > 0 ? (
          <>
            <PieChart
              data={categoryData.map(item => ({
                name: item.name,
                population: item.amount,
                color: item.color,
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
              }))}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View style={styles.legendContainer}>
              {categoryData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.name}: ${item.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No category data available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#333',
    fontSize: 14,
  },
});
