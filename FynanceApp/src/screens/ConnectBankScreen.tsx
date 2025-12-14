import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, StatusBar, RefreshControl } from 'react-native';
import { Text, Button, Card, ActivityIndicator, IconButton, List, Divider } from 'react-native-paper';
import { PluggyConnect } from 'react-native-pluggy-connect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pluggyService, { PluggyItem, PluggyAccount } from '../services/pluggyService';

const ConnectBankScreen = () => {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PluggyItem[]>([]);
  const [accounts, setAccounts] = useState<PluggyAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCachedData();
  }, []);

  // Carregar dados do cache
  const loadCachedData = async () => {
    try {
      setLoading(true);
      console.log('📦 Carregando dados do cache...');
      
      const cachedItems = await pluggyService.getCachedItems();
      const cachedAccounts = await pluggyService.getCachedAccounts();
      
      if (cachedItems.length > 0) {
        console.log('✅ Cache carregado - Items:', cachedItems.length, 'Contas:', cachedAccounts.length);
        setItems(cachedItems);
        setAccounts(cachedAccounts);
      } else {
        console.log('ℹ️ Nenhuma conta conectada ainda');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar cache:', err);
      setError('Erro ao carregar dados salvos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar connect token (igual ao quickstart)
  const fetchConnectToken = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔑 Buscando connect token...');
      
      const token = await pluggyService.createConnectToken();
      console.log('✅ Connect token obtido');
      setConnectToken(token);
    } catch (err: any) {
      console.error('❌ Erro ao buscar token:', err);
      setError(err.message || 'Erro ao conectar com Pluggy');
    } finally {
      setLoading(false);
    }
  };

  // Callbacks do Pluggy (igual ao quickstart)
  const handleOnOpen = useCallback(() => {
    console.log('📱 Widget Pluggy aberto');
  }, []);

  const handleOnSuccess = useCallback(async (itemData: any) => {
    console.log('🎉 Conexão bem-sucedida!', JSON.stringify(itemData, null, 2));
    
    // Extrair o Item ID do itemData
    const itemId = itemData?.item?.id;
    console.log('🆔 Item ID extraído:', itemId);
    
    if (!itemId) {
      console.error('❌ Item ID não encontrado no itemData');
      Alert.alert('Erro', 'Item ID não encontrado. Tente novamente.');
      setConnectToken(null);
      return;
    }
    
    // Fechar widget
    setConnectToken(null);
    
    // Aguardar e buscar dados usando o Item ID
    setTimeout(async () => {
      try {
        console.log('🔍 Buscando dados da API após sucesso...');
        console.log('🔍 Usando Item ID:', itemId);
        
        // Buscar contas diretamente usando o Item ID
        const apiAccounts = await pluggyService.getAccountsByItemId(itemId);
        console.log('💰 Contas encontradas:', apiAccounts.length);
        
        // Buscar transações de todas as contas
        const accountIds = apiAccounts.map(acc => acc.id);
        const apiTransactions = await pluggyService.getAllTransactions(accountIds);
        console.log('💸 Transações encontradas:', apiTransactions.length);
        
        // Criar um item mock para exibir na UI
        const mockItem = {
          id: itemId,
          connector: itemData.item.connector || {
            id: 200,
            name: 'MeuPluggy (Sandbox)'
          },
          createdAt: new Date().toISOString(),
          status: 'UPDATED',
          executionStatus: 'UPDATED'
        };
        
        // ✅ SALVAR NO CACHE - ADICIONAR À LISTA EXISTENTE
        console.log('💾 Salvando Item ID...');
        await AsyncStorage.setItem('@fynance:pluggy_item_id', itemId);
        
        // Buscar items existentes e adicionar apenas se não existir
        const existingItems = await pluggyService.getCachedItems();
        const itemExists = existingItems.some(item => item.id === mockItem.id);
        const updatedItems = itemExists ? existingItems : [...existingItems, mockItem];
        console.log('💾 Salvando items no cache (evitando duplicação)...');
        await AsyncStorage.setItem('@fynance:pluggy_items', JSON.stringify(updatedItems));
        
        // Buscar accounts existentes e adicionar apenas os novos
        const existingAccounts = await pluggyService.getCachedAccounts();
        const newAccounts = apiAccounts.filter(newAcc => 
          !existingAccounts.some(existingAcc => existingAcc.id === newAcc.id)
        );
        const updatedAccounts = [...existingAccounts, ...newAccounts];
        console.log('💾 Salvando accounts no cache (evitando duplicação)...');
        await AsyncStorage.setItem('@fynance:pluggy_accounts', JSON.stringify(updatedAccounts));
        
        // Buscar transactions existentes e adicionar apenas as novas
        const existingTransactions = await pluggyService.getCachedTransactions();
        const newTransactions = apiTransactions.filter(newTx => 
          !existingTransactions.some(existingTx => existingTx.id === newTx.id)
        );
        const updatedTransactions = [...existingTransactions, ...newTransactions];
        console.log('💾 Salvando transactions no cache (evitando duplicação)...');
        await AsyncStorage.setItem('@fynance:pluggy_transactions', JSON.stringify(updatedTransactions));
        
        console.log('✅ Dados salvos no cache com sucesso!');
        
        // Atualizar estado com todas as contas
        setItems(updatedItems);
        setAccounts(updatedAccounts);
        
        Alert.alert(
          'Sucesso!',
          `Conta conectada!\n\n${updatedItems.length} instituição(ões)\n${updatedAccounts.length} conta(s)`,
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('❌ Erro ao buscar dados após sucesso:', err);
        Alert.alert('Sucesso!', 'Conta conectada! Os dados estão sendo sincronizados.');
      }
    }, 3000);
  }, [connectToken]);

  const handleOnError = useCallback((error: any) => {
    console.error('❌ Erro no Pluggy:', error);
    setConnectToken(null);
    Alert.alert('Erro', error.message || 'Erro ao conectar conta');
  }, []);

  const handleOnClose = useCallback(async () => {
    console.log('🚪 Widget Pluggy fechado');
    
    // Guardar o connectToken antes de limpar
    const currentConnectToken = connectToken;
    setConnectToken(null);
    
    // Tentar buscar dados mesmo se o widget fechou sem sucesso explícito
    console.log('🔄 Widget fechou - tentando buscar dados...');
    try {
      // Aguardar um pouco para o Pluggy processar
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      
      const apiItems = await pluggyService.getItems(currentConnectToken || undefined);
      console.log('📦 Items encontrados após fechamento:', apiItems.length);
      
      if (apiItems.length > 0) {
        const apiAccounts = await pluggyService.getAllAccounts(currentConnectToken || undefined);
        console.log('💰 Contas encontradas após fechamento:', apiAccounts.length);
        
        // Buscar dados existentes e mesclar
        const existingItems = await pluggyService.getCachedItems();
        const existingAccounts = await pluggyService.getCachedAccounts();
        
        // Filtrar apenas novos items (que não existem no cache)
        const newItems = apiItems.filter(newItem => 
          !existingItems.some(existingItem => existingItem.id === newItem.id)
        );
        
        if (newItems.length > 0) {
          const updatedItems = [...existingItems, ...newItems];
          
          // Filtrar apenas contas novas (evitar duplicação)
          const newAccounts = apiAccounts.filter(newAcc => 
            !existingAccounts.some(existingAcc => existingAcc.id === newAcc.id)
          );
          const updatedAccounts = [...existingAccounts, ...newAccounts];
          
          // Salvar no cache
          await AsyncStorage.setItem('@fynance:pluggy_items', JSON.stringify(updatedItems));
          await AsyncStorage.setItem('@fynance:pluggy_accounts', JSON.stringify(updatedAccounts));
          
          // Atualizar estado
          setItems(updatedItems);
          setAccounts(updatedAccounts);
          
          Alert.alert(
            'Sucesso!',
            `Conta conectada!\n\n${updatedItems.length} instituição(ões)\n${updatedAccounts.length} conta(s)`,
            [{ text: 'OK' }]
          );
        } else {
          console.log('ℹ️ Nenhum item novo encontrado após fechamento do widget');
        }
      } else {
        console.log('ℹ️ Nenhum item encontrado após fechamento do widget');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados após fechamento:', err);
    }
  }, [connectToken]);

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const apiItems = await pluggyService.getItems();
      const apiAccounts = await pluggyService.getAllAccounts();
      
      // Mesclar com dados existentes
      const existingItems = await pluggyService.getCachedItems();
      const existingAccounts = await pluggyService.getCachedAccounts();
      
      // Filtrar apenas novos items
      const newItems = apiItems.filter(newItem => 
        !existingItems.some(existingItem => existingItem.id === newItem.id)
      );
      
      if (newItems.length > 0) {
        const updatedItems = [...existingItems, ...newItems];
        
        // Filtrar apenas contas novas (evitar duplicação)
        const newAccounts = apiAccounts.filter(newAcc => 
          !existingAccounts.some(existingAcc => existingAcc.id === newAcc.id)
        );
        const updatedAccounts = [...existingAccounts, ...newAccounts];
        
        await AsyncStorage.setItem('@fynance:pluggy_items', JSON.stringify(updatedItems));
        await AsyncStorage.setItem('@fynance:pluggy_accounts', JSON.stringify(updatedAccounts));
        
        setItems(updatedItems);
        setAccounts(updatedAccounts);
      } else {
        // Apenas atualizar com dados da API se não houver novos
        await AsyncStorage.setItem('@fynance:pluggy_items', JSON.stringify(apiItems));
        await AsyncStorage.setItem('@fynance:pluggy_accounts', JSON.stringify(apiAccounts));
        
        setItems(apiItems);
        setAccounts(apiAccounts);
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Deletar item
  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja desconectar esta conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              await pluggyService.deleteItem(itemId);
              await loadCachedData();
              Alert.alert('Sucesso', 'Conta desconectada!');
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Erro ao desconectar');
            }
          },
        },
      ]
    );
  };

  // Tela de erro
  if (error && !connectToken) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Ops! Algo deu errado
        </Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {error}
        </Text>
        <Button mode="contained" onPress={loadCachedData} style={styles.retryButton}>
          Tentar Novamente
        </Button>
        <StatusBar barStyle="dark-content" />
      </View>
    );
  }

  // Tela de loading inicial
  if (loading && !connectToken && items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Carregando...
        </Text>
        <StatusBar barStyle="dark-content" />
      </View>
    );
  }

  // Widget do Pluggy (igual ao quickstart)
  if (connectToken) {
    return (
      <PluggyConnect
        connectToken={connectToken}
        includeSandbox={true}
        onOpen={handleOnOpen}
        onClose={handleOnClose}
        onSuccess={handleOnSuccess}
        onError={handleOnError}
      />
    );
  }

  // Tela principal
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Open Finance
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Conecte suas contas bancárias de forma segura
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            🔐 Conexão Segura
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            Seus dados são protegidos com criptografia de ponta a ponta.
            Nunca armazenamos suas senhas bancárias.
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={fetchConnectToken}
        loading={loading}
        disabled={loading}
        style={styles.connectButton}
        icon="bank"
      >
        Conectar Banco
      </Button>

      <Button
        mode="outlined"
        onPress={handleRefresh}
        loading={refreshing}
        disabled={refreshing}
        style={styles.refreshButton}
        icon="refresh"
      >
        🔄 Buscar Dados Conectados
      </Button>

      {items.length > 0 && (
        <>
          <Divider style={styles.divider} />
          
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Contas Conectadas
          </Text>

          {items.map((item) => {
            const itemAccounts = accounts.filter(acc => acc.itemId === item.id);
            
            return (
              <Card key={item.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text variant="titleMedium">{item.connector.name}</Text>
                      <Text variant="bodySmall" style={styles.itemStatus}>
                        Status: {item.status === 'UPDATED' ? '✅ Atualizado' : '⏳ Atualizando'}
                      </Text>
                    </View>
                    <IconButton
                      icon="delete"
                      iconColor="#f44336"
                      size={20}
                      onPress={() => handleDeleteItem(item.id)}
                    />
                  </View>

                  {itemAccounts.length > 0 && (
                    <View style={styles.accountsList}>
                      <Text variant="labelLarge" style={styles.accountsLabel}>
                        Contas:
                      </Text>
                      {itemAccounts.map((account) => (
                        <View key={account.id} style={styles.accountItem}>
                          <Text 
                            variant="bodyMedium" 
                            style={styles.accountName}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {account.name || account.type}
                          </Text>
                          <Text variant="bodyLarge" style={styles.accountBalance}>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: account.currencyCode || 'BRL',
                            }).format(account.balance)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </>
      )}

      {items.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhuma conta conectada
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Conecte sua primeira conta bancária para começar a usar o Open Finance.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            💡 Dica: Use o Sandbox
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Para testes, selecione <Text style={styles.bold}>MeuPluggy</Text> e use qualquer CPF válido + senha.
          </Text>
        </Card.Content>
      </Card>

      <StatusBar barStyle="dark-content" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  card: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: '#666',
    lineHeight: 20,
  },
  connectButton: {
    margin: 16,
    marginBottom: 8,
    paddingVertical: 8,
  },
  refreshButton: {
    margin: 16,
    marginTop: 0,
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  itemCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemStatus: {
    marginTop: 4,
    color: '#666',
  },
  accountsList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingRight: 8,
  },
  accountsLabel: {
    marginBottom: 8,
    color: '#666',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 8,
    flex: 1,
  },
  accountName: {
    flex: 1,
    marginRight: 8,
  },
  accountBalance: {
    fontWeight: 'bold',
    color: '#4caf50',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '40%',
  },
  emptyCard: {
    margin: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#e3f2fd',
    elevation: 1,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 8,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});

export default ConnectBankScreen;