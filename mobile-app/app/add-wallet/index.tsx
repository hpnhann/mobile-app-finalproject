import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, Menu, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

export default function AddWalletScreen() {
  const [walletName, setWalletName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);

  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }, []);

  const handleMoneyChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setInitialBalance(formattedValue);
  };

  const handleSubmit = async () => {
    if (!walletName.trim() || initialBalance.trim() === '' || initialBalance === '0') {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const walletData = {
      walletName: walletName.trim(),
      initialBalance: Number(initialBalance.replace(/,/g, '') || '0'),
      month,
      year,
      walletType: 'budget', // Default to budget as per web
    };

    setIsLoading(true);
    try {
      await apiClient.createWallet(walletData);
      showSuccess('Tạo ví thành công');
      setTimeout(() => {
        router.push('/(tabs)/wallets');
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Không thể tạo ví');
    } finally {
      setIsLoading(false);
    }
  };

  const openMonthMenu = () => {
    setShowYearMenu(false);
    setShowMonthMenu((prev) => !prev);
  };

  const openYearMenu = () => {
    setShowMonthMenu(false);
    setShowYearMenu((prev) => !prev);
  };

  const getMonthLabel = (m: number) => {
    return `Tháng ${m}`;
  };

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.textPrimary}
            onPress={() => router.push('/(tabs)/wallets')}
          />
          <Text style={styles.topBarTitle}>Tạo ví mới</Text>
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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name="wallet-plus" size={24} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Tạo ví mới</Text>
              <Text style={styles.headerSubtitle}>
                Tạo ví ngân sách với số dư ban đầu
              </Text>
            </View>

            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                {/* Tên ví */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên ví *</Text>
                  <TextInput
                    placeholder="Ví tiền mặt, Ví ngân hàng, Ví tiết kiệm..."
                    value={walletName}
                    onChangeText={setWalletName}
                    mode="outlined"
                    style={styles.input}
                    contentStyle={styles.inputContent}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="wallet" />}
                  />
                </View>

                {/* Số dư ban đầu */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Số dư ban đầu *</Text>
                  <TextInput
                    placeholder="0"
                    value={initialBalance}
                    onChangeText={handleMoneyChange}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    contentStyle={styles.inputContent}
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="currency-usd" />}
                    right={<TextInput.Affix text="₫" />}
                  />
                  <HelperText type="info" visible style={styles.helperText}>
                    Số tiền có sẵn trong ví khi tạo
                  </HelperText>
                </View>

                {/* Tháng và Năm */}
                <View style={styles.dateRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.label}>Tháng</Text>
                    <Menu
                      visible={showMonthMenu}
                      onDismiss={() => setShowMonthMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={openMonthMenu}
                          style={styles.dateButton}
                          contentStyle={styles.dateButtonContent}
                          labelStyle={styles.dateButtonLabel}
                          icon="calendar-month"
                        >
                          {getMonthLabel(month)}
                        </Button>
                      }
                    >
                      {monthOptions.map((m) => (
                        <Menu.Item
                          key={m}
                          onPress={() => {
                            setMonth(m);
                            setShowMonthMenu(false);
                          }}
                          title={getMonthLabel(m)}
                          titleStyle={month === m ? { color: colors.primary } : {}}
                        />
                      ))}
                    </Menu>
                  </View>

                  <View style={styles.dateCol}>
                    <Text style={styles.label}>Năm</Text>
                    <Menu
                      visible={showYearMenu}
                      onDismiss={() => setShowYearMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={openYearMenu}
                          style={styles.dateButton}
                          contentStyle={styles.dateButtonContent}
                          labelStyle={styles.dateButtonLabel}
                          icon="calendar"
                        >
                          {year}
                        </Button>
                      }
                    >
                      {yearOptions.map((y) => (
                        <Menu.Item
                          key={y}
                          onPress={() => {
                            setYear(y);
                            setShowYearMenu(false);
                          }}
                          title={String(y)}
                          titleStyle={year === y ? { color: colors.primary } : {}}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/(tabs)/wallets')}
                    style={[styles.button, styles.cancelButton]}
                    labelStyle={styles.cancelButtonLabel}
                    disabled={isLoading}
                  >
                    Hủy
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
                    style={[styles.button, styles.submitButton]}
                    buttonColor={colors.primary}
                    labelStyle={styles.submitButtonLabel}
                    icon="check"
                  >
                    Tạo ví
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onDismiss={hideToast}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  headerSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    marginBottom: spacing.md,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    alignItems: 'center',
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
  card: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
  },
  inputContent: {
    ...typography.body,
  },
  inputOutline: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  helperText: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textMuted,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dateCol: {
    flex: 1,
    position: 'relative',
  },
  dateButton: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  dateButtonContent: {
    height: 48,
    justifyContent: 'center',
  },
  dateButtonLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  cancelButton: {
    borderColor: colors.border,
  },
  cancelButtonLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submitButton: {
    ...shadows.sm,
  },
  submitButtonLabel: {
    ...typography.body,
    fontWeight: '600',
    color: '#fff',
  },
});
