import { useTheme } from '@/app/providers/theme'
import { FONT_FAMILY, RADIUS, SPACING } from '@/shared/config'
import { FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'
import { StyleSheet } from 'react-native'

export const useTextInputStyles = (error?: string, isFocused?: boolean, value?: string) => {
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    inputContainer: {
      justifyContent: 'center',
      height: 50,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: colors.card,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    label: {
      left: SPACING.sm,
      position: 'absolute',
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: error ? colors.error : ((isFocused || value) ? colors.muted : colors.text),
      zIndex: 2,
    },
    input: {
      padding: 0,
      lineHeight: FONT_SIZE.md,
      marginTop: SPACING.md,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      fontWeight: FONT_WEIGHT.regular,
      backgroundColor: colors.card,
      color: colors.text,
    },
    error: {
      marginLeft: SPACING.sm,
      marginTop: SPACING.xs,
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.xs,
      color: colors.error,
    },
  })

  return {
    styles,
  }
}
