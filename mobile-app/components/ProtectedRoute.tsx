import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  console.log('[ProtectedRoute] Rendering...');
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  console.log('[ProtectedRoute] Auth state - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  useEffect(() => {
    console.log('[ProtectedRoute] useEffect - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (!isLoading && !isAuthenticated) {
      console.log('[ProtectedRoute] User not authenticated, redirecting to login...');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    console.log('[ProtectedRoute] Still loading auth state...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Đang tải...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, returning null');
    return null;
  }

  console.log('[ProtectedRoute] User authenticated, rendering children');
  return <>{children}</>;
}