import { RADIUS, SPACING } from '@/constants'
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'


export const useStyles = () => {
  const { colors } = useTheme()
  return StyleSheet.create({
    inputLabel: {
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
      marginBottom: SPACING.sm,
      color: colors.text,
    },
    quantityButton: {
      width: 40,
      height: 40,
      borderWidth: 1,
      borderRadius: RADIUS.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    quantityButtonText: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      color: colors.text,
    },
    quantityDisplay: {
      width: 60,
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    quantityText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
    },
    quantityContainer: {
      backgroundColor: colors.inputBackground,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quantityLabel: {
      fontSize: FONT_SIZE.md,
      color: colors.text,
      marginRight: SPACING.sm,
    },
    quantityInput: {
      flex: 1,
      fontSize: FONT_SIZE.md,
      color: colors.text,
      textAlign: 'center',
    },
  })
}
