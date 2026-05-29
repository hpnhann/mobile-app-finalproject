import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Avatar, TextInput, HelperText, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { apiClient } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState({
    profile: false,
    password: false
  });

  const [errors, setErrors] = useState({
    profile: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    setErrors(prev => ({ ...prev, profile: '' }));

    try {
      await apiClient.updateProfile(profileData);
      updateUser({ ...user, ...profileData });
      showSuccess('Cập nhật thông tin thành công!');
    } catch (error: any) {
      setErrors(prev => ({ ...prev, profile: error.message || 'Có lỗi xảy ra' }));
      showError(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handlePasswordChange = async () => {
    setLoading(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: '' }));

    // Validation
    if (passwordData.newPassword.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Mật khẩu mới phải có ít nhất 6 ký tự' }));
      setLoading(prev => ({ ...prev, password: false }));
      showError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors(prev => ({ ...prev, password: 'Mật khẩu xác nhận không khớp' }));
      setLoading(prev => ({ ...prev, password: false }));
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      showSuccess('Đổi mật khẩu thành công!');
    } catch (error: any) {
      setErrors(prev => ({ ...prev, password: error.message || 'Có lỗi xảy ra' }));
      showError(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } finally {
              router.replace('/login');
            }
          }
        }
      ]
    );
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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Avatar.Text
                size={80}
                label={user?.fullName?.charAt(0).toUpperCase() || 'U'}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </Text>
              </View>
            </View>

            {/* Profile Settings */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: colors.primaryLight }]}>
                    <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Title style={styles.cardTitle}>Thông tin cá nhân</Title>
                    <Paragraph style={styles.cardDescription}>
                      Cập nhật thông tin cá nhân của bạn
                    </Paragraph>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Họ và tên</Text>
                    <TextInput
                      mode="outlined"
                      value={profileData.fullName}
                      onChangeText={(text) => setProfileData(prev => ({ ...prev, fullName: text }))}
                      placeholder="Nhập họ và tên"
                      disabled={loading.profile}
                      style={styles.input}
                      left={<TextInput.Icon icon="account" size={20} />}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      mode="outlined"
                      value={profileData.email}
                      onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                      placeholder="Nhập email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      disabled={loading.profile}
                      style={styles.input}
                      left={<TextInput.Icon icon="email" size={20} />}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>

                  {errors.profile ? (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{errors.profile}</Text>
                    </View>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handleProfileUpdate}
                    loading={loading.profile}
                    disabled={loading.profile}
                    style={styles.submitButton}
                    buttonColor={colors.primary}
                    icon={() => <MaterialCommunityIcons name="content-save" size={20} color="#fff" />}
                  >
                    {loading.profile ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Password Settings */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: colors.errorLight }]}>
                    <MaterialCommunityIcons name="lock" size={20} color={colors.error} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Title style={styles.cardTitle}>Đổi mật khẩu</Title>
                    <Paragraph style={styles.cardDescription}>
                      Thay đổi mật khẩu của bạn để bảo mật tài khoản
                    </Paragraph>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                    <TextInput
                      mode="outlined"
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                      placeholder="Nhập mật khẩu hiện tại"
                      secureTextEntry={!showPasswords.current}
                      disabled={loading.password}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock" size={20} />}
                      right={
                        <TextInput.Icon
                          icon={showPasswords.current ? 'eye-off' : 'eye'}
                          onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        />
                      }
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                    <TextInput
                      mode="outlined"
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      secureTextEntry={!showPasswords.new}
                      disabled={loading.password}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock-reset" size={20} />}
                      right={
                        <TextInput.Icon
                          icon={showPasswords.new ? 'eye-off' : 'eye'}
                          onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        />
                      }
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                    <HelperText type="info" visible>
                      Mật khẩu phải có ít nhất 6 ký tự
                    </HelperText>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                      mode="outlined"
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                      placeholder="Nhập lại mật khẩu mới"
                      secureTextEntry={!showPasswords.confirm}
                      disabled={loading.password}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock-check" size={20} />}
                      right={
                        <TextInput.Icon
                          icon={showPasswords.confirm ? 'eye-off' : 'eye'}
                          onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        />
                      }
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>

                  {errors.password ? (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handlePasswordChange}
                    loading={loading.password}
                    disabled={loading.password}
                    style={styles.submitButton}
                    buttonColor={colors.error}
                    icon={() => <MaterialCommunityIcons name="lock-reset" size={20} color="#fff" />}
                  >
                    {loading.password ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Account Info */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: colors.successLight }]}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Title style={styles.cardTitle}>Thông tin tài khoản</Title>
                    <Paragraph style={styles.cardDescription}>
                      Thông tin chi tiết về tài khoản của bạn
                    </Paragraph>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>ID người dùng</Text>
                    <TextInput
                      mode="outlined"
                      value={user?.userId?.toString() || ''}
                      disabled
                      style={styles.infoInput}
                      outlineColor={colors.border}
                    />
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Vai trò</Text>
                    <TextInput
                      mode="outlined"
                      value={user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      disabled
                      style={styles.infoInput}
                      outlineColor={colors.border}
                    />
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ngày tạo</Text>
                    <TextInput
                      mode="outlined"
                      value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}
                      disabled
                      style={styles.infoInput}
                      outlineColor={colors.border}
                    />
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Trạng thái</Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.successLight }]}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                      <Text style={[styles.statusText, { color: colors.success }]}>Hoạt động</Text>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Logout Button */}
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor={colors.error}
              icon={() => <MaterialCommunityIcons name="logout" size={20} color="#fff" />}
            >
              Đăng xuất
            </Button>

            <View style={styles.bottomSpacing} />
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
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
  },
  avatar: {
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    ...typography.caption,
    color: colors.secondaryDark,
    fontWeight: '600',
  },
  card: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  formSection: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoInput: {
    backgroundColor: colors.background,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  logoutButton: {
    margin: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});
