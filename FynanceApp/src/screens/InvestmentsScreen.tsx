import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Card, Text, useTheme, Chip, IconButton, Divider, FAB } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import pluggyService, { PluggyInvestment } from '../services/pluggyService';
import { RootStackParamList } from '../types';

type InvestmentsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const InvestmentsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<InvestmentsScreenNavigationProp>();
  const [investments, setInvestments] = useState<PluggyInvestment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carregar investimentos
  const loadInvestments = async () => {
    try {
      console.log('💼 Carregando investimentos...');
      
      // Primeiro tentar buscar dados do cache
      let investments = await pluggyService.getCachedInvestments();
      console.log('💼 Investimentos em cache:', investments.length);
      
      // Se não há investimentos em cache, tentar buscar da API
      if (investments.length === 0) {
        console.log('💼 Cache vazio, buscando da API...');
        try {
          investments = await pluggyService.getAllInvestments();
          console.log('💼 Investimentos da API:', investments.length);
        } catch (apiError) {
          console.log('💼 Erro ao buscar da API, usando cache vazio:', apiError);
        }
      }
      
      console.log('💼 Total de investimentos:', investments.length);
      console.log('💼 Investimentos encontrados:', investments.map(inv => ({ 
        id: inv.id, 
        name: inv.name, 
        type: inv.type, 
        subtype: inv.subtype, 
        balance: inv.balance 
      })));
      
      setInvestments(investments);
    } catch (error) {
      console.error('❌ Erro ao carregar investimentos:', error);
      setInvestments([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvestments();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInvestments();
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular totais
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Text variant="headlineSmall" style={styles.title}>
          💼 Meus Investimentos
        </Text>

        {/* Resumo Geral */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              Resumo Geral
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Total Investido
                </Text>
                <Text variant="displaySmall" style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {formatCurrency(totalInvested)}
                </Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Produtos
                </Text>
                <Text variant="displaySmall" style={styles.summaryValue}>
                  {investments.length}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Lista de Investimentos */}
        {investments.length > 0 ? (
          investments.map((investment) => {
            return (
              <Card key={investment.id} style={styles.investmentCard}>
                <Card.Content>
                  {/* Header */}
                  <View style={styles.investmentHeader}>
                    <View style={styles.investmentHeaderLeft}>
                      <IconButton
                        icon="chart-line"
                        size={24}
                        iconColor="#fff"
                        style={[styles.investmentIcon, { backgroundColor: '#4caf50' }]}
                      />
                      <View style={styles.investmentInfo}>
                        <Text variant="titleMedium" style={styles.investmentName} numberOfLines={1} ellipsizeMode="tail">
                          {investment.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.investmentNumber}>
                          {investment.code || investment.id.substring(0, 8)}
                        </Text>
                      </View>
                    </View>
                    
                    <Chip mode="outlined">
                      {investment.subtype || 'Investimento'}
                    </Chip>
                  </View>

                  <Divider style={styles.investmentDivider} />

                  {/* Valor */}
                  <View style={styles.valueContainer}>
                    <Text variant="bodySmall" style={styles.valueLabel}>
                      Saldo Atual
                    </Text>
                    <Text variant="headlineSmall" style={[styles.valueAmount, { color: '#4caf50' }]}>
                      {formatCurrency(investment.balance || 0)}
                    </Text>
                  </View>

                  {/* Informações Adicionais */}
                  <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                      <Text variant="bodySmall" style={styles.infoLabel}>
                        Moeda:
                      </Text>
                      <Text variant="bodyMedium" style={styles.infoValue}>
                        {investment.currencyCode || 'BRL'}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <IconButton
                icon="chart-line-variant"
                size={48}
                iconColor="#999"
              />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Nenhum investimento encontrado
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Conecte uma conta com investimentos para visualizá-los aqui
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB para conectar nova conta */}
      <FAB
        icon="plus"
        label="Conectar Conta"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('ConnectBank')}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#e8f5e9',
  },
  summaryTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 60,
  },
  investmentCard: {
    marginBottom: 12,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 50,
  },
  investmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    maxWidth: '90%',
  },
  investmentInfo: {
    flex: 1,
    marginLeft: 8,
  },
  investmentIcon: {
    margin: 0,
    marginRight: 12,
  },
  investmentName: {
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  investmentNumber: {
    color: '#666',
  },
  typeChip: {
    flexShrink: 0,
    maxWidth: 60,
  },
  investmentDivider: {
    marginBottom: 12,
  },
  valueContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  valueLabel: {
    color: '#666',
    marginBottom: 4,
  },
  valueAmount: {
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    fontWeight: '500',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default InvestmentsScreen;

