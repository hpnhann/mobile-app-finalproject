import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, SegmentedButtons, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

interface ParentCategory {
  parentCategoryId: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

interface ChildCategory {
  childCategoryId: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  parentCategoryId: number;
  parent?: {
    parentCategoryId: number;
    name: string;
  };
}

interface Wallet {
  walletId: number;
  walletName: string;
  walletType?: string;
}

export default function AddTransactionScreen() {
  const params = useLocalSearchParams();
  const transactionId = params.transactionId ? parseInt(params.transactionId as string) : null;
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [childCategoryId, setChildCategoryId] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<number | null>(null);
  
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Load wallets first
      const [budgetWalletsRes, investmentWalletsRes] = await Promise.all([
        apiClient.getWallets({ month: currentMonth, year: currentYear }),
        apiClient.getInvestmentWallets({ month: currentMonth, year: currentYear }),
      ]);
      
      const allWallets = [
        ...((budgetWalletsRes as any)?.wallets || []),
        ...((investmentWalletsRes as any)?.wallets || []),
      ];
      setWallets(allWallets);
      
      // Load transaction data if editing - need to determine type first
      let initialType: 'income' | 'expense' = 'expense';
      let savedParentCategoryId: number | null = null;
      let savedChildCategoryId: number | null = null;
      
      if (transactionId) {
        const transactionRes: any = await apiClient.getTransactions();
        const transactions = transactionRes?.transactions || transactionRes?.data || [];
        const transaction = transactions.find((t: any) => t.transactionId === transactionId);
        
        if (transaction) {
          setAmount(Math.abs(Number(transaction.amount || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
          setNote(transaction.note || '');
          setTransactionDate(transaction.transactionDate ? new Date(transaction.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
          
          const category = transaction.parentCategory || transaction.childCategory;
          if (category) {
            initialType = category.type;
            setTransactionType(initialType);
            
            if (transaction.childCategory?.childCategoryId) {
              savedChildCategoryId = transaction.childCategory.childCategoryId;
            } else if (transaction.parentCategory?.parentCategoryId) {
              savedParentCategoryId = transaction.parentCategory.parentCategoryId;
            }
          }
          
          if (transaction.wallet) {
            setWalletId(transaction.wallet.walletId);
          }
        }
      }
      
      // Load categories based on type (after determining type from transaction if editing)
      const [parentRes, childRes] = await Promise.all([
        apiClient.getParentCategories(initialType),
        apiClient.getChildCategories(),
      ]);
      
      setParentCategories((parentRes as any)?.categories || []);
      setChildCategories((childRes as any)?.categories || []);
      
      // Set category IDs after categories are loaded
      if (transactionId) {
        if (savedChildCategoryId) {
          setChildCategoryId(savedChildCategoryId);
          setParentCategoryId(null);
        } else if (savedParentCategoryId) {
          setParentCategoryId(savedParentCategoryId);
          setChildCategoryId(null);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Không thể tải dữ liệu');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Reload categories when type changes (only if not loading initial data)
    if (!isLoadingData && !transactionId) {
      apiClient.getParentCategories(transactionType).then((res: any) => {
        setParentCategories(res?.categories || []);
      });
      setParentCategoryId(null);
      setChildCategoryId(null);
    }
  }, [transactionType]);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  const getChildCategoriesForParent = (parentId: number) => {
    return childCategories.filter(
      cat => cat.parentCategoryId === parentId && cat.type === transactionType
    );
  };

  const toggleParentExpansion = (parentId: number) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const handleCategorySelect = (category: ParentCategory | ChildCategory) => {
    if ('childCategoryId' in category) {
      setChildCategoryId(category.childCategoryId);
      setParentCategoryId(null);
    } else {
      setParentCategoryId(category.parentCategoryId);
      setChildCategoryId(null);
    }
    setShowCategoryPicker(false);
    setCategorySearch('');
  };

  const getSelectedCategory = () => {
    if (childCategoryId) {
      return childCategories.find(cat => cat.childCategoryId === childCategoryId);
    } else if (parentCategoryId) {
      return parentCategories.find(cat => cat.parentCategoryId === parentCategoryId);
    }
    return null;
  };

  const filteredParentCategories = parentCategories.filter(
    cat => cat.type === transactionType &&
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!amount || (!parentCategoryId && !childCategoryId) || !walletId) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const transactionData = {
      parentCategoryId: parentCategoryId,
      childCategoryId: childCategoryId,
      walletId: walletId,
      amount: Number(amount.replace(/,/g, '') || '0'),
      transactionDate: transactionDate,
      note: note || undefined,
    };

    setIsLoading(true);
    try {
      if (transactionId) {
        await apiClient.updateTransaction(transactionId, transactionData);
        showSuccess('Cập nhật giao dịch thành công!');
      } else {
        await apiClient.createTransaction(transactionData);
        showSuccess('Giao dịch đã được thêm!');
      }
      setTimeout(() => {
        router.push('/(tabs)/transactions');
      }, 1500);
    } catch (error: any) {
      showError(error.message || (transactionId ? 'Không thể cập nhật giao dịch' : 'Không thể thêm giao dịch'));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = getSelectedCategory();
  const selectedWallet = wallets.find(w => w.walletId === walletId);

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.textPrimary}
            onPress={() => router.push('/(tabs)/transactions')}
          />
          <Text style={styles.topBarTitle}>
            {transactionId ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <Text style={styles.label}>Loại giao dịch</Text>
                <SegmentedButtons
                  value={transactionType}
                  onValueChange={(value) => {
                    setTransactionType(value as 'income' | 'expense');
                    setParentCategoryId(null);
                    setChildCategoryId(null);
                  }}
                  buttons={[
                    { value: 'expense', label: 'Chi tiêu', icon: 'arrow-down' },
                    { value: 'income', label: 'Thu nhập', icon: 'arrow-up' },
                  ]}
                  style={styles.segment}
                />

                <Text style={styles.label}>Ngày giao dịch *</Text>
                <TextInput
                  value={transactionDate}
                  onChangeText={setTransactionDate}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                  left={<TextInput.Icon icon="calendar" />}
                  style={styles.input}
                />

                <Text style={styles.label}>Số tiền *</Text>
                <TextInput
                  label="Số tiền"
                  value={amount}
                  onChangeText={handleAmountChange}
                  mode="outlined"
                  keyboardType="numeric"
                  right={<TextInput.Affix text="₫" />}
                  left={<TextInput.Icon icon="currency-usd" />}
                  style={styles.input}
                />
                <HelperText type="info" visible>
                  Nhập số tiền, hệ thống sẽ tự thêm dấu phân cách.
                </HelperText>

                <Text style={styles.label}>Danh mục *</Text>
                {selectedCategory ? (
                  <Surface style={styles.selectedItem} elevation={1}>
                    <View style={styles.selectedItemContent}>
                      <Text style={styles.selectedItemIcon}>{selectedCategory.icon || '📝'}</Text>
                      <Text style={styles.selectedItemText} numberOfLines={1}>
                        {selectedCategory.name}
                      </Text>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => {
                          setParentCategoryId(null);
                          setChildCategoryId(null);
                        }}
                      />
                    </View>
                  </Surface>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={() => setShowCategoryPicker(true)}
                    style={styles.pickerButton}
                    icon="chevron-down"
                    contentStyle={styles.pickerButtonContent}
                  >
                    Chọn danh mục
                  </Button>
                )}

                {showCategoryPicker && (
                  <Surface style={styles.pickerContainer} elevation={2}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>Chọn danh mục</Text>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => {
                          setShowCategoryPicker(false);
                          setCategorySearch('');
                        }}
                      />
                    </View>
                    
                    <TextInput
                      placeholder="Tìm kiếm danh mục..."
                      value={categorySearch}
                      onChangeText={setCategorySearch}
                      mode="outlined"
                      left={<TextInput.Icon icon="magnify" />}
                      style={styles.searchInput}
                    />

                    <ScrollView style={styles.categoryList} nestedScrollEnabled>
                      {filteredParentCategories.map((parent) => {
                        const children = getChildCategoriesForParent(parent.parentCategoryId);
                        const isExpanded = expandedParents.has(parent.parentCategoryId);
                        const hasChildren = children.length > 0;

                        return (
                          <View key={parent.parentCategoryId} style={styles.categoryItem}>
                            <View style={styles.categoryRow}>
                              {hasChildren && (
                                <IconButton
                                  icon={isExpanded ? 'chevron-down' : 'chevron-right'}
                                  size={20}
                                  onPress={() => toggleParentExpansion(parent.parentCategoryId)}
                                />
                              )}
                              {!hasChildren && <View style={{ width: 40 }} />}
                              
                              <Button
                                mode="text"
                                onPress={() => handleCategorySelect(parent)}
                                style={styles.categoryButton}
                                contentStyle={styles.categoryButtonContent}
                              >
                                <Text style={styles.categoryIcon}>{parent.icon || '📝'}</Text>
                                <Text style={styles.categoryName}>{parent.name}</Text>
                                {hasChildren && (
                                  <Text style={styles.categoryCount}>({children.length})</Text>
                                )}
                              </Button>
                            </View>

                            {isExpanded && children.map((child) => (
                              <View key={child.childCategoryId} style={styles.childCategoryItem}>
                                <Button
                                  mode="text"
                                  onPress={() => handleCategorySelect(child)}
                                  style={styles.categoryButton}
                                  contentStyle={styles.categoryButtonContent}
                                >
                                  <Text style={styles.categoryIcon}>{child.icon || '📝'}</Text>
                                  <Text style={styles.categoryName}>{child.name}</Text>
                                </Button>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </Surface>
                )}

                <Text style={styles.label}>Ví *</Text>
                {selectedWallet ? (
                  <Surface style={styles.selectedItem} elevation={1}>
                    <View style={styles.selectedItemContent}>
                      <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                      <Text style={styles.selectedItemText} numberOfLines={1}>
                        {selectedWallet.walletName}
                      </Text>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => setWalletId(null)}
                      />
                    </View>
                  </Surface>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={() => setShowWalletPicker(true)}
                    style={styles.pickerButton}
                    icon="chevron-down"
                    contentStyle={styles.pickerButtonContent}
                  >
                    Chọn ví
                  </Button>
                )}

                {showWalletPicker && (
                  <Surface style={styles.pickerContainer} elevation={2}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>Chọn ví</Text>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => setShowWalletPicker(false)}
                      />
                    </View>
                    
                    <ScrollView style={styles.walletList} nestedScrollEnabled>
                      {wallets.map((wallet) => (
                        <Button
                          key={wallet.walletId}
                          mode="text"
                          onPress={() => {
                            setWalletId(wallet.walletId);
                            setShowWalletPicker(false);
                          }}
                          style={styles.walletButton}
                          contentStyle={styles.walletButtonContent}
                        >
                          <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                          <Text style={styles.walletName}>{wallet.walletName}</Text>
                        </Button>
                      ))}
                    </ScrollView>
                  </Surface>
                )}

                <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
                <TextInput
                  label="Ghi chú"
                  value={note}
                  onChangeText={setNote}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  left={<TextInput.Icon icon="note-text" />}
                  style={styles.input}
                />

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/(tabs)/transactions')}
                    disabled={isLoading}
                    style={styles.cancelButton}
                    textColor={colors.textPrimary}
                    icon="close"
                  >
                    Hủy
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading || isLoadingData}
                    style={styles.submitButton}
                    buttonColor={colors.primary}
                    textColor="#fff"
                    icon={transactionId ? "check" : "plus"}
                  >
                    {transactionId ? 'Cập nhật' : 'Thêm'}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  cardContent: {
    padding: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
  },
  segment: {
    marginBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    height: 56,
  },
  pickerButton: {
    marginBottom: spacing.sm,
  },
  pickerButtonContent: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  selectedItem: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedItemIcon: {
    fontSize: 20,
  },
  selectedItemText: {
    flex: 1,
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  pickerContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    maxHeight: 300,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  searchInput: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  categoryList: {
    maxHeight: 200,
  },
  categoryItem: {
    marginBottom: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryButton: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  categoryName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  childCategoryItem: {
    marginLeft: spacing.xl,
    marginBottom: spacing.xs,
  },
  walletList: {
    maxHeight: 200,
  },
  walletButton: {
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  walletButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  walletName: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 2,
  },
});
