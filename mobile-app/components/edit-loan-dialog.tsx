import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Button, Text, TextInput, HelperText, Surface, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { colors, spacing, borderRadius, typography } from '../constants/theme';
import { useToast } from '../hooks/useToast';

interface EditLoanDialogProps {
  visible: boolean;
  onDismiss: () => void;
  loan: any;
  onSuccess: () => void;
}

export default function EditLoanDialog({ visible, onDismiss, loan, onSuccess }: EditLoanDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Date picker states for dueDate
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);

  const { showSuccess: showSuccessToast, showError } = useToast();

  useEffect(() => {
    if (visible && loan) {
      setTitle(loan.title || '');
      setDescription(loan.description || '');
      setInterestRate(loan.interestRate?.toString() || '');
      setBorrowerName(loan.borrowerName || '');
      
      if (loan.dueDate) {
        setDueDate(loan.dueDate);
        const date = new Date(loan.dueDate);
        setSelectedDay(date.getDate());
        setSelectedMonth(date.getMonth() + 1);
        setSelectedYear(date.getFullYear());
      } else {
        setDueDate('');
      }
    }
  }, [visible, loan]);

  // Update dueDate when day, month, or year changes
  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      setDueDate(formattedDate);
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  const dayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear + i);
  }, []);

  const getMonthLabel = (m: number) => {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return months[m - 1];
  };

  const getFormattedDate = () => {
    if (!dueDate) return 'Chọn ngày hạn';
    const date = new Date(dueDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleInterestRateChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    setInterestRate(numericValue);
  };

  const handleSubmit = async () => {
    if (!title || !title.trim()) {
      showError('Vui lòng nhập tiêu đề');
      return;
    }

    setIsLoading(true);
    try {
      const trimmedBorrowerName = (borrowerName || '').trim();
      const borrowerNameValue = trimmedBorrowerName || null;

      const updateData: any = {
        title: title.trim(),
        description: description?.trim() || undefined,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        dueDate: dueDate || undefined,
        borrowerName: borrowerNameValue,
      };

      await apiClient.updateLoan(loan.loanId, updateData);
      showSuccessToast('Cập nhật khoản vay thành công!');
      onSuccess();
      onDismiss();
    } catch (error: any) {
      showError(error.message || 'Không thể cập nhật khoản vay');
    } finally {
      setIsLoading(false);
    }
  };

  if (!loan) return null;

  const isBorrowing = loan.type === 'borrow';

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title style={styles.title}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
          <Text style={styles.titleText}>Chỉnh sửa khoản vay</Text>
        </View>
      </Dialog.Title>
      <Dialog.Content>
        <ScrollView>
          <TextInput
            label="Tiêu đề *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Mô tả"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="Lãi suất (%)"
            value={interestRate}
            onChangeText={handleInterestRateChange}
            mode="outlined"
            keyboardType="decimal-pad"
            right={<TextInput.Affix text="%" />}
            style={styles.input}
          />

          <Text style={styles.label}>Hạn thanh toán</Text>
          {dueDate && (
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
            label={isBorrowing ? 'Người cho vay' : 'Người vay'}
            value={borrowerName}
            onChangeText={setBorrowerName}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
            placeholder={isBorrowing ? 'Tên người cho vay' : 'Tên người vay'}
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
          disabled={isLoading}
          buttonColor={colors.primary}
          icon="check"
        >
          Cập nhật
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
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    height: 56,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
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
});
