import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Text, ActivityIndicator, Avatar, Surface, Chip, ProgressBar, Badge } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

interface Wallet {
  walletId: number;
  walletName: string;
  currentBalance: number;
  walletType: 'budget' | 'investment';
}

interface Transaction {
  transactionId: number;
  amount: number | string;
  transactionDate: string;
  note?: string;
  parentCategory?: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
  };
  childCategory?: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    parent?: {
      name: string;
    };
  };
}

interface Goal {
  goalId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  progress?: number;
  isCompleted?: boolean;
  isOverdue?: boolean;
}

interface DashboardStats {
  totalAssets: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  budgetWallets: number;
  investmentWallets: number;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  overdueGoals: number;
  totalIncomeExpense: number;
  totalLoansAmount: number;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const [
        budgetWalletsResponse,
        investmentWalletsResponse,
        transactionsResponse,
        goalsResponse,
        goalStatsResponse,
        loanStatsResponse
      ] = await Promise.all([
        apiClient.getWallets({ month: currentMonth, year: currentYear }),
        apiClient.getInvestmentWallets({ month: currentMonth, year: currentYear }),
        apiClient.getTransactions(),
        apiClient.getGoals(),
        apiClient.getGoalStats(),
        apiClient.getLoanStats()
      ]);

      const budgetWallets = (budgetWalletsResponse as any).wallets || [];
      const investmentWallets = (investmentWalletsResponse as any).wallets || [];
      const allWallets = [...budgetWallets, ...investmentWallets];
      setWallets(allWallets);

      const transactions = (transactionsResponse as any).transactions || [];
      setTransactions(transactions.slice(0, 5));

      setGoals((goalsResponse as any).goals || []);

      const totalAssets = allWallets.reduce((sum, wallet) => {
        const balance = typeof wallet.currentBalance === 'string' 
          ? parseFloat(wallet.currentBalance) 
          : wallet.currentBalance || 0;
        return sum + balance;
      }, 0);

      const currentMonthTransactions = transactions.filter((t: Transaction) => {
        const transactionDate = new Date(t.transactionDate);
        return transactionDate.getMonth() + 1 === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });

      const totalIncome = currentMonthTransactions
        .filter((t: Transaction) => {
          const category = t.parentCategory || t.childCategory;
          return category && category.type === 'income';
        })
        .reduce((sum: number, t: Transaction) => {
          const amount = parseFloat(t.amount.toString()) || 0;
          return sum + amount;
        }, 0);

      const totalExpense = currentMonthTransactions
        .filter((t: Transaction) => {
          const category = t.parentCategory || t.childCategory;
          return category && category.type === 'expense';
        })
        .reduce((sum: number, t: Transaction) => {
          const amount = parseFloat(t.amount.toString()) || 0;
          return sum + amount;
        }, 0);

      const totalIncomeExpense = totalIncome - totalExpense;

      const loanStats = loanStatsResponse || {};
      const totalBorrowed = typeof loanStats.totalBorrowed === 'string' ? parseFloat(loanStats.totalBorrowed) : (loanStats.totalBorrowed || 0);
      const totalLent = typeof loanStats.totalLent === 'string' ? parseFloat(loanStats.totalLent) : (loanStats.totalLent || 0);
      const totalLoansAmount = totalBorrowed + totalLent;

      const netBalance = totalAssets - totalIncomeExpense - totalLoansAmount;

      const budgetWalletsCount = allWallets.filter(w => w.walletType === 'budget').length;
      const investmentWalletsCount = allWallets.filter(w => w.walletType === 'investment').length;

      const goalStats = (goalStatsResponse as any).stats || {};
      const totalGoals = goalStats.totalGoals || 0;
      const completedGoals = goalStats.completedGoals || 0;
      const activeGoals = goalStats.activeGoals || 0;
      const overdueGoals = goalStats.overdueGoals || 0;

      setStats({
        totalAssets,
        totalIncome,
        totalExpense,
        netBalance,
        budgetWallets: budgetWalletsCount,
        investmentWallets: investmentWalletsCount,
        totalGoals,
        completedGoals,
        activeGoals,
        overdueGoals,
        totalIncomeExpense,
        totalLoansAmount
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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

  const getGoalStatus = (goal: Goal) => {
    const percentage = goal.progress || (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (goal.isCompleted || percentage >= 100) return { status: "completed", color: colors.success, icon: "check-circle" };
    if (goal.isOverdue || daysLeft < 0) return { status: "overdue", color: colors.error, icon: "clock-alert" };
    if (daysLeft < 30) return { status: "urgent", color: colors.warning, icon: "clock" };
    if (percentage >= 75) return { status: "almost", color: colors.secondary, icon: "trending-up" };
    return { status: "progress", color: colors.info, icon: "target" };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ProtectedRoute>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={56}
                label={user?.fullName?.charAt(0).toUpperCase() || 'U'}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.userDetails}>
                <Text style={styles.greeting}>Xin chào,</Text>
                <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
                <View style={styles.dateBadge}>
                  <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                  <Text style={styles.dateText}>
                    {new Date().toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Button
                mode="text"
                onPress={() => router.push('/currency-converter')}
                style={styles.headerButton}
                icon={() => <MaterialCommunityIcons name="currency-usd" size={24} color={colors.primary} />}
              />
              <Button
                mode="text"
                onPress={() => router.push('/(tabs)/profile')}
                style={styles.headerButton}
                icon={() => <MaterialCommunityIcons name="account" size={24} color={colors.primary} />}
              />
            </View>
          </View>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </Text>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Tổng quan tài chính</Text>
          <Text style={styles.welcomeSubtitle}>
            Quản lý tài chính thông minh và hiệu quả
          </Text>
        </View>

        {/* Main Stats Cards - Grid Layout */}
        <View style={styles.statsGrid}>
          {/* Số dư hiện tại */}
          <Card style={[styles.statCard, styles.primaryCard]}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Số dư hiện tại</Text>
                <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(stats?.totalAssets || 0)}
              </Text>
              <Text style={styles.statSubtext}>
                Từ {stats?.budgetWallets || 0} ví ngân sách + {stats?.investmentWallets || 0} ví đầu tư
              </Text>
            </Card.Content>
          </Card>

          {/* Tổng thu/chi */}
          <Card style={[styles.statCard, styles.secondaryCard]}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Tổng thu/chi</Text>
                <View style={[styles.statIconContainer, { backgroundColor: colors.successLight }]}>
                  <MaterialCommunityIcons name="arrow-up-right" size={20} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.statValue, {
                color: (stats?.totalIncomeExpense || 0) >= 0 ? colors.success : colors.error
              }]}>
                {formatCurrency(stats?.totalIncomeExpense || 0)}
              </Text>
              <Text style={styles.statSubtext}>
                Tổng thu nhập - Tổng chi tiêu
              </Text>
            </Card.Content>
          </Card>

          {/* Tổng khoản vay/cho vay */}
          <Card style={[styles.statCard, styles.tertiaryCard]}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Tổng khoản vay/cho vay</Text>
                <View style={[styles.statIconContainer, { backgroundColor: colors.errorLight }]}>
                  <MaterialCommunityIcons name="arrow-down-right" size={20} color={colors.error} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {formatCurrency(stats?.totalLoansAmount || 0)}
              </Text>
              <Text style={styles.statSubtext}>
                Tổng vay + Tổng cho vay
              </Text>
            </Card.Content>
          </Card>

          {/* Số dư ròng */}
          <Card style={[styles.statCard, styles.quaternaryCard]}>
            <Card.Content style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Số dư ròng</Text>
                <View style={[styles.statIconContainer, { backgroundColor: colors.infoLight }]}>
                  <MaterialCommunityIcons name="cash" size={20} color={colors.info} />
                </View>
              </View>
              <Text style={[styles.statValue, {
                color: (stats?.netBalance || 0) >= 0 ? colors.success : colors.error
              }]}>
                {formatCurrency(stats?.netBalance || 0)}
              </Text>
              <Text style={styles.statSubtext}>
                Số dư hiện tại - Tổng thu/chi - Tổng khoản vay/cho vay
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Goals Overview */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="target" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>Mục tiêu tiết kiệm</Text>
              </View>
              <Button
                mode="text"
                onPress={() => router.push('/(tabs)/goals')}
                textColor={colors.primary}
              >
                Xem tất cả
              </Button>
            </View>
            
            {goals.length > 0 ? (
              <>
                <View style={styles.goalsStatsGrid}>
                  <View style={[styles.goalStatBox, { backgroundColor: colors.infoLight }]}>
                    <Text style={[styles.goalStatValue, { color: colors.info }]}>{stats?.totalGoals || 0}</Text>
                    <Text style={styles.goalStatLabel}>Tổng mục tiêu</Text>
                  </View>
                  <View style={[styles.goalStatBox, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.goalStatValue, { color: colors.success }]}>{stats?.completedGoals || 0}</Text>
                    <Text style={styles.goalStatLabel}>Đã hoàn thành</Text>
                  </View>
                  <View style={[styles.goalStatBox, { backgroundColor: colors.warningLight }]}>
                    <Text style={[styles.goalStatValue, { color: colors.warning }]}>{stats?.activeGoals || 0}</Text>
                    <Text style={styles.goalStatLabel}>Đang thực hiện</Text>
                  </View>
                  <View style={[styles.goalStatBox, { backgroundColor: colors.errorLight }]}>
                    <Text style={[styles.goalStatValue, { color: colors.error }]}>{stats?.overdueGoals || 0}</Text>
                    <Text style={styles.goalStatLabel}>Quá hạn</Text>
                  </View>
                </View>
                
                {goals.slice(0, 3).map((goal) => {
                  const status = getGoalStatus(goal);
                  const percentage = goal.progress || (goal.currentAmount / goal.targetAmount) * 100;
                  
                  return (
                    <Surface key={goal.goalId} style={styles.goalItem} elevation={1}>
                      <View style={styles.goalHeader}>
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        <View style={styles.goalStatus}>
                          <MaterialCommunityIcons name={status.icon as any} size={16} color={status.color} />
                          <Text style={[styles.goalPercentage, { color: status.color }]}>
                            {Math.round(percentage)}%
                          </Text>
                        </View>
                      </View>
                      <ProgressBar 
                        progress={Math.min(percentage / 100, 1)} 
                        color={status.color}
                        style={styles.goalProgress}
                      />
                      <View style={styles.goalFooter}>
                        <Text style={styles.goalAmount}>
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </Text>
                        <Text style={styles.goalDeadline}>
                          Hạn: {formatDate(goal.deadline)}
                        </Text>
                      </View>
                    </Surface>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="target" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có mục tiêu tiết kiệm nào</Text>
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/add-goal')}
                  buttonColor={colors.primary}
                >
                  Tạo mục tiêu đầu tiên
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Wallets Overview */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="wallet" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>Ví ngân sách</Text>
              </View>
              <Button
                mode="text"
                onPress={() => router.push('/(tabs)/wallets')}
                textColor={colors.primary}
              >
                Xem tất cả
              </Button>
            </View>
            {wallets.filter(w => w.walletType === 'budget').length > 0 ? (
              wallets.filter(w => w.walletType === 'budget').slice(0, 3).map((wallet) => (
                <Surface key={wallet.walletId} style={styles.walletItem} elevation={1}>
                  <View style={styles.walletInfo}>
                    <View style={[styles.walletIcon, { backgroundColor: colors.primaryLight }]}>
                      <MaterialCommunityIcons name="wallet" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.walletDetails}>
                      <View style={styles.transactionTitleRow}>
                        <Text style={styles.walletName} numberOfLines={1}>{wallet.walletName}</Text>
                      </View>
                      <View style={styles.chipContainer}>
                        <Chip 
                          mode="flat" 
                          style={styles.categoryChip} 
                          textStyle={styles.chipText}
                          icon={() => (
                            <MaterialCommunityIcons 
                              name="wallet" 
                              size={12} 
                              color={colors.primary} 
                            />
                          )}
                        >
                          Ngân sách
                        </Chip>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.walletBalance, { color: colors.primary }]}>
                    {formatCurrency(typeof wallet.currentBalance === 'string' 
                      ? parseFloat(wallet.currentBalance) 
                      : wallet.currentBalance || 0)}
                  </Text>
                </Surface>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có ví ngân sách nào</Text>
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/add-wallet')}
                  buttonColor={colors.primary}
                >
                  Tạo ví đầu tiên
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
              </View>
              <Button
                mode="text"
                onPress={() => router.push('/(tabs)/transactions')}
                textColor={colors.primary}
              >
                Xem tất cả
              </Button>
            </View>
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => {
                const category = transaction.parentCategory || transaction.childCategory;
                const isIncome = category?.type === 'income';
                
                return (
                  <Surface key={transaction.transactionId} style={styles.transactionItem} elevation={1}>
                    <View style={styles.transactionInfo}>
                      <View style={[styles.transactionIcon, {
                        backgroundColor: isIncome ? colors.successLight : colors.errorLight
                      }]}>
                        <MaterialCommunityIcons
                          name={isIncome ? 'arrow-up' : 'arrow-down'}
                          size={20}
                          color={isIncome ? colors.success : colors.error}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <View style={styles.transactionTitleRow}>
                          {category?.icon && (
                            <Text style={styles.categoryIcon}>{category.icon}</Text>
                          )}
                          <Text style={styles.transactionCategory} numberOfLines={1}>
                            {transaction.note || category?.name || 'Không có danh mục'}
                          </Text>
                        </View>
                        <View style={styles.transactionMetaRow}>
                          <Text style={styles.transactionDate}>
                            {formatDate(transaction.transactionDate)}
                          </Text>
                          {transaction.childCategory?.parent && (
                            <View style={styles.chipContainer}>
                              <Chip 
                                mode="flat" 
                                style={styles.categoryChip} 
                                textStyle={styles.chipText}
                                icon={() => (
                                  <MaterialCommunityIcons 
                                    name="tag" 
                                    size={12} 
                                    color={colors.primary} 
                                  />
                                )}
                              >
                                {transaction.childCategory.parent.name}
                              </Chip>
                              {transaction.childCategory.name && (
                                <Chip 
                                  mode="flat" 
                                  style={[styles.categoryChip, styles.childCategoryChip]} 
                                  textStyle={styles.chipText}
                                >
                                  {transaction.childCategory.name}
                                </Chip>
                              )}
                            </View>
                          )}
                          {!transaction.childCategory?.parent && category?.name && (
                            <View style={styles.chipContainer}>
                              <Chip 
                                mode="flat" 
                                style={styles.categoryChip} 
                                textStyle={styles.chipText}
                                icon={() => (
                                  <MaterialCommunityIcons 
                                    name="tag" 
                                    size={12} 
                                    color={colors.primary} 
                                  />
                                )}
                              >
                                {category.name}
                              </Chip>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.transactionAmount, {
                      color: isIncome ? colors.success : colors.error
                    }]}>
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Text>
                  </Surface>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="swap-horizontal" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/add-transaction')}
                  buttonColor={colors.primary}
                >
                  Thêm giao dịch đầu tiên
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FAB
        icon="plus"
        onPress={() => router.push('/add-transaction')}
        style={styles.fab}
        color="#fff"
      />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
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
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  headerSection: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: spacing.md,
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: typography.h3.fontSize,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: spacing.sm,
  },
  monthBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  monthBadgeText: {
    fontSize: typography.caption.fontSize,
    color: colors.secondaryDark,
    fontWeight: '600',
  },
  welcomeSection: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    width: (width - spacing.md * 3) / 2,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  primaryCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  secondaryCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  tertiaryCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  quaternaryCard: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  statCardContent: {
    padding: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  statSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  goalsStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  goalStatBox: {
    flex: 1,
    minWidth: (width - spacing.md * 2 - spacing.sm * 3) / 4,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  goalStatValue: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  goalStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalItem: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  goalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalPercentage: {
    ...typography.bodySmall,
    fontWeight: 'bold',
  },
  goalProgress: {
    height: 8,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  goalDeadline: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  walletDetails: {
    flex: 1,
    minWidth: 0,
  },
  walletName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  walletBalance: {
    ...typography.body,
    fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  categoryIcon: {
    fontSize: 18,
  },
  transactionCategory: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  categoryChip: {
    height: 28,
    backgroundColor: colors.primaryLight,
    borderWidth: 0,
  },
  childCategoryChip: {
    backgroundColor: colors.secondaryLight,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  transactionAmount: {
    ...typography.body,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});
