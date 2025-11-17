import { FONT_FAMILY, RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useColorPickerStyles = (value?: string) => {
  const { colors } = useTheme()
  const { bottom } = useSafeAreaInsets()

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
      color: colors.text
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    colorIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: SPACING.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    value: {
      fontFamily: FONT_FAMILY.regular,
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.regular,
      color: colors.text,
      flex: 1,
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
    title: {
      fontFamily: FONT_FAMILY.bold,
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: SPACING.lg,
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    button: {
      flex: 1,
    },
    cancelButton: {
      backgroundColor: colors.muted,
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    bottomSheetContent: {
      paddingHorizontal: SPACING.md,
      paddingBottom: bottom + SPACING.sm,
    },
  })

  return { styles }
}
