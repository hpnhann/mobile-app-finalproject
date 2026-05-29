import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Button, FAB, Text, ActivityIndicator, Surface, Chip, Menu, IconButton, Dialog, Portal, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

interface Wallet {
  walletId: number;
  walletName: string;
  initialBalance?: number;
  currentBalance: number;
  walletType: 'budget' | 'investment';
  month?: number;
  year?: number;
  createdAt?: string;
}

export default function WalletsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const [budgetWalletsResponse, investmentWalletsResponse] = await Promise.all([
        apiClient.getWallets({ month: selectedMonth, year: selectedYear }),
        apiClient.getInvestmentWallets({ month: selectedMonth, year: selectedYear })
      ]);
      
      const budgetWallets = (budgetWalletsResponse as any).wallets || [];
      const investmentWallets = (investmentWalletsResponse as any).wallets || [];
      const allWallets = [...budgetWallets, ...investmentWallets];
      setWallets(allWallets);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [selectedMonth, selectedYear]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(numAmount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const budgetWallets = wallets.filter(w => w.walletType === 'budget');
  const investmentWallets = wallets.filter(w => w.walletType === 'investment');
  
  const totalBalance = wallets.reduce((sum, w) => {
    const balance = typeof w.currentBalance === 'string' 
      ? parseFloat(w.currentBalance) 
      : w.currentBalance || 0;
    return sum + balance;
  }, 0);

  const totalInitial = wallets.reduce((sum, w) => {
    const initial = typeof w.initialBalance === 'string' 
      ? parseFloat(w.initialBalance) 
      : w.initialBalance || 0;
    return sum + initial;
  }, 0);

  const totalGrowth = totalBalance - totalInitial;
  const growthPercentage = totalInitial > 0 ? (totalGrowth / totalInitial) * 100 : 0;

  const handleDeleteWallet = async (walletId: number) => {
    const wallet = wallets.find(w => w.walletId === walletId);
    if (wallet) {
      setWalletToDelete(wallet);
      setDeleteDialogVisible(true);
    }
  };

  const confirmDeleteWallet = async () => {
    if (!walletToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteWallet(walletToDelete.walletId);
      showSuccess('Đã xóa ví thành công');
      setDeleteDialogVisible(false);
      setWalletToDelete(null);
      await fetchWallets();
    } catch (error: any) {
      showError(error.message || 'Không thể xóa ví');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMenu = (walletId: number) => {
    setMenuVisible(prev => ({ ...prev, [walletId]: !prev[walletId] }));
  };

  const renderWallet = (wallet: Wallet) => {
    const balance = typeof wallet.currentBalance === 'string' 
      ? parseFloat(wallet.currentBalance) 
      : wallet.currentBalance || 0;
    const initial = typeof wallet.initialBalance === 'string' 
      ? parseFloat(wallet.initialBalance) 
      : wallet.initialBalance || 0;
    const growth = balance - initial;
    
    return (
      <Card key={wallet.walletId} style={styles.walletCard} mode="elevated">
        <Card.Content style={styles.walletContent}>
          <View style={styles.walletHeader}>
            <View style={styles.walletLeft}>
              <View style={[styles.walletIcon, { 
                backgroundColor: wallet.walletType === 'budget' ? colors.primaryLight : colors.secondaryLight 
              }]}>
                <MaterialCommunityIcons 
                  name={wallet.walletType === 'budget' ? 'wallet' : 'chart-line'} 
                  size={24} 
                  color={wallet.walletType === 'budget' ? colors.primary : colors.secondary} 
                />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName} numberOfLines={1}>
                  {wallet.walletName}
                </Text>
              </View>
            </View>
            <Menu
              visible={menuVisible[wallet.walletId] || false}
              onDismiss={() => toggleMenu(wallet.walletId)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(wallet.walletId)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(wallet.walletId);
                  setTimeout(() => {
                    router.push(`/edit-wallet?id=${wallet.walletId}`);
                  }, 100);
                }}
                title="Chỉnh sửa"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(wallet.walletId);
                  handleDeleteWallet(wallet.walletId);
                }}
                title="Xóa"
                leadingIcon="delete"
                titleStyle={{ color: colors.error }}
              />
            </Menu>
          </View>

          <View style={styles.walletBalanceSection}>
            <View style={styles.walletBalanceRow}>
              <Text style={styles.walletBalanceLabel}>Số dư hiện tại:</Text>
              <Text style={[styles.walletBalanceValue, {
                color: balance >= 0 ? colors.success : colors.error
              }]}>
                {formatCurrency(balance)}
              </Text>
            </View>
            {wallet.initialBalance !== undefined && (
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletBalanceLabel}>Số dư ban đầu:</Text>
                <Text style={styles.walletBalanceValue}>
                  {formatCurrency(initial)}
                </Text>
              </View>
            )}
            {wallet.initialBalance !== undefined && (
              <View style={styles.walletGrowthRow}>
                <MaterialCommunityIcons
                  name={growth >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={growth >= 0 ? colors.success : colors.error}
                />
                <Text style={[styles.walletGrowthText, {
                  color: growth >= 0 ? colors.success : colors.error
                }]}>
                  {growth >= 0 ? '+' : ''}{formatCurrency(growth)} ({growthPercentage.toFixed(1)}%)
                </Text>
              </View>
            )}
          </View>

          {wallet.createdAt && (
            <Text style={styles.walletDate}>
              Tạo ngày: {formatDate(wallet.createdAt)}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="wallet" size={24} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Quản lý ví</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý các ví ngân sách và đầu tư của bạn
            </Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Tổng số dư</Text>
                  <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.primary }]} numberOfLines={1}>
                  {formatCurrency(totalBalance)}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                  {wallets.length} ví
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Ví ngân sách</Text>
                  <MaterialCommunityIcons name="wallet" size={20} color={colors.success} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.success }]} numberOfLines={1}>
                  {formatCurrency(
                    budgetWallets.reduce((sum, w) => {
                      const balance = typeof w.currentBalance === 'string' 
                        ? parseFloat(w.currentBalance) 
                        : w.currentBalance || 0;
                      return sum + balance;
                    }, 0)
                  )}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                  {budgetWallets.length} ví
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Ví đầu tư</Text>
                  <MaterialCommunityIcons name="chart-line" size={20} color={colors.info} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.info }]} numberOfLines={1}>
                  {formatCurrency(
                    investmentWallets.reduce((sum, w) => {
                      const balance = typeof w.currentBalance === 'string' 
                        ? parseFloat(w.currentBalance) 
                        : w.currentBalance || 0;
                      return sum + balance;
                    }, 0)
                  )}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                  {investmentWallets.length} ví
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Tăng trưởng</Text>
                  <MaterialCommunityIcons 
                    name={totalGrowth >= 0 ? 'trending-up' : 'trending-down'} 
                    size={20} 
                    color={totalGrowth >= 0 ? colors.success : colors.error} 
                  />
                </View>
                <Text style={[styles.summaryCardValue, { 
                  color: totalGrowth >= 0 ? colors.success : colors.error 
                }]} numberOfLines={1}>
                  {totalGrowth >= 0 ? '+' : ''}{formatCurrency(totalGrowth)}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                  {growthPercentage.toFixed(1)}% so với ban đầu
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Budget Wallets Section */}
          {budgetWallets.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Ví ngân sách</Text>
                <Text style={styles.sectionCount}>({budgetWallets.length})</Text>
              </View>
              {budgetWallets.map((wallet) => renderWallet(wallet))}
            </View>
          )}

          {/* Investment Wallets Section */}
          {investmentWallets.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.secondaryLight }]}>
                  <MaterialCommunityIcons name="chart-line" size={20} color={colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Ví đầu tư</Text>
                <Text style={styles.sectionCount}>({investmentWallets.length})</Text>
              </View>
              {investmentWallets.map((wallet) => renderWallet(wallet))}
            </View>
          )}

          {/* Empty State */}
          {wallets.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={80}
                color={colors.textMuted}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>Chưa có ví nào</Text>
              <Text style={styles.emptySubtitle}>
                Tạo ví đầu tiên để bắt đầu quản lý chi tiêu và theo dõi mục tiêu tài chính của bạn.
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/add-wallet')}
                buttonColor={colors.primary}
                style={styles.emptyButton}
                icon="plus"
              >
                Tạo ví
              </Button>
            </View>
          )}

          <View style={styles.bottomSpacing} />
          <View style={styles.fabSpacing} />
        </ScrollView>
        <FAB
          icon="plus"
          onPress={() => router.push('/add-wallet')}
          style={styles.fab}
          color="#fff"
          label="Tạo ví"
        />

        {/* Delete Confirmation Dialog */}
        <Portal>
          <Dialog
            visible={deleteDialogVisible}
            onDismiss={() => {
              if (!isDeleting) {
                setDeleteDialogVisible(false);
                setWalletToDelete(null);
              }
            }}
            style={styles.dialog}
          >
            <Dialog.Icon icon="alert" size={48} color={colors.error} />
            <Dialog.Title style={styles.dialogTitle}>Xác nhận xóa ví</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={styles.dialogContent}>
                Bạn có chắc chắn muốn xóa ví{' '}
                <Text style={styles.dialogWalletName}>"{walletToDelete?.walletName}"</Text>?
                {'\n\n'}
                Hành động này không thể hoàn tác.
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <Button
                onPress={() => {
                  setDeleteDialogVisible(false);
                  setWalletToDelete(null);
                }}
                disabled={isDeleting}
                textColor={colors.textSecondary}
              >
                Hủy
              </Button>
              <Button
                onPress={confirmDeleteWallet}
                loading={isDeleting}
                disabled={isDeleting}
                buttonColor={colors.error}
                textColor="#fff"
                mode="contained"
              >
                Xóa
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={hideToast}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  headerSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    marginBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  monthYearSelector: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  monthYearText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  summaryCardContent: {
    padding: spacing.md,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryCardTitle: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  summaryCardValue: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  summaryCardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  section: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionCount: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  walletCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
    overflow: 'hidden',
  },
  walletContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  walletLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
    flexShrink: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  walletInfo: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
    flexShrink: 1,
  },
  walletName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  walletTypeChip: {
    height: 24,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  walletBalanceSection: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletBalanceLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  walletBalanceValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
    minWidth: 0,
  },
  walletGrowthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  walletGrowthText: {
    ...typography.bodySmall,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  walletDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  fabSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  dialog: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
  },
  dialogTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  dialogContent: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dialogWalletName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  dialogActions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
});
