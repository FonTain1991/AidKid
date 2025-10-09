
const green = '#3A944E'
const greenRgba = (opacity: number | string) => `rgba(58, 148, 78, ${opacity})`

export const LIGHT_COLORS = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  primary: '#3A944E',
  secondary: '#4CAF50',
  border: '#E0E0E0',
  card: '#FFFFFF',
  error: '#FF5252',
  success: '#4CAF50',
  warning: '#FF9800',
  muted: '#9E9E9E',
  placeholder: '#BDBDBD',
  inputBackground: '#FAFAFA',
  headerBackground: green,
  headerColor: '#FFFFFF',
  bottomBarBackground: '#FFFFFF',
  white: '#FFFFFF',
  shadow: '#000000'
}

export type ThemeColors = Record<keyof typeof LIGHT_COLORS, string>
