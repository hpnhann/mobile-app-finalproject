import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Text, ActivityIndicator, Surface, Chip, SegmentedButtons, ProgressBar, Menu, Dialog, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import LoanDetailsDialog from '../../components/loan-details-dialog';
import LoanPaymentDialog from '../../components/loan-payment-dialog';
import EditLoanDialog from '../../components/edit-loan-dialog';

interface Loan {
  loanId: number;
  userId: number;
  walletId: number;
  type: 'borrow' | 'lend';
  title: string;
  description?: string;
  principalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  startDate: string;
  dueDate?: string;
  status: 'active' | 'completed' | 'overdue';
  borrowerName?: string;
  lenderName?: string;
  wallet: {
    walletId: number;
    walletName: string;
    currentBalance: number;
  };
  totalPaid: number;
  totalReceived: number;
  progress: number;
  isOverdue: boolean;
}

interface LoanStats {
  totalBorrowed: number;
  totalLent: number;
  activeBorrowed: number;
  activeLent: number;
  totalLoans: number;
  activeLoans: number;
  netPosition: number;
}

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<number | null>(null);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [loansResponse, statsResponse] = await Promise.all([
        apiClient.getLoans(),
        apiClient.getLoanStats()
      ]);
      
      const loansData = (loansResponse as any).loans || [];
      const statsData = (statsResponse as any) || null;
      
      setLoans(loansData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching loans:', error);
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

  const getLoanStatus = (loan: Loan) => {
    if (loan.isOverdue) {
      return { status: "overdue", color: colors.error, icon: "clock-alert" };
    }
    if (loan.status === 'completed') {
      return { status: "completed", color: colors.success, icon: "check-circle" };
    }
    return { status: "active", color: colors.primary, icon: "clock" };
  };

  const filteredLoans = loans.filter(loan => {
    if (filterType === 'all') return true;
    return loan.type === filterType;
  });

  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;
    
    try {
      await apiClient.deleteLoan(loanToDelete);
      showSuccess('Đã xóa khoản vay thành công!');
      setDeleteDialogVisible(false);
      setLoanToDelete(null);
      fetchData();
    } catch (error: any) {
      showError(error.message || 'Không thể xóa khoản vay');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu vay nợ...</Text>
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
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="credit-card" size={24} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Vay nợ</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý các khoản vay và cho vay
            </Text>
          </View>

          {/* Summary Cards */}
          {stats && (
            <View style={styles.summaryCards}>
              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryCardContent}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle} numberOfLines={1}>Tổng vay</Text>
                    <MaterialCommunityIcons name="trending-up" size={20} color={colors.success} />
                  </View>
                  <Text style={[styles.summaryCardValue, { color: colors.success }]} numberOfLines={1}>
                    {formatCurrency(stats.totalBorrowed || 0)}
                  </Text>
                  <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                    {stats.activeBorrowed || 0} khoản đang vay
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryCardContent}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle} numberOfLines={1}>Tổng cho vay</Text>
                    <MaterialCommunityIcons name="trending-down" size={20} color={colors.info} />
                  </View>
                  <Text style={[styles.summaryCardValue, { color: colors.info }]} numberOfLines={1}>
                    {formatCurrency(stats.totalLent || 0)}
                  </Text>
                  <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                    {stats.activeLent || 0} khoản đang cho vay
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.summaryCard}>
                <Card.Content style={styles.summaryCardContent}>
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardTitle} numberOfLines={1}>Vị thế ròng</Text>
                    <MaterialCommunityIcons name="arrow-right-left" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.summaryCardValue, { 
                    color: (stats.netPosition || 0) >= 0 ? colors.success : colors.error 
                  }]} numberOfLines={1}>
                    {formatCurrency(stats.netPosition || 0)}
                  </Text>
                  <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                    {stats.activeLoans || 0} khoản đang hoạt động
                  </Text>
                </Card.Content>
              </Card>
            </View>
          )}

          {/* Filter Section */}
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <SegmentedButtons
                value={filterType}
                onValueChange={setFilterType}
                buttons={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'borrow', label: 'Vay tiền' },
                  { value: 'lend', label: 'Cho vay' },
                ]}
                style={styles.segmentedButtons}
              />
              
              {filterType !== 'all' && (
                <IconButton
                  icon="close-circle"
                  size={20}
                  iconColor={colors.error}
                  onPress={() => setFilterType('all')}
                  style={styles.clearFilterButton}
                />
              )}
            </View>
          </View>

          {/* Loans List */}
          <Card style={styles.loansListCard}>
            <Card.Content>
              <Title style={styles.loansListTitle}>Danh sách vay nợ</Title>
              
              {filteredLoans.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="credit-card-off"
                    size={64}
                    color={colors.textMuted}
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>Chưa có khoản vay nào</Text>
                  <Text style={styles.emptySubtitle}>
                    Tạo khoản vay đầu tiên để bắt đầu quản lý
                  </Text>
                </View>
              ) : (
                <View style={styles.loansList}>
                  {filteredLoans.map((loan) => {
                    const status = getLoanStatus(loan);
                    const percentage = loan.progress || ((loan.principalAmount - loan.remainingAmount) / loan.principalAmount) * 100;
                    const typeInfo = loan.type === 'borrow' 
                      ? { label: 'Vay tiền', color: colors.success, icon: 'trending-up' }
                      : { label: 'Cho vay', color: colors.info, icon: 'trending-down' };

                    return (
                      <Card key={loan.loanId} style={styles.loanItem} mode="elevated" elevation={2}>
                        <Card.Content style={styles.loanItemContent}>
                          {/* Header: Icon, Title, Menu */}
                          <View style={styles.loanItemHeader}>
                            <View style={styles.loanTitleSection}>
                              <View style={[styles.loanIcon, { backgroundColor: typeInfo.color + '20' }]}>
                                <MaterialCommunityIcons
                                  name={typeInfo.icon as any}
                                  size={20}
                                  color={typeInfo.color}
                                />
                              </View>
                              <Text style={styles.loanTitle} numberOfLines={1}>
                                {loan.title}
                              </Text>
                            </View>
                            <Menu
                              visible={menuVisible[loan.loanId] || false}
                              onDismiss={() => setMenuVisible({ ...menuVisible, [loan.loanId]: false })}
                              anchor={
                                <Button
                                  mode="text"
                                  onPress={() => setMenuVisible({ ...menuVisible, [loan.loanId]: true })}
                                  icon={() => <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />}
                                  style={styles.loanMenuButton}
                                  contentStyle={styles.loanMenuButtonContent}
                                >
                                  {''}
                                </Button>
                              }
                            >
                              <Menu.Item
                                onPress={() => {
                                  setMenuVisible({ ...menuVisible, [loan.loanId]: false });
                                  setSelectedLoan(loan);
                                  setDetailsDialogVisible(true);
                                }}
                                title="Xem chi tiết"
                                leadingIcon="eye"
                              />
                              {loan.status === 'active' && loan.remainingAmount > 0 && (
                                <Menu.Item
                                  onPress={() => {
                                    setMenuVisible({ ...menuVisible, [loan.loanId]: false });
                                    setSelectedLoan(loan);
                                    setPaymentDialogVisible(true);
                                  }}
                                  title={loan.type === 'borrow' ? 'Trả nợ' : 'Thu nợ'}
                                  leadingIcon={loan.type === 'borrow' ? 'arrow-down-right' : 'arrow-up-right'}
                                />
                              )}
                              <Menu.Item
                                onPress={() => {
                                  setMenuVisible({ ...menuVisible, [loan.loanId]: false });
                                  setSelectedLoan(loan);
                                  setEditDialogVisible(true);
                                }}
                                title="Chỉnh sửa"
                                leadingIcon="pencil"
                              />
                              <Menu.Item
                                onPress={() => {
                                  setMenuVisible({ ...menuVisible, [loan.loanId]: false });
                                  setLoanToDelete(loan.loanId);
                                  setDeleteDialogVisible(true);
                                }}
                                title="Xóa"
                                leadingIcon="delete"
                                titleStyle={{ color: colors.error }}
                              />
                            </Menu>
                          </View>

                          {/* Type Chip */}
                          <View style={styles.loanChipRow}>
                            <Chip 
                              mode="flat" 
                              style={[styles.loanTypeChip, { backgroundColor: typeInfo.color + '20' }]} 
                              textStyle={[styles.chipText, { color: typeInfo.color }]}
                              compact
                            >
                              {typeInfo.label}
                            </Chip>
                            <Chip 
                              mode="flat" 
                              style={[styles.loanStatusChip, { backgroundColor: status.color + '20' }]} 
                              textStyle={[styles.chipText, { color: status.color }]}
                              icon={() => (
                                <MaterialCommunityIcons 
                                  name={status.icon as any} 
                                  size={12} 
                                  color={status.color} 
                                />
                              )}
                              compact
                            >
                              {status.status === 'overdue' ? 'Quá hạn' : 
                               status.status === 'completed' ? 'Hoàn thành' : 'Đang hoạt động'}
                            </Chip>
                          </View>

                          {/* Person Info */}
                          {loan.borrowerName && (
                            <Text style={styles.loanPerson} numberOfLines={1}>
                              {loan.type === 'borrow' ? 'Vay từ' : 'Người vay'}: {loan.borrowerName}
                            </Text>
                          )}

                          {/* Amount Info */}
                          <View style={styles.loanAmountRow}>
                            <Text style={styles.loanAmount}>
                              {formatCurrency(loan.remainingAmount)} / {formatCurrency(loan.principalAmount)}
                            </Text>
                          </View>

                          {/* Progress Section */}
                          <View style={styles.loanProgressSection}>
                            <View style={styles.loanProgressHeader}>
                              <Text style={styles.loanProgressLabel}>Tiến độ</Text>
                              <Text style={[styles.loanProgressPercentage, { color: status.color }]}>
                                {percentage.toFixed(1)}%
                              </Text>
                            </View>
                            <ProgressBar 
                              progress={Math.min(percentage / 100, 1)} 
                              color={status.color}
                              style={styles.loanProgressBar}
                            />
                          </View>

                          {/* Remaining Amount */}
                          <View style={styles.loanRemainingSection}>
                            <Text style={styles.loanRemainingLabel}>Còn lại</Text>
                            <Text style={[styles.loanRemainingAmount, { color: status.color }]}>
                              {formatCurrency(loan.remainingAmount)}
                            </Text>
                          </View>

                          {/* Action Buttons */}
                          {loan.status === 'active' && loan.remainingAmount > 0 && (
                            <View style={styles.loanItemActions}>
                              <Button
                                mode="contained"
                                onPress={() => {
                                  setSelectedLoan(loan);
                                  setPaymentDialogVisible(true);
                                }}
                                style={styles.loanActionButton}
                                buttonColor={loan.type === 'borrow' ? colors.error : colors.success}
                                textColor="#fff"
                                icon={() => (
                                  <MaterialCommunityIcons 
                                    name={loan.type === 'borrow' ? 'arrow-down-right' : 'arrow-up-right'} 
                                    size={18} 
                                    color="#fff" 
                                  />
                                )}
                                labelStyle={styles.loanActionButtonLabel}
                              >
                                {loan.type === 'borrow' ? 'Trả nợ' : 'Thu nợ'}
                              </Button>
                            </View>
                          )}
                        </Card.Content>
                      </Card>
                    );
                  })}
                </View>
              )}
            </Card.Content>
          </Card>

          <View style={styles.bottomSpacing} />
          <View style={styles.fabSpacing} />
        </ScrollView>

        <FAB
          icon="plus"
          onPress={() => router.push('/add-loan')}
          style={styles.fab}
          color="#fff"
          label="Tạo khoản vay"
        />

        {/* Dialogs */}
        {selectedLoan && (
          <>
            <LoanDetailsDialog
              visible={detailsDialogVisible}
              onDismiss={() => {
                setDetailsDialogVisible(false);
                setSelectedLoan(null);
              }}
              loan={selectedLoan}
            />
            <LoanPaymentDialog
              visible={paymentDialogVisible}
              onDismiss={() => {
                setPaymentDialogVisible(false);
                setSelectedLoan(null);
              }}
              loan={selectedLoan}
              onSuccess={() => {
                fetchData();
              }}
            />
            <EditLoanDialog
              visible={editDialogVisible}
              onDismiss={() => {
                setEditDialogVisible(false);
                setSelectedLoan(null);
              }}
              loan={selectedLoan}
              onSuccess={() => {
                fetchData();
              }}
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Xác nhận xóa khoản vay</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn xóa khoản vay này? Hành động này không thể hoàn tác.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setDeleteDialogVisible(false);
              setLoanToDelete(null);
            }}>
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleDeleteLoan}
              buttonColor={colors.error}
            >
              Xóa
            </Button>
          </Dialog.Actions>
        </Dialog>

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
  content: {
    paddingBottom: spacing.xxl,
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
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.md,
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
    minWidth: '30%',
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
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  summaryCardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
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
  loansListCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
    overflow: 'hidden',
  },
  loansListTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  loansList: {
    gap: spacing.md,
  },
  loanItem: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  loanItemContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loanItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  loanTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  loanIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  loanTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  loanMenuButton: {
    minWidth: 36,
    height: 36,
  },
  loanMenuButtonContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loanChipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  loanTypeChip: {
    height: 28,
    flexShrink: 0,
  },
  loanStatusChip: {
    height: 28,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loanPerson: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  loanAmountRow: {
    marginBottom: spacing.sm,
  },
  loanAmount: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  loanProgressSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  loanProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanProgressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  loanProgressPercentage: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  loanProgressBar: {
    height: 8,
    borderRadius: borderRadius.sm,
  },
  loanRemainingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.sm,
  },
  loanRemainingAmount: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  loanRemainingLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  loanItemActions: {
    marginTop: spacing.sm,
  },
  loanActionButton: {
    width: '100%',
  },
  loanActionButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
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
    textAlign: 'center',
    lineHeight: 24,
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
});
