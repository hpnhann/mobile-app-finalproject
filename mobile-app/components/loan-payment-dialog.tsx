import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Button, Text, TextInput, HelperText, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { useToast } from '../hooks/useToast';

interface LoanPaymentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  loan: any;
  onSuccess: () => void;
}

export default function LoanPaymentDialog({ visible, onDismiss, loan, onSuccess }: LoanPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (visible && loan) {
      const today = new Date().toISOString().split('T')[0];
      setTransactionDate(today);
      setAmount('');
      setNote('');
    }
  }, [visible, loan]);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  const handleSubmit = async () => {
    if (!amount) {
      showError('Vui lòng nhập số tiền');
      return;
    }

    // Remove all non-numeric characters
    const cleanAmount = amount.replace(/[^\d]/g, '');
    const numericAmount = Number(cleanAmount);

    if (numericAmount <= 0) {
      showError('Số tiền phải lớn hơn 0');
      return;
    }

    if (numericAmount > loan.remainingAmount) {
      showError(`Số tiền không được vượt quá số nợ còn lại: ${formatCurrency(loan.remainingAmount)}`);
      return;
    }

    // Check wallet balance (only for borrowing - when paying back)
    if (loan.type === 'borrow') {
      if (loan.wallet?.currentBalance < numericAmount) {
        showError('Số dư ví không đủ để trả nợ');
        return;
      }
    }

    setIsLoading(true);
    try {
      await apiClient.makeLoanPayment(loan.loanId, {
        amount: numericAmount,
        note: note || undefined,
        transactionDate: transactionDate,
      });
      showSuccess(loan.type === 'borrow' ? 'Trả nợ thành công!' : 'Thu nợ thành công!');
      onSuccess();
      onDismiss();
    } catch (error: any) {
      showError(error.message || 'Không thể thực hiện giao dịch');
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

  const isBorrowing = loan.type === 'borrow';
  const actionText = isBorrowing ? 'Trả nợ' : 'Thu nợ';
  const actionIcon = isBorrowing ? 'arrow-down-right' : 'arrow-up-right';
  const actionColor = isBorrowing ? colors.error : colors.success;

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title style={styles.title}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name={actionIcon as any} size={24} color={actionColor} />
          <Text style={styles.titleText}>{actionText}</Text>
        </View>
      </Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          {/* Loan Info */}
          <Surface style={styles.loanInfo} elevation={1}>
            <View style={styles.loanInfoGrid}>
              <View style={styles.loanInfoItem}>
                <Text style={styles.loanInfoLabel}>Số nợ còn lại</Text>
                <Text style={styles.loanInfoValue}>{formatCurrency(loan.remainingAmount)}</Text>
              </View>
              <View style={styles.loanInfoItem}>
                <Text style={styles.loanInfoLabel}>Ví</Text>
                <Text style={styles.loanInfoValue}>{loan.wallet?.walletName || 'N/A'}</Text>
              </View>
            </View>
            <Text style={styles.loanInfoBalance}>
              Số dư ví: {formatCurrency(loan.wallet?.currentBalance || 0)}
            </Text>
          </Surface>

          {/* Amount Input */}
          <Text style={styles.label}>Số tiền {actionText.toLowerCase()} *</Text>
          <TextInput
            label="Số tiền"
            value={amount}
            onChangeText={handleAmountChange}
            mode="outlined"
            keyboardType="numeric"
            right={<TextInput.Affix text="₫" />}
            style={styles.input}
          />
          <HelperText type="info" visible>
            Tối đa: {formatCurrency(loan.remainingAmount)}
          </HelperText>

          {/* Transaction Date */}
          <Text style={styles.label}>Ngày giao dịch *</Text>
          <TextInput
            label="Ngày giao dịch"
            value={transactionDate}
            onChangeText={setTransactionDate}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            left={<TextInput.Icon icon="calendar" />}
            style={styles.input}
          />

          {/* Note */}
          <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
          <TextInput
            label="Ghi chú"
            value={note}
            onChangeText={setNote}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={isLoading}>
          Hủy
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading || !amount}
          buttonColor={actionColor}
          icon={actionIcon}
        >
          {actionText}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: borderRadius.lg,
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
  },
  loanInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  loanInfoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  loanInfoItem: {
    flex: 1,
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
  loanInfoBalance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    height: 56,
  },
});
