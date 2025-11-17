import { useSafeAreaInsets as useSafeAreaInsetsOriginal } from 'react-native-safe-area-context'
import { Platform } from 'react-native'

export const useSafeAreaInsets = () => {
  const insets = useSafeAreaInsetsOriginal()

  // Добавляем дополнительный отступ для системной навигации на Android
  const bottomInset = Platform.OS === 'android'
    ? Math.max(insets.bottom, 16) // Минимум 16px на Android
    : insets.bottom

  return {
    ...insets,
    bottom: bottomInset,
  }
}
