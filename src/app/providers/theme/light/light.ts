
const orange = '#FF6B35'
const orangeRgba = (opacity: number | string) => `rgba(255, 107, 53, ${opacity})`

export const LIGHT_COLORS = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  primary: '#FF6B35',
  secondary: '#FF8A65',
  border: '#E0E0E0',
  card: '#FFFFFF',
  error: '#FF5252',
  success: '#4CAF50',
  warning: '#FF9800',
  muted: '#9E9E9E',
  placeholder: '#BDBDBD',
  inputBackground: '#FAFAFA',
  headerBackground: orange,
  headerColor: '#FFFFFF',
  bottomBarBackground: '#FFFFFF',
  white: '#FFFFFF',
  shadow: '#000000'
}

export type ThemeColors = Record<keyof typeof LIGHT_COLORS, string>
