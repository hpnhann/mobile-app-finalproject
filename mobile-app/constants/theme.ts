// Theme colors matching web app
export const colors = {
  // Primary colors
  primary: '#dc2626',
  primaryLight: '#fef2f2',
  primaryDark: '#991b1b',
  
  // Secondary colors
  secondary: '#f59e0b',
  secondaryLight: '#fef3c7',
  secondaryDark: '#d97706',
  
  // Status colors
  success: '#22c55e',
  successLight: '#dcfce7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // Neutral colors
  background: '#ffffff',
  card: '#fef2f2',
  cardForeground: '#374151',
  border: '#e5e7eb',
  muted: '#fef2f2',
  mutedForeground: '#6b7280',
  foreground: '#374151',
  
  // Text colors
  textPrimary: '#374151',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  // Chart colors
  chart1: '#dc2626',
  chart2: '#f59e0b',
  chart3: '#a16207',
  chart4: '#164e63',
  chart5: '#475569',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
