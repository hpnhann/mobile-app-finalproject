import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, Menu, IconButton, Surface, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

interface Wallet {
  walletId: number;
  walletName: string;
  currentBalance: number;
  walletType?: string;
}

export default function AddLoanScreen() {
  const [loanType, setLoanType] = useState<'borrow' | 'lend'>('borrow');
  const [walletId, setWalletId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  // Date picker states for startDate
  const [selectedStartDay, setSelectedStartDay] = useState<number>(new Date().getDate());
  const [selectedStartMonth, setSelectedStartMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedStartYear, setSelectedStartYear] = useState<number>(new Date().getFullYear());
  const [showStartDayMenu, setShowStartDayMenu] = useState(false);
  const [showStartMonthMenu, setShowStartMonthMenu] = useState(false);
  const [showStartYearMenu, setShowStartYearMenu] = useState(false);

  // Date picker states for dueDate
  const [selectedDueDay, setSelectedDueDay] = useState<number>(1);
  const [selectedDueMonth, setSelectedDueMonth] = useState<number>(1);
  const [selectedDueYear, setSelectedDueYear] = useState<number>(new Date().getFullYear());
  const [showDueDayMenu, setShowDueDayMenu] = useState(false);
  const [showDueMonthMenu, setShowDueMonthMenu] = useState(false);
  const [showDueYearMenu, setShowDueYearMenu] = useState(false);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    loadWallets();
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
  }, []);

  // Update startDate when day, month, or year changes
  useEffect(() => {
    if (selectedStartDay && selectedStartMonth && selectedStartYear) {
      const formattedDate = `${selectedStartYear}-${String(selectedStartMonth).padStart(2, '0')}-${String(selectedStartDay).padStart(2, '0')}`;
      setStartDate(formattedDate);
    }
  }, [selectedStartDay, selectedStartMonth, selectedStartYear]);

  // Update dueDate when day, month, or year changes
  useEffect(() => {
    if (selectedDueDay && selectedDueMonth && selectedDueYear) {
      const formattedDate = `${selectedDueYear}-${String(selectedDueMonth).padStart(2, '0')}-${String(selectedDueDay).padStart(2, '0')}`;
      setDueDate(formattedDate);
    }
  }, [selectedDueDay, selectedDueMonth, selectedDueYear]);

  const loadWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const [budgetWalletsRes, investmentWalletsRes] = await Promise.all([
        apiClient.getWallets({ month: currentMonth, year: currentYear }),
        apiClient.getInvestmentWallets({ month: currentMonth, year: currentYear }),
      ]);
      
      const allWallets = [
        ...((budgetWalletsRes as any)?.wallets || []),
        ...((investmentWalletsRes as any)?.wallets || []),
      ];
      setWallets(allWallets);
      
      if (allWallets.length > 0) {
        setWalletId(allWallets[0].walletId);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      showError('Không thể tải danh sách ví');
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const startDayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedStartYear, selectedStartMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedStartMonth, selectedStartYear]);

  const dueDayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedDueYear, selectedDueMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedDueMonth, selectedDueYear]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
  }, []);

  const getMonthLabel = (m: number) => {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return months[m - 1];
  };

  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setPrincipalAmount(formattedValue);
  };

  const handleInterestRateChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    setInterestRate(numericValue);
  };

  const handleSubmit = async () => {
    if (!walletId || !title || !principalAmount || !startDate) {
      showError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Remove all non-numeric characters
    const cleanAmount = principalAmount.replace(/[^\d]/g, '');
    const numericAmount = Number(cleanAmount);

    if (numericAmount <= 0) {
      showError(loanType === 'borrow' ? 'Số tiền vay phải lớn hơn 0' : 'Số tiền cho vay phải lớn hơn 0');
      return;
    }

    // Check wallet balance for lend
    if (loanType === 'lend') {
      const selectedWallet = wallets.find(w => w.walletId === walletId);
      if (selectedWallet && selectedWallet.currentBalance < numericAmount) {
        showError('Số dư ví không đủ để cho vay');
        return;
      }
    }

    setIsLoading(true);
    try {
      await apiClient.createLoan({
        walletId,
        type: loanType,
        title: title.trim(),
        description: description?.trim() || undefined,
        principalAmount: numericAmount,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        startDate,
        dueDate: dueDate || undefined,
        borrowerName: borrowerName?.trim() || undefined,
      });
      showSuccess(loanType === 'borrow' ? 'Tạo khoản vay thành công!' : 'Tạo khoản cho vay thành công!');
      setTimeout(() => {
        router.push('/(tabs)/loans');
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Không thể tạo khoản vay');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWallet = wallets.find(w => w.walletId === walletId);

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.textPrimary}
            onPress={() => router.push('/(tabs)/loans')}
          />
          <Text style={styles.topBarTitle}>Tạo khoản vay</Text>
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
                <Text style={styles.label}>Loại khoản vay</Text>
                <SegmentedButtons
                  value={loanType}
                  onValueChange={(value) => setLoanType(value as 'borrow' | 'lend')}
                  buttons={[
                    { value: 'borrow', label: 'Vay tiền', icon: 'trending-up' },
                    { value: 'lend', label: 'Cho vay', icon: 'trending-down' },
                  ]}
                  style={styles.segment}
                />

                <Text style={styles.label}>Ví {loanType === 'borrow' ? 'nhận tiền' : 'cho vay'} *</Text>
                {selectedWallet ? (
                  <Surface style={styles.selectedWallet} elevation={1}>
                    <View style={styles.selectedWalletContent}>
                      <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
                      <View style={styles.selectedWalletInfo}>
                        <Text style={styles.selectedWalletName}>{selectedWallet.walletName}</Text>
                        <Text style={styles.selectedWalletBalance}>
                          Số dư: {selectedWallet.currentBalance.toLocaleString('vi-VN')} ₫
                        </Text>
                      </View>
                      <Button
                        mode="text"
                        onPress={() => setShowWalletPicker(true)}
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
                    onPress={() => setShowWalletPicker(true)}
                    style={styles.pickerButton}
                    icon="wallet"
                  >
                    Chọn ví
                  </Button>
                )}

                {showWalletPicker && (
                  <Surface style={styles.walletPicker} elevation={2}>
                    <View style={styles.walletPickerHeader}>
                      <Text style={styles.walletPickerTitle}>Chọn ví</Text>
                      <Button
                        mode="text"
                        onPress={() => setShowWalletPicker(false)}
                        icon="close"
                        compact
                      >
                        Đóng
                      </Button>
                    </View>
                    <ScrollView style={styles.walletList}>
                      {wallets.map((wallet) => (
                        <Button
                          key={wallet.walletId}
                          mode={walletId === wallet.walletId ? 'contained' : 'text'}
                          onPress={() => {
                            setWalletId(wallet.walletId);
                            setShowWalletPicker(false);
                          }}
                          style={styles.walletItem}
                          icon="wallet"
                        >
                          {wallet.walletName} - {wallet.currentBalance.toLocaleString('vi-VN')} ₫
                        </Button>
                      ))}
                    </ScrollView>
                  </Surface>
                )}

                <TextInput
                  label="Tiêu đề *"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  placeholder={loanType === 'borrow' ? 'Ví dụ: Vay mua xe máy' : 'Ví dụ: Cho vay mua nhà'}
                  style={styles.input}
                />

                <TextInput
                  label="Mô tả"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Mô tả chi tiết về khoản vay..."
                  style={styles.input}
                />

                <TextInput
                  label={loanType === 'borrow' ? 'Số tiền vay *' : 'Số tiền cho vay *'}
                  value={principalAmount}
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

                <TextInput
                  label="Lãi suất (%)"
                  value={interestRate}
                  onChangeText={handleInterestRateChange}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  right={<TextInput.Affix text="%" />}
                  left={<TextInput.Icon icon="percent" />}
                  style={styles.input}
                />

                <Text style={styles.label}>Ngày bắt đầu *</Text>
                {startDate && (
                  <Surface style={styles.selectedDateContainer} elevation={1}>
                    <View style={styles.selectedDateContent}>
                      <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primary} />
                      <View style={styles.selectedDateTextContainer}>
                        <Text style={styles.selectedDateLabel}>Ngày đã chọn</Text>
                        <Text style={styles.selectedDateValue}>{getFormattedDate(startDate)}</Text>
                      </View>
                    </View>
                  </Surface>
                )}

                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerRow}>
                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Ngày</Text>
                      <Menu
                        visible={showStartDayMenu}
                        onDismiss={() => setShowStartDayMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowStartMonthMenu(false);
                                setShowStartYearMenu(false);
                                setShowStartDayMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />}
                            >
                              {selectedStartDay}
                            </Button>
                          </Surface>
                        }
                      >
                        {startDayOptions.map((day) => (
                          <Menu.Item
                            key={day}
                            onPress={() => {
                              setSelectedStartDay(day);
                              setShowStartDayMenu(false);
                            }}
                            title={`Ngày ${day}`}
                            titleStyle={selectedStartDay === day ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Tháng</Text>
                      <Menu
                        visible={showStartMonthMenu}
                        onDismiss={() => setShowStartMonthMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowStartDayMenu(false);
                                setShowStartYearMenu(false);
                                setShowStartMonthMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar-month" size={18} color={colors.primary} />}
                            >
                              {getMonthLabel(selectedStartMonth)}
                            </Button>
                          </Surface>
                        }
                      >
                        {monthOptions.map((month) => (
                          <Menu.Item
                            key={month}
                            onPress={() => {
                              setSelectedStartMonth(month);
                              const daysInNewMonth = new Date(selectedStartYear, month, 0).getDate();
                              if (selectedStartDay > daysInNewMonth) {
                                setSelectedStartDay(daysInNewMonth);
                              }
                              setShowStartMonthMenu(false);
                            }}
                            title={getMonthLabel(month)}
                            titleStyle={selectedStartMonth === month ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Năm</Text>
                      <Menu
                        visible={showStartYearMenu}
                        onDismiss={() => setShowStartYearMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowStartDayMenu(false);
                                setShowStartMonthMenu(false);
                                setShowStartYearMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar-range" size={18} color={colors.primary} />}
                            >
                              {selectedStartYear}
                            </Button>
                          </Surface>
                        }
                      >
                        {yearOptions.map((year) => (
                          <Menu.Item
                            key={year}
                            onPress={() => {
                              setSelectedStartYear(year);
                              const daysInNewMonth = new Date(year, selectedStartMonth, 0).getDate();
                              if (selectedStartDay > daysInNewMonth) {
                                setSelectedStartDay(daysInNewMonth);
                              }
                              setShowStartYearMenu(false);
                            }}
                            title={String(year)}
                            titleStyle={selectedStartYear === year ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Hạn thanh toán (tùy chọn)</Text>
                {dueDate && (
                  <Surface style={styles.selectedDateContainer} elevation={1}>
                    <View style={styles.selectedDateContent}>
                      <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primary} />
                      <View style={styles.selectedDateTextContainer}>
                        <Text style={styles.selectedDateLabel}>Ngày đã chọn</Text>
                        <Text style={styles.selectedDateValue}>{getFormattedDate(dueDate)}</Text>
                      </View>
                    </View>
                  </Surface>
                )}

                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerRow}>
                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Ngày</Text>
                      <Menu
                        visible={showDueDayMenu}
                        onDismiss={() => setShowDueDayMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowDueMonthMenu(false);
                                setShowDueYearMenu(false);
                                setShowDueDayMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />}
                            >
                              {selectedDueDay}
                            </Button>
                          </Surface>
                        }
                      >
                        {dueDayOptions.map((day) => (
                          <Menu.Item
                            key={day}
                            onPress={() => {
                              setSelectedDueDay(day);
                              setShowDueDayMenu(false);
                            }}
                            title={`Ngày ${day}`}
                            titleStyle={selectedDueDay === day ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Tháng</Text>
                      <Menu
                        visible={showDueMonthMenu}
                        onDismiss={() => setShowDueMonthMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowDueDayMenu(false);
                                setShowDueYearMenu(false);
                                setShowDueMonthMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar-month" size={18} color={colors.primary} />}
                            >
                              {getMonthLabel(selectedDueMonth)}
                            </Button>
                          </Surface>
                        }
                      >
                        {monthOptions.map((month) => (
                          <Menu.Item
                            key={month}
                            onPress={() => {
                              setSelectedDueMonth(month);
                              const daysInNewMonth = new Date(selectedDueYear, month, 0).getDate();
                              if (selectedDueDay > daysInNewMonth) {
                                setSelectedDueDay(daysInNewMonth);
                              }
                              setShowDueMonthMenu(false);
                            }}
                            title={getMonthLabel(month)}
                            titleStyle={selectedDueMonth === month ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>

                    <View style={styles.datePickerCol}>
                      <Text style={styles.datePickerLabel}>Năm</Text>
                      <Menu
                        visible={showDueYearMenu}
                        onDismiss={() => setShowDueYearMenu(false)}
                        anchor={
                          <Surface style={styles.datePickerButton} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => {
                                setShowDueDayMenu(false);
                                setShowDueMonthMenu(false);
                                setShowDueYearMenu((prev) => !prev);
                              }}
                              contentStyle={styles.datePickerButtonContent}
                              labelStyle={styles.datePickerButtonLabel}
                              icon={() => <MaterialCommunityIcons name="calendar-range" size={18} color={colors.primary} />}
                            >
                              {selectedDueYear}
                            </Button>
                          </Surface>
                        }
                      >
                        {yearOptions.map((year) => (
                          <Menu.Item
                            key={year}
                            onPress={() => {
                              setSelectedDueYear(year);
                              const daysInNewMonth = new Date(year, selectedDueMonth, 0).getDate();
                              if (selectedDueDay > daysInNewMonth) {
                                setSelectedDueDay(daysInNewMonth);
                              }
                              setShowDueYearMenu(false);
                            }}
                            title={String(year)}
                            titleStyle={selectedDueYear === year ? { color: colors.primary, fontWeight: '600' } : {}}
                          />
                        ))}
                      </Menu>
                    </View>
                  </View>
                </View>

                <TextInput
                  label={loanType === 'borrow' ? 'Người cho vay' : 'Người vay'}
                  value={borrowerName}
                  onChangeText={setBorrowerName}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                  placeholder={loanType === 'borrow' ? 'Tên người cho vay' : 'Tên người vay'}
                  style={styles.input}
                />

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/(tabs)/loans')}
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
                    disabled={isLoading || isLoadingWallets}
                    style={styles.submitButton}
                    buttonColor={loanType === 'borrow' ? colors.success : colors.info}
                    textColor="#fff"
                    icon="check"
                  >
                    Tạo khoản vay
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
  selectedWallet: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  selectedWalletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedWalletInfo: {
    flex: 1,
  },
  selectedWalletName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedWalletBalance: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pickerButton: {
    marginBottom: spacing.md,
  },
  walletPicker: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 300,
  },
  walletPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  walletPickerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  walletList: {
    maxHeight: 200,
  },
  walletItem: {
    marginBottom: spacing.xs,
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
