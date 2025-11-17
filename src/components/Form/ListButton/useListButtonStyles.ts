import { FONT_FAMILY, RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'

export const useListButtonStyles = (value?: string) => {
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    base: {
      justifyContent: 'center',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
      height: 50,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    textContainer: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    fieldName: {
      fontFamily: FONT_FAMILY.medium,
      fontSize: value ? FONT_SIZE.sm : FONT_SIZE.lg,
      fontWeight: FONT_WEIGHT.medium,
      color: value ? colors.muted : colors.text
    },
    value: {
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.regular,
      marginTop: 4,
      color: colors.text,
    },
    arrowContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrow: {
      width: 8,
      height: 8,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      transform: [{ rotate: '45deg' }],
      borderColor: colors.secondary,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.8,
    },
  })

  return {
    styles,
    colors,
  }
}
