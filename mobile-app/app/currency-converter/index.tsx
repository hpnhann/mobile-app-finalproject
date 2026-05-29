import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Title, TextInput, Button, Text, Menu, ActivityIndicator, Surface, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProtectedRoute from '../../components/ProtectedRoute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const CURRENCIES = [
  { code: 'VND', name: 'Việt Nam Đồng', flag: '🇻🇳' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'KRW', name: 'Korean Won', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
];

// Mock exchange rates (base: VND)
const EXCHANGE_RATES: { [key: string]: number } = {
  'VND': 1,
  'USD': 0.000043,
  'EUR': 0.000039,
  'JPY': 0.0065,
  'GBP': 0.000033,
  'KRW': 0.032,
  'THB': 0.0014,
  'SGD': 0.000058,
};

export default function CurrencyConverterScreen() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState(CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState(CURRENCIES[1]);
  const [convertedAmount, setConvertedAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [showToMenu, setShowToMenu] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Calculate exchange rate
  useEffect(() => {
    const fromRate = EXCHANGE_RATES[fromCurrency.code] || 1;
    const toRate = EXCHANGE_RATES[toCurrency.code] || 1;
    
    // Convert to VND first, then to target currency
    const rate = toRate / fromRate;
    setExchangeRate(rate);
  }, [fromCurrency, toCurrency]);

  // Auto convert when amount or currencies change
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount.replace(/,/g, '')))) {
      const numericAmount = parseFloat(amount.replace(/,/g, ''));
      const result = numericAmount * exchangeRate;
      setConvertedAmount(result.toLocaleString('vi-VN', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }));
    } else {
      setConvertedAmount('');
    }
  }, [amount, exchangeRate]);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    const tempAmount = amount;
    setAmount(convertedAmount.replace(/,/g, ''));
    setConvertedAmount(tempAmount.replace(/,/g, ''));
  };

  const refreshRate = () => {
    setLastUpdate(new Date());
    // In real app, this would fetch latest exchange rates
  };

  const setQuickAmount = (quickAmount: number) => {
    if (fromCurrency.code === 'VND') {
      setAmount(quickAmount.toLocaleString('vi-VN'));
    } else {
      setAmount(quickAmount.toString());
    }
  };

  const getQuickAmounts = () => {
    if (fromCurrency.code === 'VND') {
      return [1000000, 5000000, 10000000, 50000000];
    } else {
      return [100, 500, 1000, 5000];
    }
  };

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name="currency-usd" size={24} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Chuyển đổi tiền tệ</Text>
              <Text style={styles.headerSubtitle}>
                Chuyển đổi giữa các loại tiền tệ với tỷ giá thời gian thực
              </Text>
            </View>

            {/* Converter Card */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                {/* From Currency */}
                <View style={styles.currencySection}>
                  <Text style={styles.sectionLabel}>Từ</Text>
                  <View style={styles.currencyRow}>
                    <TextInput
                      mode="outlined"
                      placeholder="0"
                      value={amount}
                      onChangeText={handleAmountChange}
                      keyboardType="numeric"
                      style={styles.amountInput}
                      contentStyle={styles.amountInputContent}
                      left={<TextInput.Icon icon="cash" size={20} />}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                    <Menu
                      visible={showFromMenu}
                      onDismiss={() => setShowFromMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setShowFromMenu(true)}
                          style={styles.currencySelector}
                          contentStyle={styles.currencySelectorContent}
                          icon={() => (
                            <View style={styles.currencySelectorIcon}>
                              <Text style={styles.currencyFlag}>{fromCurrency.flag}</Text>
                              <Text style={styles.currencyCode}>{fromCurrency.code}</Text>
                            </View>
                          )}
                        />
                      }
                    >
                      {CURRENCIES.map((currency) => (
                        <Menu.Item
                          key={currency.code}
                          onPress={() => {
                            setFromCurrency(currency);
                            setShowFromMenu(false);
                          }}
                          title={`${currency.flag} ${currency.code} - ${currency.name}`}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                {/* Swap Button */}
                <View style={styles.swapContainer}>
                  <Button
                    mode="outlined"
                    onPress={swapCurrencies}
                    style={styles.swapButton}
                    contentStyle={styles.swapButtonContent}
                    icon={() => <MaterialCommunityIcons name="swap-vertical" size={20} color={colors.primary} />}
                  >
                    Đổi chiều
                  </Button>
                </View>

                {/* To Currency */}
                <View style={styles.currencySection}>
                  <Text style={styles.sectionLabel}>Sang</Text>
                  <View style={styles.currencyRow}>
                    <TextInput
                      mode="outlined"
                      placeholder="0"
                      value={convertedAmount}
                      editable={false}
                      style={[styles.amountInput, styles.resultInput]}
                      contentStyle={styles.amountInputContent}
                      left={<TextInput.Icon icon="cash-check" size={20} />}
                      outlineColor={colors.border}
                    />
                    <Menu
                      visible={showToMenu}
                      onDismiss={() => setShowToMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setShowToMenu(true)}
                          style={styles.currencySelector}
                          contentStyle={styles.currencySelectorContent}
                          icon={() => (
                            <View style={styles.currencySelectorIcon}>
                              <Text style={styles.currencyFlag}>{toCurrency.flag}</Text>
                              <Text style={styles.currencyCode}>{toCurrency.code}</Text>
                            </View>
                          )}
                        />
                      }
                    >
                      {CURRENCIES.map((currency) => (
                        <Menu.Item
                          key={currency.code}
                          onPress={() => {
                            setToCurrency(currency);
                            setShowToMenu(false);
                          }}
                          title={`${currency.flag} ${currency.code} - ${currency.name}`}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                {/* Exchange Rate Info */}
                <Surface style={styles.rateInfo} elevation={1}>
                  <View style={styles.rateInfoHeader}>
                    <View style={styles.rateInfoText}>
                      <Text style={styles.rateLabel}>Tỷ giá: </Text>
                      <Text style={styles.rateValue}>
                        1 {fromCurrency.code} = {exchangeRate.toLocaleString('vi-VN', { 
                          maximumFractionDigits: 6 
                        })} {toCurrency.code}
                      </Text>
                    </View>
                    <Button
                      mode="text"
                      onPress={refreshRate}
                      style={styles.refreshButton}
                      icon={() => <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />}
                    />
                  </View>
                  <Text style={styles.lastUpdate}>
                    Cập nhật lần cuối: {lastUpdate.toLocaleString('vi-VN')}
                  </Text>
                </Surface>

                {/* Quick Convert Buttons */}
                <View style={styles.quickConvertSection}>
                  <Text style={styles.quickConvertLabel}>Chuyển đổi nhanh</Text>
                  <View style={styles.quickConvertGrid}>
                    {getQuickAmounts().map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        mode="outlined"
                        onPress={() => setQuickAmount(quickAmount)}
                        style={styles.quickButton}
                        textColor={colors.primary}
                        contentStyle={styles.quickButtonContent}
                      >
                        {fromCurrency.code === 'VND' 
                          ? `${quickAmount.toLocaleString('vi-VN')} ₫`
                          : `$${quickAmount}`
                        }
                      </Button>
                    ))}
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Note Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.noteHeader}>
                  <MaterialCommunityIcons name="information" size={20} color={colors.warning} />
                  <Title style={styles.noteTitle}>Lưu ý</Title>
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteItem}>
                    • Tỷ giá có thể thay đổi theo thời gian thực. Tỷ giá hiển thị là tham khảo.
                  </Text>
                  <Text style={styles.noteItem}>
                    • Để có tỷ giá chính xác nhất, vui lòng kiểm tra với ngân hàng hoặc tổ chức tài chính.
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <View style={styles.bottomSpacing} />
          </ScrollView>
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
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
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
  card: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  cardContent: {
    padding: spacing.lg,
  },
  currencySection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.background,
  },
  amountInputContent: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultInput: {
    backgroundColor: colors.muted,
  },
  currencySelector: {
    minWidth: 100,
    borderColor: colors.border,
  },
  currencySelectorContent: {
    paddingVertical: spacing.sm,
  },
  currencySelectorIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currencyFlag: {
    fontSize: 20,
  },
  currencyCode: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  swapButton: {
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  swapButtonContent: {
    paddingHorizontal: spacing.md,
  },
  rateInfo: {
    backgroundColor: colors.muted,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  rateInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rateInfoText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rateLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rateValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  refreshButton: {
    marginLeft: spacing.sm,
  },
  lastUpdate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  quickConvertSection: {
    marginTop: spacing.md,
  },
  quickConvertLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  quickConvertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    minWidth: '45%',
    borderColor: colors.border,
  },
  quickButtonContent: {
    paddingVertical: spacing.xs,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noteTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  noteContent: {
    gap: spacing.sm,
  },
  noteItem: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});
