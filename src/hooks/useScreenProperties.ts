import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { useTheme } from '@/providers/theme'
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'

export interface UseScreenPropertiesOptions {
  backgroundColor?: string
  statusBarStyle?: 'light-content' | 'dark-content' | 'default'
  navigationOptions?: Partial<NativeStackNavigationOptions & BottomTabNavigationOptions>
}

export const useScreenProperties = (options: UseScreenPropertiesOptions = {}) => {
  const { colors, isDark } = useTheme()
  const navigation = useNavigation()
  const {
    backgroundColor = colors.background,
    statusBarStyle,
    navigationOptions = {}
  } = options

  useEffect(() => {
    // Определяем стиль статус бара на основе темы по умолчанию
    const defaultStatusBarStyle = isDark ? 'light-content' : 'dark-content'
    const finalStatusBarStyle = statusBarStyle || defaultStatusBarStyle

    // Базовые опции для цвета фона
    const baseOptions: Partial<NativeStackNavigationOptions> = {
      headerStyle: {
        backgroundColor,
      },
    }

    // Если headerTintColor не передан в navigationOptions, используем значение по умолчанию
    if (!navigationOptions.headerTintColor) {
      baseOptions.headerTintColor = finalStatusBarStyle === 'light-content' ? '#FFFFFF' : '#000000'
    }

    // Объединяем опции
    const finalOptions = {
      ...baseOptions,
      ...navigationOptions,
    }

    // Устанавливаем все опции через навигацию
    navigation.setOptions(finalOptions)
  }, [navigation, backgroundColor, statusBarStyle, isDark, colors.background, navigationOptions])
}
