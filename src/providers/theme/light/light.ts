
const green = '#3A944E'

export const LIGHT_COLORS = {
  background: '#FFFFFF',
  text: '#1F2E22',
  primary: '#3A944E',
  secondary: '#66BB6A',
  border: '#E8F5E9',
  card: '#FFFFFF',
  error: '#D32F2F',
  success: '#4CAF50',
  warning: '#FF9800',
  muted: '#90A495',
  placeholder: '#C8E6C9',
  inputBackground: '#F1F8F4',
  headerBackground: green,
  headerColor: '#FFFFFF',
  link: '#007AFF'
}

export type ThemeColors = Record<keyof typeof LIGHT_COLORS, string>
