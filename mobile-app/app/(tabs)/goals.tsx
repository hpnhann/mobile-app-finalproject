import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Text, ActivityIndicator, ProgressBar, Surface, Chip, Menu, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import DepositGoalDialog from '../../components/deposit-goal-dialog';
import SpendFromGoalDialog from '../../components/spend-from-goal-dialog';
import EditGoalDialog from '../../components/edit-goal-dialog';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

interface Goal {
  goalId: number;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  daysLeft?: number;
  isCompleted?: boolean;
  isOverdue?: boolean;
}

interface GoalStats {
  totalGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  completedGoals: number;
  activeGoals: number;
  overdueGoals: number;
  overallProgress: number;
  remainingAmount: number;
}

const { width } = Dimensions.get('window');

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositDialogVisible, setDepositDialogVisible] = useState(false);
  const [spendDialogVisible, setSpendDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [goalsResponse, statsResponse] = await Promise.all([
        apiClient.getGoals(),
        apiClient.getGoalStats()
      ]);
      
      const goalsData = (goalsResponse as any).goals || [];
      const statsData = (statsResponse as any).stats || null;
      
      setGoals(goalsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
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
    const daysLeft = goal.daysLeft || Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (goal.isCompleted || percentage >= 100) {
      return { status: "completed", color: colors.success, icon: "check-circle" };
    }
    if (goal.isOverdue || daysLeft < 0) {
      return { status: "overdue", color: colors.error, icon: "clock-alert" };
    }
    if (daysLeft < 30) {
      return { status: "urgent", color: colors.warning, icon: "clock" };
    }
    if (percentage >= 75) {
      return { status: "almost", color: colors.secondary, icon: "trending-up" };
    }
    return { status: "progress", color: colors.primary, icon: "target" };
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await apiClient.deleteGoal(goalToDelete);
      showSuccess('Đã xóa mục tiêu thành công!');
      setDeleteDialogVisible(false);
      setGoalToDelete(null);
      fetchData();
    } catch (error: any) {
      showError(error.message || 'Không thể xóa mục tiêu');
    }
  };

  const handleDeposit = async (goalId: number, amount: number, walletId: number) => {
    try {
      await apiClient.depositToGoal(goalId, amount, walletId);
      fetchData();
    } catch (error: any) {
      throw error;
    }
  };

  const handleSpend = async (goalId: number, amount: number, categoryId: number, note: string) => {
    try {
      await apiClient.spendFromGoal(goalId, amount, categoryId, note);
      fetchData();
    } catch (error: any) {
      throw error;
    }
  };

  const handleEditGoal = async (goalData: any) => {
    try {
      await apiClient.updateGoal(goalData.goalId, {
        title: goalData.title,
        targetAmount: goalData.targetAmount,
        deadline: goalData.deadline,
        description: goalData.description,
      });
      fetchData();
    } catch (error: any) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu mục tiêu...</Text>
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
              <MaterialCommunityIcons name="target" size={24} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Mục tiêu tiết kiệm</Text>
            <Text style={styles.headerSubtitle}>
              {stats?.totalGoals || goals.length} mục tiêu đang theo dõi
            </Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Tổng mục tiêu</Text>
                  <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.primary }]} numberOfLines={1}>
                  {formatCurrency(stats?.totalTargetAmount || 0)}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                  {stats?.totalGoals || 0} mục tiêu đang theo dõi
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Đã tiết kiệm</Text>
                  <MaterialCommunityIcons name="piggy-bank" size={20} color={colors.secondary} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.secondary }]} numberOfLines={1}>
                  {formatCurrency(stats?.totalCurrentAmount || 0)}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>
                  {stats?.overallProgress?.toFixed(1) || 0}% tổng mục tiêu
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Còn thiếu</Text>
                  <MaterialCommunityIcons name="trending-up" size={20} color={colors.error} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.error }]} numberOfLines={1}>
                  {formatCurrency(stats?.remainingAmount || 0)}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>Cần tiết kiệm thêm</Text>
              </Card.Content>
            </Card>

            <Card style={styles.summaryCard}>
              <Card.Content style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle} numberOfLines={1}>Hoàn thành</Text>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                </View>
                <Text style={[styles.summaryCardValue, { color: colors.success }]} numberOfLines={1}>
                  {stats?.completedGoals || 0}
                </Text>
                <Text style={styles.summaryCardSubtitle} numberOfLines={2}>Mục tiêu đã đạt được</Text>
              </Card.Content>
            </Card>
          </View>

          {/* Goals Progress Overview */}
          {goals.length > 0 && (
            <Card style={styles.progressCard}>
              <Card.Content style={styles.progressCardContent}>
                <Title style={styles.progressCardTitle}>Tiến độ mục tiêu</Title>
                <Paragraph style={styles.progressCardSubtitle}>
                  Theo dõi tiến độ của các mục tiêu tiết kiệm
                </Paragraph>
                <View style={styles.progressList}>
                  {goals.map((goal, index) => {
                    const percentage = goal.progress || Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const status = getGoalStatus(goal);
                    const daysLeft = goal.daysLeft || Math.ceil(
                      (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isLast = index === goals.length - 1;

                    return (
                      <View key={goal.goalId} style={[styles.progressItem, isLast && styles.progressItemLast]}>
                        <View style={styles.progressItemHeader}>
                          <View style={styles.progressItemLeft}>
                            <View style={[styles.progressDot, { backgroundColor: colors.primary }]} />
                            <Text style={styles.progressItemTitle} numberOfLines={1} ellipsizeMode="tail">
                              {goal.title}
                            </Text>
                          </View>
                          <View style={styles.progressItemRight}>
                            <Text style={styles.progressItemAmount} numberOfLines={1} ellipsizeMode="tail">
                              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                            </Text>
                            <Text style={[styles.progressItemPercentage, { color: status.color }]} numberOfLines={1}>
                              {percentage.toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                        <View style={styles.progressItemMetaRow}>
                          <View style={styles.progressChipContainer}>
                            <Chip 
                              mode="flat" 
                              style={styles.progressStatusChip} 
                              textStyle={styles.progressChipText}
                              icon={() => (
                                <MaterialCommunityIcons 
                                  name={status.icon as any} 
                                  size={12} 
                                  color={status.color} 
                                />
                              )}
                            >
                              {daysLeft > 0 ? `${daysLeft} ngày` : "Quá hạn"}
                            </Chip>
                          </View>
                        </View>
                        <ProgressBar 
                          progress={Math.min(percentage / 100, 1)} 
                          color={status.color}
                          style={styles.progressBar}
                        />
                      </View>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Goals List */}
          <Card style={styles.goalsListCard}>
            <Card.Content style={styles.goalsListCardContent}>
              <Title style={styles.goalsListTitle}>Danh sách mục tiêu</Title>
              <Paragraph style={styles.goalsListSubtitle}>
                Quản lý các mục tiêu tiết kiệm của bạn
              </Paragraph>
              
              {goals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="target"
                    size={64}
                    color={colors.textMuted}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>Chưa có mục tiêu nào</Text>
              <Text style={styles.emptySubtitle}>
                    Tạo mục tiêu đầu tiên để bắt đầu tiết kiệm
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/add-goal')}
                    buttonColor={colors.primary}
                style={styles.emptyButton}
              >
                    Tạo mục tiêu đầu tiên
              </Button>
            </View>
              ) : (
                <View style={styles.goalsList}>
                  {goals.map((goal) => {
                    const percentage = goal.progress || (goal.currentAmount / goal.targetAmount) * 100;
                    const status = getGoalStatus(goal);
                    const daysLeft = goal.daysLeft || Math.ceil(
                      (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <Card key={goal.goalId} style={styles.goalItem} mode="elevated" elevation={2}>
                        <Card.Content style={styles.goalItemContent}>
                          {/* Header: Title and Menu */}
                          <View style={styles.goalItemHeader}>
                            <View style={styles.goalTitleSection}>
                              <View style={[styles.goalIconSmall, { backgroundColor: colors.primaryLight }]}>
                                <MaterialCommunityIcons
                                  name="target"
                                  size={20}
                                  color={colors.primary}
                                />
                              </View>
                              <Text style={styles.goalTitle} numberOfLines={1}>
                                {goal.title}
                              </Text>
                            </View>
                            <Menu
                              visible={menuVisible[goal.goalId] || false}
                              onDismiss={() => setMenuVisible({ ...menuVisible, [goal.goalId]: false })}
                              anchor={
                                <Button
                                  mode="text"
                                  onPress={() => setMenuVisible({ ...menuVisible, [goal.goalId]: true })}
                                  icon={() => <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />}
                                  style={styles.goalMenuButton}
                                  contentStyle={styles.goalMenuButtonContent}
                                >
                                  {''}
                                </Button>
                              }
                            >
                              <Menu.Item
                                onPress={() => {
                                  setMenuVisible({ ...menuVisible, [goal.goalId]: false });
                                  setSelectedGoal(goal);
                                  setEditDialogVisible(true);
                                }}
                                title="Chỉnh sửa"
                                leadingIcon="pencil"
                              />
                              <Menu.Item
                                onPress={() => {
                                  setMenuVisible({ ...menuVisible, [goal.goalId]: false });
                                  setGoalToDelete(goal.goalId);
                                  setDeleteDialogVisible(true);
                                }}
                                title="Xóa"
                                leadingIcon="delete"
                                titleStyle={{ color: colors.error }}
                              />
                            </Menu>
                          </View>

                          {/* Progress Section */}
                          <View style={styles.goalProgressSection}>
                            <View style={styles.goalProgressHeader}>
                              <View style={styles.goalProgressInfo}>
                                <Text style={styles.goalProgressLabel}>Tiến độ</Text>
                                <Text style={[styles.goalProgressPercentage, { color: status.color }]}>
                                  {percentage.toFixed(1)}%
                                </Text>
                              </View>
                              <View style={styles.goalChipRow}>
                                <Chip 
                                  mode="flat" 
                                  style={styles.goalStatusChip} 
                                  textStyle={styles.chipText}
                                  icon={() => (
                                    <MaterialCommunityIcons 
                                      name={status.icon as any} 
                                      size={12} 
                                      color={status.color} 
                                    />
                                  )}
                                  compact
                                >
                                  {daysLeft > 0 ? `${daysLeft} ngày` : "Quá hạn"}
                                </Chip>
                              </View>
                            </View>
                            <ProgressBar 
                              progress={Math.min(percentage / 100, 1)} 
                              color={status.color}
                              style={styles.goalProgressBar}
                            />
                          </View>

                          {/* Stats Section */}
                          <View style={styles.goalStatsSection}>
                            <View style={styles.goalStatItem}>
                              <Text style={styles.goalStatLabel}>Đã tiết kiệm</Text>
                              <Text style={[styles.goalStatValue, { color: colors.success }]}>
                                {formatCurrency(goal.currentAmount)}
                              </Text>
                            </View>
                            <View style={styles.goalStatDivider} />
                            <View style={styles.goalStatItem}>
                              <Text style={styles.goalStatLabel}>Mục tiêu</Text>
                              <Text style={styles.goalStatValue}>
                                {formatCurrency(goal.targetAmount)}
                              </Text>
                            </View>
                            <View style={styles.goalStatDivider} />
                            <View style={styles.goalStatItem}>
                              <Text style={styles.goalStatLabel}>Còn thiếu</Text>
                              <Text style={[styles.goalStatValue, { color: status.color }]}>
                                {formatCurrency(goal.targetAmount - goal.currentAmount)}
                              </Text>
                            </View>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.goalItemActions}>
                            <Button
                              mode="contained"
                              onPress={() => {
                                setSelectedGoal(goal);
                                setDepositDialogVisible(true);
                              }}
                              style={styles.goalActionButton}
                              buttonColor={colors.secondary}
                              textColor="#fff"
                              icon={() => <MaterialCommunityIcons name="piggy-bank" size={18} color="#fff" />}
                              disabled={goal.isCompleted}
                              labelStyle={styles.goalActionButtonLabel}
                            >
                              Nạp tiền
                            </Button>
                            <Button
                              mode="outlined"
                              onPress={() => {
                                setSelectedGoal(goal);
                                setSpendDialogVisible(true);
                              }}
                              style={[styles.goalActionButton, { borderColor: colors.error }]}
                              textColor={colors.error}
                              icon={() => <MaterialCommunityIcons name="arrow-down-right" size={18} color={colors.error} />}
                              disabled={goal.currentAmount <= 0}
                              labelStyle={styles.goalActionButtonLabel}
                            >
                              Chi tiêu
                            </Button>
                          </View>
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
          onPress={() => router.push('/add-goal')}
          style={styles.fab}
          color="#fff"
          label="Tạo mục tiêu"
        />

        {/* Dialogs */}
        {selectedGoal && (
          <>
            <DepositGoalDialog
              visible={depositDialogVisible}
              onDismiss={() => {
                setDepositDialogVisible(false);
                setSelectedGoal(null);
              }}
              goal={selectedGoal}
              onSuccess={() => {
                fetchData();
              }}
            />
            <SpendFromGoalDialog
              visible={spendDialogVisible}
              onDismiss={() => {
                setSpendDialogVisible(false);
                setSelectedGoal(null);
              }}
              goal={selectedGoal}
              onSuccess={() => {
                fetchData();
              }}
            />
            <EditGoalDialog
              visible={editDialogVisible}
              onDismiss={() => {
                setEditDialogVisible(false);
                setSelectedGoal(null);
              }}
              goal={selectedGoal}
              onSuccess={() => {
                fetchData();
              }}
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Xác nhận xóa mục tiêu</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn xóa mục tiêu này? Hành động này không thể hoàn tác.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setDeleteDialogVisible(false);
              setGoalToDelete(null);
            }}>
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleDeleteGoal}
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
    width: (width - spacing.md * 3) / 2,
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
    minHeight: 20,
  },
  summaryCardTitle: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.xs,
  },
  summaryCardValue: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    fontSize: 18,
  },
  summaryCardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  progressCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
    overflow: 'hidden',
  },
  progressCardContent: {
    padding: spacing.md,
    paddingHorizontal: spacing.md,
  },
  progressCardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  progressCardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  progressList: {
    gap: spacing.lg,
  },
  progressItem: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  progressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  progressItemTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  progressItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  progressChipContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  progressStatusChip: {
    height: 28,
    backgroundColor: colors.primaryLight,
    borderWidth: 0,
  },
  progressChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  progressItemRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 120,
    paddingLeft: spacing.xs,
  },
  progressItemAmount: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  progressItemPercentage: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'right',
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  goalsListCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
    overflow: 'hidden',
  },
  goalsListCardContent: {
    padding: spacing.md,
    paddingHorizontal: spacing.md,
  },
  goalsListTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  goalsListSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  goalsList: {
    gap: spacing.md,
  },
  goalItem: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    marginBottom: 0,
    ...shadows.md,
  },
  goalItemContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  goalItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  goalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  goalIconSmall: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  goalTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  goalProgressSection: {
    gap: spacing.sm,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  goalProgressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalProgressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  goalProgressPercentage: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  goalChipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  goalStatusChip: {
    height: 28,
    backgroundColor: colors.primaryLight,
    borderWidth: 0,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  goalProgressBar: {
    height: 10,
    borderRadius: borderRadius.md,
  },
  goalStatsSection: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  goalStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  goalStatValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  goalStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  goalItemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalActionButton: {
    flex: 1,
  },
  goalActionButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalMenuButton: {
    minWidth: 36,
    height: 36,
  },
  goalMenuButtonContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
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
