import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { useTheme } from '@/app/providers/theme'
import { RADIUS, SPACING } from '@/shared/config'
import { FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'
import { useSafeAreaInsets } from '@/shared/hooks'

export const useQuickCreateStyles = () => {
  const { colors } = useTheme()
  const { bottom } = useSafeAreaInsets()

  return useMemo(() => StyleSheet.create({
    container: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      backgroundColor: colors.bottomBarBackground,
      paddingBottom: bottom + SPACING.md
    },
    title: {
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      marginBottom: SPACING.xl,
    },
    options: {
      gap: 16,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      backgroundColor: colors.background,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionText: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.medium,
      color: colors.text,
    },
  }), [colors, bottom])
}
