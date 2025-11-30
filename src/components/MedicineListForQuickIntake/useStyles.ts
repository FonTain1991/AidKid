import { FONT_FAMILY, RADIUS, SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { useMemo } from 'react'
import { StyleSheet } from 'react-native'

export function useStyles() {
  const { colors } = useTheme()

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        marginHorizontal: SPACING.md,
        padding: 16,
        borderWidth: 1,
        borderRadius: SPACING.md,
        borderColor: colors.border
      },
      icon: {
        width: 50,
        height: 50,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center'
      },
      name: {
        fontFamily: FONT_FAMILY.medium,
        fontSize: FONT_SIZE.xl,
        color: colors.text
      },
      medicinesCount: {
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.sm,
        color: colors.secondary
      },
      emptyIcon: {
        backgroundColor: colors.placeholder,
        height: 50,
        width: 50,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center'
      },
      medicineKitTag: {
        position: 'absolute',
        top: -10,
        right: 0,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.md,
      },
      medicineKitTagName: {
        fontFamily: FONT_FAMILY.medium,
        fontSize: FONT_SIZE.sm,
        color: colors.headerColor
      },
      quantityContainer: {
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingVertical: SPACING.xs / 2,
        paddingHorizontal: SPACING.xs
      },
      quantity: {
        fontFamily: FONT_FAMILY.regular,
        fontSize: FONT_SIZE.sm,
        color: colors.text
      },
      checkedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: SPACING.md,
      }
    })
  }, [colors])
}