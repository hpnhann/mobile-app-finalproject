import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Button, Text, Surface, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface LoanDetailsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  loan: any;
}

interface LoanTransaction {
  loanTransactionId: number;
  type: 'payment' | 'receipt';
  amount: number;
  transactionDate: string;
  note?: string;
}

export default function LoanDetailsDialog({ visible, onDismiss, loan }: LoanDetailsDialogProps) {
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && loan) {
      loadTransactions();
    }
  }, [visible, loan]);

  const loadTransactions = async () => {
    if (!loan) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getLoanTransactions(loan.loanId);
      setTransactions((response as any).transactions || []);
    } catch (err: any) {
      console.error('Error loading loan transactions:', err);
      setError(err.message || 'Không thể tải lịch sử giao dịch');
    } finally {
      setIsLoading(false);
    }
  };

  if (!loan) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const typeInfo = loan.type === 'borrow'
    ? { label: 'Vay tiền', color: colors.success, icon: 'trending-up' }
    : { label: 'Cho vay', color: colors.info, icon: 'trending-down' };

  const status = loan.isOverdue
    ? { status: 'overdue', color: colors.error, icon: 'clock-alert' }
    : loan.status === 'completed'
    ? { status: 'completed', color: colors.success, icon: 'check-circle' }
    : { status: 'active', color: colors.primary, icon: 'clock' };

  const percentage = loan.progress || ((loan.principalAmount - loan.remainingAmount) / loan.principalAmount) * 100;

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title style={styles.title}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          <Text style={styles.titleText} numberOfLines={1}>{loan.title}</Text>
        </View>
      </Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          {/* Loan Info */}
          <Surface style={[styles.loanInfo, { borderLeftColor: typeInfo.color }]} elevation={1}>
            <View style={styles.loanInfoGrid}>
              <View style={styles.loanInfoItem}>
                <Text style={styles.loanInfoLabel}>Số tiền gốc</Text>
                <Text style={styles.loanInfoValue}>{formatCurrency(loan.principalAmount)}</Text>
              </View>
              <View style={styles.loanInfoItem}>
                <Text style={styles.loanInfoLabel}>Còn lại</Text>
                <Text style={styles.loanInfoValue}>{formatCurrency(loan.remainingAmount)}</Text>
              </View>
              <View style={styles.loanInfoItem}>
                <Text style={styles.loanInfoLabel}>Ngày bắt đầu</Text>
                <Text style={styles.loanInfoValue}>{formatDate(loan.startDate)}</Text>
              </View>
              <View style={styles.loanInfoItem}>
                <Text style={styles.loanInfoLabel}>Hạn thanh toán</Text>
                <Text style={styles.loanInfoValue}>
                  {loan.dueDate ? formatDate(loan.dueDate) : 'Không có'}
                </Text>
              </View>
            </View>

            {loan.interestRate && (
              <View style={styles.loanInfoRow}>
                <Text style={styles.loanInfoLabel}>Lãi suất</Text>
                <Text style={styles.loanInfoValue}>{loan.interestRate}%</Text>
              </View>
            )}

            <View style={styles.loanInfoRow}>
              <Text style={styles.loanInfoLabel}>Tiến độ</Text>
              <Text style={styles.loanInfoValue}>{percentage.toFixed(1)}%</Text>
            </View>
            <ProgressBar progress={Math.min(percentage / 100, 1)} color={status.color} style={styles.progressBar} />

            <View style={styles.loanInfoRow}>
              <Text style={styles.loanInfoLabel}>Ví</Text>
              <Text style={styles.loanInfoValue}>{loan.wallet?.walletName || 'N/A'}</Text>
            </View>

            <View style={styles.loanInfoRow}>
              <Text style={styles.loanInfoLabel}>
                {loan.type === 'borrow' ? 'Vay từ' : 'Người vay'}
              </Text>
              <Text style={styles.loanInfoValue}>{loan.borrowerName || 'N/A'}</Text>
            </View>

            {loan.description && (
              <View style={styles.loanInfoRow}>
                <Text style={styles.loanInfoLabel}>Mô tả</Text>
                <Text style={styles.loanInfoValue}>{loan.description}</Text>
              </View>
            )}
          </Surface>

          {/* Transactions History */}
          <View style={styles.transactionsSection}>
            <Text style={styles.transactionsTitle}>
              Lịch sử giao dịch ({transactions.length})
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((transaction) => (
                  <Surface key={transaction.loanTransactionId} style={styles.transactionItem} elevation={1}>
                    <View style={styles.transactionContent}>
                      <View style={styles.transactionLeft}>
                        <View style={[
                          styles.transactionIcon,
                          { backgroundColor: transaction.type === 'payment' ? colors.errorLight : colors.successLight }
                        ]}>
                          <MaterialCommunityIcons
                            name={transaction.type === 'payment' ? 'arrow-down-right' : 'arrow-up-right'}
                            size={20}
                            color={transaction.type === 'payment' ? colors.error : colors.success}
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionType}>
                            {transaction.type === 'payment' ? 'Trả nợ' : 'Thu nợ'}
                          </Text>
                          <View style={styles.transactionMeta}>
                            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                            <Text style={styles.transactionDate}>
                              {formatDate(transaction.transactionDate)}
                            </Text>
                          </View>
                          {transaction.note && (
                            <Text style={styles.transactionNote} numberOfLines={2}>
                              {transaction.note}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'payment' ? colors.error : colors.success }
                      ]}>
                        {transaction.type === 'payment' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </Surface>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Đóng</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  title: {
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleText: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  loanInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  loanInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  loanInfoItem: {
    flex: 1,
    minWidth: '45%',
  },
  loanInfoRow: {
    marginBottom: spacing.sm,
  },
  loanInfoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  loanInfoValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  transactionsSection: {
    marginTop: spacing.md,
  },
  transactionsTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  transactionsList: {
    gap: spacing.sm,
  },
  transactionItem: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionType: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginBottom: spacing.xs / 2,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionNote: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  transactionAmount: {
    ...typography.h3,
    fontWeight: 'bold',
    flexShrink: 0,
  },
});
