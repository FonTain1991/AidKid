import { Dimensions, Platform } from 'react-native'

export const SERVER_URL = 'http://192.168.100.2:4444'

export { FONT_FAMILY } from './font'
export { RADIUS } from './radius'
export { SPACING } from './spacing'
export { UNITS } from './units'

export const IS_ANDROID = Platform.OS === 'android'
export const WIDTH = Dimensions.get('window').width
export const HEIGHT = Dimensions.get('window').height

export const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Один раз', icon: '📅' },
  { value: 'daily', label: 'Ежедневно', icon: '🔄' },
  { value: 'weekly', label: 'Еженедельно', icon: '📆' },
]

export const getFrequencyIcon = (frequency: string) => {
  switch (frequency) {
    case 'once':
      return '📅'
    case 'daily':
      return '🔄'
    case 'weekly':
      return '📆'
    default:
      return '⏰'
  }
}

export const getFrequencyText = (frequency: string) => {
  switch (frequency) {
    case 'once':
      return 'Один раз'
    case 'daily':
      return 'Ежедневно'
    case 'weekly':
      return 'Еженедельно'
    default:
      return frequency
  }
}