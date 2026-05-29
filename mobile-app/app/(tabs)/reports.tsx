import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, Text, ActivityIndicator, Surface, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

interface OverviewData {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalWallets: number;
  totalWalletBalance: number;
  totalGoals: number;
  completedGoals: number;
  totalLoans: number;
  activeLoans: number;
}

interface CategoryData {
  name: string;
  amount: number;
  count: number;
  percentage: string;
  icon: string;
}

interface MonthlyData {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
}

interface WalletData {
  walletId: number;
  name: string;
  type: string;
  currentBalance: number;
  transactionCount: number;
}

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  const router = useRouter();

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const startDateParam = startDateStr || (startDate ? startDate.toISOString().split('T')[0] : undefined);
      const endDateParam = endDateStr || (endDate ? endDate.toISOString().split('T')[0] : undefined);

      const [overviewRes, expenseRes, incomeRes, monthlyRes, walletRes] = await Promise.all([
        apiClient.getOverviewReport(startDateParam, endDateParam),
        apiClient.getExpenseByCategoryReport(startDateParam, endDateParam),
        apiClient.getIncomeByCategoryReport(startDateParam, endDateParam),
        apiClient.getMonthlyReport(selectedYear),
        apiClient.getWalletReport()
      ]);

      setOverviewData((overviewRes as any).overview || overviewRes);
      setExpenseCategories((expenseRes as any).categories || []);
      setIncomeCategories((incomeRes as any).categories || []);
      setMonthlyData((monthlyRes as any).monthlyData || []);
      setWalletData((walletRes as any).wallets || []);
    } catch (error) {
      console.error('Lỗi khi tải báo cáo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDateStr, endDateStr, selectedYear]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'dd/mm/yyyy';
    return date.toLocaleDateString('vi-VN');
  };

  const formatPercentage = (percentage: string) => {
    return `${parseFloat(percentage || '0').toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
        </View>
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
            <Text style={styles.headerTitle}>Báo cáo thống kê</Text>
            <Button
              mode="outlined"
              onPress={() => {}}
              icon={() => <MaterialCommunityIcons name="download" size={18} color={colors.primary} />}
              textColor={colors.primary}
              style={styles.exportButton}
              compact
            >
              Xuất Excel
            </Button>
          </View>

          {/* Filter Section */}
          <Card style={styles.filterCard}>
            <Card.Content style={styles.filterContent}>
              <View style={styles.filterHeader}>
                <View style={[styles.filterHeaderIcon, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name="filter" size={18} color={colors.primary} />
                </View>
                <Text style={styles.filterTitle}>Bộ lọc thời gian</Text>
              </View>
              
              <View style={styles.filterRow}>
                <View style={styles.filterItemCompact}>
                  <View style={styles.filterLabelRow}>
                    <MaterialCommunityIcons name="calendar-start" size={14} color={colors.textSecondary} />
                    <Text style={styles.filterLabel}>Từ ngày</Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    placeholder="dd/mm/yyyy"
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                    style={styles.dateInputCompact}
                    dense
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="calendar" size={18} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </View>
                <View style={styles.filterItemCompact}>
                  <View style={styles.filterLabelRow}>
                    <MaterialCommunityIcons name="calendar-end" size={14} color={colors.textSecondary} />
                    <Text style={styles.filterLabel}>Đến ngày</Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    placeholder="dd/mm/yyyy"
                    value={endDateStr}
                    onChangeText={setEndDateStr}
                    style={styles.dateInputCompact}
                    dense
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="calendar" size={18} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </View>
              </View>
              
              <View style={styles.filterRow}>
                <View style={styles.filterItemCompact}>
                  <View style={styles.filterLabelRow}>
                    <MaterialCommunityIcons name="calendar-year" size={14} color={colors.textSecondary} />
                    <Text style={styles.filterLabel}>Năm</Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    placeholder="2026"
                    value={selectedYear.toString()}
                    onChangeText={(text) => {
                      const year = parseInt(text) || new Date().getFullYear();
                      setSelectedYear(year);
                    }}
                    style={styles.dateInputCompact}
                    dense
                    keyboardType="numeric"
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="calendar-month" size={18} />}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </View>
                <View style={[styles.filterItemCompact, styles.clearButtonContainer]}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setStartDateStr('');
                      setEndDateStr('');
                      setSelectedYear(new Date().getFullYear());
                    }}
                    style={styles.clearButtonCompact}
                    textColor={colors.error}
                    buttonColor={colors.errorLight}
                    icon={() => <MaterialCommunityIcons name="close-circle" size={18} color={colors.error} />}
                    contentStyle={styles.clearButtonContent}
                  >
                    Xóa bộ lọc
                  </Button>
                </View>
              </View>
            </Card.Content>
          </Card>

        {/* Overview Cards - Row 1 */}
        {overviewData && (
          <View style={styles.cardsGrid}>
            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tổng giao dịch</Text>
                <MaterialCommunityIcons name="chart-bar" size={20} color={colors.info} />
              </View>
              <Text style={styles.cardValue}>{overviewData.totalTransactions || 0}</Text>
              <Text style={styles.cardSubtext}>Giao dịch</Text>
            </Surface>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tổng thu nhập</Text>
                <MaterialCommunityIcons name="trending-up" size={20} color={colors.success} />
              </View>
              <Text style={[styles.cardValue, { color: colors.success }]}>
                {formatCurrency(overviewData.totalIncome || 0)}
              </Text>
              <Text style={styles.cardSubtext}>VND</Text>
            </Surface>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tổng chi tiêu</Text>
                <MaterialCommunityIcons name="trending-down" size={20} color={colors.error} />
              </View>
              <Text style={[styles.cardValue, { color: colors.error }]}>
                {formatCurrency(overviewData.totalExpense || 0)}
              </Text>
              <Text style={styles.cardSubtext}>VND</Text>
            </Surface>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Số dư ròng</Text>
                <MaterialCommunityIcons name="cash" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardValue, {
                color: (overviewData.netBalance || 0) >= 0 ? colors.success : colors.error
              }]}>
                {formatCurrency(overviewData.netBalance || 0)}
              </Text>
              <Text style={styles.cardSubtext}>VND</Text>
            </Surface>
          </View>
        )}

        {/* Additional Stats - Row 2 */}
        {overviewData && (
          <View style={styles.cardsGrid}>
            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tổng ví</Text>
                <MaterialCommunityIcons name="wallet" size={20} color={colors.info} />
              </View>
              <Text style={styles.cardValue}>{overviewData.totalWallets || 0}</Text>
              <Text style={styles.cardSubtext}>Ví</Text>
            </Surface>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Số dư ví</Text>
                <MaterialCommunityIcons name="cash" size={20} color={colors.success} />
              </View>
              <Text style={[styles.cardValue, { color: colors.success }]}>
                {formatCurrency(overviewData.totalWalletBalance || 0)}
              </Text>
              <Text style={styles.cardSubtext}>VND</Text>
            </Surface>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Mục tiêu</Text>
                <MaterialCommunityIcons name="target" size={20} color={colors.secondary} />
              </View>
              <Text style={styles.cardValue}>
                {overviewData.completedGoals || 0}/{overviewData.totalGoals || 0}
              </Text>
              <Text style={styles.cardSubtext}>Hoàn thành</Text>
            </Surface>

            <Surface style={styles.summaryCard} elevation={2}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Vay nợ</Text>
                <MaterialCommunityIcons name="credit-card" size={20} color={colors.warning} />
              </View>
              <Text style={styles.cardValue}>
                {overviewData.activeLoans || 0}/{overviewData.totalLoans || 0}
              </Text>
              <Text style={styles.cardSubtext}>Đang hoạt động</Text>
            </Surface>
          </View>
        )}

        {/* Category Breakdown - Vertical Stack */}
        <View style={styles.categoryStack}>
          {/* Expense Categories */}
          <Card style={styles.categoryCardFull}>
            <Card.Content style={styles.categoryCardContent}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryHeaderIcon, { backgroundColor: colors.errorLight }]}>
                  <MaterialCommunityIcons name="chart-pie" size={20} color={colors.error} />
                </View>
                <Text style={styles.categoryTitle}>Chi tiêu theo danh mục</Text>
              </View>
              {expenseCategories.length > 0 ? (
                expenseCategories.slice(0, 5).map((category, index) => (
                  <View key={index} style={styles.categoryItemNew}>
                    <View style={styles.categoryLeftSection}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: colors.errorLight }]}>
                        <Text style={styles.categoryIcon}>{category.icon || '💰'}</Text>
                      </View>
                      <View style={styles.categoryDetails}>
                        <Text style={styles.categoryNameNew} numberOfLines={2}>
                          {category.name}
                        </Text>
                        <View style={styles.categoryMetaRow}>
                          <MaterialCommunityIcons name="file-document" size={12} color={colors.textSecondary} />
                          <Text style={styles.categoryCountNew}>
                            {category.count} giao dịch
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.categoryRightSection}>
                      <Text style={[styles.categoryValueNew, { color: colors.error }]}>
                        {formatCurrency(category.amount)}
                      </Text>
                      <Text style={styles.categoryPercentNew}>
                        {formatPercentage(category.percentage)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCategoryState}>
                  <Text style={styles.emptyCategoryText}>Chưa có chi tiêu nào</Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Income Categories */}
          <Card style={styles.categoryCardFull}>
            <Card.Content style={styles.categoryCardContent}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryHeaderIcon, { backgroundColor: colors.successLight }]}>
                  <MaterialCommunityIcons name="chart-pie" size={20} color={colors.success} />
                </View>
                <Text style={styles.categoryTitle}>Thu nhập theo danh mục</Text>
              </View>
              {incomeCategories.length > 0 ? (
                incomeCategories.slice(0, 5).map((category, index) => (
                  <View key={index} style={styles.categoryItemNew}>
                    <View style={styles.categoryLeftSection}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: colors.successLight }]}>
                        <Text style={styles.categoryIcon}>{category.icon || '💰'}</Text>
                      </View>
                      <View style={styles.categoryDetails}>
                        <Text style={styles.categoryNameNew} numberOfLines={2}>
                          {category.name}
                        </Text>
                        <View style={styles.categoryMetaRow}>
                          <MaterialCommunityIcons name="file-document" size={12} color={colors.textSecondary} />
                          <Text style={styles.categoryCountNew}>
                            {category.count} giao dịch
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.categoryRightSection}>
                      <Text style={[styles.categoryValueNew, { color: colors.success }]}>
                        {formatCurrency(category.amount)}
                      </Text>
                      <Text style={styles.categoryPercentNew}>
                        {formatPercentage(category.percentage)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCategoryState}>
                  <Text style={styles.emptyCategoryText}>Chưa có thu nhập nào</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Wallet Report */}
        {walletData.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="wallet" size={24} color={colors.primary} />
                <Title style={styles.cardTitle}>Báo cáo ví</Title>
              </View>
              {walletData.map((wallet) => (
                <Surface key={wallet.walletId} style={styles.walletItem} elevation={1}>
                  <View style={styles.walletInfo}>
                    <View style={[styles.walletIcon, { backgroundColor: colors.primaryLight }]}>
                      <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.walletName}>{wallet.name}</Text>
                      <Text style={styles.walletType}>{wallet.type}</Text>
                    </View>
                  </View>
                  <View style={styles.walletAmount}>
                    <Text style={styles.walletBalance}>{formatCurrency(wallet.currentBalance)}</Text>
                    <Text style={styles.walletCount}>{wallet.transactionCount} giao dịch</Text>
                  </View>
                </Surface>
              ))}
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  headerSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    flex: 1,
  },
  exportButton: {
    borderColor: colors.primary,
    marginLeft: spacing.sm,
  },
  filterCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  filterContent: {
    padding: spacing.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterItemCompact: {
    flex: 1,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dateInputCompact: {
    backgroundColor: colors.background,
    height: 48,
  },
  inputContent: {
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  clearButtonContainer: {
    justifyContent: 'flex-end',
  },
  clearButtonCompact: {
    borderColor: colors.error,
    height: 48,
    borderRadius: borderRadius.md,
  },
  clearButtonContent: {
    paddingVertical: spacing.xs,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    width: (width - spacing.md * 3) / 2,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  cardValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  categoryStack: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  categoryCardFull: {
    width: '100%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  categoryCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  categoryCardContent: {
    padding: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryItemNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  categoryLeftSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.md,
    minWidth: 0,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryDetails: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  categoryNameNew: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
    fontSize: 15,
  },
  categoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryCountNew: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  categoryRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
    flexShrink: 0,
  },
  categoryValueNew: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    fontSize: 16,
    textAlign: 'right',
  },
  categoryPercentNew: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyCategoryState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyCategoryText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
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
    gap: spacing.md,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  walletType: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  walletAmount: {
    alignItems: 'flex-end',
  },
  walletBalance: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  walletCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 100,
  },
});
