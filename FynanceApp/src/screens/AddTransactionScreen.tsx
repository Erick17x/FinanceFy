import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme,
  SegmentedButtons,
  Menu,
  Divider,
  Chip
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import pluggyService, { PluggyAccount, PluggyTransaction } from '../services/pluggyService';
import { mockAccounts, mockCreditCards } from '../data/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AddTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface TransactionForm {
  type: 'income' | 'expense';
  amount: string;
  description: string;
  category: string;
  subcategory: string;
  accountId: string;
  creditCardId?: string;
  date: string;
  merchant: string;
  notes: string;
}

const AddTransactionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  
  // Estados para dados reais do Pluggy
  const [pluggyAccounts, setPluggyAccounts] = useState<PluggyAccount[]>([]);
  const [pluggyCreditCards, setPluggyCreditCards] = useState<PluggyAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const [formData, setFormData] = useState<TransactionForm>({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    subcategory: '',
    accountId: '',
    creditCardId: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [cardMenuVisible, setCardMenuVisible] = useState(false);


  // Categorias disponíveis
  const categories = {
    expense: [
      'Alimentação',
      'Transporte',
      'Casa',
      'Saúde',
      'Entretenimento',
      'Educação',
      'Compras',
      'Serviços',
      'Outros'
    ],
    income: [
      'Salário',
      'Freelance',
      'Investimentos',
      'Vendas',
      'Presente',
      'Outros'
    ]
  };

  // Carregar dados reais do Pluggy com fallback para mock
  const loadPluggyData = async () => {
    setIsLoadingAccounts(true);
    try {
      console.log('💳 AddTransaction: Carregando dados do Pluggy...');
      
      // Tentar carregar contas do cache primeiro
      const cachedAccounts = await pluggyService.getCachedAccounts();
      console.log('💳 AddTransaction: Contas em cache:', cachedAccounts.length);
      
      if (cachedAccounts.length > 0) {
        // Separar contas bancárias de cartões de crédito
        const bankAccounts = cachedAccounts.filter(account => account.type === 'BANK');
        const creditCards = cachedAccounts.filter(account => account.type === 'CREDIT');
        
        setPluggyAccounts(bankAccounts);
        setPluggyCreditCards(creditCards);
        setUsingMockData(false);
        
        // Selecionar primeira conta automaticamente se disponível
        if (bankAccounts.length > 0 && !formData.accountId) {
          setFormData(prev => ({ ...prev, accountId: bankAccounts[0].id }));
        }
        
        console.log('💳 AddTransaction: Contas bancárias:', bankAccounts.length);
        console.log('💳 AddTransaction: Cartões de crédito:', creditCards.length);
      } else {
        // Fallback para dados mock
        console.log('💳 AddTransaction: Usando dados mock como fallback');
        setUsingMockData(true);
        
        // Converter dados mock para formato PluggyAccount
        const mockBankAccounts: PluggyAccount[] = mockAccounts.map(account => ({
          id: account.id,
          itemId: 'mock-item',
          type: 'BANK',
          subtype: account.type === 'checking' ? 'CHECKING_ACCOUNT' : 'SAVINGS_ACCOUNT',
          number: account.accountNumber,
          name: account.name,
          balance: account.balance,
          currencyCode: account.currency
        }));
        
        const mockCreditCards: PluggyAccount[] = mockCreditCards.map(card => ({
          id: card.id,
          itemId: 'mock-item',
          type: 'CREDIT',
          subtype: 'CREDIT_CARD',
          number: `****${card.lastFourDigits}`,
          name: card.name,
          balance: card.currentBalance,
          currencyCode: 'BRL',
          creditData: {
            creditLimit: card.limit,
            availableCreditLimit: card.availableLimit,
            status: 'ACTIVE'
          }
        }));
        
        setPluggyAccounts(mockBankAccounts);
        setPluggyCreditCards(mockCreditCards);
        
        // Selecionar primeira conta automaticamente se disponível
        if (mockBankAccounts.length > 0 && !formData.accountId) {
          setFormData(prev => ({ ...prev, accountId: mockBankAccounts[0].id }));
        }
        
        console.log('💳 AddTransaction: Mock - Contas bancárias:', mockBankAccounts.length);
        console.log('💳 AddTransaction: Mock - Cartões de crédito:', mockCreditCards.length);
      }
      
    } catch (error) {
      console.error('💳 AddTransaction: Erro ao carregar dados do Pluggy:', error);
      
      // Em caso de erro, usar dados mock
      console.log('💳 AddTransaction: Erro, usando dados mock como fallback');
      setUsingMockData(true);
      
      const mockBankAccounts: PluggyAccount[] = mockAccounts.map(account => ({
        id: account.id,
        itemId: 'mock-item',
        type: 'BANK',
        subtype: account.type === 'checking' ? 'CHECKING_ACCOUNT' : 'SAVINGS_ACCOUNT',
        number: account.accountNumber,
        name: account.name,
        balance: account.balance,
        currencyCode: account.currency
      }));
      
      const mockCreditCards: PluggyAccount[] = mockCreditCards.map(card => ({
        id: card.id,
        itemId: 'mock-item',
        type: 'CREDIT',
        subtype: 'CREDIT_CARD',
        number: `****${card.lastFourDigits}`,
        name: card.name,
        balance: card.currentBalance,
        currencyCode: 'BRL',
        creditData: {
          creditLimit: card.limit,
          availableCreditLimit: card.availableLimit,
          status: 'ACTIVE'
        }
      }));
      
      setPluggyAccounts(mockBankAccounts);
      setPluggyCreditCards(mockCreditCards);
      
      // Selecionar primeira conta automaticamente se disponível
      if (mockBankAccounts.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: mockBankAccounts[0].id }));
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('💳 AddTransaction: Inicializando tela...');
    loadPluggyData();
  }, []);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('💳 AddTransaction: Tela ganhou foco, recarregando dados...');
      loadPluggyData();
    }, [])
  );

  const updateField = (field: keyof TransactionForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { amount, description, category, accountId } = formData;

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição');
      return false;
    }

    if (!category) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria');
      return false;
    }

    if (!accountId) {
      Alert.alert('Erro', 'Por favor, selecione uma conta');
      return false;
    }

    if (pluggyAccounts.length === 0) {
      Alert.alert(
        'Nenhuma conta disponível', 
        'Não há contas disponíveis para esta transação. Verifique se você conectou suas contas ou se os dados estão sendo carregados corretamente.',
        [
          { text: 'OK' },
          { 
            text: 'Conectar conta', 
            onPress: () => navigation.navigate('ConnectBank')
          }
        ]
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const selectedAccount = getSelectedAccount();
      const selectedCard = getSelectedCard();
      
      if (!selectedAccount) {
        Alert.alert('Erro', 'Conta selecionada não encontrada');
        return;
      }

      // Criar transação no formato PluggyTransaction
      const newTransaction: PluggyTransaction = {
        id: Date.now().toString(),
        accountId: selectedAccount.id,
        date: new Date(formData.date).toISOString(),
        description: formData.description,
        amount: formData.type === 'expense' 
          ? -parseFloat(formData.amount) 
          : parseFloat(formData.amount),
        balance: (selectedAccount.balance || 0) + (formData.type === 'expense' 
          ? -parseFloat(formData.amount) 
          : parseFloat(formData.amount)),
        category: formData.category,
        type: formData.type === 'expense' ? 'DEBIT' : 'CREDIT'
      };

      console.log('💳 Nova transação criada:', newTransaction);
      
      // Salvar transação no cache
      const saved = await saveTransactionToCache(newTransaction);
      
      if (!saved) {
        Alert.alert('Erro', 'Falha ao salvar transação. Tente novamente.');
        return;
      }
      
      Alert.alert(
        'Sucesso!', 
        `Transação de ${formData.type === 'expense' ? 'despesa' : 'receita'} adicionada com sucesso!\n\n` +
        `💰 Valor: ${formatBalance(Math.abs(parseFloat(formData.amount)))}\n` +
        `📝 Descrição: ${formData.description}\n` +
        `🏦 Conta: ${selectedAccount.name}\n` +
        `📅 Data: ${new Date(formData.date).toLocaleDateString('pt-BR')}`,
        [
          {
            text: 'Adicionar outra',
            onPress: () => {
              setFormData({
                ...formData,
                amount: '',
                description: '',
                merchant: '',
                notes: '',
                category: '', // Reset categoria para permitir nova seleção
              });
            }
          },
          {
            text: 'Ver transações',
            onPress: () => navigation.navigate('Transactions'),
            style: 'default'
          },
          {
            text: 'Voltar',
            onPress: () => navigation.goBack(),
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('💳 Erro ao salvar transação:', error);
      Alert.alert('Erro', 'Falha ao salvar transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAccount = () => {
    return pluggyAccounts.find(acc => acc.id === formData.accountId) || null;
  };

  const getSelectedCard = () => {
    return pluggyCreditCards.find(card => card.id === formData.creditCardId);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Salvar transação no cache
  const saveTransactionToCache = async (transaction: PluggyTransaction) => {
    try {
      console.log('💾 Salvando transação no cache...');
      
      // Buscar transações existentes
      const existingTransactions = await pluggyService.getCachedTransactions();
      console.log('💾 Transações existentes:', existingTransactions.length);
      
      // Adicionar nova transação
      const updatedTransactions = [...existingTransactions, transaction];
      
      // Salvar no cache
      await AsyncStorage.setItem('@fynance:pluggy_transactions', JSON.stringify(updatedTransactions));
      
      console.log('✅ Transação salva no cache com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar transação no cache:', error);
      return false;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Text variant="headlineSmall" style={styles.title}>
        Nova Transação
      </Text>

      {/* Type Selector */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Tipo de Transação
          </Text>
          
          <SegmentedButtons
            value={formData.type}
            onValueChange={(value) => {
              updateField('type', value as 'income' | 'expense');
              updateField('category', ''); // Reset category when type changes
            }}
            buttons={[
              {
                value: 'expense',
                label: '💸 Despesa',
                icon: 'minus'
              },
              {
                value: 'income',
                label: '💰 Receita',
                icon: 'plus'
              }
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Amount and Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informações Básicas
          </Text>
          
          <TextInput
            label={`Valor ${formData.type === 'expense' ? '(R$)' : '(R$)'}`}
            value={formData.amount}
            onChangeText={(value) => updateField('amount', value.replace(/[^0-9.,]/g, ''))}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            left={<TextInput.Icon icon={formData.type === 'expense' ? 'minus' : 'plus'} />}
            placeholder="0,00"
          />

          <TextInput
            label="Descrição"
            value={formData.description}
            onChangeText={(value) => updateField('description', value)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="text" />}
            placeholder="Ex: Almoço no restaurante"
          />

          <TextInput
            label="Data"
            value={formData.date}
            onChangeText={(value) => updateField('date', value)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="calendar" />}
          />
        </Card.Content>
      </Card>

      {/* Category */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Categoria
          </Text>
          
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCategoryMenuVisible(true)}
                style={styles.menuButton}
                icon="tag"
              >
                {formData.category || 'Selecionar categoria'}
              </Button>
            }
          >
            {categories[formData.type].map((category) => (
              <Menu.Item
                key={category}
                onPress={() => {
                  updateField('category', category);
                  setCategoryMenuVisible(false);
                }}
                title={category}
              />
            ))}
          </Menu>

          {formData.category && (
            <Chip
              style={styles.categoryChip}
              icon="tag"
              onClose={() => updateField('category', '')}
            >
              {formData.category}
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Account Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Conta e Pagamento
              </Text>
              {usingMockData && (
                <Chip
                  mode="outlined"
                  compact
                  style={styles.mockDataChip}
                  textStyle={styles.mockDataChipText}
                >
                  Demo
                </Chip>
              )}
            </View>
            <Button
              mode="text"
              onPress={loadPluggyData}
              loading={isLoadingAccounts}
              icon="refresh"
              compact
              style={styles.refreshButton}
            >
              Atualizar
            </Button>
          </View>
          
          {isLoadingAccounts && (
            <View style={styles.loadingContainer}>
              <Text variant="bodyMedium" style={styles.loadingText}>
                🔄 Carregando contas...
              </Text>
            </View>
          )}
          
          {pluggyAccounts.length === 0 && !isLoadingAccounts && (
            <View style={styles.noAccountsContainer}>
              <Text variant="bodyMedium" style={styles.noAccountsText}>
                📱 Nenhuma conta bancária disponível
              </Text>
              <Text variant="bodySmall" style={styles.noAccountsSubtext}>
                {usingMockData 
                  ? 'Usando dados de demonstração. Conecte suas contas reais via Open Finance.'
                  : 'Conecte suas contas bancárias via Open Finance para adicionar transações'
                }
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('ConnectBank')}
                style={styles.connectButton}
                icon="bank"
              >
                Conectar Contas
              </Button>
            </View>
          )}
          
          <Menu
            visible={accountMenuVisible}
            onDismiss={() => setAccountMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setAccountMenuVisible(true)}
                style={styles.menuButton}
                icon="bank"
                loading={isLoadingAccounts}
                disabled={isLoadingAccounts}
              >
                {isLoadingAccounts 
                  ? 'Carregando contas...' 
                  : getSelectedAccount() 
                    ? `${getSelectedAccount()?.name} - ${formatBalance(getSelectedAccount()?.balance || 0)}`
                    : 'Selecionar conta'
                }
              </Button>
            }
          >
            {pluggyAccounts.length > 0 ? pluggyAccounts.map((account) => (
              <Menu.Item
                key={account.id}
                onPress={() => {
                  updateField('accountId', account.id);
                  setAccountMenuVisible(false);
                }}
                title={`${account.name} - ${formatBalance(account.balance || 0)}`}
                description={account.subtype === 'CHECKING_ACCOUNT' ? 'Conta Corrente' : 'Poupança'}
              />
            )) : (
              <Menu.Item
                onPress={() => setAccountMenuVisible(false)}
                title="Nenhuma conta conectada"
                description="Conecte uma conta bancária primeiro"
                disabled
              />
            )}
          </Menu>

          {formData.type === 'expense' && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodyMedium" style={styles.optionalLabel}>
                Cartão de Crédito (opcional)
              </Text>
              
              <Menu
                visible={cardMenuVisible}
                onDismiss={() => setCardMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setCardMenuVisible(true)}
                    style={styles.menuButton}
                    icon="credit-card"
                    disabled={isLoadingAccounts}
                  >
                    {getSelectedCard()?.name || 'Nenhum cartão'}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    updateField('creditCardId', '');
                    setCardMenuVisible(false);
                  }}
                  title="Nenhum cartão"
                />
                {pluggyCreditCards.map((card) => (
                  <Menu.Item
                    key={card.id}
                    onPress={() => {
                      updateField('creditCardId', card.id);
                      setCardMenuVisible(false);
                    }}
                    title={`${card.name}`}
                    description={`Limite: ${formatBalance(card.creditData?.creditLimit || 0)}`}
                  />
                ))}
                {pluggyCreditCards.length === 0 && (
                  <Menu.Item
                    onPress={() => setCardMenuVisible(false)}
                    title="Nenhum cartão conectado"
                    description="Conecte um cartão de crédito primeiro"
                    disabled
                  />
                )}
              </Menu>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Additional Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informações Adicionais
          </Text>
          
          <TextInput
            label="Estabelecimento/Origem"
            value={formData.merchant}
            onChangeText={(value) => updateField('merchant', value)}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="store" />}
            placeholder="Ex: Restaurante do João"
          />

          <TextInput
            label="Observações"
            value={formData.notes}
            onChangeText={(value) => updateField('notes', value)}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="note" />}
            placeholder="Observações adicionais..."
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancelar
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
        >
          {loading ? 'Salvando...' : 'Salvar Transação'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  menuButton: {
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  optionalLabel: {
    marginBottom: 8,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 4,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6c757d',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noAccountsContainer: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  noAccountsText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noAccountsSubtext: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  connectButton: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockDataChip: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
  },
  mockDataChipText: {
    color: '#856404',
    fontSize: 10,
  },
  refreshButton: {
    minWidth: 80,
  },
});

export default AddTransactionScreen;






