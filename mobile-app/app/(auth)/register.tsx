import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      showError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      await register(fullName, email, password);
      showSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={['#28a745', '#28a745', '#1e7e34']}
          style={styles.headerSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <MaterialCommunityIcons name="wallet" size={40} color="#fff" />
            </View>
            <MaterialCommunityIcons name="trending-up" size={24} color="rgba(255,255,255,0.8)" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.appName}>Bắt đầu ngay hôm nay</Text>
            <Text style={styles.appSubtitle}>Tạo tài khoản để quản lý tài chính thông minh</Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="account-plus" size={16} color="#fff" />
              </View>
              <Text style={styles.featureText}>Tạo tài khoản miễn phí</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="trending-up" size={16} color="#fff" />
              </View>
              <Text style={styles.featureText}>Theo dõi chi tiêu thông minh</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#fff" />
              </View>
              <Text style={styles.featureText}>Bảo mật thông tin tuyệt đối</Text>
            </View>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
        </LinearGradient>

        {/* Register Form */}
        <View style={styles.formContainer}>
          <Surface style={styles.formCard} elevation={4}>
            <View style={styles.formHeader}>
              <Text style={styles.welcomeTitle}>Tạo tài khoản mới</Text>
              <Text style={styles.welcomeSubtitle}>Điền thông tin để bắt đầu hành trình quản lý tài chính</Text>
            </View>

            <View style={styles.formContent}>
              <TextInput
                label="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#28a745',
                    outline: '#E1E5E9',
                  }
                }}
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#28a745',
                    outline: '#E1E5E9',
                  }
                }}
              />

              <TextInput
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{
                  colors: {
                    primary: '#28a745',
                    outline: '#E1E5E9',
                  }
                }}
              />

              <TextInput
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                theme={{
                  colors: {
                    primary: '#28a745',
                    outline: '#E1E5E9',
                  }
                }}
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
                style={styles.registerButton}
                contentStyle={styles.registerButtonContent}
                labelStyle={styles.registerButtonLabel}
              >
                {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
              </Button>

              <View style={styles.linksContainer}>
                <Button
                  mode="text"
                  onPress={() => router.push('/(auth)/login')}
                  style={styles.linkButton}
                  labelStyle={styles.linkButtonLabel}
                >
                  Đã có tài khoản? Đăng nhập
                </Button>
              </View>
            </View>
          </Surface>
        </View>
      </ScrollView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerSection: {
    height: height * 0.5,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 15,
    marginRight: 10,
    backdropFilter: 'blur(10px)',
  },
  headerText: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  featuresList: {
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 80,
    right: 60,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '50%',
    left: 20,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: -30,
  },
  formCard: {
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 25,
    minHeight: height * 0.6,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formContent: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  registerButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#28a745',
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  linkButton: {
    marginTop: 5,
  },
  linkButtonLabel: {
    fontSize: 14,
    color: '#28a745',
  },
});