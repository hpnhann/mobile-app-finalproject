import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Button, Text, TextInput, HelperText, Surface, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { useToast } from '../hooks/useToast';

interface SpendFromGoalDialogProps {
  visible: boolean;
  onDismiss: () => void;
  goal: any;
  onSuccess: () => void;
}

interface Category {
  categoryId: number;
  name: string;
  type: 'expense';
  icon?: string;
  isChild?: boolean;
  parentCategoryId?: number;
}

export default function SpendFromGoalDialog({ visible, onDismiss, goal, onSuccess }: SpendFromGoalDialogProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (visible && goal) {
      loadExpenseCategories();
      setAmount('');
      setCategoryId(null);
      setNote('');
      setCategorySearch('');
    }
  }, [visible, goal]);

  const loadExpenseCategories = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCategoriesByType('expense');
      const parentCategories = (response as any).categories || [];
      
      const allCategories: Category[] = [];
      
      parentCategories.forEach((parent: any) => {
        if (parent.type === 'expense') {
          allCategories.push({
            categoryId: parent.parentCategoryId,
            name: parent.name,
            type: 'expense',
            icon: parent.icon,
            isChild: false
          });
        }
        
        if (parent.children && Array.isArray(parent.children)) {
          parent.children.forEach((child: any) => {
            if (child.type === 'expense') {
              allCategories.push({
                categoryId: child.childCategoryId,
                name: `${parent.name} - ${child.name}`,
                type: 'expense',
                icon: child.icon || parent.icon,
                isChild: true,
                parentCategoryId: parent.parentCategoryId
              });
            }
          });
        }
      });
      
      setExpenseCategories(allCategories);
      
      if (allCategories.length > 0) {
        setCategoryId(allCategories[0].categoryId);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setExpenseCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  const handleSubmit = async () => {
    if (!amount || !categoryId) {
      showError('Vui lòng nhập số tiền và chọn danh mục');
      return;
    }

    // Remove all non-numeric characters (both comma and dot as thousands separators)
    const cleanAmount = amount.replace(/[^\d]/g, '');
    const numericAmount = Number(cleanAmount);

    if (numericAmount <= 0) {
      showError('Số tiền phải lớn hơn 0');
      return;
    }

    if (numericAmount > goal.currentAmount) {
      showError(`Số tiền không được vượt quá số dư: ${goal.currentAmount.toLocaleString('vi-VN')} ₫`);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.spendFromGoal(goal.goalId, numericAmount, categoryId, note || '');
      showSuccess('Chi tiêu thành công!');
      onSuccess();
      onDismiss();
    } catch (error: any) {
      showError(error.message || 'Không thể chi tiêu');
    } finally {
      setIsLoading(false);
    }
  };

  if (!goal) return null;

  const maxAmount = goal.currentAmount;
  const selectedCategory = expenseCategories.find(c => c.categoryId === categoryId);
  const filteredCategories = expenseCategories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title style={styles.title}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="arrow-down-right" size={24} color={colors.error} />
          <Text style={styles.titleText}>Chi tiêu từ mục tiêu</Text>
        </View>
      </Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          {/* Goal Info */}
          <Surface style={styles.goalInfo} elevation={1}>
            <View style={styles.goalInfoRow}>
              <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
              <Text style={styles.goalInfoTitle}>{goal.title}</Text>
            </View>
            <Text style={styles.goalInfoBalance}>
              Số dư hiện tại: {goal.currentAmount.toLocaleString('vi-VN')} ₫
            </Text>
          </Surface>

          {/* Amount Input */}
          <Text style={styles.label}>Số tiền chi tiêu *</Text>
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
            Tối đa: {maxAmount.toLocaleString('vi-VN')} ₫
          </HelperText>

          {/* Category Selection */}
          <Text style={styles.label}>Danh mục chi tiêu *</Text>
          {selectedCategory ? (
            <Surface style={styles.selectedCategory} elevation={1}>
              <View style={styles.selectedCategoryContent}>
                <Text style={styles.selectedCategoryIcon}>{selectedCategory.icon || '📝'}</Text>
                <Text style={styles.selectedCategoryName} numberOfLines={1}>
                  {selectedCategory.name}
                </Text>
                <Button
                  mode="text"
                  onPress={() => setShowCategoryPicker(true)}
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
              onPress={() => setShowCategoryPicker(true)}
              style={styles.pickerButton}
              icon="tag"
            >
              Chọn danh mục chi tiêu
            </Button>
          )}

          {showCategoryPicker && (
            <Surface style={styles.categoryPicker} elevation={2}>
              <View style={styles.categoryPickerHeader}>
                <Text style={styles.categoryPickerTitle}>Chọn danh mục</Text>
                <Button
                  mode="text"
                  onPress={() => {
                    setShowCategoryPicker(false);
                    setCategorySearch('');
                  }}
                  icon="close"
                  compact
                >
                  Đóng
                </Button>
              </View>
              <TextInput
                placeholder="Tìm kiếm danh mục..."
                value={categorySearch}
                onChangeText={setCategorySearch}
                mode="outlined"
                left={<TextInput.Icon icon="magnify" />}
                style={styles.searchInput}
              />
              <ScrollView style={styles.categoryList}>
                {filteredCategories.map((category) => (
                  <Button
                    key={category.categoryId}
                    mode={categoryId === category.categoryId ? 'contained' : 'text'}
                    onPress={() => {
                      setCategoryId(category.categoryId);
                      setShowCategoryPicker(false);
                    }}
                    style={styles.categoryItem}
                    icon={() => <Text>{category.icon || '📝'}</Text>}
                  >
                    {category.name}
                  </Button>
                ))}
              </ScrollView>
            </Surface>
          )}

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
          disabled={isLoading || !amount || !categoryId}
          buttonColor={colors.error}
          icon="arrow-down-right"
        >
          Chi tiêu
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  goalInfoTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  goalInfoBalance: {
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
  },
  selectedCategory: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  selectedCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedCategoryIcon: {
    fontSize: 20,
  },
  selectedCategoryName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  pickerButton: {
    marginBottom: spacing.md,
  },
  categoryPicker: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 300,
  },
  categoryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryPickerTitle: {
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
});
