import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'


export const useStyles = () => {
  const { colors } = useTheme()
  return StyleSheet.create({
    scroll: {
      flex: 1,
      paddingVertical: SPACING.md,
    },
    inputLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.sm,
      color: colors.text,
    },
    timePickerLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.xs,
      color: colors.text,
    },
    infoSection: {
      marginTop: SPACING.xl,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
    },
    infoTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.sm,
      color: colors.text
    },
    infoText: {
      fontSize: FONT_SIZE.sm,
      lineHeight: 20,
      color: colors.text
    }
  })
}
