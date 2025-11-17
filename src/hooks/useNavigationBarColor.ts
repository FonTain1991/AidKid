import { IS_ANDROID } from '@/constants'
import { useTheme } from '@/providers/theme'
import { useEffect } from 'react'
import SystemNavigationBar from 'react-native-system-navigation-bar'

interface UseNavigationBarColorOptions {
  color?: string
}

export const useNavigationBarColor = (options: UseNavigationBarColorOptions = {}) => {
  const { colors } = useTheme()
  const { color } = options

  useEffect(() => {
    if (!IS_ANDROID) {
      return
    }

    SystemNavigationBar.navigationShow()
    const navigationColor = color || colors.background
    SystemNavigationBar.setNavigationColor(navigationColor, 'dark')

    // Cleanup: возвращаем дефолтный цвет при уходе с экрана
    return () => {
      SystemNavigationBar.setNavigationColor(colors.background, 'dark')
    }
  }, [colors.background, color])
}
