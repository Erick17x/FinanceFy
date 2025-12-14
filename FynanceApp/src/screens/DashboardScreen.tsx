import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Card, Text, Divider, FAB, useTheme, Button, IconButton, Chip } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BalanceCard from '../components/dashboard/BalanceCard';
import CreditCardSummary from '../components/dashboard/CreditCardSummary';
import SpendingLimit from '../components/dashboard/SpendingLimit';
import TransactionItem from '../components/common/TransactionItem';
import pluggyService, { PluggyAccount, PluggyTransaction } from '../services/pluggyService';
import { RootStackParamList } from '../types';
import { getTransactionCategory, getTransactionIcon } from '../utils/transactionUtils';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  // Estados para Open Finance
  const [openFinanceAccounts, setOpenFinanceAccounts] = useState<PluggyAccount[]>([]);
  const [openFinanceTransactions, setOpenFinanceTransactions] = useState<PluggyTransaction[]>([]);
  const [ownerName, setOwnerName] = useState<string>('');
  const [isLoadingOpenFinance, setIsLoadingOpenFinance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pegar as 5 transações mais recentes
  const recentTransactions = openFinanceTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleAddTransaction = () => {
    // @ts-ignore - Temporariamente ignorar tipo
    navigation.navigate('AddTransaction');
  };

  const handleNavigateToNotifications = () => {
    // @ts-ignore - Temporariamente ignorar tipo
    navigation.navigate('Notifications');
  };

  const handleNavigateToReports = () => {
    // @ts-ignore - Temporariamente ignorar tipo
    navigation.navigate('Relatórios');
  };

  const handleNavigateToAccounts = () => {
    // @ts-ignore - Temporariamente ignorar tipo
    navigation.navigate('Contas');
  };

  const handleNavigateToBankConnection = () => {
    navigation.navigate('ConnectBank');
  };

  // Carregar dados do Open Finance (apenas do cache local)
  const loadOpenFinanceData = async () => {
    try {
      console.log('📊 Dashboard: Carregando dados do cache local...');
      
      // Carregar items
      const cachedItems = await pluggyService.getCachedItems();
      console.log('📊 Dashboard: Items em cache:', cachedItems.length);
      
      if (cachedItems.length > 0) {
        // Carregar contas do cache
        const cachedAccounts = await pluggyService.getCachedAccounts();
        setOpenFinanceAccounts(cachedAccounts);
        console.log('📊 Dashboard: Contas em cache:', cachedAccounts.length);
        
        // Extrair nome do titular da primeira conta
        if (cachedAccounts.length > 0) {
          // @ts-ignore - owner pode existir
          const owner = cachedAccounts[0].owner || '';
          if (owner) {
            // Pegar apenas o primeiro nome
            const firstName = owner.split(' ')[0];
            setOwnerName(firstName);
            console.log('👤 Nome do titular:', firstName);
          }
        }
        
        // Carregar transações do cache
        const cachedTransactions = await pluggyService.getCachedTransactions();
        setOpenFinanceTransactions(cachedTransactions);
        console.log('📊 Dashboard: Transações em cache:', cachedTransactions.length);
      } else {
        setOpenFinanceAccounts([]);
        setOpenFinanceTransactions([]);
        console.log('📊 Dashboard: Nenhum dado em cache. Conecte uma conta bancária primeiro.');
      }
    } catch (error) {
      console.error('📊 Dashboard: Erro ao carregar cache:', error);
      setOpenFinanceAccounts([]);
      setOpenFinanceTransactions([]);
    }
  };

  // Refresh control
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Dashboard: Iniciando atualização completa com polling...');
      
      // Tentar forçar nova autenticação se houver erro
      let items;
      try {
        items = await pluggyService.getItems();
      } catch (error: any) {
        if (error.message && error.message.includes('Unauthorized')) {
          console.log('🔄 Erro de autenticação detectado, tentando nova autenticação...');
          await pluggyService.forceReauth();
          items = await pluggyService.getItems();
        } else {
          throw error;
        }
      }
      
      if (items.length === 0) {
        console.log('🔄 Nenhuma conta conectada para atualizar.');
        setOpenFinanceAccounts([]);
        setOpenFinanceTransactions([]);
        setOwnerName('');
        setIsRefreshing(false);
        return;
      }

      console.log(`🔄 Disparando atualização para ${items.length} item(s)...`);
      for (const item of items) {
        await pluggyService.updateItem(item.id);
      }

      // Polling para verificar o status da atualização
      const POLLING_INTERVAL = 5000; // 5 segundos
      const MAX_WAIT_TIME = 60000; // 1 minuto
      let elapsedTime = 0;

      const poll = async (): Promise<boolean> => {
        if (elapsedTime >= MAX_WAIT_TIME) {
          console.warn('🔄 Polling timeout. Buscando dados mesmo assim.');
          return true; // Sai do loop
        }

        const updatedItems = await pluggyService.getItems();
        const isSyncing = updatedItems.some(item => item.status === 'UPDATING');

        if (isSyncing) {
          console.log(`🔄 Sincronizando... Verificando novamente em ${POLLING_INTERVAL / 1000}s`);
          elapsedTime += POLLING_INTERVAL;
          await new Promise<void>(resolve => setTimeout(resolve, POLLING_INTERVAL));
          return poll();
        } else {
          console.log('✅ Sincronização concluída!');
          return true;
        }
      };

      await poll();

      // Buscar os dados atualizados
      console.log('🔄 Buscando dados pós-sincronização...');
      const accounts = await pluggyService.getAllAccounts();
      setOpenFinanceAccounts(accounts);

      if (accounts.length > 0) {
        const accountIds = accounts.map(acc => acc.id);
        console.log('🔄 Account IDs para buscar transações:', accountIds);
        const transactions = await pluggyService.getAllTransactions(accountIds);
        console.log('🔄 Transações carregadas:', transactions.length);
        setOpenFinanceTransactions(transactions);

        // @ts-ignore - owner pode existir
        const owner = accounts[0].owner || '';
        if (owner) {
          const firstName = owner.split(' ')[0];
          setOwnerName(firstName);
        }
      } else {
        console.log('🔄 Nenhuma conta encontrada, carregando transações do cache...');
        // Mesmo sem contas, tentar carregar transações do cache
        const cachedTransactions = await pluggyService.getCachedTransactions();
        setOpenFinanceTransactions(cachedTransactions);
        setOwnerName('');
      }

      console.log('🔄 Atualização completa!');

    } catch (error) {
      console.error('🔄 Dashboard: Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadOpenFinanceData();
  }, []);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadOpenFinanceData();
    }, [])
  );

  // Calcular saldo total apenas das contas bancárias (exclui cartões de crédito)
  const getTotalOpenFinanceBalance = () => {
    return openFinanceAccounts
      .filter(account => account.type === 'BANK')
      .reduce((total, account) => {
        // A API do Pluggy retorna balance diretamente como número
        if (account.balance) {
          return total + account.balance;
        }
        return total;
      }, 0);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#1976d2']}
          />
        }
      >
        {/* Header with notifications */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.welcomeText}>
              Olá{ownerName ? `, ${ownerName}` : ''}! 👋
            </Text>
            {ownerName && (
              <Text variant="bodySmall" style={styles.welcomeSubtext}>
                Bem-vindo ao seu painel financeiro
              </Text>
            )}
          </View>
          <IconButton
            icon="bell"
            size={24}
            onPress={handleNavigateToNotifications}
            style={[styles.notificationButton, { backgroundColor: theme.colors.primaryContainer }]}
          />
        </View>

        <BalanceCard accounts={openFinanceAccounts} />

        {/* Open Finance Accounts Section */}
        {openFinanceAccounts.length > 0 && (
          <Card style={styles.openFinanceCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  🏦 Contas Conectadas (Open Finance)
                </Text>
                <Chip 
                  style={styles.accountCountChip}
                  textStyle={styles.accountCountText}
                >
                  {openFinanceAccounts.length} conta{openFinanceAccounts.length !== 1 ? 's' : ''}
                </Chip>
              </View>
              
              <Text variant="bodyLarge" style={styles.totalBalanceText}>
                Saldo Total: {formatBalance(getTotalOpenFinanceBalance())}
              </Text>

              {openFinanceAccounts.slice(0, 2).map((account, index) => {
                return (
                  <View key={account.id} style={styles.accountItem}>
                    <View style={styles.accountInfo}>
                      <Text variant="bodyMedium" style={styles.accountName} numberOfLines={2} ellipsizeMode="tail">
                        {account.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.accountNumber}>
                        {account.number || account.id.substring(0, 8)}
                      </Text>
                    </View>
                    <View style={styles.accountBalance}>
                      <Text variant="bodyLarge" style={styles.balanceAmount}>
                        {formatBalance(account.balance || 0)}
                      </Text>
                      <Chip 
                        style={[
                          styles.accountTypeChip,
                          { backgroundColor: account.type === 'BANK' ? '#2196f3' : '#9c27b0' }
                        ]}
                        textStyle={styles.accountTypeText}
                      >
                        {account.type === 'BANK' 
                          ? (account.subtype === 'CHECKING_ACCOUNT' ? 'Corrente' : 'Poupança')
                          : 'Cartão'}
                      </Chip>
                    </View>
                  </View>
                );
              })}

              {openFinanceAccounts.length > 2 && (
                <Button
                  mode="outlined"
                  onPress={handleNavigateToBankConnection}
                  style={styles.viewAllButton}
                  compact
                >
                  Ver Todas as Contas ({openFinanceAccounts.length})
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
        
        {/* Remover dados mockados - usar apenas dados reais do Pluggy */}

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.quickActionsTitle}>
              ⚡ Ações Rápidas
            </Text>
            
            <View style={styles.quickActionsGrid}>
              <Button
                mode="outlined"
                onPress={handleNavigateToReports}
                icon="chart-line"
                style={styles.quickActionButton}
              >
                Relatórios
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleNavigateToAccounts}
                icon="bank"
                style={styles.quickActionButton}
              >
                Contas
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Investments')}
                icon="chart-line-variant"
                style={styles.quickActionButton}
              >
                Investimentos
              </Button>
              
            </View>
            
            <View style={styles.quickActionsGrid}>
              <Button
                mode="outlined"
                onPress={handleNavigateToNotifications}
                icon="bell"
                style={styles.quickActionButton}
              >
                Notificações
              </Button>
              
              <Button
                mode="contained"
                onPress={handleNavigateToBankConnection}
                icon="bank"
                style={styles.quickActionButton}
              >
                Open Finance
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        {/* Transações Recentes - Dados Reais do Pluggy */}
        {openFinanceTransactions.length > 0 && (
          <Card style={styles.transactionsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.transactionsTitle}>
                💸 Transações Recentes
              </Text>
              {recentTransactions.map((transaction, index) => {
                // 1. Busca a conta vinculada para saber se é Cartão ou Banco
                const transactionAccount = openFinanceAccounts.find(acc => acc.id === transaction.accountId);
                
                // Log para debug: verificar se a conta foi encontrada
                if (!transactionAccount) {
                  console.warn('⚠️ Dashboard - Conta não encontrada para transação:', {
                    transactionId: transaction.id,
                    accountId: transaction.accountId,
                    availableAccountIds: openFinanceAccounts.map(acc => acc.id)
                  });
                }
                
                // Detecção mais robusta de cartão de crédito (similar ao CardsScreen)
                const accountType = transactionAccount?.type?.toUpperCase();
                const accountSubtype = transactionAccount?.subtype?.toUpperCase();
                const accountName = transactionAccount?.name?.toUpperCase() || '';
                
                const isCreditCard = accountType === 'CREDIT' || 
                                    accountSubtype === 'CREDIT_CARD' ||
                                    accountName.includes('CARTÃO') ||
                                    accountName.includes('CREDIT') ||
                                    accountName.includes('MASTERCARD') ||
                                    accountName.includes('VISA') ||
                                    accountName.includes('ELO');

                // 2. Lógica de determinação de débito (gasto) vs crédito (recebimento)
                // Para cartão de crédito: a API retorna valores POSITIVOS para gastos
                // Para banco/PIX: a API retorna valores NEGATIVOS para gastos
                let isDebit: boolean;
                if (isCreditCard) {
                  // Cartão de crédito: Valor POSITIVO (+) é GASTO (deve aparecer em VERMELHO)
                  // Valor NEGATIVO (-) é CRÉDITO/ESTORNO (deve aparecer em VERDE)
                  isDebit = transaction.amount > 0;
                } else {
                  // Banco/PIX/Débito: Valor NEGATIVO (-) é GASTO (deve aparecer em VERMELHO)
                  // Valor POSITIVO (+) é RECEBIMENTO (deve aparecer em VERDE)
                  isDebit = transaction.amount < 0;
                }
                
                const category = getTransactionCategory(transaction.description, transaction.amount);
                const icon = getTransactionIcon(transaction.description, transaction.amount);
                
                console.log('🔍 Dashboard - Transaction:', {
                  description: transaction.description,
                  amount: transaction.amount,
                  accountId: transaction.accountId,
                  accountType: accountType,
                  accountSubtype: accountSubtype,
                  accountName: transactionAccount?.name,
                  isCreditCard: isCreditCard,
                  isDebit: isDebit,
                  category: category,
                  willShowAsRed: isDebit
                });
                
                return (
                  <React.Fragment key={transaction.id}>
                    <View style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View style={[
                          styles.transactionIconContainer,
                          { backgroundColor: isDebit ? '#ffebee' : '#e8f5e9' }
                        ]}>
                          <IconButton
                            icon={icon}
                            size={18}
                            iconColor={isDebit ? '#f44336' : '#4caf50'}
                            style={styles.transactionIcon}
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text variant="bodyMedium" style={styles.transactionDescription}>
                            {transaction.description}
                          </Text>
                          <Text variant="bodySmall" style={styles.transactionDate}>
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </Text>
                          <View style={{
                            backgroundColor: '#e3f2fd',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            alignSelf: 'flex-start',
                            marginTop: 4
                          }}>
                            <Text style={{ color: '#1976d2', fontSize: 10, fontWeight: '500' }}>
                              {category}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text 
                          variant="bodyMedium" 
                          style={[
                            styles.transactionAmount,
                            { color: isDebit ? '#f44336' : '#4caf50' }
                          ]}
                          numberOfLines={1}
                        >
                          {/* Para cartão de crédito: se for gasto (positivo), mostrar como negativo */}
                          {/* Para banco: usar o sinal original do valor */}
                          {isCreditCard && isDebit 
                            ? `- ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Math.abs(transaction.amount))}`
                            : `${isDebit ? '-' : '+'} ${new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Math.abs(transaction.amount))}`}
                        </Text>
                      </View>
                    </View>
                    {index < recentTransactions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
              
              {openFinanceTransactions.length > 5 && (
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Transactions')}
                  style={{ marginTop: 8 }}
                >
                  Ver Todas ({openFinanceTransactions.length})
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

    <FAB
      icon="plus"
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      onPress={handleAddTransaction}
      label="Nova Transação"
      color="white"
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 80, // Espaço para o FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontWeight: 'bold',
  },
  welcomeSubtext: {
    color: '#666',
    marginTop: 4,
  },
  notificationButton: {
    margin: 0,
  },
  quickActionsCard: {
    marginTop: 16,
  },
  quickActionsTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: 120,
    maxWidth: '48%', // Garantir que não ultrapasse metade da largura
  },
  transactionsCard: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 4,
  },
  transactionsTitle: {
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 80,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    maxWidth: '70%',
  },
  transactionIconContainer: {
    borderRadius: 18,
    marginRight: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIcon: {
    margin: 0,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionDescription: {
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontSize: 13,
    lineHeight: 16,
    flexWrap: 'wrap',
    flex: 1,
    maxWidth: '100%',
  },
  transactionDate: {
    color: '#666',
    fontSize: 11,
  },
  transactionCategoryChip: {
    alignSelf: 'flex-start',
    height: 18,
    marginTop: 2,
  },
  transactionCategoryText: {
    fontSize: 9,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
    maxWidth: '30%',
    paddingLeft: 8,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
    paddingRight: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    maxWidth: '80%', // Limitar largura máxima
  },
  openFinanceCard: {
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  accountCountChip: {
    backgroundColor: '#e3f2fd',
    maxWidth: 120,
    flexShrink: 1,
  },
  accountCountText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalBalanceText: {
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 16,
    textAlign: 'center',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexWrap: 'wrap',
    minHeight: 60,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  accountName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    flex: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  accountNumber: {
    color: '#666',
    fontSize: 12,
  },
  accountBalance: {
    alignItems: 'flex-end',
    minWidth: 100,
    maxWidth: '45%',
    flexShrink: 1,
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  accountTypeChip: {
    minWidth: 60,
    maxWidth: 100,
    flexShrink: 1,
  },
  accountTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewAllButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
});

export default DashboardScreen;