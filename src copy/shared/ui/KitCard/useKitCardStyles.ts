import { useTheme } from '@/app/providers/theme'
import { FONT_FAMILY, RADIUS, SPACING } from '@/shared/config'
import { FONT_SIZE, FONT_WEIGHT } from '@/shared/config/constants/font'
import { StyleSheet } from 'react-native'

export const useKitCardStyles = () => {
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    card: {
      borderRadius: RADIUS.lg,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.md,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    content: {
      padding: SPACING.md,
      minHeight: 120,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.sm,
    },
    title: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.bold,
      fontWeight: FONT_WEIGHT.bold,
      lineHeight: FONT_SIZE.lg * 1.3,
      flex: 1,
      marginRight: SPACING.sm,
    },
    description: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.regular,
      fontWeight: FONT_WEIGHT.regular,
      lineHeight: FONT_SIZE.sm * 1.4,
      marginBottom: SPACING.md,
      opacity: 0.9,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 20,
    },
    menuButton: {
      padding: SPACING.xs,
      borderRadius: RADIUS.sm,
    },
    menuIcon: {
      fontSize: 18,
      fontWeight: 'bold',
      transform: [{ rotate: '90deg' }],
    },
    addMedicineButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    addMedicineText: {
      fontSize: FONT_SIZE.xs,
      fontFamily: FONT_FAMILY.medium,
      fontWeight: FONT_WEIGHT.medium,
    },
  })

  return {
    styles,
    colors,
  }
}
