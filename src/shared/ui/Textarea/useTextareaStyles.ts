import { useTheme } from '@/app/providers/theme'
import { FONT_FAMILY, RADIUS, SPACING } from '@/shared/config'
import { FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'
import { StyleSheet } from 'react-native'

interface TextareaStylesParams {
  error?: string
  isFocused?: boolean
  value?: string
  numberOfLines?: number
}

export const useTextareaStyles = (params: TextareaStylesParams) => {
  const { error, isFocused, value } = params
  const { colors } = useTheme()


  const styles = StyleSheet.create({
    inputContainer: {
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: colors.card,
      paddingHorizontal: SPACING.sm,
    },
    animatedContainer: {
      justifyContent: 'center',
      overflow: 'hidden',
    },
    label: {
      position: 'absolute',
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      color: error ? colors.error : ((isFocused || value) ? colors.muted : colors.text),
      zIndex: 2,
    },
    input: {
      padding: 0,
      lineHeight: FONT_SIZE.md,
      marginTop: SPACING.lg,
      paddingBottom: SPACING.sm,
      fontSize: FONT_SIZE.md,
      fontFamily: FONT_FAMILY.regular,
      fontWeight: FONT_WEIGHT.regular,
      backgroundColor: colors.card,
      color: colors.text,
      flex: 1
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
