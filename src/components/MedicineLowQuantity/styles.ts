import { RADIUS, SPACING } from '@/constants'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'

export const useStyles = () => {
  const { colors } = useTheme()
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.warning,
    },
  })
}