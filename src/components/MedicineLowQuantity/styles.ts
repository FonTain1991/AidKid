import { RADIUS, SPACING } from '@/constants'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()
  return StyleSheet.create({
    alertsContainer: {
      gap: SPACING.md,
      marginBottom: SPACING.md,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      gap: SPACING.sm,
    },
    alertIcon: {
      fontSize: 24,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: SPACING.xs / 2,
    },
    alertText: {
      fontSize: 14,
    },
    alertArrow: {
      fontSize: 24,
      fontWeight: 'bold',
    },
  })
}