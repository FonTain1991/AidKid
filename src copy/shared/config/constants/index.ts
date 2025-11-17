import { Dimensions, Platform } from 'react-native'

export const SERVER_URL = 'http://192.168.100.2:4444'

export { FONT_FAMILY } from './font'
export { RADIUS } from './radius'
export { SPACING } from './spacing'
export const IS_ANDROID = Platform.OS === 'android'
export const IS_IOS = Platform.OS === 'ios'
export const HEIGHT_SCREEN = Dimensions.get('window').height
export const WIDTH_SCREEN = Dimensions.get('window').width
export const HEIGHT_ITEM = 48
