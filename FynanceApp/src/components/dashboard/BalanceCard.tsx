import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { PluggyAccount } from '../../services/pluggyService';

interface BalanceCardProps {
  accounts: PluggyAccount[];
}

const BalanceCard: React.FC<BalanceCardProps> = ({ accounts }) => {
  const theme = useTheme();

  // Separar contas bancárias de cartões de crédito
  const bankAccounts = accounts.filter(account => account.type === 'BANK');
  const creditCards = accounts.filter(account => account.type === 'CREDIT');

  // Saldo total apenas das contas bancárias
  const totalBalance = bankAccounts.reduce((sum, account) => {
    return sum + (account.balance || 0);
  }, 0);

  // Limite disponível dos cartões de crédito
  const totalAvailableCredit = creditCards.reduce((sum, card) => {
    const availableCredit = card.creditData?.availableCreditLimit || 0;
    return sum + availableCredit;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.primary }]}>
      <Card.Content>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onPrimary }]}>
          Saldo Total
        </Text>
        <Text variant="displaySmall" style={[styles.balance, { color: theme.colors.onPrimary }]}>
          {formatCurrency(totalBalance)}
        </Text>
        
        {/* Limite disponível de cartão de crédito - menor */}
        {totalAvailableCredit > 0 && (
          <View style={styles.creditContainer}>
            <Text variant="bodySmall" style={[styles.creditLabel, { color: theme.colors.onPrimary }]}>
              Cartão de crédito disponível
            </Text>
            <Text variant="bodyMedium" style={[styles.creditValue, { color: theme.colors.onPrimary }]}>
              {formatCurrency(totalAvailableCredit)}
            </Text>
          </View>
        )}

        <View style={styles.accountsContainer}>
          {bankAccounts.map((account) => (
            <View key={account.id} style={styles.accountItem}>
              <Text variant="bodySmall" style={[styles.accountName, { color: theme.colors.onPrimary }]}>
                {account.name}
              </Text>
              <Text variant="bodyMedium" style={[styles.accountBalance, { color: theme.colors.onPrimary }]}>
                {formatCurrency(account.balance || 0)}
              </Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 4,
    marginVertical: 8,
    elevation: 4,
  },
  title: {
    marginBottom: 8,
    opacity: 0.9,
  },
  balance: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  creditContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  creditLabel: {
    opacity: 0.7,
    fontSize: 12,
  },
  creditValue: {
    fontWeight: '500',
    fontSize: 14,
    opacity: 0.9,
  },
  accountsContainer: {
    gap: 8,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountName: {
    opacity: 0.8,
    flex: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  accountBalance: {
    fontWeight: '600',
  },
});

export default BalanceCard;

