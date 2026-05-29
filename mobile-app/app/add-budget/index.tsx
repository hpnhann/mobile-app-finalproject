import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, Menu, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

interface Category {
  categoryId: number;
  name: string;
  type: 'income' | 'expense';
}

export default function AddBudgetScreen() {
  const [budgetName, setBudgetName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      // Only show expense categories for budgets
      setCategories(response.data?.filter((cat: Category) => cat.type === 'expense') || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    // Set default dates (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(startOfMonth.toISOString().split('T')[0]);
    setEndDate(endOfMonth.toISOString().split('T')[0]);
  }, []);

  const handleMoneyChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  const handleSubmit = async () => {
    if (!budgetName || !amount || !selectedCategory || !startDate || !endDate) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const budgetData = {
      budgetName,
      amount: Number(amount.replace(/,/g, '') || '0'),
      categoryId: selectedCategory.categoryId,
      startDate,
      endDate,
    };

    setIsLoading(true);
    try {
      await apiClient.createBudget(budgetData);
      showSuccess('Ngân sách đã được tạo!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Không thể tạo ngân sách');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineMedium" style={styles.title}>Tạo ngân sách</Text>
                <Text style={styles.subtitle}>Thiết lập ngân sách để kiểm soát chi tiêu.</Text>

            <TextInput
              label="Tên ngân sách"
              value={budgetName}
              onChangeText={setBudgetName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Số tiền *"
              value={amount}
              onChangeText={handleMoneyChange}
              mode="outlined"
              keyboardType="numeric"
              right={<TextInput.Affix text="₫" />}
              style={styles.input}
            />

            <HelperText type="info" visible>
              Số tiền ngân sách cho khoảng thời gian đã chọn.
            </HelperText>

            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowCategoryMenu(true)}
                  style={styles.menuButton}
                >
                  {selectedCategory ? selectedCategory.name : 'Chọn danh mục'}
                </Button>
              }
            >
              {categories.map((category) => (
                <Menu.Item
                  key={category.categoryId}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryMenu(false);
                  }}
                  title={category.name}
                />
              ))}
            </Menu>

            <TextInput
              label="Ngày bắt đầu (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              mode="outlined"
              placeholder="2024-01-01"
              style={styles.input}
            />

            <TextInput
              label="Ngày kết thúc (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              mode="outlined"
              placeholder="2024-01-31"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
            >
              Tạo ngân sách
            </Button>
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
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    margin: 0,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  menuButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 20,
  },
});