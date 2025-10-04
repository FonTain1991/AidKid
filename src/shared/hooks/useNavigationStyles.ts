import { useTheme } from '@/app/providers/theme'
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import { useMemo } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FONT_FAMILY, SPACING } from '../config/constants'
import { FONT_SIZE, FONT_WEIGHT } from '../config/constants/font'

export const useNavigationStyles = () => {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const navigationStyles = useMemo((): Partial<BottomTabNavigationOptions> => ({
    headerShown: false,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontFamily: FONT_FAMILY.medium,
      fontSize: FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.semiBold,
      textAlign: 'center' as const,
      color: colors.text,
    },
    headerTitleAlign: 'center' as const,
    headerTitleContainerStyle: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...Platform.select({
        android: {
          flex: 1,
          marginHorizontal: 0,
        },
        ios: {
          flex: 1,
        },
      }),
    },
    tabBarStyle: {
      backgroundColor: colors.bottomBarBackground,
      borderTopColor: colors.border,
      paddingTop: SPACING.sm,
      paddingBottom: insets.bottom + SPACING.sm,
      height: 60 + insets.bottom + SPACING.sm, // базовая высота + safe area + отступы
    },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.medium,
    },
  }), [colors.background, colors.text, colors.bottomBarBackground, colors.border, colors.primary, colors.muted, insets.bottom])

  return navigationStyles
}
