import { useTheme } from '@/app/providers/theme'
import { IS_ANDROID } from '@/shared/config'
import { useEffect } from 'react'
import SystemNavigationBar from 'react-native-system-navigation-bar'

interface UseNavigationBarColorOptions {
  color?: string
}

export const useNavigationBarColor = (options: UseNavigationBarColorOptions = {}) => {
  const { colors, isDark } = useTheme()
  const { color } = options

  useEffect(() => {
    if (!IS_ANDROID) {
      return
    }

    SystemNavigationBar.navigationShow()
    const navigationColor = color || colors.bottomBarBackground
    SystemNavigationBar.setNavigationColor(navigationColor, 'dark')

    // Cleanup: возвращаем дефолтный цвет при уходе с экрана
    return () => {
      SystemNavigationBar.setNavigationColor(colors.bottomBarBackground, 'dark')
    }
  }, [colors.background, color, colors])
}
