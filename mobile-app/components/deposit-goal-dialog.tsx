import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Button, Text, TextInput, HelperText, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { useToast } from '../hooks/useToast';

interface DepositGoalDialogProps {
  visible: boolean;
  onDismiss: () => void;
  goal: any;
  onSuccess: () => void;
}

interface BudgetWallet {
  walletId: number;
  walletName: string;
  currentBalance: number;
}

export default function DepositGoalDialog({ visible, onDismiss, goal, onSuccess }: DepositGoalDialogProps) {
  const [amount, setAmount] = useState('');
  const [budgetWallets, setBudgetWallets] = useState<BudgetWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (visible && goal) {
      loadBudgetWallets();
      setAmount('');
      setSelectedWalletId(null);
    }
  }, [visible, goal]);

  const loadBudgetWallets = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const response = await apiClient.getWallets({ 
        month: currentMonth, 
        year: currentYear 
      });
      
      const wallets = (response as any).wallets || [];
      setBudgetWallets(wallets);
      
      if (wallets.length > 0) {
        setSelectedWalletId(wallets[0].walletId);
      }
    } catch (error) {
      console.error('Error loading budget wallets:', error);
      setBudgetWallets([]);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  const handleQuickAmount = (quickAmount: number) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (quickAmount <= remaining) {
      setAmount(quickAmount.toLocaleString('vi-VN'));
    }
  };

  const handleSubmit = async () => {
    if (!amount || !selectedWalletId) {
      showError('Vui lòng nhập số tiền và chọn ví');
      return;
    }

    // Remove all non-numeric characters (both comma and dot as thousands separators)
    const cleanAmount = amount.replace(/[^\d]/g, '');
    const numericAmount = Number(cleanAmount);

    if (numericAmount <= 0) {
      showError('Số tiền phải lớn hơn 0');
      return;
    }

    const remaining = goal.targetAmount - goal.currentAmount;
    if (numericAmount > remaining) {
      showError(`Số tiền không được vượt quá số còn thiếu: ${remaining.toLocaleString('vi-VN')} ₫`);
      return;
    }

    const selectedWallet = budgetWallets.find(w => w.walletId === selectedWalletId);
    if (selectedWallet && numericAmount > selectedWallet.currentBalance) {
      showError('Số dư ví không đủ');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.depositToGoal(goal.goalId, numericAmount, selectedWalletId);
      showSuccess('Nạp tiền thành công!');
      onSuccess();
      onDismiss();
    } catch (error: any) {
      showError(error.message || 'Không thể nạp tiền');
    } finally {
      setIsLoading(false);
    }
  };

  if (!goal) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const selectedWallet = budgetWallets.find(w => w.walletId === selectedWalletId);
  const quickAmounts = [100000, 200000, 500000, 1000000];

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title style={styles.title}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="piggy-bank" size={24} color={colors.secondary} />
          <Text style={styles.titleText}>Nạp tiền vào mục tiêu</Text>
        </View>
      </Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          {/* Goal Info */}
          <Surface style={styles.goalInfo} elevation={1}>
            <View style={styles.goalInfoRow}>
              <Text style={styles.goalInfoLabel}>Hiện tại:</Text>
              <Text style={styles.goalInfoValue}>{goal.currentAmount.toLocaleString('vi-VN')} ₫</Text>
            </View>
            <View style={styles.goalInfoRow}>
              <Text style={styles.goalInfoLabel}>Mục tiêu:</Text>
              <Text style={styles.goalInfoValue}>{goal.targetAmount.toLocaleString('vi-VN')} ₫</Text>
            </View>
            <View style={styles.goalInfoRow}>
              <Text style={styles.goalInfoLabel}>Còn thiếu:</Text>
              <Text style={[styles.goalInfoValue, { color: colors.error }]}>
                {remaining.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </Surface>

          {/* Wallet Selection */}
          <Text style={styles.label}>Chọn ví ngân sách *</Text>
          {selectedWallet ? (
            <Surface style={styles.selectedWallet} elevation={1}>
              <View style={styles.selectedWalletContent}>
                <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                <View style={styles.selectedWalletInfo}>
                  <Text style={styles.selectedWalletName}>{selectedWallet.walletName}</Text>
                  <Text style={styles.selectedWalletBalance}>
                    Số dư: {selectedWallet.currentBalance.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>
                <Button
                  mode="text"
                  onPress={() => setShowWalletPicker(true)}
                  icon="chevron-down"
                  compact
                >
                  Đổi
                </Button>
              </View>
            </Surface>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setShowWalletPicker(true)}
              style={styles.pickerButton}
              icon="wallet"
            >
              Chọn ví ngân sách
            </Button>
          )}

          {showWalletPicker && (
            <Surface style={styles.walletPicker} elevation={2}>
              <View style={styles.walletPickerHeader}>
                <Text style={styles.walletPickerTitle}>Chọn ví</Text>
                <Button
                  mode="text"
                  onPress={() => setShowWalletPicker(false)}
                  icon="close"
                  compact
                >
                  Đóng
                </Button>
              </View>
              <ScrollView style={styles.walletList}>
                {budgetWallets.map((wallet) => (
                  <Button
                    key={wallet.walletId}
                    mode={selectedWalletId === wallet.walletId ? 'contained' : 'text'}
                    onPress={() => {
                      setSelectedWalletId(wallet.walletId);
                      setShowWalletPicker(false);
                    }}
                    style={styles.walletItem}
                    icon="wallet"
                  >
                    {wallet.walletName} - {wallet.currentBalance.toLocaleString('vi-VN')} ₫
                  </Button>
                ))}
              </ScrollView>
            </Surface>
          )}

          {/* Amount Input */}
          <Text style={styles.label}>Số tiền nạp *</Text>
          <TextInput
            label="Số tiền"
            value={amount}
            onChangeText={handleAmountChange}
            mode="outlined"
            keyboardType="numeric"
            right={<TextInput.Affix text="₫" />}
            style={styles.input}
          />

          {/* Quick Amount Buttons */}
          <Text style={styles.label}>Số tiền nhanh</Text>
          <View style={styles.quickAmountsRow}>
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                mode="outlined"
                onPress={() => handleQuickAmount(quickAmount)}
                style={styles.quickAmountButton}
                disabled={quickAmount > remaining}
                compact
              >
                {quickAmount.toLocaleString('vi-VN')} ₫
              </Button>
            ))}
          </View>
          <Button
            mode="outlined"
            onPress={() => setAmount(remaining.toLocaleString('vi-VN'))}
            style={styles.fullAmountButton}
            compact
          >
            Nạp hết số còn thiếu ({remaining.toLocaleString('vi-VN')} ₫)
          </Button>
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
          disabled={isLoading}
          buttonColor={colors.secondary}
          icon="piggy-bank"
        >
          Nạp tiền
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
  goalInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  goalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  goalInfoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  goalInfoValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
  },
  selectedWallet: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  selectedWalletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedWalletInfo: {
    flex: 1,
  },
  selectedWalletName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedWalletBalance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pickerButton: {
    marginBottom: spacing.md,
  },
  walletPicker: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 300,
  },
  walletPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  walletPickerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  walletList: {
    maxHeight: 200,
  },
  walletItem: {
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
  },
  fullAmountButton: {
    marginBottom: spacing.md,
  },
});
