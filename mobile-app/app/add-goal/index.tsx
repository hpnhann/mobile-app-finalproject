import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, Menu, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

export default function AddGoalScreen() {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Date picker states
  const currentDate = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(currentDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Initialize targetDate on mount
  React.useEffect(() => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setTargetDate(formattedDate);
  }, []);

  // Generate day options based on selected month and year
  const dayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear + i);
  }, []);

  // Update targetDate when day, month, or year changes
  React.useEffect(() => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setTargetDate(formattedDate);
  }, [selectedDay, selectedMonth, selectedYear]);

  // Format date for display
  const getFormattedDate = () => {
    if (!targetDate) return 'Chọn ngày mục tiêu';
    const date = new Date(targetDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMonthLabel = (m: number) => {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return months[m - 1];
  };

  const handleMoneyChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setTargetAmount(formattedValue);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!goalName || !goalName.trim()) {
      showError('Vui lòng nhập tên mục tiêu');
      return;
    }
    
    if (!targetAmount || targetAmount.trim() === '' || Number(targetAmount.replace(/,/g, '')) <= 0) {
      showError('Vui lòng nhập số tiền mục tiêu hợp lệ');
      return;
    }
    
    if (!targetDate || targetDate.trim() === '') {
      showError('Vui lòng chọn ngày mục tiêu');
      return;
    }

    // Validate deadline must be after today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(targetDate);
    deadlineDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate <= today) {
      showError('Ngày hạn phải sau ngày hiện tại');
      return;
    }

    const goalData = {
      title: goalName.trim(),
      targetAmount: Number(targetAmount.replace(/,/g, '') || '0'),
      deadline: targetDate,
      description: description?.trim() || undefined,
    };

    setIsLoading(true);
    try {
      await apiClient.createGoal(goalData);
      showSuccess('Mục tiêu đã được tạo!');
      setTimeout(() => {
        router.push('/(tabs)/goals');
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Không thể tạo mục tiêu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.textPrimary}
            onPress={() => router.push('/(tabs)/goals')}
          />
          <Text style={styles.topBarTitle}>Tạo mục tiêu</Text>
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

            <TextInput
              label="Tên mục tiêu"
              value={goalName}
              onChangeText={setGoalName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Số tiền mục tiêu *"
              value={targetAmount}
              onChangeText={handleMoneyChange}
              mode="outlined"
              keyboardType="numeric"
              right={<TextInput.Affix text="₫" />}
              style={styles.input}
            />

            <HelperText type="info" visible>
              Nhập số tiền mục tiêu (tự động thêm dấu phân cách).
            </HelperText>

                <Text style={styles.label}>Ngày mục tiêu *</Text>
                
                {/* Selected Date Display */}
                {targetDate && (
                  <Surface style={styles.selectedDateContainer} elevation={1}>
                    <View style={styles.selectedDateContent}>
                      <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primary} />
                      <View style={styles.selectedDateTextContainer}>
                        <Text style={styles.selectedDateLabel}>Ngày đã chọn</Text>
                        <Text style={styles.selectedDateValue}>{getFormattedDate()}</Text>
                      </View>
                    </View>
                  </Surface>
                )}

                {/* Date Picker Buttons */}
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerRow}>
                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Ngày</Text>
                      <Menu
                        visible={showDayMenu}
                        onDismiss={() => setShowDayMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowMonthMenu(false);
                                setShowYearMenu(false);
                                setShowDayMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />}
                            >
                              {selectedDay}
                            </Button>
                          </Surface>
                        }
                      >
                        {dayOptions.map((day) => (
                          <Menu.Item
                            key={day}
                            onPress={() => {
                              setSelectedDay(day);
                              setShowDayMenu(false);
                            }}
                            title={`Ngày ${day}`}
                            titleStyle={selectedDay === day ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Tháng</Text>
                      <Menu
                        visible={showMonthMenu}
                        onDismiss={() => setShowMonthMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowDayMenu(false);
                                setShowYearMenu(false);
                                setShowMonthMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar-month" size={18} color={colors.primary} />}
                            >
                              {getMonthLabel(selectedMonth)}
                            </Button>
                          </Surface>
                        }
                      >
                        {monthOptions.map((month) => (
                          <Menu.Item
                            key={month}
                            onPress={() => {
                              setSelectedMonth(month);
                              const daysInNewMonth = new Date(selectedYear, month, 0).getDate();
                              if (selectedDay > daysInNewMonth) {
                                setSelectedDay(daysInNewMonth);
                              }
                              setShowMonthMenu(false);
                            }}
                            title={getMonthLabel(month)}
                            titleStyle={selectedMonth === month ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Năm</Text>
                      <Menu
                        visible={showYearMenu}
                        onDismiss={() => setShowYearMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowDayMenu(false);
                                setShowMonthMenu(false);
                                setShowYearMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar-range" size={18} color={colors.primary} />}
                            >
                              {selectedYear}
                            </Button>
                          </Surface>
                        }
                      >
                        {yearOptions.map((year) => (
                          <Menu.Item
                            key={year}
                            onPress={() => {
                              setSelectedYear(year);
                              const daysInNewMonth = new Date(year, selectedMonth, 0).getDate();
                              if (selectedDay > daysInNewMonth) {
                                setSelectedDay(daysInNewMonth);
                              }
                              setShowYearMenu(false);
                            }}
                            title={String(year)}
                            titleStyle={selectedYear === year ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>
                  </View>
                </View>

            <TextInput
              label="Mô tả (tùy chọn)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/(tabs)/goals')}
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
                    disabled={isLoading}
                    style={styles.submitButton}
                    buttonColor={colors.primary}
                    textColor="#fff"
                    icon="check"
                  >
                    Tạo mục tiêu
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
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    height: 56,
  },
  selectedDateContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedDateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedDateTextContainer: {
    flex: 1,
  },
  selectedDateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  selectedDateValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '600',
  },
  datePickerContainer: {
    marginBottom: spacing.md,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  datePickerCol: {
    flex: 1,
  },
  datePickerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontSize: 12,
    fontWeight: '500',
  },
  datePickerButton: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerButtonContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  datePickerButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
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