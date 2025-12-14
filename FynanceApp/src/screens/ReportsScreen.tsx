import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  useTheme, 
  SegmentedButtons,
  Surface,
  Divider,
  Chip
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import MonthSelector from '../components/common/MonthSelector';
import MonthlyExpensesChart from '../components/charts/MonthlyExpensesChart';
import MonthlyComparisonChart from '../components/charts/MonthlyComparisonChart';
import pluggyService, { PluggyTransaction } from '../services/pluggyService';
import { mockTransactions } from '../data/mockData';

const ReportsScreen = () => {
  const theme = useTheme();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [viewType, setViewType] = useState('overview');
  const [transactions, setTransactions] = useState<PluggyTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carregar transações reais do Pluggy
  const loadTransactions = async () => {
    try {
      console.log('📊 Relatórios: Carregando transações do Pluggy...');
      const cachedTransactions = await pluggyService.getCachedTransactions();
      console.log('📊 Relatórios: Transações carregadas:', cachedTransactions.length);
      setTransactions(cachedTransactions);
    } catch (error) {
      console.error('❌ Erro ao carregar transações nos relatórios:', error);
      setTransactions([]);
    }
  };

  // Recarregar quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  // Refresh control
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  // Converter transações do Pluggy para o formato esperado pelos gráficos
  const convertPluggyTransactions = (pluggyTxs: PluggyTransaction[]) => {
    return pluggyTxs.map(tx => ({
      id: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      description: tx.description,
      category: tx.category || 'Outros',
      subcategory: 'Transação',
      date: tx.date,
      type: (tx.amount > 0 ? 'income' : 'expense') as 'income' | 'expense',
      merchant: tx.description,
      location: ''
    }));
  };

  // Usar dados reais se disponíveis, senão usar mock
  const allTransactions = transactions.length > 0 
    ? convertPluggyTransactions(transactions)
    : mockTransactions;

  // Calculate some stats for the header
  const monthTransactions = allTransactions.filter(t => 
    t.date.startsWith(selectedMonth)
  );
  
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header Section */}
      <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.primary }]} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
            📊 Relatórios Financeiros
          </Text>
          <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onPrimary }]}>
            Análise detalhada dos seus gastos
          </Text>
        </View>
      </Surface>

      {/* Quick Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <Card style={[styles.statCard, styles.incomeCard]}>
          <Card.Content style={styles.statCardContent}>
            <Text variant="bodySmall" style={styles.statLabel}>Receitas</Text>
            <Text variant="titleLarge" style={[styles.statValue, { color: '#2e7d32' }]}>
              R$ {totalIncome.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.expenseCard]}>
          <Card.Content style={styles.statCardContent}>
            <Text variant="bodySmall" style={styles.statLabel}>Despesas</Text>
            <Text variant="titleLarge" style={[styles.statValue, { color: '#d32f2f' }]}>
              R$ {totalExpenses.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.balanceCard]}>
          <Card.Content style={styles.statCardContent}>
            <Text variant="bodySmall" style={styles.statLabel}>Saldo</Text>
            <Text variant="titleLarge" style={[
              styles.statValue, 
              { color: balance >= 0 ? '#2e7d32' : '#d32f2f' }
            ]}>
              R$ {balance.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Month Selector in Card */}
      <Card style={styles.monthCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📅 Período de Análise
          </Text>
          <MonthSelector 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </Card.Content>
      </Card>

      {/* View Type Selector */}
      <Card style={styles.viewTypeCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            👁️ Tipo de Visualização
          </Text>
          <SegmentedButtons
            value={viewType}
            onValueChange={setViewType}
            buttons={[
              { value: 'overview', label: 'Resumo', icon: 'chart-pie' },
              { value: 'detailed', label: 'Detalhado', icon: 'chart-line' },
              { value: 'comparison', label: 'Comparação', icon: 'chart-bar' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Charts Section */}
      {viewType === 'overview' && (
        <>
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                📈 Gastos por Categoria
              </Text>
              <Divider style={styles.divider} />
              <MonthlyExpensesChart 
                transactions={allTransactions}
                selectedMonth={selectedMonth}
              />
            </Card.Content>
          </Card>
        </>
      )}

      {viewType === 'detailed' && (
        <>
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                📊 Análise Detalhada
              </Text>
              <Divider style={styles.divider} />
              <MonthlyExpensesChart 
                transactions={allTransactions}
                selectedMonth={selectedMonth}
              />
            </Card.Content>
          </Card>

          {/* Transaction Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.chartTitle}>
                📋 Resumo de Transações
              </Text>
              <Divider style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Total de transações:</Text>
                <Chip mode="outlined">{monthTransactions.length}</Chip>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Maior gasto:</Text>
                <Chip mode="outlined">
                  R$ {monthTransactions.filter(t => t.type === 'expense').length > 0 
                    ? Math.max(...monthTransactions.filter(t => t.type === 'expense').map(t => Math.abs(t.amount))).toFixed(2)
                    : '0,00'
                  }
                </Chip>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Categoria principal:</Text>
                <Chip mode="outlined">Alimentação</Chip>
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {viewType === 'comparison' && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              📊 Comparação Mensal
            </Text>
            <Divider style={styles.divider} />
            <MonthlyComparisonChart 
              transactions={allTransactions}
            />
          </Card.Content>
        </Card>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSurface: {
    marginBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 3,
  },
  incomeCard: {
    backgroundColor: '#e8f5e8',
  },
  expenseCard: {
    backgroundColor: '#ffebee',
  },
  balanceCard: {
    backgroundColor: '#e3f2fd',
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontWeight: 'bold',
  },
  monthCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  viewTypeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff8e1',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 40,
    paddingVertical: 4,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default ReportsScreen;