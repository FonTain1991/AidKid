import { StyleSheet } from 'react-native'
import { useMemo } from 'react'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'

export const useAddShoppingItemStyles = () => {
  const { colors } = useTheme()

  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1
    },
    scroll: {
      flex: 1
    },
    scrollContent: {
      flexGrow: 1,
      padding: SPACING.md
    },
    form: {
      flex: 1
    },
    field: {
      marginBottom: SPACING.md
    },
    autoComplete: {
      zIndex: 1000
    },
    textArea: {
      minHeight: 80
    },
    helpText: {
      padding: SPACING.md,
      borderRadius: 12,
      backgroundColor: colors.primary + '20', // 20% прозрачности
      marginBottom: SPACING.xl
    },
    helpTextContent: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
      color: colors.textSecondary
    }
  }), [colors])
}
