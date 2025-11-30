import { Dimensions, Platform } from 'react-native'

export const SERVER_URL = 'http://192.168.100.2:4444'

export { FONT_FAMILY } from './font'
export { RADIUS } from './radius'
export { SPACING } from './spacing'
export { UNITS } from './units'

export const IS_ANDROID = Platform.OS === 'android'
export const WIDTH = Dimensions.get('window').width
export const HEIGHT = Dimensions.get('window').height