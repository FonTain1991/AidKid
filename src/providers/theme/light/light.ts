
const pink = '#E91E63'

export const LIGHT_COLORS = {
  background: '#FFFFFF',
  text: '#2C1F22',
  primary: '#E91E63',
  secondary: '#F48FB1',
  border: '#FCE4EC',
  card: '#FFFFFF',
  error: '#D32F2F',
  success: '#4CAF50',
  warning: '#FF9800',
  muted: '#BCAAA4',
  placeholder: '#FFCCCB',
  inputBackground: '#FFF5F7',
  headerBackground: pink,
  headerColor: '#FFFFFF'
}

export type ThemeColors = Record<keyof typeof LIGHT_COLORS, string>
