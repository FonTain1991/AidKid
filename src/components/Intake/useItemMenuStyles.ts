import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'

export function useItemMenuStyles() {
  const { colors } = useTheme()

  return StyleSheet.create({
    section: {
      marginTop: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
      color: colors.text
    },
    menuItem: {
      borderBottomWidth: 1,
      paddingHorizontal: SPACING.md,
      borderBottomColor: colors.border
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
    },
    menuIcon: {
      fontSize: FONT_SIZE.xl,
      marginRight: SPACING.md,
      width: 24,
      textAlign: 'center',
    },
    menuText: {
      flex: 1,
    },
    menuTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: FONT_WEIGHT.bold,
      marginBottom: SPACING.sm,
      color: colors.text
    },
    menuDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.muted
    },
    menuRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      minWidth: 20,
      height: SPACING.md,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.sm,
      backgroundColor: colors.primary
    },
    badgeText: {
      color: colors.background,
      fontSize: FONT_SIZE.sm,
      fontWeight: FONT_WEIGHT.bold,
    },
    menuArrow: {
      fontSize: FONT_SIZE.xl,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.muted
    },
  })
}