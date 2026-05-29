import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Card, Button, FAB, Text, ActivityIndicator, Surface, Chip, IconButton, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

// Interface matching API response structure
interface Transaction {
  transactionId: number;
  amount: string | number;
  transactionDate: string;
  note?: string | null;
  parentCategory?: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    parentCategoryId?: number;
  } | null;
  childCategory?: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    childCategoryId?: number;
    parentCategoryId?: number;
    parent?: {
      name: string;
      parentCategoryId?: number;
    };
  } | null;
  wallet?: {
    walletId: number;
    walletName: string;
    walletType?: string;
  } | null;
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [childCategories, setChildCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response: any = await apiClient.getTransactions();
      
      let transactionsData: Transaction[] = [];
      if (response?.transactions) {
        transactionsData = Array.isArray(response.transactions) ? response.transactions : [];
      } else if (response?.data) {
        transactionsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        transactionsData = response;
      }
      
      setTransactions(transactionsData);
    } catch (error: any) {
      console.error('[Transactions] Error fetching:', error);
      setTransactions([]);
      showError('Không thể tải danh sách giao dịch');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const [parentRes, childRes] = await Promise.all([
        apiClient.getParentCategories(),
        apiClient.getChildCategories()
      ]);
      
      setParentCategories((parentRes as any)?.categories || (parentRes as any)?.data || []);
      setChildCategories((childRes as any)?.categories || (childRes as any)?.data || []);
    } catch (error) {
      console.error('[Transactions] Error fetching categories:', error);
      setParentCategories([]);
      setChildCategories([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchCategories()]);
    } catch (error) {
      console.error('[Transactions] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    return transactions.filter((transaction) => {
      try {
        const category = transaction.parentCategory || transaction.childCategory;
        const categoryName = category?.name || '';
        const note = transaction.note || '';
        
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          note.toLowerCase().includes(searchLower) ||
          categoryName.toLowerCase().includes(searchLower);
        
        const matchesType = 
          selectedType === 'all' || 
          category?.type === selectedType;

        return matchesSearch && matchesType;
      } catch (error) {
        return false;
      }
    });
  }, [transactions, searchTerm, selectedType]);

  // Calculate totals
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    try {
      filteredTransactions.forEach((t) => {
        try {
          const category = t.parentCategory || t.childCategory;
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0);
          
          if (category?.type === 'income') {
            income += isNaN(amount) ? 0 : amount;
          } else if (category?.type === 'expense') {
            expense += isNaN(amount) ? 0 : amount;
          }
        } catch (err) {
          // Skip invalid transactions
        }
      });
    } catch (error) {
      console.error('[Transactions] Calculate totals error:', error);
    }
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number | string | undefined | null) => {
    try {
      if (amount === null || amount === undefined) return '0 ₫';
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount) || !isFinite(numAmount)) return '0 ₫';
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(numAmount);
    } catch (error) {
      return '0 ₫';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      await apiClient.deleteTransaction(transactionId);
      setTransactions(transactions.filter((t) => t.transactionId !== transactionId));
      showSuccess('Đã xóa giao dịch');
    } catch (error: any) {
      showError(error.message || 'Không thể xóa giao dịch');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    router.push({
      pathname: '/add-transaction',
      params: { transactionId: transaction.transactionId.toString() }
    });
  };

  const incomeCount = filteredTransactions.filter((t) => {
    const category = t.parentCategory || t.childCategory;
    return category?.type === 'income';
  }).length;

  const expenseCount = filteredTransactions.filter((t) => {
    const category = t.parentCategory || t.childCategory;
    return category?.type === 'expense';
  }).length;

  const renderTransaction = ({ item }: { item: Transaction }) => {
    try {
      const category = item.parentCategory || item.childCategory;
      const isIncome = category?.type === 'income';
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : (item.amount || 0);
      
      return (
        <Card style={styles.transactionCard} mode="elevated">
          <Card.Content style={styles.transactionContent}>
            <View style={styles.transactionRow}>
              <View style={[styles.transactionIconContainer, {
                backgroundColor: isIncome ? colors.successLight : colors.errorLight
              }]}>
                <MaterialCommunityIcons
                  name={isIncome ? 'arrow-up' : 'arrow-down'}
                  size={24}
                  color={isIncome ? colors.success : colors.error}
                />
              </View>
              
              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionTitleRow}>
                    {category?.icon && (
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                    )}
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {item.note || category?.name || 'Không có danh mục'}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, {
                    color: isIncome ? colors.success : colors.error
                  }]}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(amount))}
                  </Text>
                </View>
                
                <View style={styles.transactionMeta}>
                  <View style={styles.transactionMetaRow}>
                    <MaterialCommunityIcons 
                      name="calendar" 
                      size={14} 
                      color={colors.textMuted} 
                    />
                    <Text style={styles.transactionDate}>
                      {formatDate(item.transactionDate)}
                    </Text>
                  </View>
                  
                  {item.wallet && (
                    <View style={styles.transactionMetaRow}>
                    <MaterialCommunityIcons 
                      name="wallet" 
                      size={14} 
                      color={colors.textMuted} 
                    />
                    <Text style={styles.transactionWallet} numberOfLines={1}>
                      {item.wallet.walletName}
                    </Text>
                  </View>
                  )}
                </View>
                
                <View style={styles.chipContainer}>
                  {item.childCategory?.parent && (
                    <>
                      <Chip 
                        mode="flat" 
                        style={[styles.categoryChip, styles.parentChip]} 
                        textStyle={styles.chipText}
                        icon={() => (
                          <MaterialCommunityIcons 
                            name="tag" 
                            size={12} 
                            color={colors.primary} 
                          />
                        )}
                        compact
                      >
                        {item.childCategory.parent.name}
                      </Chip>
                      {item.childCategory.name && (
                        <Chip 
                          mode="flat" 
                          style={[styles.categoryChip, styles.childChip]} 
                          textStyle={styles.chipText}
                          compact
                        >
                          {item.childCategory.name}
                        </Chip>
                      )}
                    </>
                  )}
                  {!item.childCategory?.parent && category?.name && (
                    <Chip 
                      mode="flat" 
                      style={[styles.categoryChip, styles.parentChip]} 
                      textStyle={styles.chipText}
                      icon={() => (
                        <MaterialCommunityIcons 
                          name="tag" 
                          size={12} 
                          color={colors.primary} 
                        />
                      )}
                      compact
                    >
                      {category.name}
                    </Chip>
                  )}
                </View>
              </View>
              
              <View style={styles.transactionActions}>
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor={colors.primary}
                  onPress={() => handleEditTransaction(item)}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor={colors.error}
                  onPress={() => handleDeleteTransaction(item.transactionId)}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    } catch (error) {
      console.error('[Transactions] Render error:', error);
      return (
        <Card style={styles.transactionCard}>
          <Card.Content>
            <Text style={{ color: colors.error }}>Lỗi hiển thị</Text>
          </Card.Content>
        </Card>
      );
    }
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
        <View style={styles.container}>
          {/* Header Section with Compact Summary */}
          <View style={styles.headerSection}>
            <View style={styles.headerTop}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Quản lý giao dịch</Text>
            </View>
            
            {/* Compact Summary Row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="arrow-up" size={16} color={colors.success} />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryItemLabel}>Thu nhập</Text>
                  <Text style={[styles.summaryItemValue, { color: colors.success }]} numberOfLines={1}>
                    {formatCurrency(totalIncome)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="arrow-down" size={16} color={colors.error} />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryItemLabel}>Chi tiêu</Text>
                  <Text style={[styles.summaryItemValue, { color: colors.error }]} numberOfLines={1}>
                    {formatCurrency(totalExpense)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons 
                  name="swap-horizontal" 
                  size={16} 
                  color={netBalance >= 0 ? colors.success : colors.error} 
                />
                <View style={styles.summaryItemContent}>
                  <Text style={styles.summaryItemLabel}>Còn lại</Text>
                  <Text style={[styles.summaryItemValue, {
                    color: netBalance >= 0 ? colors.success : colors.error
                  }]} numberOfLines={1}>
                    {formatCurrency(netBalance)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Compact Filter Section */}
          <View style={styles.filterSection}>
            <TextInput
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              mode="outlined"
              left={<TextInput.Icon icon="magnify" />}
              right={searchTerm ? (
                <TextInput.Icon 
                  icon="close" 
                  onPress={() => setSearchTerm('')}
                />
              ) : undefined}
              style={styles.searchInput}
              contentStyle={styles.searchInputContent}
              outlineStyle={styles.searchInputOutline}
            />
            
            <View style={styles.filterRow}>
              <SegmentedButtons
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as 'all' | 'income' | 'expense')}
                buttons={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'income', label: 'Thu nhập' },
                  { value: 'expense', label: 'Chi tiêu' },
                ]}
                style={styles.segmentedButtons}
              />
              
              {(searchTerm || selectedType !== 'all') && (
                <IconButton
                  icon="close-circle"
                  size={20}
                  iconColor={colors.error}
                  onPress={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                  }}
                  style={styles.clearFilterButton}
                />
              )}
            </View>
          </View>

          {/* Transactions List Header */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Danh sách giao dịch</Text>
            <Text style={styles.listSubtitle}>
              {filteredTransactions.length} giao dịch
            </Text>
          </View>

          {/* Transactions List - Full Screen Scrollable */}
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item, index) => {
              try {
                return item.transactionId?.toString() || `transaction-${index}`;
              } catch {
                return `transaction-${index}`;
              }
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            contentContainerStyle={styles.listContent}
            style={styles.listContainer}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="receipt-outline"
                  size={80}
                  color={colors.textMuted}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>Không tìm thấy giao dịch nào</Text>
                <Text style={styles.emptySubtitle}>
                  {searchTerm || selectedType !== 'all' 
                    ? 'Thử thay đổi bộ lọc hoặc thêm giao dịch mới'
                    : 'Thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu'}
                </Text>
                <Button
                  mode="contained"
                  onPress={() => router.push('/add-transaction')}
                  style={styles.emptyButton}
                  buttonColor={colors.primary}
                  icon="plus"
                >
                  Thêm giao dịch
                </Button>
              </View>
            }
            ListFooterComponent={<View style={styles.fabSpacing} />}
          />
        </View>
        
        <FAB
          icon="plus"
          onPress={() => router.push('/add-transaction')}
          style={styles.fab}
          color="#fff"
          label="Thêm giao dịch"
        />
        
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
    padding: spacing.md,
    paddingTop: spacing.xxl,
    marginBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryItemContent: {
    flex: 1,
    minWidth: 0,
  },
  summaryItemLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  summaryItemValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.card,
    height: 48,
  },
  searchInputContent: {
    ...typography.body,
    fontSize: 14,
  },
  searchInputOutline: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segmentedButtons: {
    flex: 1,
    backgroundColor: colors.card,
  },
  clearFilterButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  listHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  listSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  transactionCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
    overflow: 'hidden',
  },
  transactionContent: {
    padding: spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  categoryIcon: {
    fontSize: 18,
  },
  transactionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  transactionAmount: {
    ...typography.h3,
    fontWeight: 'bold',
    flexShrink: 0,
  },
  transactionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  transactionWallet: {
    ...typography.caption,
    color: colors.textMuted,
    maxWidth: 120,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  categoryChip: {
    height: 28,
    borderRadius: borderRadius.md,
    borderWidth: 0,
  },
  parentChip: {
    backgroundColor: colors.primaryLight,
  },
  childChip: {
    backgroundColor: colors.secondaryLight,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  transactionActions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: spacing.xs,
    flexShrink: 0,
  },
  actionButton: {
    margin: 0,
    width: 36,
    height: 36,
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
});
